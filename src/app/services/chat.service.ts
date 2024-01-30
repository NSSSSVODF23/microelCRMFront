import {EventEmitter, Injectable} from '@angular/core';
import {Chat} from "../types/transport-interfaces";
import {ApiService} from "./api.service";
import {RealTimeUpdateService} from "./real-time-update.service";
import {PersonalityService} from "./personality.service";
import {MessageService} from "primeng/api";

@Injectable({
    providedIn: 'root'
})
export class ChatService {

    chats: Chat[] = [];
    // unreadMessagesCount: { [chatId: number]: number } = {};
    open: EventEmitter<number> = new EventEmitter<number>();
    currentOpenChat?: number;

    private notificationAudios = {
        loud: new Audio('/assets/audio/notify/loud-notify.mp3'),
        quiet: new Audio('/assets/audio/notify/quiet-notify.mp3'),
    };

    constructor(private api: ApiService, private rt: RealTimeUpdateService, private personality: PersonalityService, private messageService: MessageService) {
        // this.getChats();
        personality.userData$.subscribe(emp => {
            if (!emp) return;
            this.rt.chatCreated(emp.login).subscribe(this.createChat.bind(this))
            this.rt.chatMessageCreated(emp.login).subscribe(message=>{
                if(message.parentChatId !== this.currentOpenChat){
                    if(this.notificationAudios.loud.paused) this.notificationAudios.loud.play().then();
                    this.messageService.add({
                        key: 'chatMessage',
                        severity: 'chatmsg',
                        data: message,
                        life: 30000,
                    });
                }else {
                    if(this.notificationAudios.quiet.paused) this.notificationAudios.quiet.play().then();
                }
            })
            // this.rt.updateCountUnreadMessages(emp.login).subscribe(c => this.unreadMessagesCount[c.chatId] = c.count)
        })
        this.rt.chatUpdated().subscribe(this.updateChat.bind(this));
        this.rt.chatClosed().subscribe(this.closeChat.bind(this));
        this.open.subscribe(()=>this.messageService.clear("chatMessage"));
    }

    // get isHasUnreadMessages(): boolean {
    //     // return Object.keys(this.unreadMessagesCount).length > 0;
    // }
    //
    // get allUnreadCount(): number {
    //     // return Object.values(this.unreadMessagesCount).reduce((a, b) => a + b, 0);
    // }

    createChat(chat: Chat): void {
        this.chats.push(chat);
        // this.api.getCountOfUnreadMessages(chat.chatId).subscribe(c => this.unreadMessagesCount[chat.chatId] = c);
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
            // delete this.unreadMessagesCount[chat.chatId];
        }
    }

    getChats(): void {
        this.api.getMyActiveChats().subscribe(chats => {
            this.chats = chats;
            for (const chat of chats) {
                // this.api.getCountOfUnreadMessages(chat.chatId).subscribe(c => this.unreadMessagesCount[chat.chatId] = c);
            }
        });
    }
}
