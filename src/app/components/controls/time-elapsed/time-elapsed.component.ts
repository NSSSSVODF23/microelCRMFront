import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {SubscriptionsHolder, Utils} from "../../../util";
import {interval} from "rxjs";

@Component({
    selector: 'app-time-elapsed',
    templateUrl: './time-elapsed.component.html',
    styleUrls: ['./time-elapsed.component.scss']
})
export class TimeElapsedComponent implements OnInit, OnDestroy {
    @Input() type: 'short' | 'long' = 'long';
    @Input() startTime?: number | string | Date;
    value: string = '-- секунд';
    subscriptions: SubscriptionsHolder = new SubscriptionsHolder();

    constructor() {
    }

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
        if (this.startTime instanceof Date) {
            startTime = this.startTime.getTime();
        } else if (typeof this.startTime === 'string') {
            startTime = new Date(this.startTime).getTime();
        } else {
            startTime = this.startTime
        }
        const delta = new Date().getTime() - startTime;
        // Секунды, остаток от минуты
        const seconds = Math.floor(delta / 1000) % 60;
        const secondsSuf = Utils.declineOfNumber(seconds, ["секунда", "секунды", "секунд"]);
        // Минуты, остаток от часов
        const minutes = Math.floor(delta / (1000 * 60)) % 60;
        const minutesSuf = Utils.declineOfNumber(minutes, ["минута", "минуты", "минут"]);
        // Часы, остаток от дней
        const hours = Math.floor(delta / (1000 * 60 * 60)) % 24;
        const hoursSuf = Utils.declineOfNumber(hours, ["час", "часа", "часов"]);
        // Дни, без остатка
        const days = Math.floor(delta / (1000 * 60 * 60 * 24));
        const daysSuf = Utils.declineOfNumber(days, ["день", "дня", "дней"]);

        if (days || hours || minutes || seconds) {
            switch (this.type) {
                case 'short':
                    if (days > 0) {
                        this.value = `${days} ${daysSuf}`;
                    } else if (hours > 0) {
                        this.value = `${hours} ${hoursSuf}`;
                    } else if (minutes > 0) {
                        this.value = `${minutes} ${minutesSuf}`;
                    } else if (seconds > 0) {
                        this.value = `${seconds} ${secondsSuf}`;
                    }
                    break;
                case 'long':
                    this.value = '';
                    if (days > 0) {
                        this.value += `${days} ${daysSuf}`;
                    }
                    if (hours > 0) {
                        if (days > 0) this.value += ' ';
                        this.value += `${hours} ${hoursSuf}`;
                    }
                    if (minutes > 0) {
                        if (hours > 0 || days > 0) this.value += ' ';
                        this.value += `${minutes} ${minutesSuf}`;
                    }
                    if (seconds > 0 && days === 0 && hours === 0 && minutes === 0) {
                        if (minutes > 0 || hours > 0 || days > 0) this.value += ' ';
                        this.value += `${seconds} ${secondsSuf}`;
                    }
                    break;
            }
        } else {
            this.value = '-- секунд';
        }
    }
}
