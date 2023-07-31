import {Directive, HostListener, Input} from '@angular/core';

@Directive({
    selector: '[appPreventInput]'
})
export class PreventInputDirective {

    @Input() appPreventInput: boolean = false;

    constructor() {
    }

    @HostListener('keydown', ['$event'])
    onKeyDown(event: KeyboardEvent) {
        if (this.appPreventInput) {
            event.preventDefault();
        }
    }
}
