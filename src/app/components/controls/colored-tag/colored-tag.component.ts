import {AfterViewInit, Component, ElementRef, Input, OnChanges, OnInit, SimpleChanges, ViewChild} from '@angular/core';
import {Utils} from "../../../util";

@Component({
    selector: 'app-colored-tag',
    templateUrl: './colored-tag.component.html',
    styleUrls: ['./colored-tag.component.scss']
})
export class ColoredTagComponent implements OnInit, AfterViewInit, OnChanges {

    @ViewChild("wrapper") wrapper?: ElementRef<HTMLSpanElement>;

    constructor() {
    }

    @Input() caption?: string;

    @Input() captionForColor?: string;

    @Input() color?: string;

    ngAfterViewInit(): void {
        this.colorize();
    }

    ngOnInit(): void {
    }

    colorize() {
        if(!this.wrapper) return;
        if (this.color) {
            this.wrapper.nativeElement.style.background = this.color;
        }else if(this.captionForColor){
            this.wrapper.nativeElement.style.background = Utils.stringToGradient(this.captionForColor);
        }else if(this.caption){
            this.wrapper.nativeElement.style.background = Utils.stringToGradient(this.caption);
        }
    }

    ngOnChanges(changes: SimpleChanges): void {
        this.colorize();
    }

}
