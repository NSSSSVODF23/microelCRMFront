import {AfterViewInit, Component, OnInit} from '@angular/core';
import {Observable, of} from "rxjs";
import Konva from "konva";
import TextConfig = Konva.TextConfig;
import GroupConfig = Konva.GroupConfig;
import {PonElements} from "../../../../pon/scheme/elements";

@Component({
    templateUrl: './pon-scheme-page.component.html',
    styleUrls: ['./pon-scheme-page.component.scss']
})
export class PonSchemePage implements OnInit, AfterViewInit {

    stage?: Konva.Stage;
    layer = new Konva.Layer();

    constructor() {
    }

    ngAfterViewInit(): void {
        this.stage = new Konva.Stage({
            container: 'container',
            width: 800,
            height: 800,
        });
        this.stage.add(this.layer);
        let box = new PonElements.Box();
        this.layer.add(box.getUI());
        // this.layer.add(this.rect);
    }

    ngOnInit(): void {
    }

    public handleClick(component: any) {
        console.log('Hello Circle', component);
    }

}
