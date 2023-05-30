import {Directive, EventEmitter, HostListener, Output} from '@angular/core';

@Directive({
    selector: '[appScrollToBottomEmitter]'
})
export class ScrollToBottomEmitterDirective {

    @Output() onScrollToBottom: EventEmitter<void> = new EventEmitter<void>();

    constructor() {
    }

    @HostListener('scroll', ['$event'])
    onScroll(event: any) {
        if (((event.target['scrollHeight'] - Math.abs( event.target['scrollTop'])) - event.target.clientHeight) < 25) {
            this.onScrollToBottom.emit();
        }
    }

}
