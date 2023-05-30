import {AfterViewInit, Directive, ElementRef} from '@angular/core';

@Directive({
  selector: '[appEmojiStyleApply]'
})
export class EmojiStyleApplyDirective implements AfterViewInit{

  constructor(private element: ElementRef) { }

  ngAfterViewInit(): void {
    const el = this.element.nativeElement;
    el.innerHTML = el.innerHTML.replace(
        new RegExp(/(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/, 'g'),
        '<span class="emoji">$&</span>');
  }

}
