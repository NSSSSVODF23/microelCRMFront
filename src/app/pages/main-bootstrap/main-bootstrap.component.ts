import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {Router} from "@angular/router";
import {NotificationsService} from "../../services/notifications.service";
import {ChatService} from "../../services/chat.service";
import {ChatPanelComponent} from "../../components/panels/chat-panel/chat-panel.component";
import {Subscription} from "rxjs";
import {TaskCreatorService} from "../../services/task-creator.service";

@Component({
    templateUrl: './main-bootstrap.component.html',
    styleUrls: ['./main-bootstrap.component.scss']
})
export class MainBootstrapComponent implements OnInit, OnDestroy {

    isTaskCreationPage = false;
    @ViewChild('chatPanelEl') chatPanelEl?: ChatPanelComponent;
    openChatSub?:Subscription;

    constructor(readonly router: Router, readonly notifyService: NotificationsService, readonly chatService: ChatService, readonly taskCreator: TaskCreatorService) {
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
}
