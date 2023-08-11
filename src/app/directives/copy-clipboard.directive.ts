import {Directive, EventEmitter, HostListener, Input, Output} from '@angular/core';

@Directive({
  selector: '[appCopyClipboard]'
})
export class CopyClipboardDirective {
  @Input() appCopyClipboard: string = "";

  @Output() copied = new EventEmitter();

  @HostListener("click", ["$event"])
  public onClick(event: MouseEvent): void {
    event.preventDefault();
    navigator.clipboard.writeText(this.appCopyClipboard).then(r => this.copied.emit());
  }

}
