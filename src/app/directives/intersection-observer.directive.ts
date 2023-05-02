import {Directive, ElementRef, EventEmitter, Input, OnInit, Output} from '@angular/core';

@Directive({
    selector: '[appIntersectionObserver]'
})
export class IntersectionObserverDirective implements OnInit {

    @Output() intersection = new EventEmitter<void>();
    @Input() root?: HTMLElement;
    private observer?: IntersectionObserver;

    constructor(public el: ElementRef) {

    }

    ngOnInit(): void {

        this.observer = new IntersectionObserver(this.callback, {threshold: 0.5, root: this.root});
        this.observer.observe(this.el.nativeElement);
    }

    private callback: ConstructorParameters<typeof IntersectionObserver>[0] = (entries) =>
        entries
            // .filter((entry) => {
            //     return entry.isIntersecting!;
            // })
            .forEach((_entry) => {
                // this.intersection.emit();
                if(_entry.isIntersecting){
                    this.el.nativeElement.children.forEach((c:any)=>c.style.display = undefined);
                }else{
                    this.el.nativeElement.children.forEach((c:any)=>c.style.display = 'none');
                }
            });
}
