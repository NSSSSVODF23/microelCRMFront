import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {Router} from "@angular/router";
import {NotificationsService} from "../../services/notifications.service";
import {ChatService} from "../../services/chat.service";
import {ChatPanelComponent} from "../../components/panels/chat-panel/chat-panel.component";
import {map, Subscription, tap} from "rxjs";
import {TaskCreatorService} from "../../services/task-creator.service";
import {RealTimeUpdateService} from "../../services/real-time-update.service";
import {BlockUiService} from "../../services/block-ui.service";

@Component({
    templateUrl: './main-bootstrap.component.html',
    styleUrls: ['./main-bootstrap.component.scss']
})
export class MainBootstrapComponent implements OnInit, OnDestroy {

    isTaskCreationPage = false;
    commutatorRemoteUpdatePool$ = this.rt.acpCommutatorsRemoteUpdatePool().pipe(tap(pool=>{
        if(!pool || pool.length === 0) this.commutatorRemoteUpdatePoolVisible = false;
    }));
    @ViewChild('chatPanelEl') chatPanelEl?: ChatPanelComponent;
    openChatSub?:Subscription;
    commutatorRemoteUpdatePoolVisible = false;

    constructor(private router: Router, readonly notifyService: NotificationsService, private rt: RealTimeUpdateService,
                private chatService: ChatService, readonly taskCreator: TaskCreatorService, readonly blockUiService: BlockUiService) {
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
