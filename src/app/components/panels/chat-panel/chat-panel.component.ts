import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {ChatMessage, Employee, EmployeeStatus, FileData} from "../../../transport-interfaces";
import {PersonalityService} from "../../../services/personality.service";
import {ApiService} from "../../../services/api.service";
import {SubscriptionsHolder} from "../../../util";
import {RealTimeUpdateService} from "../../../services/real-time-update.service";

const emp1 = {
    access: 31,
    avatar: "3759c9e6-cc1e-4ec6-b100-31347f6c3771.png",
    firstName: "Максим",
    lastName: "Ушаков",
    login: "m.ushakov2",
    offsite: false,
    secondName: "Андреевич",
    status: EmployeeStatus.ONLINE
}

const MESSAGE_LIMIT = 25;

@Component({
    selector: 'app-chat-panel',
    templateUrl: './chat-panel.component.html',
    styleUrls: ['./chat-panel.component.scss']
})
export class ChatPanelComponent implements OnInit, OnDestroy {
    isShow = false;
    messages: ChatMessage[] = [
        {
            chatMessageId: Math.floor(Math.random() * 999999),
            author: emp1,
            text: "Привет",
            attachments: [],
            sendAt: "2023-12-12T12:12:12",
        },
        {
            chatMessageId: Math.floor(Math.random() * 999999),
            author: emp1,
            text: "Но активно развивающиеся страны третьего мира описаны максимально подробно! Есть над чем задуматься: сделанные на базе интернет-аналитики выводы будут описаны максимально подробно. А ещё некоторые особенности внутренней политики, вне зависимости от их уровня, должны быть объявлены нарушающими общечеловеческие нормы этики и морали.",
            attachments: [],
            sendAt: "2023-12-12T12:12:12",
        }
    ];
    first = 0;
    totalMessages = 0;
    sendingText = "";
    sendingFiles: FileData[] = [];
    replyMessageId = 0;
    private subsribtions: SubscriptionsHolder = new SubscriptionsHolder();

    constructor(readonly personality: PersonalityService,
                readonly api: ApiService,
                readonly rt: RealTimeUpdateService) {
    }

    _chatId: number = 0;

    @Input() set chatId(value: number) {
        this._chatId = value;
        this.messages = [];
        this.first = 0;
        this.totalMessages = 0;
        this.replyMessageId = 0;
        this.sendingText = "";
        this.sendingFiles = [];
        this.loadMessages();
        this.subsribtions.addSubscription('msgCr', this.createMessageSub());
    }

    private createMessageSub(){
        return this.rt.chatMessageCreated(this._chatId).subscribe(message => {
            this.messages = [message,...this.messages];
            this.first++;
            this.totalMessages++;
        });
    }

    isMy(employee: Employee) {
        return this.personality.me?.login === employee.login;
    }

    ngOnInit(): void {
    }

    ngOnDestroy() {
        this.subsribtions.unsubscribeAll();
    }

    show(chatId: number) {
        this.chatId = chatId;
        this.isShow = true;
    }

    trackMessages(index: number, message: ChatMessage) {
        return message.chatMessageId;
    }

    loadMessages() {
        this.api.getChatMessages(this._chatId, 0, MESSAGE_LIMIT).subscribe(page => {
            this.first = page.pageable.offset + MESSAGE_LIMIT;
            this.totalMessages = page.totalElements;
            this.messages = [...this.messages, ...page.content];
        })
    }

    sendMessage() {
        console.log("sendMessage", this.sendingText, this.sendingFiles, this.replyMessageId);
        this.api.sendChatMessage(this._chatId, this.sendingText, this.sendingFiles, this.replyMessageId)
            .subscribe(message => {})
    }
}
