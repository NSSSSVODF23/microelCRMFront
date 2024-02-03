import {Component, Input, OnInit} from '@angular/core';
import {OnChange} from "../../../decorators";
import {Utils} from "../../../util";

@Component({
    selector: 'app-duration',
    templateUrl: './duration.component.html',
    styleUrls: ['./duration.component.scss']
})
export class DurationComponent implements OnInit {

    @Input() ms?: number;
    @Input() short = true;

    hours: number = 0;
    hourSuffix = "";
    minutes: number = 0;
    minuteSuffix = "";
    seconds: number = 0;
    secondSuffix = "";

    constructor() {
    }

    ngOnInit(): void {
    }

    @OnChange('ms')
    msChange(ms: number) {
        this.hours = Math.floor(ms / 3600000);
        this.hourSuffix = this.short ? "ч." : Utils.declineOfNumber(this.hours, ['час', 'часа', 'часов']);
        this.minutes = Math.floor((ms - this.hours * 3600000) / 60000);
        this.minuteSuffix = this.short ? "м." :  Utils.declineOfNumber(this.minutes, ['минута', 'минуты', 'минут']);
        this.seconds = Math.floor((ms - this.hours * 3600000 - this.minutes * 60000) / 1000);
        this.secondSuffix = this.short ? "с." :  Utils.declineOfNumber(this.seconds, ['секунда', 'секунды', 'секунд']);
    }
}
