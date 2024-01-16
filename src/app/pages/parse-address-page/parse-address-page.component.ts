import {Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {SimpleMessage} from "../../types/parsing-interfaces";
import {ApiService} from "../../services/api.service";
import {RealTimeUpdateService} from "../../services/real-time-update.service";
import {Subscription} from "rxjs";

@Component({
  templateUrl: './parse-address-page.component.html',
  styleUrls: ['./parse-address-page.component.scss']
})
export class ParseAddressPageComponent implements OnInit, OnDestroy {

  messages: SimpleMessage[] = [];
  subscription?: Subscription;
  @ViewChild('messageListEl') messageListEl?: ElementRef<HTMLDivElement>;

  constructor(readonly rt: RealTimeUpdateService, readonly api: ApiService) { }

  ngOnInit(): void {
    this.subscription = this.rt.parserMessageReceived().subscribe(message=> {
      this.messages.push(message);
      if(this.messageListEl?.nativeElement){
          this.messageListEl.nativeElement.scrollTop = this.messageListEl.nativeElement.scrollHeight-this.messageListEl.nativeElement.clientHeight;
      }
    })
  }

  ngOnDestroy() {
      this.subscription?.unsubscribe();
  }

  messageClass(item: SimpleMessage) {
    return 'simple-message ' + item.severity.toLowerCase();
  }

  startParse() {
    this.api.startAddressParse().subscribe()
  }
}
