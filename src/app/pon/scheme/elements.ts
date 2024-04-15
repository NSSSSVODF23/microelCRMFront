import Konva from "konva";

export namespace PonType {
    export enum FiberColor {
        RED = "RED",
        BLUE = "BLUE",
        YELLOW = "YELLOW",
        ORANGE = "ORANGE",
        GREEN = "GREEN",
        WHITE = "WHITE",
        BLACK = "BLACK",
        BROWN = "BROWN",
        GRAY = "GRAY"
    }

    export enum ConnectorType {
        SCSC = "SCSC",
        LCLC = "LCLC",
        SCLC = "SCLC"
    }

    export enum PolishingType {
        UPC = "UPC",
        APC = "APC"
    }

    export enum BoxType {
        ROOT = "ROOT",
        TRUNK = "TRUNK",
        SUBSCRIBER = "SUBSCRIBER"
    }

    export enum ConnectionPointType {
        IN = "IN",
        OUT = "OUT"
    }

    export enum EventType {
        CREATE = "CREATE",
        UPDATE = "UPDATE",
        EDIT = "EDIT",
        DELETE = "DELETE"
    }
}

export namespace PonData {

    export interface PonScheme {
        id: number;
        name: string;
        description: string;
        created: string;
        updated: string;
        edited?: string;
        deleted?: string;
        creator: string;
        lastEditor: string;
        isEditing: boolean;
    }

    export interface PonNode {
        id: number;
        dtype: string;
        x: number;
        y: number;
        z: number;
        width: number;
        height: number;
        parent: Partial<PonNode>;
        scheme: Partial<PonScheme>;
    }

    export interface Simplex extends PonNode {
        connectorType: PonType.ConnectorType;
        polishingType: PonType.PolishingType;
        box: Partial<Box>;
    }

    export interface Fiber {
        id: number;
        color: PonType.FiberColor;
        in: ConnectionPoint;
        out: ConnectionPoint;
        cable: Partial<Cable>;
    }

    export interface Cable extends PonNode {
        fibers: Partial<Fiber>[];
        kN: number;
        xIn: number;
        yIn: number;
        xOut: number;
        yOut: number;
    }

    export interface Bond {
        id: number;
        path: number[];
        in: ConnectionPoint;
        out: ConnectionPoint;
    }

    export interface ConnectionPoint extends PonNode {
        type: PonType.ConnectionPointType;
        bond: Partial<Bond>;
    }

    export interface Box extends PonNode {
        type: PonType.BoxType;
        name: string;
        simplexes: Partial<Simplex>[];
    }

    export interface SchemeChangeEvent {
        type: PonType.EventType;
        scheme: PonScheme;
    }
}

export namespace PonElements {

    export abstract class Element {

        abstract getData(): any;

        abstract getUI(): Konva.Group;

        abstract getChild(): Element[];

        abstract highlight(): void;

        abstract unhighlight(): void;

        abstract changePosition(position: {x: number, y: number}): void;

        abstract onMouseEnter(callback: (event: Konva.KonvaEventObject<MouseEvent>, element: Element) => void): void;

        abstract onMouseLeave(callback: (event: Konva.KonvaEventObject<MouseEvent>, element: Element) => void): void;

        abstract onMouseDown(callback: (event: Konva.KonvaEventObject<MouseEvent>, element: Element) => void): void;

        abstract onMouseUp(callback: (event: Konva.KonvaEventObject<MouseEvent>, element: Element) => void): void;

        abstract onMouseMove(callback: (event: Konva.KonvaEventObject<MouseEvent>, element: Element) => void): void;

        abstract onMouseClick(callback: (event: Konva.KonvaEventObject<MouseEvent>, element: Element) => void): void;

        abstract onMouseDblClick(callback: (event: Konva.KonvaEventObject<MouseEvent>, element: Element) => void): void;

        abstract onDragStart(callback: (event: Konva.KonvaEventObject<MouseEvent>, element: Element) => void): void;

        abstract onDragMove(callback: (event: Konva.KonvaEventObject<MouseEvent>, element: Element) => void): void;

        abstract onDragEnd(callback: (event: Konva.KonvaEventObject<MouseEvent>, element: Element) => void): void;
    }

    export class ConnectionPoint extends Element {

        readonly point = new Konva.Circle({
            x: 0,
            y: 0,
            radius: 8,
            fill: 'gray',
        });
        private data: Partial<PonData.ConnectionPoint> = {};
        private node = new Konva.Group({});
        private bond?: Partial<PonElements.Bond>;

