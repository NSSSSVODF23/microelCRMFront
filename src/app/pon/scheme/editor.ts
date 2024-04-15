import Konva from "konva";
import {PonData, PonElements, PonFunc} from "./elements";
import {Observable, Subject, Subscription} from "rxjs";

export namespace PonEditor {

    export enum ToolMode {
        Select,
        Move,
        Connect
    }

    export enum ControlState {
        None,
        Connecting,
        Moving
    }

    export class Stage {

        readonly _context!: Konva.Stage;
        readonly onChangeToolMode = new Subject<ToolMode>();
        private toolMode = ToolMode.Select;
        private controlState = ControlState.None;
        private panning = false;
        private layer = new Konva.Layer();
        private auxiliaryLayer = new Konva.Layer();
        private elements: PonElements.Element[] = [];
        private connectingFromPoint?: PonElements.ConnectionPoint;
        private movingElement?: PonElements.Element;
        private auxiliaryLine = new Konva.Line({
            stroke: 'red',
            strokeWidth: 2,
            points: [10, 800, 800, 800],
            visible: false,
            // tension: 0.3
        });
        private winResizeSub?: Subscription;

        constructor(container: string, resize: Observable<{ width: number, height: number }>) {
            this._context = new Konva.Stage({
                container,
                width: 800,
                height: 800,
            });

            this.winResizeSub = resize.subscribe(resize => {
                this._context.setSize(resize);
            });

            this._context.add(this.layer);
            this._context.add(this.auxiliaryLayer);
            this.bindStageHandlers();
            this.appendAuxiliaryElements();
        }

        setToolMode(mode: ToolMode) {
            this.toolMode = mode;
            this.onChangeToolMode.next(mode);
        }

        appendElement(element: PonElements.Element) {
            this.elements.push(element);
            this.bindHandlers(element);
            this.layer.add(element.getUI());
        }

        createElement(elementClass: any) {
            this.appendElement(elementClass.create(0, 0, 12));
        }

        loadNode(elementClass: any, nodeData: PonData.PonNode) {
            this.appendElement(new elementClass(nodeData));
        }

        getElementsData() {
            return this.elements.map(element => element.getData());
        }

        loadNodes(data: PonData.PonNode[]) {
            data.forEach(node => {
                switch (node.dtype) {
                    case "Box":
                        this.loadNode(PonElements.Box, node);
                        break;
                    case "ConnectionPoint":
                        this.loadNode(PonElements.ConnectionPoint, node);
                        break;
                    case "Cable":
                        // this.loadNode(PonElements.Cable, node);
                        break;
                    case "Simplex":
                        this.loadNode(PonElements.Simplex, node);
                }
            });
        }

        destroy() {
            this.winResizeSub?.unsubscribe();
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
            const movingCP: PonElements.ConnectionPoint[] = [];
            if (element instanceof PonElements.ConnectionPoint) {
                movingCP.push(element);
            }
            for (const child of element.getChild()) {
                movingCP.push(...this.getMovingCP(child));
            }
            return movingCP;
        }

        private appendAuxiliaryElements() {
            this.auxiliaryLayer.add(this.auxiliaryLine);
        }

        private bindStageHandlers() {
            this._context.on('wheel', this.zoomHandler.bind(this));
            this._context.on('mousedown', this.mouseDownHandler.bind(this));
            this._context.on('mouseup', this.mouseUpHandler.bind(this));
            this._context.on('mousemove', this.mouseMoveHandler.bind(this));
            this._context.on('contextmenu', (e) => {
                e.evt.preventDefault();
            });
        }

        private mouseDownHandler = (event: Konva.KonvaEventObject<MouseEvent>) => {
            if (event.evt.button === 2) {
                event.evt.preventDefault();
                this.panning = true;
                return;
            }
            switch (this.toolMode) {
            }
        }

        private mouseUpHandler = (event: Konva.KonvaEventObject<MouseEvent>) => {
            if (event.evt.button === 2) {
                event.evt.preventDefault();
                this.panning = false;
                return;
            }
            switch (this.toolMode) {
                case ToolMode.Connect:
                    if (this.controlState === ControlState.Connecting && this.connectingFromPoint) {
                        this.controlState = ControlState.None;
                        this.connectingFromPoint = undefined;
                        this.auxiliaryLine.setAttrs({
                            visible: false
                        })
                    }
                    break;
                case ToolMode.Move:
                    if (this.controlState === ControlState.Moving && this.movingElement) {
                        const position = this.movingElement.getUI().getPosition();
                        position.x = position.x - (position.x % 10);
                        position.y = position.y - (position.y % 10);
                        this.movingElement.getUI().setPosition(position);
                        this.movingElement.changePosition(position);
                        this.controlState = ControlState.None;
                        this.movingElement = undefined;
                    }
            }
        }

        private mouseMoveHandler = (event: Konva.KonvaEventObject<MouseEvent>) => {
            if (this.panning) {
                this._context.move({
                    x: event.evt.movementX,
                    y: event.evt.movementY
                })
                return;
            }
            switch (this.toolMode) {
                case ToolMode.Connect:
                    if (this.controlState === ControlState.Connecting && this.connectingFromPoint) {
                        const path = PonFunc.calculateBondPathToPoint(this.connectingFromPoint, this._context.getPointerPosition() ?? {
                            x: 0,
                            y: 0
                        });
                        this.auxiliaryLine.setAttrs({
                            points: path,
                        })
                    }
                    break;
                case ToolMode.Move:
                    if (this.controlState === ControlState.Moving && this.movingElement) {
                        const {x, y} = this._context.getPointerPosition() ?? {
                            x: 0,
                            y: 0
                        };
                        this.movingElement.getUI().move({
                            x: event.evt.movementX / this._context.scaleX(),
                            y: event.evt.movementY / this._context.scaleY(),
                        });
                        this.recalculateBonds(this.getMovingCP(this.movingElement));
                    }
            }
        }

        private zoomHandler = (event: Konva.KonvaEventObject<WheelEvent>) => {
            if (!this._context) return;
            event.evt.preventDefault();
            const SCALE_BY = 1.1;

            let oldScale = this._context.scaleX();
            let pointer = this._context.getPointerPosition();

            if (!pointer) return;

            let mousePointTo = {
                x: (pointer.x - this._context.x()) / oldScale,
                y: (pointer.y - this._context.y()) / oldScale,
            };

            // how to scale? Zoom in? Or zoom out?
            let direction = -Math.sign(event.evt.deltaY);

            let newScale = direction > 0 ? oldScale * SCALE_BY : oldScale / SCALE_BY;

            this._context.scale({x: newScale, y: newScale});

            let newPos = {
                x: pointer.x - mousePointTo.x * newScale,
                y: pointer.y - mousePointTo.y * newScale,
            };
            this._context.position(newPos);
        }

        private recalculateBonds(movingCP: PonElements.ConnectionPoint[]) {
            for (const cp of movingCP) {
                const bond = cp.getBond() as PonElements.Bond;
                if (bond)
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
                        const {x, y} = this._context.getPointerPosition() ?? {
                            x: 0,
                            y: 0
                        };
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
                    if (element instanceof PonElements.ConnectionPoint && this.controlState === ControlState.Connecting && this.connectingFromPoint) {
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
    }
}
