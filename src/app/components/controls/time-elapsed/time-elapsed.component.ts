import {Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges} from '@angular/core';
import {SubscriptionsHolder, Utils} from "../../../util";
import {interval} from "rxjs";

@Component({
  selector: 'app-time-elapsed',
  templateUrl: './time-elapsed.component.html',
  styleUrls: ['./time-elapsed.component.scss']
})
export class TimeElapsedComponent implements OnInit, OnDestroy {
  @Input() startTime?: number|string|Date;
  value: string = '-- секунд';
  subscriptions: SubscriptionsHolder = new SubscriptionsHolder();

  constructor() { }

  ngOnInit(): void {
    this.subscriptions.addSubscription("time", interval(100).subscribe(this.updateTime.bind(this)));
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribeAll();
  }

  updateTime() {
    if (!this.startTime) {
      this.value = '-- секунд';
      return;
    }
    let startTime = 0;
    if(this.startTime instanceof Date) {
      startTime = this.startTime.getTime();
    }else if(typeof this.startTime === 'string') {
      startTime = new Date(this.startTime).getTime();
    }else{
      startTime = this.startTime
    }
    const delta = new Date().getTime() - startTime;
    // Секунды, остаток от минуты
    const seconds = Math.floor(delta / 1000) % 60;
    // Минуты, остаток от часов
    const minutes = Math.floor(delta / (1000 * 60)) % 60;
    // Часы, остаток от дней
    const hours = Math.floor(delta / (1000 * 60 * 60)) % 24;
    // Дни, без остатка
    const days = Math.floor(delta / (1000 * 60 * 60 * 24));

    let tempValue = '';
    if (days > 0) {
      tempValue += `${days} ${Utils.declineOfNumber(days, ["день", "дня", "дней"])}`;
    }
    if (hours > 0) {
      if(days > 0) tempValue += ' ';
      tempValue += `${hours} ${Utils.declineOfNumber(hours, ["час", "часа", "часов"])}`;
    }
    if (minutes > 0) {
      if(hours> 0 || days > 0) tempValue += ' ';
      tempValue += `${minutes} ${Utils.declineOfNumber(minutes, ["минута", "минуты", "минут"])}`;
    }
    if (seconds > 0 && days === 0 && hours === 0 && minutes === 0) {
      if(minutes> 0 || hours > 0 || days > 0) tempValue += ' ';
      tempValue += `${seconds} ${Utils.declineOfNumber(seconds, ["секунда", "секунды", "секунд"])}`;
    }

    if(tempValue) {
      this.value = tempValue;
    }else{
      this.value = '-- секунд';
    }
  }
}
