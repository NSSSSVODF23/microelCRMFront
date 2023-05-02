import {Component, ElementRef, Input, OnDestroy, OnInit} from '@angular/core';
import {FloatingChipsService} from "../../../services/floating-chips.service";

@Component({
  selector: 'app-timestamp-chips',
  templateUrl: './timestamp-chips.component.html',
  styleUrls: ['./timestamp-chips.component.scss']
})
export class TimestampChipsComponent implements OnInit, OnDestroy {

  @Input() timestamp: any;
  @Input() index: number = 0;
  @Input() distance: number = 0;


  constructor(readonly chipsService: FloatingChipsService, readonly el: ElementRef<HTMLElement>) { }

  ngOnInit(): void {
    this.chipsService.add(this.el);
  }

  ngOnDestroy(): void {
    this.chipsService.remove(this.el);
  }

}
