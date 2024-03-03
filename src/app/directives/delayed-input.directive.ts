import {Directive, ElementRef, EventEmitter, HostListener, Input, OnInit, Output} from '@angular/core';
import {debounceTime, fromEvent, map, ReplaySubject, switchMap, tap} from "rxjs";
import {AutoUnsubscribe, OnChangeObservable} from "../decorators";

@Directive({
    selector: '[appDelayedInput input]'
})
@AutoUnsubscribe()
export class DelayedInputDirective {

    @Input() delay = 500;
    @Output() delayInput = new EventEmitter();

    @OnChangeObservable('delay')
    delayChange$ = new ReplaySubject<number>(1);

    sub = this.delayChange$
        .pipe(
            switchMap(delay => fromEvent(this.el.nativeElement, "input").pipe(debounceTime(delay))),
            map((event) => {
                const target = event.target as HTMLInputElement;
                return target.value;
            })
        ).subscribe(this.delayInput);

    constructor(private el: ElementRef<HTMLInputElement>) {
    }

}
