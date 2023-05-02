import {Component, Input, OnInit} from '@angular/core';
import {INotification, NotificationType} from "../../../transport-interfaces";
import {NotificationsService} from "../../../services/notifications.service";

@Component({
    selector: 'app-notification-item',
    templateUrl: './notification-item.component.html',
    styleUrls: ['./notification-item.component.scss']
})
export class NotificationItemComponent implements OnInit {

    @Input() notification: INotification = {} as INotification;

    constructor(readonly notifyService: NotificationsService) {
    }

    ngOnInit(): void {
    }

    getIcon(type: NotificationType) {
        return this.notifyService.icons[type] + ' icon header';
    }

    getTitle(type: NotificationType) {
        return this.notifyService.titles[type];
    }
}
