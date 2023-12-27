import {Directive, EventEmitter, OnDestroy, OnInit, Output} from '@angular/core';
import {Listbox} from "primeng/listbox";
import {SubscriptionsHolder} from "../util";
import {debounceTime, filter, fromEvent, map, Observable, startWith} from "rxjs";

@Directive({
  selector: 'p-listbox[appListElementLazyScroll]'
})
export class ListElementLazyScrollDirective implements OnInit, OnDestroy{

  private subscriptions = new SubscriptionsHolder();
  private scroll$?: Observable<HTMLDivElement>;
  @Output() onScrollDown = new EventEmitter();

  constructor(private element: Listbox) { }

  ngOnInit(): void {
    const el = this.element.el.nativeElement as HTMLDivElement;
    const wrapperChild = el.children.item(0);
    if(wrapperChild){
      const scrollChild = wrapperChild.children.item(0) as HTMLDivElement;
      if(scrollChild){
        this.scroll$ = fromEvent(scrollChild,  'scroll').pipe(map(event=>{
          const target = event.target as HTMLDivElement;
          return target;
        }),startWith(scrollChild), debounceTime(200),filter((target:HTMLDivElement)=>{
          return (target.scrollHeight - (target.scrollTop+target.offsetHeight)) < 10;
        }));
        this.subscriptions.addSubscription("scroll", this.scroll$.subscribe(()=>this.onScrollDown.emit()))
      }
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribeAll();
  }

}
