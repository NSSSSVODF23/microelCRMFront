import {Directive, ElementRef, HostListener, Input, OnChanges, OnDestroy, OnInit, SimpleChanges} from '@angular/core';

@Directive({
    selector: '[appAdjustInputWidth]'
})
export class AdjustInputWidthDirective implements OnInit, OnDestroy, OnChanges {

    @Input() dfPlaceholder: string = '';

    @Input() set update(value: string) {
        this.adjust(this.el.nativeElement);
    }

    itemToMeasure = document.createElement('span');

    constructor(readonly el: ElementRef<HTMLInputElement>) {
    }

    @HostListener('input', ['$event'])
    onInput(event: any) {
        this.adjust(event.target)
    }

    @HostListener('blur', ['$event'])
    onBlur(event: any) {
        setTimeout(() => this.adjust(event.target))
    }

    @HostListener('focus', ['$event'])
    onFocus(event: any) {
        this.adjust(event.target)
    }

    ngOnInit(): void {
        const computedStyle = getComputedStyle(this.el.nativeElement);
        this.itemToMeasure.style.fontSize = computedStyle.fontSize;
        this.itemToMeasure.style.fontFamily = computedStyle.fontFamily;
        this.itemToMeasure.style.fontWeight = computedStyle.fontWeight;
        this.itemToMeasure.style.fontStyle = computedStyle.fontStyle;
        this.itemToMeasure.style.visibility = 'hidden';
        this.itemToMeasure.style.position = 'fixed';
        this.itemToMeasure.style.whiteSpace = 'nowrap';
        this.el.nativeElement.style.transition = 'width .2s ease-in-out';
        this.el.nativeElement.style.boxSizing = 'content-box';
        this.el.nativeElement.placeholder = this.dfPlaceholder;
        document.body.append(this.itemToMeasure);
        this.adjust(this.el.nativeElement)
    }

    ngOnDestroy(): void {
        document.body.removeChild(this.itemToMeasure);
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes["dfPlaceholder"]) {
            this.itemToMeasure.innerText = changes["dfPlaceholder"].currentValue;
            this.el.nativeElement.placeholder = changes["dfPlaceholder"].currentValue;
        }
        this.adjust(this.el.nativeElement)
    }

    private adjust(target: any) {
        if (target.value)
            this.itemToMeasure.innerText = target.value;
        else
            this.itemToMeasure.innerText = this.dfPlaceholder;
        const {width} = this.itemToMeasure.getBoundingClientRect();
        target.style.width = `${width}px`;
    }
}
