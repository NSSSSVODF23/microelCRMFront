import {AfterViewInit, Directive, HostListener, Input, ViewContainerRef} from '@angular/core';

@Directive({
    selector: '[appExtendPageHeight]'
})
export class ExtendPageHeightDirective implements AfterViewInit {

    @Input() limited = false;
    @Input() shift = 0;

    constructor(readonly host: ViewContainerRef) {
        if (document.readyState === "complete") setTimeout(this.onResize.bind(this), 0);
    }

    @HostListener('window:load')
    onLoad() {
        // this.onResize();
    }

    @HostListener('window:resize')
    onResize() {
        const {y} = this.host.element.nativeElement.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        if (!this.limited) this.host.element.nativeElement.style.minHeight = (windowHeight - (y < 0 ? 0 : y) - this.shift) + 'px';
        if (this.limited) this.host.element.nativeElement.style.height = (windowHeight - (y < 0 ? 0 : y) - this.shift) + 'px';
    }

    @HostListener('window:scroll', ['$event'])
    onScroll(event: any) {
        this.onResize();
    }

    ngAfterViewInit(): void {
        this.onResize();
    }

}