        constructor(data?: Partial<PonData.ConnectionPoint>) {
            super();
            this.node.add(this.point);
            this.data = data ?? {};
            this.data.dtype = "ConnectionPoint";
            this.node.move({
                x: this.data.x ?? 0,
                y: this.data.y ?? 0,
            });
            this.node.add(this.point);
        }

        getBond() {
            return this.bond;
        }

        setBond(bond: PonElements.Bond) {
            this.bond = bond;
        }

        getData() {
            return this.data;
        }

        override changePosition(position: { x: number; y: number }) {
            this.data.x = position.x;
            this.data.y = position.y;
        }

        override highlight() {
        }

        override unhighlight() {

        }

        override getUI(): Konva.Group {
            return this.node;
        }

        override getChild(): PonElements.Element[] {
            return [];
        }

        override onMouseEnter(callback: (event: Konva.KonvaEventObject<MouseEvent>, element: Element) => void): void {
            this.node.on('mouseenter', ev => callback(ev, this));
        }

        override onMouseLeave(callback: (event: Konva.KonvaEventObject<MouseEvent>, element: Element) => void): void {
            this.node.on('mouseleave', ev => callback(ev, this));
        }

        override onMouseDown(callback: (event: Konva.KonvaEventObject<MouseEvent>, element: Element) => void): void {
            this.node.on('mousedown', ev => callback(ev, this));
        }

        override onMouseUp(callback: (event: Konva.KonvaEventObject<MouseEvent>, element: Element) => void): void {
            this.node.on('mouseup', ev => callback(ev, this));
        }

        override onMouseMove(callback: (event: Konva.KonvaEventObject<MouseEvent>, element: Element) => void): void {
            this.node.on('mousemove', ev => callback(ev, this));
        }

        override onMouseClick(callback: (event: Konva.KonvaEventObject<MouseEvent>, element: Element) => void): void {
            this.node.on('click', ev => callback(ev, this));
        }

        override onMouseDblClick(callback: (event: Konva.KonvaEventObject<MouseEvent>, element: Element) => void): void {
            this.node.on('dblclick', ev => callback(ev, this));
        }

        override onDragStart(callback: (event: Konva.KonvaEventObject<MouseEvent>, element: Element) => void): void {
            this.node.on('dragstart', ev => callback(ev, this));
        }

        override onDragMove(callback: (event: Konva.KonvaEventObject<MouseEvent>, element: Element) => void): void {
            this.node.on('dragmove', ev => callback(ev, this));
        }

        override onDragEnd(callback: (event: Konva.KonvaEventObject<MouseEvent>, element: Element) => void): void {
            this.node.on('dragend', ev => callback(ev, this));
        }
    }

    export class Simplex extends Element {
        private data: Partial<PonData.Simplex> = {};
        private node = new Konva.Group({});
        private inPoint?: ConnectionPoint;
        private outPoint?: ConnectionPoint;
        private typeName = new Konva.Text({
            x: 19.5,
            y: 5.5,
            text: "SCSC",
            fontSize: 11,
            fill: 'gray',
        });
        private background = new Konva.Rect({
            x: 0,
            y: 0,
            width: 70,
            height: 20,
            fill: 'white',
            cornerRadius: 7.5,
            strokeEnabled: true,
            stroke: 'gray',
            strokeWidth: 2,
            dash: [2, 2],
        });

        constructor(data?: Partial<PonData.ConnectionPoint>) {
            super();
            this.data = data ?? {};
            this.data.dtype = "Simplex";
            this.inPoint = new ConnectionPoint({
                type: PonType.ConnectionPointType.IN,
                x: 10,
                y: 10,
            });
            this.outPoint = new ConnectionPoint({
                type: PonType.ConnectionPointType.OUT,
                x: 50 + 10,
                y: 10,
            });
            this.node.move({
                x: this.data.x ?? 0,
                y: this.data.y ?? 0,
            });
            this.node.add(this.background);
            this.node.add(this.inPoint.getUI());
            this.node.add(this.typeName);
            this.node.add(this.outPoint.getUI());
        }

        static create(data: Partial<PonData.Simplex>) {
            return new Simplex(data);
        }

        override changePosition(position: { x: number; y: number }) {
            this.data.x = position.x;
            this.data.y = position.y;
        }

        override getData(): any {
            return this.data;
        }

        override highlight() {
        }

        override unhighlight() {

        }

        override getUI(): Konva.Group {
            return this.node;
        }

        override getChild(): PonElements.Element[] {
            if (this.inPoint && this.outPoint) return [this.inPoint, this.outPoint];
            return [];
        }

