import {Component, ElementRef, Input, OnChanges, OnInit, SimpleChanges, ViewChild} from '@angular/core';
import {Utils} from "../../../util";
import {EmployeeStatus} from "../../../transport-interfaces";
import {RealTimeUpdateService} from "../../../services/real-time-update.service";

@Component({
    selector: 'app-avatar', templateUrl: './avatar.component.html', styleUrls: ['./avatar.component.scss']
})
export class AvatarComponent implements OnInit, OnChanges {

    @Input() size: number = 3.5;
    @Input() deleted?: boolean = false;
    @Input() src?: string;
    @Input() name?: string;
    @Input() status?: EmployeeStatus;
    @Input() shape: 'circle' | 'square' = 'circle';
    @ViewChild('wrapperEl') wrapperEl?: ElementRef<HTMLDivElement>;
    @ViewChild('captionEl') captionEl?: ElementRef<HTMLDivElement>;
    isLoad = false;
    get captionStyle () {
       return {
           // textSize: this.size + 'rem',
       }
    };

    get wrapperStyle() {
        return {
            borderRadius: this.shape === 'circle' ? '999px' : '25%',
            width: this.size + 'rem',
            height: this.size + 'rem',
            fontSize: this.size + 'rem',
            background: this.isLoad ? 'transparent' : this.colorize()
        }
    }

    constructor() {
    }

    get indicatorStyle() {
        const style = {} as any;
        if (this.shape === 'square') {
            style.transform = 'translate(25%, -25%)';
        }
        switch (this.status) {
            case EmployeeStatus.ONLINE:
                style.backgroundColor = '#36ff3b';
                break;
            case EmployeeStatus.AWAY:
                style.backgroundColor = '#ffc107';
                break;
            case EmployeeStatus.OFFLINE:
                style.backgroundColor = '#d5dde1';
                break;
        }
        return style;
    }

    ngOnInit(): void {
    }

    getInitials() {
        // Находим одну или две буквы из this.name,
        // одна буква это первая буква в строке, а вторая буква, это буква после пробела
        if (this.name) {
            const name = this.name.trim();
            const firstLetter = name.charAt(0);
            const secondLetter = name.indexOf(' ') >= 0 ? name.charAt(name.indexOf(' ') + 1) : '';
            return (firstLetter + secondLetter).toUpperCase();
        } else {
            return "?"
        }
    }

    colorize(): string {
        return Utils.stringToGradient(this.name ?? "?");
    }

    ngOnChanges(changes: SimpleChanges): void {
        // setTimeout(() => {
        //     if(!this.wrapperEl || !this.captionEl) return;
        //     // Получаем наибольшее значение высоты или ширины элемента captionEl
        //     const maxSize = Math.max(this.wrapperEl.nativeElement.offsetHeight, this.captionEl.nativeElement.offsetHeight);
        //     // Устанавливаем это значение как высоту и ширину wrapperEl
        //     this.wrapperEl.nativeElement.style.width = maxSize + 'px';
        //     this.wrapperEl.nativeElement.style.height = maxSize + 'px';
        // })
    }
}
