import {AfterViewInit, Component, OnInit, ViewChild} from '@angular/core';
import Konva from "konva";
import {PonData, PonElements, PonFunc} from "../../../../pon/scheme/elements";
import {MenuItem} from "primeng/api";
import {AutoUnsubscribe} from "../../../../decorators";
import {debounceTime, fromEvent, startWith} from "rxjs";
import {Menubar} from "primeng/menubar";
import ConnectionPoint = PonElements.ConnectionPoint;

enum ToolMode {
    Select,
    Move,
    Connect
}

enum ControlState {
    None,
    Connecting,
    Moving
}

@Component({
    templateUrl: './pon-scheme-page.component.html',
    styleUrls: ['./pon-scheme-page.component.scss']
})
@AutoUnsubscribe()
export class PonSchemePage implements OnInit, AfterViewInit {

    openScheme?: PonData.PonScheme;
    isSchemeEditing = false;

    toolMode = ToolMode.Select;
    controlState = ControlState.None;
    stage?: Konva.Stage;

    layer = new Konva.Layer();
    auxiliaryLayer = new Konva.Layer();

    menuBarOptions = [] as MenuItem[];
    elements: PonElements.Element[] = [];

    prevMousePosition?: {x: number, y: number};
    connectingFromPoint?: PonElements.ConnectionPoint;
    movingElement?: PonElements.Element;

    auxiliaryLine = new Konva.Line({
        stroke: 'red',
        strokeWidth: 2,
        points: [10, 800, 800, 800],
        visible: false,
        tension: 0.3
    });
    @ViewChild('menubarElement') menubarElement?: Menubar;

    winResizeSub = fromEvent(window, 'resize').pipe(startWith(null), debounceTime(100)).subscribe(() => {
        if (this.stage && this.menubarElement) {
            const menubarHeight = this.menubarElement.el.nativeElement.offsetHeight;
            this.stage.setSize({
                width: window.innerWidth - 200,
                height: window.innerHeight - menubarHeight
            })
        }
    });

    constructor() {
    }

    ngAfterViewInit(): void {
        this.stage = new Konva.Stage({
            container: 'container',
            width: 800,
            height: 800,
        });
        this.stage.add(this.layer);
        this.stage.add(this.auxiliaryLayer);
        this.bindStageHandlers();
        this.appendAuxiliaryElements();
        this.appendElement(PonElements.Box.create(10, 10, 8));
        this.appendElement(PonElements.Box.create(410, 10, 24));
    }

    appendAuxiliaryElements() {
        this.auxiliaryLayer.add(this.auxiliaryLine);
    }

    appendElement(element: PonElements.Element) {
        this.elements.push(element);
        this.bindHandlers(element);
        this.layer.add(element.getUI());
    }

    updateMenu() {
        this.menuBarOptions = [
            {
                label: "Переместить",
                command: () => {
                    this.setToolMode(ToolMode.Move)
                },
                styleClass: this.toolMode === ToolMode.Move ? 'active-button' : '',
            },
            {
                label: "Соединить",
                command: () => {
                    this.setToolMode(ToolMode.Connect)
                },
                styleClass: this.toolMode === ToolMode.Connect ? 'active-button' : '',
            }
        ]
    }

    setToolMode(mode: ToolMode) {
        this.toolMode = mode;
        this.updateMenu();
    }

    ngOnInit(): void {
        this.updateMenu();
    }

    private bindStageHandlers() {
        if (!this.stage) throw new Error('Не удалось привязать обработчики событий к сцене');
        this.stage.on('mousedown', this.mouseDownHandler.bind(this));
        this.stage.on('mouseup', this.mouseUpHandler.bind(this));
        this.stage.on('mousemove', this.mouseMoveHandler.bind(this));
    }

    private bindHandlers(element: PonElements.Element) {
        element.onMouseEnter(this.elementMouseEnterHandler.bind(this));
        element.onMouseLeave(this.elementMouseLeaveHandler.bind(this));
        element.onMouseDown(this.elementMouseDownHandler.bind(this));
        element.onMouseMove(this.elementMouseMoveHandler.bind(this));
        element.onMouseUp(this.elementMouseUpHandler.bind(this));
        for (const child of element.getChild()) {
            this.bindHandlers(child);
        }
    }

    private getMovingCP(element: PonElements.Element) {
        const movingCP: ConnectionPoint[] = [];
        if(element instanceof PonElements.ConnectionPoint) {
            movingCP.push(element);
        }
        for (const child of element.getChild()) {
            movingCP.push(...this.getMovingCP(child));
        }
        return movingCP;
    }

    private recalculateBonds(movingCP: PonElements.ConnectionPoint[]) {
        for (const cp of movingCP) {
            const bond = cp.getBond() as PonElements.Bond;
            if(bond)
                bond.recalculate();
        }
    }