        override onMouseEnter(callback: (event: Konva.KonvaEventObject<MouseEvent>, element: Element) => void): void {
            this.node.on('mouseenter', ev => callback(ev, this));
        }

        override onMouseLeave(callback: (event: Konva.KonvaEventObject<MouseEvent>, element: Element) => void): void {
            this.node.on('mouseleave', ev => callback(ev, this));
        }

        override onMouseDown(callback: (event: Konva.KonvaEventObject<MouseEvent>, element: Element) => void): void {
            this.node.on('mousedown', ev => callback(ev, this));
        }

        override onMouseUp(callback: (event: Konva.KonvaEventObject<MouseEvent>, element: Element) => void): void {
            this.node.on('mouseup', ev => callback(ev, this));
        }

        override onMouseMove(callback: (event: Konva.KonvaEventObject<MouseEvent>, element: Element) => void): void {
            this.node.on('mousemove', ev => callback(ev, this));
        }

        override onMouseClick(callback: (event: Konva.KonvaEventObject<MouseEvent>, element: Element) => void): void {
            this.node.on('click', ev => callback(ev, this));
        }

        override onMouseDblClick(callback: (event: Konva.KonvaEventObject<MouseEvent>, element: Element) => void): void {
            this.node.on('dblclick', ev => callback(ev, this));
        }

        override onDragStart(callback: (event: Konva.KonvaEventObject<MouseEvent>, element: Element) => void): void {
            this.node.on('dragstart', ev => callback(ev, this));
        }

        override onDragMove(callback: (event: Konva.KonvaEventObject<MouseEvent>, element: Element) => void): void {
            this.node.on('dragmove', ev => callback(ev, this));
        }

        override onDragEnd(callback: (event: Konva.KonvaEventObject<MouseEvent>, element: Element) => void): void {
            this.node.on('dragend', ev => callback(ev, this));
        }
    }

    export class Box extends Element {

        private data: Partial<PonData.Box> = {};
        private node = new Konva.Group({
            draggable: false,
        });
        private background = new Konva.Rect({
            x: 0,
            y: 0,
            width: 100,
            height: 100,
            fill: 'white',
            cornerRadius: 5,
            strokeEnabled: true,
            stroke: 'gray',
            strokeWidth: 2,
            dash: [5, 5],
        });
        private title = new Konva.Text({
            x: 10,
            y: 10,
            text: 'Ящик К.2.5',
            fill: 'gray',
        });
        private simplexes: PonElements.Simplex[] = [];

        constructor(data?: Partial<PonData.Box>) {
            super();
            this.data = data ?? {};
            this.data.dtype = "Box";
            this.title.setText(data?.name ?? 'Без имени');
            if (data?.x && data?.y) {
                this.node.move({
                    x: data.x,
                    y: data.y,
                });
            }
            if (data?.width && data?.height) {
                this.node.setSize({width: data.width, height: data.height})
            }
            this.background.setSize({
                width: data?.width ?? 310,
                height: data?.height ? data.height : (data?.simplexes?.length ?? 0) * 25 + 120,
            })
            this.node.add(this.background);
            this.node.add(this.title);
            let index = 0;
            for (let simplex of data?.simplexes ?? []) {
                if (!simplex.x) {
                    simplex.x = 120;
                }
                if (!simplex.y) {
                    simplex.y = index * 25 + 60;
                }
                const simplexElement = new Simplex(simplex);
                this.simplexes.push(simplexElement);
                this.node.add(simplexElement.getUI());
                index++;
            }
        }

        static create(x: number, y: number, portCount: number) {
            let simplexes: Partial<PonData.Simplex>[] = [];
            for (let i = 0; i < portCount; i++) {
                simplexes.push({
                    connectorType: PonType.ConnectorType.SCSC,
                    polishingType: PonType.PolishingType.UPC,
                });
            }
            return new Box({
                x,
                y,
                name: `Ящик К.2.5`,
                simplexes,
            });
        }

        override changePosition(position: { x: number; y: number }) {
            this.data.x = position.x;
            this.data.y = position.y;
        }

        override getData(): any {
            return this.data;
        }

        override highlight() {
            this.title.setAttr('fill', 'blue');
            this.background.setAttr('stroke', 'blue');
        }

        override unhighlight() {
            this.title.setAttr('fill', 'gray');
            this.background.setAttr('stroke', 'gray');
        }

        override getUI(): Konva.Group {
            return this.node;
        }

