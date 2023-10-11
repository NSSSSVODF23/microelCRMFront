import {Directive, HostListener, Input} from '@angular/core';
import {OverlayPanel} from "primeng/overlaypanel";
import {Overlay} from "primeng/overlay";

@Directive({
    selector: '[appCloseIfScroll]',
})
export class CloseIfScrollDirective {

    @Input() isVisible: boolean = false;
    @Input() alignFn?: ()=>void;

    constructor() {
    }

    @HostListener('window:scroll', ['$event']) onScrollEvent(event: any) {
        if (this.isVisible && this.alignFn) {
            this.alignFn();
        }
    }

}
