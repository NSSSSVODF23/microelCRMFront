import {AfterViewInit, Directive, ElementRef, OnDestroy, OnInit} from '@angular/core';
import {
  delay,
  interval,
  mergeMap,
  of,
  repeat, skipWhile,
  Subject,
  Subscription,
  switchMap, takeLast,
  takeUntil, takeWhile,
  tap,
  throwError,
  timeout, timer
} from "rxjs";

@Directive({
  selector: '[appTicker]'
})
export class TickerDirective implements OnInit, OnDestroy{

  subscription?: Subscription;

  constructor(private elementRef: ElementRef<HTMLElement>) {
  }

  ngOnInit(): void {
    const element = this.elementRef.nativeElement;

    const mover$ = interval(60).pipe(
        takeWhile(()=> {
          return element.scrollWidth > element.scrollLeft + element.clientWidth
        }),
        tap(()=> {
          let distance = Math.floor((element.scrollWidth - element.clientWidth) / 55);
          if(distance < 1) distance = 1
          element.scrollBy({left: distance})
        }),
        takeLast(1)
    )

    this.subscription = of(null).pipe(
        delay(1000),
        skipWhile(()=>element.scrollWidth <= element.clientWidth),
        switchMap(()=>mover$),
        delay(1000),
        tap(()=>element.scrollTo({left:0})),
        repeat()
    ).subscribe()
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe()
  }

}