        override getChild(): PonElements.Element[] {
            return this.simplexes;
        }

        override onMouseEnter(callback: (event: Konva.KonvaEventObject<MouseEvent>, element: Element) => void): void {
            this.node.on('mouseenter', ev => callback(ev, this));
        }

        override onMouseLeave(callback: (event: Konva.KonvaEventObject<MouseEvent>, element: Element) => void): void {
            this.node.on('mouseleave', ev => callback(ev, this));
        }

        override onMouseDown(callback: (event: Konva.KonvaEventObject<MouseEvent>, element: Element) => void): void {
            this.node.on('mousedown', ev => callback(ev, this));
        }

        override onMouseUp(callback: (event: Konva.KonvaEventObject<MouseEvent>, element: Element) => void): void {
            this.node.on('mouseup', ev => callback(ev, this));
        }

        override onMouseMove(callback: (event: Konva.KonvaEventObject<MouseEvent>, element: Element) => void): void {
            this.node.on('mousemove', ev => callback(ev, this));
        }

        override onMouseClick(callback: (event: Konva.KonvaEventObject<MouseEvent>, element: Element) => void): void {
            this.node.on('click', ev => callback(ev, this));
        }

        override onMouseDblClick(callback: (event: Konva.KonvaEventObject<MouseEvent>, element: Element) => void): void {
            this.node.on('dblclick', ev => callback(ev, this));
        }

        override onDragStart(callback: (event: Konva.KonvaEventObject<MouseEvent>, element: Element) => void): void {
            this.node.on('dragstart', ev => callback(ev, this));
        }

        override onDragMove(callback: (event: Konva.KonvaEventObject<MouseEvent>, element: Element) => void): void {
            this.node.on('dragmove', ev => callback(ev, this));
        }

        override onDragEnd(callback: (event: Konva.KonvaEventObject<MouseEvent>, element: Element) => void): void {
            this.node.on('dragend', ev => callback(ev, this));
        }
    }

    export class Bond extends Element {

        private data: Partial<PonData.Bond> = {};
        private node = new Konva.Group({
            draggable: false,
        });
        private line = new Konva.Line({
            points: [0, 0, 0, 0],
            stroke: 'black',
            strokeWidth: 2,
            // tension: 0.3
        });
        private inCp?: PonElements.ConnectionPoint;
        private outCp?: PonElements.ConnectionPoint;

        constructor(data?: Partial<PonData.Bond>) {
            super();
            this.data = data ?? {};
            if (this.data.in && this.data.out) {
                const path = this.data.path ?? [];
                this.line.setAttrs({
                    points: path,
                })
            }
            this.node.add(this.line);
        }

        static create(inCp: PonElements.ConnectionPoint, outCp: PonElements.ConnectionPoint) {
            const path = PonFunc.calculateBondPath(inCp, outCp);
            const bond = new Bond({
                in: inCp.getData() as PonData.ConnectionPoint,
                out: outCp.getData() as PonData.ConnectionPoint,
                path,
            });
            inCp.setBond(bond);
            outCp.setBond(bond);
            bond.setConnectionPoints(inCp, outCp);
            return bond;
        }

        getInCp() {
            return this.inCp;
        }

        getOutCp() {
            return this.outCp;
        }

        setConnectionPoints(inCp: PonElements.ConnectionPoint, outCp: PonElements.ConnectionPoint) {
            this.inCp = inCp;
            this.outCp = outCp;
        }

        recalculate() {
            if (this.inCp && this.outCp) {
                const path = PonFunc.calculateBondPath(this.inCp, this.outCp);
                this.line.setAttrs({
                    points: path,
                })
            }
        }

        override changePosition(position: { x: number; y: number }) {
            // this.data.x = position.x;
            // this.data.y = position.y;
        }

        override getData(): any {
            return this.data;
        }

        override highlight() {

        }

        override unhighlight() {

        }

        override getChild(): PonElements.Element[] {
            return [];
        }

        override getUI(): Konva.Group {
            return this.node;
        }

        override onDragEnd(callback: (event: Konva.KonvaEventObject<MouseEvent>, element: PonElements.Element) => void): void {
        }

        override onDragMove(callback: (event: Konva.KonvaEventObject<MouseEvent>, element: PonElements.Element) => void): void {
        }

        override onDragStart(callback: (event: Konva.KonvaEventObject<MouseEvent>, element: PonElements.Element) => void): void {
        }

        override onMouseClick(callback: (event: Konva.KonvaEventObject<MouseEvent>, element: PonElements.Element) => void): void {
        }

