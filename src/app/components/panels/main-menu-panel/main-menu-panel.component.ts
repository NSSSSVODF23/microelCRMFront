import {Component, OnInit} from '@angular/core';
import {MainMenuService} from "../../../services/main-menu.service";
import {NotificationsService} from "../../../services/notifications.service";

@Component({
    selector: 'app-main-menu-panel',
    templateUrl: './main-menu-panel.component.html',
    styleUrls: ['./main-menu-panel.component.scss']
})
export class MainMenuPanelComponent implements OnInit {

    notificationSidebarVisible = false;

    constructor(readonly menuService: MainMenuService, readonly notificationsService: NotificationsService) {
    }

    ngOnInit(): void {
    }

    openNotificationSidebar(event: MouseEvent) {
        this.notificationSidebarVisible = true;
    }
}
