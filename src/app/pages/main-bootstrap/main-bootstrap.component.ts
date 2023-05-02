import {Component, OnInit} from '@angular/core';
import {Router} from "@angular/router";
import {NotificationsService} from "../../services/notifications.service";

@Component({
    templateUrl: './main-bootstrap.component.html',
    styleUrls: ['./main-bootstrap.component.scss']
})
export class MainBootstrapComponent implements OnInit {

    isTaskCreationPage = false;

    constructor(readonly router: Router, readonly notifyService: NotificationsService) {
    }

    ngOnInit(): void {
        this.isTaskCreationPage = this.router.url === "/task/create";
    }

    openCreateTaskPage() {
        const width = 800;
        const height = 800;
        // Open new tab for create new parent task with taskId parameter, using Window.open() method
        window.open('/task/create', '_blank', `popup=yes,width=${width},height=${height},left=${(screen.width / 2) - (width / 2)},top=${(screen.height / 2) - (height / 2)}`);
    }
}
