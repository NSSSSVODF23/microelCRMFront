import {AfterViewInit, Directive, ElementRef, Input} from '@angular/core';
import {Utils} from "../util";

@Directive({
    selector: '[appColorize]'
})
export class ColorizeDirective implements AfterViewInit {

    constructor(private el: ElementRef<HTMLElement>) {
    }

    _colorString?: string;

    get colorString() {
        return this._colorString;
    }

    @Input() set colorString(value: string | undefined) {
        this._colorString = value;
        this.el.nativeElement.style.color = Utils.stringToColor(this._colorString?.trim() ?? '');
    }

    ngAfterViewInit(): void {
        this.el.nativeElement.style.color = Utils.stringToColor(this.el.nativeElement.innerText.trim());
    }
}