        override onMouseDblClick(callback: (event: Konva.KonvaEventObject<MouseEvent>, element: PonElements.Element) => void): void {
        }

        override onMouseDown(callback: (event: Konva.KonvaEventObject<MouseEvent>, element: PonElements.Element) => void): void {
        }

        override onMouseEnter(callback: (event: Konva.KonvaEventObject<MouseEvent>, element: PonElements.Element) => void): void {
        }

        override onMouseLeave(callback: (event: Konva.KonvaEventObject<MouseEvent>, element: PonElements.Element) => void): void {
        }

        override onMouseMove(callback: (event: Konva.KonvaEventObject<MouseEvent>, element: PonElements.Element) => void): void {
        }

        override onMouseUp(callback: (event: Konva.KonvaEventObject<MouseEvent>, element: PonElements.Element) => void): void {
        }

    }
}

export namespace PonFunc {
    /**
     * Получение угла наклона отрезка в радианах
     * @param x0 начало отрезка X
     * @param y0 начало отрезка Y
     * @param x1 конец отрезка X
     * @param y1 конец отрезка Y
     */
    export function getAngle(x0: number, y0: number, x1: number, y1: number): number {
        return Math.atan2((y1 - y0), (x1 - x0));
    }

    /**
     * Получение координаты точки пересечения отрезка с окружностью
     * @param x0 Центр окружности
     * @param y0 Центр окружности
     * @param x1 Конец отрезка X
     * @param y1 Конец отрезка Y
     * @param radius Радиус окружности
     */
    export function getCircleIntersection(x0: number, y0: number, x1: number, y1: number, radius: number): { x: number, y: number } {
        const ang = getAngle(x0, y0, x1, y1);
        return {
            x: x0 + radius * Math.cos(ang),
            y: y0 + radius * Math.sin(ang),
        };
    }

    export function calculateBondPath(cp1: PonElements.ConnectionPoint, cp2: PonElements.ConnectionPoint) {
        const stagePosition = cp1.point.getStage()?.getAbsolutePosition();
        const scale = cp1.point.getStage()?.scale();
        if (!stagePosition || !scale) return [];
        const pos1 = cp1.point.getAbsolutePosition();
        pos1.x -= stagePosition.x;
        pos1.y -= stagePosition.y;
        pos1.x /= scale.x;
        pos1.y /= scale.y;
        const pos2 = cp2.point.getAbsolutePosition();
        pos2.x -= stagePosition.x;
        pos2.y -= stagePosition.y;
        pos2.x /= scale.x;
        pos2.y /= scale.y;

        const thirdx = (pos2.x - pos1.x) / 3;
        const thirdy = (pos2.y - pos1.y) / 6;
        const fbX = pos1.x + thirdx;
        const fbY = pos1.y + thirdy;
        const sbX = pos2.x - thirdx;
        const sbY = pos2.y - thirdy;
        const {x, y} = PonFunc.getCircleIntersection(pos1.x, pos1.y, fbX, fbY, 10);
        const targetPos = PonFunc.getCircleIntersection(pos2.x, pos2.y, sbX, sbY, 10);

        return [x, y, fbX, fbY, sbX, sbY, targetPos.x, targetPos.y];
    }

    export function calculateBondPathToPoint(cp1: PonElements.ConnectionPoint, point: { x: number, y: number }) {
        const stagePosition = cp1.point.getStage()?.getAbsolutePosition();
        const scale = cp1.point.getStage()?.scale();
        if (!stagePosition || !scale) return [];
        const pos1 = cp1.point.getAbsolutePosition();
        pos1.x -= stagePosition.x;
        pos1.y -= stagePosition.y;
        pos1.x /= scale.x;
        pos1.y /= scale.y;
        const pos2 = point;
        pos2.x -= stagePosition.x;
        pos2.y -= stagePosition.y;
        pos2.x /= scale.x;
        pos2.y /= scale.y;

        const thirdx = (pos2.x - pos1.x) / 3;
        const thirdy = (pos2.y - pos1.y) / 6;
        const fbX = pos1.x + thirdx;
        const fbY = pos1.y + thirdy;
        const sbX = pos2.x - thirdx;
        const sbY = pos2.y - thirdy;
        const {x, y} = PonFunc.getCircleIntersection(pos1.x, pos1.y, fbX, fbY, 10);
        const targetPos = PonFunc.getCircleIntersection(pos2.x, pos2.y, sbX, sbY, 10);

        return [x, y, fbX, fbY, sbX, sbY, targetPos.x, targetPos.y];
    }
}
