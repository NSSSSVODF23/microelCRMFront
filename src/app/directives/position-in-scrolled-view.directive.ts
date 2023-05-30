import {Directive, ElementRef, Input, OnDestroy, OnInit} from '@angular/core';
import {animationFrames, debounceTime, delay, fromEvent, interval, tap} from "rxjs";
import {SubscriptionsHolder} from "../util";

export interface BoxPosition {
    top?: number;
    left?: number;
    right?: number;
    bottom?: number;
}

@Directive({
    selector: '[appPositionInScrolledView]'
})
export class PositionInScrolledViewDirective implements OnInit, OnDestroy {

    @Input() parentView?: HTMLElement;
    @Input() basicOffsets?: BoxPosition;
    private subscriptions = new SubscriptionsHolder();

    constructor(private element: ElementRef) {
    }

    ngOnInit() {
        if (!this.parentView || !this.basicOffsets) return;
        this.parentView.style.position = 'relative';
        this.element.nativeElement.style.position = 'absolute';
        const timer$ = interval(500);
        const scroll$ = fromEvent(this.parentView, 'scroll').pipe(
            tap(this.hide.bind(this)),
            debounceTime(500),
            tap(this.updatePosition.bind(this)),
            tap(this.show.bind(this))
        );
        this.subscriptions.addSubscription("scr", scroll$.subscribe());
        this.subscriptions.addSubscription('time', timer$.subscribe(this.updatePosition.bind(this)));
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribeAll();
    }

    private hide(){
        this.element.nativeElement.style.opacity = '0';
    }

    private show(){
        this.element.nativeElement.style.opacity = '';
    }

    private updatePosition() {
        if (!this.parentView || !this.basicOffsets) return;
        const hScroll = this.parentView.scrollTop;
        const vScroll = this.parentView.scrollLeft;
        const el = this.element.nativeElement;
        if (this.basicOffsets.top != undefined) {
            el.style.top = this.basicOffsets.top + hScroll + 'px';
        } else if (this.basicOffsets.bottom != undefined) {
            el.style.bottom = this.basicOffsets.bottom - hScroll + 'px';
        }
        if (this.basicOffsets.left != undefined) {
            el.style.left = this.basicOffsets.left + vScroll + 'px';
        } else if (this.basicOffsets.right != undefined) {
            el.style.right = this.basicOffsets.right + vScroll + 'px';
        }
    }
}
