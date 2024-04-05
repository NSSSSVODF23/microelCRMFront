import Konva from "konva";

export namespace PonElements {

    interface Element {
        getUI(): Konva.Group;
    }

    export class Box implements Element{

        private node = new Konva.Group({
            draggable:true,
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

        constructor() {
            this.node.add(this.background);
            this.node.add(this.title);
            setTimeout(() =>{
                this.node.move({x: 100, y: 100});
                this.background.setSize({width: 250, height: 250});
            }, 3000);
        }

        getUI(): Konva.Group {
            return this.node;
        }
    }
}
