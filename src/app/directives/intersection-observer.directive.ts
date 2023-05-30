import {Directive, ElementRef, EventEmitter, OnInit, Output} from '@angular/core';

@Directive({
    selector: '[appIntersectionObserver]'
})
export class IntersectionObserverDirective implements OnInit {

    @Output() intersection = new EventEmitter<IntersectionObserverEntry[]>();
    private observer = new IntersectionObserver((entries, observer) =>
        this.intersection.emit(entries), {threshold: 0.5, root: this.root.nativeElement});
    private childMutationObserver = new MutationObserver(this.onChildMutation.bind(this));

    constructor(public root: ElementRef) {

    }

    ngOnInit(): void {
        const observerOptions = {
            childList: true,
            subtree: false
        }
        this.childMutationObserver.observe(this.root.nativeElement, observerOptions);
    }

    private onChildMutation(mutations: MutationRecord[]) {
        for (const mutation of mutations) {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach((node: any) => {
                    try {
                        this.observer.observe(node);
                    } catch (ignore) {
                    }
                });
                mutation.removedNodes.forEach((node: any) => {
                    try {
                        this.observer.unobserve(node);
                    } catch (ignore) {
                    }
                });
            }
        }
    }
}
