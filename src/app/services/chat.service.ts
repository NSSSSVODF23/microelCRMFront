import {EventEmitter, Injectable} from '@angular/core';
import {Chat} from "../transport-interfaces";
import {ApiService} from "./api.service";
import {RealTimeUpdateService} from "./real-time-update.service";
import {PersonalityService} from "./personality.service";

@Injectable({
    providedIn: 'root'
})
export class ChatService {

    chats: Chat[] = [];
    unreadMessagesCount: { [chatId: number]: number } = {};
    open: EventEmitter<number> = new EventEmitter<number>();

    constructor(private api: ApiService, private rt: RealTimeUpdateService, private personality: PersonalityService) {
        this.getChats();
        personality.onGettingUserData.subscribe(emp => {
            if (!emp.login) return;
            this.rt.chatCreated(emp.login).subscribe(this.createChat.bind(this))
            this.rt.updateCountUnreadMessages(emp.login).subscribe(c => this.unreadMessagesCount[c.chatId] = c.count)
        })
        this.rt.chatUpdated().subscribe(this.updateChat.bind(this));
        this.rt.chatClosed().subscribe(this.closeChat.bind(this));
    }

    get isHasUnreadMessages(): boolean {
        return Object.keys(this.unreadMessagesCount).length > 0;
    }

    get allUnreadCount(): number {
        return Object.values(this.unreadMessagesCount).reduce((a, b) => a + b, 0);
    }

    createChat(chat: Chat): void {
        this.chats.push(chat);
        this.api.getCountOfUnreadMessages(chat.chatId).subscribe(c => this.unreadMessagesCount[chat.chatId] = c);
    }

    updateChat(chat: Chat): void {
        const index = this.chats.findIndex(c => c.chatId === chat.chatId);
        if (index != -1) {
            this.chats[index] = chat;
        }
    }

    closeChat(chat: Chat): void {
        const index = this.chats.findIndex(c => c.chatId === chat.chatId);
        if (index != -1) {
            this.chats.splice(index, 1);
            delete this.unreadMessagesCount[chat.chatId];
        }
    }

    getChats(): void {
        this.api.getMyActiveChats().subscribe(chats => {
            this.chats = chats;
            for (const chat of chats) {
                this.api.getCountOfUnreadMessages(chat.chatId).subscribe(c => this.unreadMessagesCount[chat.chatId] = c);
            }
        });
    }
}
