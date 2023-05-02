import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
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
    isLoad = false;
    avatarType: "image" | "initials" | "deleted" = "initials";

    constructor() {
    }

    get mainStyle() {
        let color = 'transparent';
        if (this.avatarType === 'initials') {
            color = this.colorize();
        } else if (this.avatarType === 'deleted') {
            color = '#ced5dc';
        }
        return {
            width: this.size + 'rem',
            height: this.size + 'rem',
            fontSize: this.size + 'rem',
            borderRadius: this.shape === 'circle' ? '999px' : '25%',
            background: color
        }
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

    updateType() {
        if (this.deleted) {
            this.avatarType = "deleted"
            return;
        }
        if (this.src) {
            this.avatarType = "image"
        } else {
            this.avatarType = "initials";
        }
    }

    ngOnInit(): void {
        this.updateType()
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

    imageDownloaded() {
        this.isLoad = true;
        this.updateType();
    }

    ngOnChanges(changes: SimpleChanges): void {
        this.updateType();
    }
}
