import {Component, OnInit, ViewChild} from '@angular/core';
import {Subscription, tap} from "rxjs";
import {ChatPanelComponent} from "../../../components/panels/chat-panel/chat-panel.component";
import {ActivatedRoute, Router} from "@angular/router";
import {NotificationsService} from "../../../services/notifications.service";
import {RealTimeUpdateService} from "../../../services/real-time-update.service";
import {ChatService} from "../../../services/chat.service";
import {TaskCreatorService} from "../../../services/task-creator.service";
import {BlockUiService} from "../../../services/block-ui.service";
import {AutoUnsubscribe} from "../../../decorators";

@Component({
    templateUrl: './main-bootstrap.component.html',
    styleUrls: ['./main-bootstrap.component.scss']
})
@AutoUnsubscribe()
export class MainBootstrap implements OnInit {

    isTaskCreationPage = false;
    @ViewChild('chatPanelEl') chatPanelEl?: ChatPanelComponent;
    openChatSub = this.chatService.open.subscribe(id => {
        if (this.chatPanelEl) this.chatPanelEl.show(id);
    })
    commutatorRemoteUpdatePoolVisible = false;
    commutatorRemoteUpdatePool$ = this.rt.acpCommutatorsRemoteUpdatePool().pipe(tap(pool => {
        if (!pool || pool.length === 0) this.commutatorRemoteUpdatePoolVisible = false;
    }));

    constructor(private router: Router, readonly notifyService: NotificationsService, private rt: RealTimeUpdateService, private route: ActivatedRoute,
                private chatService: ChatService, readonly taskCreator: TaskCreatorService, readonly blockUiService: BlockUiService) {
    }

    ngOnInit(): void {
        this.isTaskCreationPage = this.router.url === "/task/create";
        this.route.url.subscribe(console.log)
    }
}
