import Konva from "konva";
import {PonData, PonElements, PonFunc, PonType} from "./elements";
import {Observable, Subject, Subscription} from "rxjs";
import PonNodeType = PonType.PonNodeType;

export namespace PonEditor {

    import ConnectionPoint = PonElements.ConnectionPoint;

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

        private gridSize = 20;
        private gridLayer = new Konva.Layer();

        private mainLayer = new Konva.Layer();
        private bondLayer = new Konva.Layer();
        private auxiliaryLayer = new Konva.Layer();
        private elements: PonElements.AbstractElement[] = [];
        private connectingFromPoint?: PonElements.ConnectionPoint;
        private movingElement?: PonElements.AbstractElement;
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

            this.setupLayers();
            this.bindStageHandlers();
            this.appendAuxiliaryElements();
        }

        setToolMode(mode: ToolMode) {
            this.toolMode = mode;
            this.onChangeToolMode.next(mode);
        }

        appendElement(element: PonElements.AbstractElement) {
            this.elements.push(element);
            this.bindHandlers(element);
            switch (element.getData().type) {
                case PonNodeType.BOND:
                    this.bondLayer.add(element.getUI());
                    break;
                default:
                    this.mainLayer.add(element.getUI());
            }
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
                switch (node.type) {
                    case PonNodeType.BOX:
                        this.loadNode(PonElements.Box, node);
                        break;
                    case PonNodeType.CONNECTION_POINT:
                        this.loadNode(PonElements.ConnectionPoint, node);
                        break;
                    case PonNodeType.CABLE:
                        // this.loadNode(PonElements.Cable, node);
                        break;
                    case PonNodeType.SIMPLEX:
                        this.loadNode(PonElements.Simplex, node);
                        break;
                    case PonType.PonNodeType.BOND:
                        this.loadNode(PonElements.Bond, node);
                        break;
                }
            });
            this.connectConnectionPoints();
        }

        destroy() {
            this.winResizeSub?.unsubscribe();
        }

        /**
         * Рисует сетку
         */
        drawGrid() {
            // // Очищаем слой
            // this.gridLayer.destroyChildren();
            //
            // // Получаем текущий масштаб
            // const scale = this._context.scaleX();
            //
            // // Вычисляем видимую область
            // let minX = -this._context.x() / scale;
            // minX = minX + (minX % this.gridSize);
            // let minY = -this._context.y() / scale;
            // minY = minY + (minY % this.gridSize);
            // let maxX = (this._context.width() / scale + minX);
            // maxX = maxX - (maxX % this.gridSize);
            // let maxY = (this._context.height() / scale + minY);
            // maxY = maxY - (maxY % this.gridSize);
            //
            // // Рисуем сетку из точек
            // for (let i = minX; i <= maxX; i += 1) {
            //     for (let j = minY; j <= maxY; j += 1) {
            //         // Создаем новую точку
            //         const circle = new Konva.Circle({
            //             x: i * this.gridSize * scale,
            //             y: j * this.gridSize * scale,
            //             radius: 1,
            //             fill: 'gray',
            //             listening: false,
            //             // stroke: 'black',
            //             // strokeWidth: 1 * scale
            //         });
            //
            //         // Добавляем точку на слой
            //         this.gridLayer.add(circle);
            //     }
            // }
            //
            // // Рисуем слой
            // this.gridLayer.draw();
        }

        /**
         * Соединяет точки с линиями
         */
        private connectConnectionPoints() {
            this.elements.forEach(element => {
                if (element instanceof PonElements.Bond) {
                    const bondData = element.getData();
                    if (bondData.inputConnectionPoint && bondData.outputConnectionPoint) {
                        const allConnectionPoints = this.getAllConnectionPoints();
                        const inputPoint = allConnectionPoints.find(el => el.getData().id === bondData.inputConnectionPoint?.id) as ConnectionPoint;
                        const outputPoint = allConnectionPoints.find(el => el.getData().id === bondData.outputConnectionPoint?.id) as ConnectionPoint;
                        console.log(inputPoint, outputPoint, bondData);
                        if (inputPoint && outputPoint) {
                            element.connect(inputPoint, outputPoint);
                        }
                    }
                }
            })
        }

        private setupLayers() {
            this._context.add(this.gridLayer);
            this._context.add(this.mainLayer);
            this._context.add(this.bondLayer);
            this._context.add(this.auxiliaryLayer);
            this.drawGrid();
        }

        private bindHandlers(element: PonElements.AbstractElement) {
            element.onMouseEnter(this.elementMouseEnterHandler.bind(this));
            element.onMouseLeave(this.elementMouseLeaveHandler.bind(this));
            element.onMouseDown(this.elementMouseDownHandler.bind(this));
            element.onMouseMove(this.elementMouseMoveHandler.bind(this));
            element.onMouseUp(this.elementMouseUpHandler.bind(this));
            for (const child of element.getChild()) {
                this.bindHandlers(child);
            }
        }

        private getConnectionPoints(element: PonElements.AbstractElement) {
            const movingCP: PonElements.ConnectionPoint[] = [];
            if (element instanceof PonElements.ConnectionPoint) {
                movingCP.push(element);
            }
            for (const child of element.getChild()) {
                movingCP.push(...this.getConnectionPoints(child));
            }
            return movingCP;
        }

        private getAllConnectionPoints() {
            const movingCP: PonElements.ConnectionPoint[] = [];
            for (const element of this.elements) {
                movingCP.push(...this.getConnectionPoints(element));
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
                        this.recalculateBonds(this.getConnectionPoints(this.movingElement));
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
                this.drawGrid();
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
            this.drawGrid();
        }

        private recalculateBonds(movingCP: PonElements.ConnectionPoint[]) {
            for (const cp of movingCP) {
                const bond = cp.getBond();
                if (bond) {
                    bond.recalculate();
                }
            }
        }

        private elementMouseEnterHandler = (event: Konva.KonvaEventObject<MouseEvent>, element: PonElements.AbstractElement) => {
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

        private elementMouseLeaveHandler = (event: Konva.KonvaEventObject<MouseEvent>, element: PonElements.AbstractElement) => {
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

        private elementMouseDownHandler = (event: Konva.KonvaEventObject<MouseEvent>, element: PonElements.AbstractElement) => {
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

        private elementMouseMoveHandler = (event: Konva.KonvaEventObject<MouseEvent>, element: PonElements.AbstractElement) => {
            switch (this.toolMode) {
            }
        }

        private elementMouseUpHandler = (event: Konva.KonvaEventObject<MouseEvent>, element: PonElements.AbstractElement) => {
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
