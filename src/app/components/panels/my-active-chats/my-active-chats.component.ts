import {Component, OnInit} from '@angular/core';
import {ChatService} from "../../../services/chat.service";
import {Chat} from "../../../types/transport-interfaces";
import {Overlay} from "primeng/overlay";

@Component({
    selector: 'app-my-active-chats',
    templateUrl: './my-active-chats.component.html',
    styleUrls: ['./my-active-chats.component.scss']
})
export class MyActiveChatsComponent implements OnInit {
    overlayPanelVisible = false;

    constructor(readonly chatService: ChatService) {
    }

    ngOnInit(): void {
    }

    trackByChat(index: number, chat: Chat) {
        return chat.chatId+chat.updated+chat.lastMessage+chat.title+chat.members;
    }

    alignOverlay(overlayPanelEl: Overlay) {
        setTimeout(()=>{
            overlayPanelEl.alignOverlay();
        }, 150);
    }
}
