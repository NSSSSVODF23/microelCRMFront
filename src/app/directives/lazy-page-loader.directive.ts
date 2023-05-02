import {Directive, EventEmitter, HostListener, Input, OnInit, Output} from '@angular/core';

@Directive({
  selector: '[appLazyPageLoader]'
})
export class LazyPageLoader implements OnInit{

  @Input() loading = false;
  @Output() loadingChange = new EventEmitter();
  @Output() load = new EventEmitter();
  @Input() initialScrollPos = 0;
  @Output() initialScrollPosChange: EventEmitter<number> = new EventEmitter();

  constructor() { }

  ngOnInit(): void {
    setTimeout(
    // @ts-ignore
        () => window.scrollTo({top: this.initialScrollPos, behavior: 'instant'}),
        100
    )
  }

  @HostListener('window:scroll', ['$event'])
  windowScroll(event: WheelEvent){
    const scrollDelta = document.documentElement.scrollHeight - (document.documentElement.scrollTop + window.innerHeight);
    if(scrollDelta === 0 && !this.loading) {
      this.loading = true;
      this.loadingChange.emit(true);
      this.load.emit()
    }
    this.initialScrollPos = window.scrollY;
    this.initialScrollPosChange.emit(window.scrollY);
  }

  @HostListener('window:resize', ['$event'])
  windowResize(event: any){
    console.log(event);
  }

}
