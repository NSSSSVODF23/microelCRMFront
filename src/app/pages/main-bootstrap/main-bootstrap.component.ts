import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {Router} from "@angular/router";
import {NotificationsService} from "../../services/notifications.service";
import {ChatService} from "../../services/chat.service";
import {ChatPanelComponent} from "../../components/panels/chat-panel/chat-panel.component";
import {Subscription} from "rxjs";

@Component({
    templateUrl: './main-bootstrap.component.html',
    styleUrls: ['./main-bootstrap.component.scss']
})
export class MainBootstrapComponent implements OnInit, OnDestroy {

    isTaskCreationPage = false;
    @ViewChild('chatPanelEl') chatPanelEl?: ChatPanelComponent;
    openChatSub?:Subscription;

    constructor(readonly router: Router, readonly notifyService: NotificationsService, readonly chatService: ChatService) {
    }

    ngOnInit(): void {
        this.isTaskCreationPage = this.router.url === "/task/create";
        this.openChatSub = this.chatService.open.subscribe(id=>{
            if(this.chatPanelEl) this.chatPanelEl.show(id);
        })
    }

    ngOnDestroy() {
        this.openChatSub?.unsubscribe();
    }

    openCreateTaskPage() {
        const width = 800;
        const height = 800;
        // Open new tab for create new parent task with taskId parameter, using Window.open() method
        window.open('/task/create', '_blank', `popup=yes,width=${width},height=${height},left=${(screen.width / 2) - (width / 2)},top=${(screen.height / 2) - (height / 2)}`);
    }
}
