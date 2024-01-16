import {AfterViewInit, Directive, Input} from '@angular/core';
import {InputMask} from "primeng/inputmask";

@Directive({
    selector: '[focusAfterInit]'
})
export class FocusAfterInitDirective implements AfterViewInit {

    @Input() focusAfterInit = true;

    constructor(private hostElement: InputMask) {
    }

    ngAfterViewInit(): void {
        if (this.focusAfterInit)
            setTimeout(() => this.hostElement.focus());
    }

}
