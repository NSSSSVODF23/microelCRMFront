import {Directive, HostListener, Input} from '@angular/core';

@Directive({
  selector: '[appRegexPatternChecker]'
})
export class RegexPatternCheckerDirective {

  @Input() patternRx?: string;

  constructor() { }

  @HostListener('keydown', ['$event'])
  letterChange(event: any) {
    if(!this.patternRx) return;
    const regex = new RegExp(this.patternRx);
    const specialKeys = ["Enter", "Space", "Tab", "Backspace"]
    if (!regex.test(event.target.value + event.key) && !specialKeys.some(key => key === event.key)) event.preventDefault();
  }
}
