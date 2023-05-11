import {Directive, HostListener} from '@angular/core';
import {OverlayPanel} from "primeng/overlaypanel";

@Directive({
    selector: 'p-overlayPanel [appCloseIfScroll]',
})
export class CloseIfScrollDirective {

    constructor(readonly element: OverlayPanel) {
    }

    @HostListener('window:scroll', ['$event']) onScrollEvent(event: any) {
        if (this.element.overlayVisible) {
            // this.element.hide();
            this.element.align();
        }
    }

}
