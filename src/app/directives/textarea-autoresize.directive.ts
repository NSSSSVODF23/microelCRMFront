import {AfterViewInit, Directive, ElementRef, OnDestroy} from '@angular/core';
import {SubscriptionsHolder} from "../util";
import {fromEvent, interval} from "rxjs";

@Directive({
    selector: '[appTextareaAutoresize]'
})
export class TextareaAutoresizeDirective implements AfterViewInit, OnDestroy {

    private subscriptions: SubscriptionsHolder = new SubscriptionsHolder();
    private measureElement = document.createElement('div');

    constructor(private elementRef: ElementRef<HTMLTextAreaElement>) {
    }

    ngAfterViewInit(): void {
        const textAreaElement = this.elementRef.nativeElement;
        document.body.append(this.measureElement);
        textAreaElement.style.boxSizing = 'border-box';
        const computedStyle = window.getComputedStyle(textAreaElement);
        this.measureElement.style.fontSize = computedStyle.fontSize;
        this.measureElement.style.fontFamily = computedStyle.fontFamily;
        this.measureElement.style.fontWeight = computedStyle.fontWeight;
        this.measureElement.style.fontStyle = computedStyle.fontStyle;
        this.measureElement.style.padding = computedStyle.padding;
        this.measureElement.style.lineHeight = computedStyle.lineHeight;
        this.measureElement.style.letterSpacing = computedStyle.letterSpacing;
        this.measureElement.style.border = computedStyle.border;
        this.measureElement.style.minHeight = (parseFloat(computedStyle.fontSize) + 5) + 'px';
        this.measureElement.style.whiteSpace = 'pre-wrap';
        this.measureElement.style.boxSizing = 'border-box';
        this.measureElement.style.visibility = 'hidden';
        this.measureElement.style.position = 'fixed';
        this.measureElement.style.top = '0';
        this.measureElement.style.left = '0';
        this.measureElement.style.overflow = 'hidden';
        this.measureElement.style.width = textAreaElement.offsetWidth + 'px';
        this.measureElement.style.height = 'auto';
        this.measureElement.style.overflowWrap = 'break-word';

        const input$ = fromEvent(textAreaElement, 'input');
        const interval$ = interval(300);
        const winResize$ = fromEvent(window, 'resize');

        const inpSub = input$.subscribe(this.resize.bind(this))
        const intervalSub = interval$.subscribe(this.resize.bind(this));
        this.subscriptions.addSubscription('input', inpSub);
        this.subscriptions.addSubscription('interval', intervalSub);


        const winResizeSub = winResize$.subscribe(this.resize.bind(this));
        this.subscriptions.addSubscription('winResize', winResizeSub);

        this.resize();
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribeAll()
    }

    private resize() {
        const textAreaElement = this.elementRef.nativeElement;
        const value = textAreaElement.value;
        this.measureElement.style.width = textAreaElement.offsetWidth + 'px';
        this.measureElement.innerText = value;
        let additionalHeight = 0;
        if (value[value.length - 1] === '\n') {
            additionalHeight = parseFloat(window.getComputedStyle(textAreaElement).fontSize) + 5;
        }
        if (textAreaElement.value.length === 0) {
            this.measureElement.style.boxSizing = 'content-box';
        } else {
            this.measureElement.style.boxSizing = 'border-box';
        }
        textAreaElement.style.height = this.measureElement.offsetHeight + additionalHeight + 'px';
    }
}