    private elementMouseEnterHandler = (event: Konva.KonvaEventObject<MouseEvent>, element: PonElements.Element) => {
        switch (this.toolMode) {
            case ToolMode.Connect:
                if (element instanceof PonElements.ConnectionPoint) {
                    element.point.setAttrs({
                        fill: 'red',
                    })
                }
                break;
            case ToolMode.Move:
                if (element instanceof PonElements.Box) {
                    element.highlight()
                }
        }

    }

    private elementMouseLeaveHandler = (event: Konva.KonvaEventObject<MouseEvent>, element: PonElements.Element) => {
        switch (this.toolMode) {
            case ToolMode.Connect:
                if (element instanceof PonElements.ConnectionPoint) {
                    element.point.setAttrs({
                        fill: 'gray',
                    })
                }
                break;
            case ToolMode.Move:
                if (element instanceof PonElements.Box) {
                    element.unhighlight()
                }
        }
    }

    private elementMouseDownHandler = (event: Konva.KonvaEventObject<MouseEvent>, element: PonElements.Element) => {
        switch (this.toolMode) {
            case ToolMode.Connect:
                if (element instanceof PonElements.ConnectionPoint) {
                    console.log('drag start', element.point.x(), element.point.y())
                    this.controlState = ControlState.Connecting;
                    this.connectingFromPoint = element;
                    element.point.setAttrs({
                        fill: 'red',
                    });
                    const {x, y} = element.point.getAbsolutePosition();
                    this.auxiliaryLine.setAttrs({
                        points: [x, y, x, y],
                        visible: true
                    });
                }
                break;
            case ToolMode.Move:
                if (element instanceof PonElements.Box) {
                    const {x, y} = this.stage?.getPointerPosition() ?? {
                        x: 0,
                        y: 0
                    };
                    this.prevMousePosition = {x, y};
                    this.controlState = ControlState.Moving;
                    this.movingElement = element;
                }
        }
    }

    private elementMouseMoveHandler = (event: Konva.KonvaEventObject<MouseEvent>, element: PonElements.Element) => {
        switch (this.toolMode) {
        }
    }

    private elementMouseUpHandler = (event: Konva.KonvaEventObject<MouseEvent>, element: PonElements.Element) => {
        switch (this.toolMode) {
            case ToolMode.Connect:
                if (element instanceof PonElements.ConnectionPoint && this.controlState === ControlState.Connecting && this.connectingFromPoint && this.stage) {
                    this.auxiliaryLine.setAttrs({
                        visible: false
                    })
                    this.appendElement(PonElements.Bond.create(this.connectingFromPoint, element));
                    element.point.setAttrs({
                        fill: 'gray',
                    })
                    this.controlState = ControlState.None;
                    this.connectingFromPoint = undefined;
                }
        }
    }

    private mouseDownHandler = (event: Konva.KonvaEventObject<MouseEvent>) => {
        switch (this.toolMode) {
        }

    }

    private mouseUpHandler = (event: Konva.KonvaEventObject<MouseEvent>) => {
        switch (this.toolMode) {
            case ToolMode.Connect:
                if (this.controlState === ControlState.Connecting && this.connectingFromPoint && this.stage) {
                    console.log('Global mouse up')
                    this.controlState = ControlState.None;
                    this.connectingFromPoint = undefined;
                    this.auxiliaryLine.setAttrs({
                        visible: false
                    })
                }
                break;
            case ToolMode.Move:
                if (this.controlState === ControlState.Moving && this.movingElement && this.stage) {
                    console.log('Global mouse up')
                    this.controlState = ControlState.None;
                    this.movingElement = undefined;
                }
        }
    }

    private mouseMoveHandler = (event: Konva.KonvaEventObject<MouseEvent>) => {
        switch (this.toolMode) {
            case ToolMode.Connect:
                if (this.controlState === ControlState.Connecting && this.connectingFromPoint && this.stage) {
                    const path = PonFunc.calculateBondPathToPoint(this.connectingFromPoint, this.stage.getPointerPosition() ?? {
                        x: 0,
                        y: 0
                    });
                    this.auxiliaryLine.setAttrs({
                        points: path,
                    })
                }
                break;
            case ToolMode.Move:
                if (this.controlState === ControlState.Moving && this.movingElement && this.prevMousePosition && this.stage) {
                    const {x, y} = this.stage.getPointerPosition() ?? {
                        x: 0,
                        y: 0
                    };
                    this.movingElement.getUI().move({
                        x: x - this.prevMousePosition.x,
                        y: y - this.prevMousePosition.y,
                    });
                    this.prevMousePosition = {x, y};
                    this.recalculateBonds(this.getMovingCP(this.movingElement));
                }
        }
    }

}
