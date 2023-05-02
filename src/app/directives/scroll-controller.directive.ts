import {Directive, ElementRef, EventEmitter, HostListener, Input, OnInit, Output} from '@angular/core';

@Directive({
    selector: '[appScrollController]'
})
export class ScrollControllerDirective implements OnInit {

    @Input() scrollPosition: number = 0;
    @Output() scrollPositionChange: EventEmitter<number> = new EventEmitter();

    constructor(private elementRef: ElementRef<HTMLElement>) {
    }

    ngOnInit(): void {
        setTimeout(
            () => this.elementRef.nativeElement.scrollTo({top: this.scrollPosition}),
            100
        )
    }

    @HostListener('scroll', ['$event'])
    private scrollPositionChanged(event: any) {
        this.scrollPosition = event.target.scrollTop;
        this.scrollPositionChange.emit(event.target.scrollTop);
    }

}
