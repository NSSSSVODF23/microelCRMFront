import {Directive, HostListener, ViewContainerRef} from '@angular/core';

@Directive({
  selector: '[appExtendPageHeight]'
})
export class ExtendPageHeightDirective {

  constructor(readonly host: ViewContainerRef) {
    if(document.readyState==="complete") setTimeout(this.onResize.bind(this), 0);
  }

  @HostListener('window:load')
  onLoad() {
    this.onResize()
  }

  @HostListener('window:resize')
  onResize() {
    const {top} = this.host.element.nativeElement.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    this.host.element.nativeElement.style.height = (windowHeight-top) + 'px';
  }

}
