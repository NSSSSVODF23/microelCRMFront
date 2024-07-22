import {Directive, ElementRef, HostListener} from '@angular/core';

@Directive({
  selector: '[appDragScrolling]'
})
export class DragScrollingDirective {

  isMouseDown = false;

  constructor(private el: ElementRef<HTMLElement>) {
      el.nativeElement.style.cursor = 'grab';
      el.nativeElement.style.userSelect = 'none';
  }

  @HostListener('mousedown', ['$event'])
  onMouseDown(event: MouseEvent) {
      if (event.button === 0) {
          this.isMouseDown = true;
          this.el.nativeElement.style.cursor = 'grabbing';
      }
  }

  @HostListener('mouseup', ['$event'])
  onMouseUp(event: MouseEvent) {
      if (event.button === 0) {
          this.isMouseDown = false;
          this.el.nativeElement.style.cursor = 'grab';
      }
  }

  @HostListener('mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
      if (this.isMouseDown) {
          const el = this.el.nativeElement;
          el.scrollTo(el.scrollLeft-event.movementX, el.scrollTop-event.movementY)
      }
  }

}
