import {AfterViewInit, Component, ElementRef, EventEmitter, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {Attachment, Chat, Employee, FileData, SuperMessage} from "../../../transport-interfaces";
import {PersonalityService} from "../../../services/personality.service";
import {ApiService} from "../../../services/api.service";
import {SubscriptionsHolder} from "../../../util";
import {RealTimeUpdateService} from "../../../services/real-time-update.service";
import {MediaViewerService} from "../../../services/media-viewer.service";
import {fade} from "../../../animations";
import {
    ContextButton,
    ContextButtonStyle,
    ContextMenuComponent
} from "../../controls/context-menu/context-menu.component";
import {debounceTime, tap} from "rxjs";

const MESSAGE_LIMIT = 25;

@Component({
    selector: 'app-chat-panel',
    templateUrl: './chat-panel.component.html',
    styleUrls: ['./chat-panel.component.scss'],
    animations: [fade]
})
export class ChatPanelComponent implements OnInit, OnDestroy, AfterViewInit {
    chatId: number = 0;
    currentChat?: Chat;
    isShow = false;
    thumbnailUrl = '/api/private/thumbnail/'
    fileUrl = '/api/private/attachment/'
    messages: SuperMessage[] = [];
    first = 0;
    totalMessages = 0;
    sendingText = "";
    sendingFiles: FileData[] = [];
    replyMessage?: SuperMessage;
    editMessage?: SuperMessage;
    unreadCount = 0;
    isBeginSending = false;
    isLoading = false;
    isEnd = false;
    @ViewChild('messageInput') messageInput?: ElementRef<HTMLTextAreaElement>;
    @ViewChild('contextMenu') contextMenu?: ContextMenuComponent;
    shaderVisible = false;
    messageContexted = -1;
    startButtonVisibleEmitter = new EventEmitter();
    startButtonVisible = true;
    loadingsStubs = Array(5).fill(null);
    private subscriptions: SubscriptionsHolder = new SubscriptionsHolder();

    constructor(readonly personality: PersonalityService,
                readonly api: ApiService,
                readonly mediaViewer: MediaViewerService,
                readonly rt: RealTimeUpdateService) {
    }

    get isNotReady() {
        return this.sendingText.trim().length === 0 && this.sendingFiles.length === 0;
    }

    trackAttachment(index: number, attachment: Attachment) {
        return attachment.name;
    };

    isMy(employee: Employee) {
        return this.personality.me?.login === employee.login;
    }

    ngOnInit(): void {
    }

    ngAfterViewInit() {
        const listScroll$ = this.startButtonVisibleEmitter.pipe(
            tap(() => this.startButtonVisible = false),
            debounceTime(300)
        );
        this.subscriptions.addSubscription('startButton', listScroll$.subscribe(() => this.startButtonVisible = true));
    }

    ngOnDestroy() {
        this.subscriptions.unsubscribeAll();
    }

    show(chatId: number) {
        const isChanged = this.chatId !== chatId;
        this.chatId = chatId;
        if(this.isShow && isChanged){
            this.isShow = false;
            setTimeout(() => { this.isShow = true}, 500);
            return;
        }
        this.isShow = true;
    }

    trackMessages(index: number, message: SuperMessage) {
        return message.superMessageId + message.text;
    }

    loadChat() {
        this.api.getChat(this.chatId).subscribe({
            next: chat => {
                this.currentChat = chat;
            }
        })
        this.api.getCountOfUnreadMessages(this.chatId).subscribe(c => this.unreadCount = c);
        this.subscriptions.addSubscription('chatUpd', this.rt.chatUpdated().subscribe(this.updateChat.bind(this)))
    }

    loadMessages() {
        if (!this.isEnd && !this.isLoading) {
            this.isLoading = true;
            this.api.getChatMessages(this.chatId, this.first, MESSAGE_LIMIT).subscribe({
                next: page => {
                    this.first = this.first + page.size;
                    this.totalMessages = page.totalElements;
                    this.isEnd = page.last;
                    this.isLoading = false;
                    this.messages = [...this.messages, ...page.content];
                },
                error: () => {
                    this.isLoading = false;
                }
            })
        }
    }

    sendMessage() {
        this.isBeginSending = true;
        if (this.editMessage) {
            this.api.editChatMessage(this.editMessage.superMessageId, this.sendingText)
                .subscribe({
                    next: () => {
                        this.isBeginSending = false;
                        this.sendingText = "";
                        this.sendingFiles = [];
                        this.editMessage = undefined;
                        setTimeout(() => {
                            this.messageInput?.nativeElement.focus();
                        })
                    },
                    error: () => {
                        this.isBeginSending = false;
                        setTimeout(() => {
                            this.messageInput?.nativeElement.focus();
                        })
                    }
                })
        } else {
            this.api.sendChatMessage(this.chatId, this.sendingText, this.sendingFiles, this.replyMessage?.superMessageId)
                .subscribe({
                    next: () => {
                        this.isBeginSending = false;
                        this.sendingText = "";
                        this.sendingFiles = [];
                        this.replyMessage = undefined;
                        setTimeout(() => {
                            this.messageInput?.nativeElement.focus();
                        })
                    },
                    error: () => {
                        this.isBeginSending = false;
                        setTimeout(() => {
                            this.messageInput?.nativeElement.focus();
                        })
                    }
                })
        }
    }

    messageInputKeyDown(event: KeyboardEvent) {
        if (event.key === 'Enter') {
            if (!event.ctrlKey && !this.isNotReady) {
                event.preventDefault();
                this.sendMessage();
            } else {
                const input = event.target as HTMLTextAreaElement;
                const start = input.selectionStart;
                const end = input.selectionEnd;
                input.value = input.value.substring(0, start ?? -1) + '\n' + input.value.substring(end ?? -1);
                this.sendingText = input.value;
                input.selectionStart = start + 1 ?? 0;
                input.selectionEnd = start + 1 ?? 0;
            }
        }
    }

    insertEmoji(event: string) {
        if (!this.messageInput?.nativeElement) return;
        const el = this.messageInput.nativeElement;
        el.focus();
        const start = el.selectionStart;
        const end = el.selectionEnd;
        el.value = el.value.substring(0, start ?? -1) + event + el.value.substring(end ?? -1);
        el.selectionStart = start + 1 ?? 0;
        el.selectionEnd = start + 1 ?? 0;
        this.sendingText = el.value;
    }

    whenOpenPanel() {
        this.loadChat();
        this.loadMessages();
        this.subscriptions.addSubscription('msgCr', this.rt.chatMessageCreated(this.chatId).subscribe(this.createMessage.bind(this)));
        this.subscriptions.addSubscription('msgUpd', this.rt.chatMessageUpdated(this.chatId).subscribe(this.updateMessage.bind(this)));
        this.subscriptions.addSubscription('msgDel', this.rt.chatMessageDeleted(this.chatId).subscribe(this.deleteMessage.bind(this)));
        this.subscriptions.addSubscription('unreadCount', this.rt.updateCountUnreadMessages(this.personality.me?.login ?? '')
            .subscribe(c => {
                if (this.chatId === c.chatId) this.unreadCount = c.count
            })
        );
    }

    flushMessages() {
        this.messages = [];
        this.first = 0;
        this.totalMessages = 0;
        this.sendingText = "";
        this.sendingFiles = [];
        this.replyMessage = undefined;
        this.isBeginSending = false;
        this.isLoading = false;
        this.isEnd = false;
        this.subscriptions.unsubscribeAll();
    }

    readMessage(event: IntersectionObserverEntry[]) {
        event.forEach(entry => {
            if (entry.isIntersecting) {
                const msgIds = JSON.parse(entry.target.attributes.getNamedItem('data-msg')?.value ?? 'null');
                const superMessages = this.messages.filter(msg => JSON.stringify(msg.includedMessages) === JSON.stringify(msgIds) && !this.readOut(msg));
                if (superMessages.length === 1) {
                    this.api.setMessagesAsRead(msgIds).subscribe();
                }
            }
        })
    }

    getMessagesIds(message: SuperMessage) {
        if (message.includedMessages) {
            return JSON.stringify(message.includedMessages)
        } else {
            return '[]'
        }
    }

    readOut(message: SuperMessage) {
        const me = this.personality.me;
        if (!me) return true;
        if (this.currentChat?.members.map(e => e.login).includes(me.login))
            return message.readByEmployees?.map(e => e.login).includes(me.login);
        else
            return true;
    }

    showContext(event: MouseEvent, message: SuperMessage) {
        if (!this.contextMenu) return;
        this.messageContexted = message.superMessageId;
        const buttons: ContextButton[] = [
            {
                label: 'Ответить',
                icon: 'mdi-reply',
                command: () => {
                    this.replyMessage = message;
                    this.messageInput?.nativeElement.focus();
                }
            }
        ];
        if (this.isMy(message.author)) {
            buttons.push({
                    label: 'Редактировать',
                    icon: 'mdi-edit',
                    command: () => {
                        this.editMessage = message;
                        this.sendingText = message.text;
                        this.messageInput?.nativeElement.focus();
                    }
                },
                {
                    label: 'Удалить',
                    icon: 'mdi-delete',
                    style: ContextButtonStyle.DANGER,
                    command: () => {
                        this.api.deleteChatMessage(this.chatId, message.superMessageId).subscribe();
                    }
                });
        }
        this.contextMenu.show(event, buttons);
    }

    clearReplyMessage() {
        this.replyMessage = undefined;
    }

    clearEditMessage() {
        this.editMessage = undefined;
        this.sendingText = "";
    }

    private createMessage(message: SuperMessage) {
        this.messages = [message, ...this.messages];
        this.first++;
        this.totalMessages++;
    }

    private updateMessage(message: SuperMessage) {
        const existedMessageIndex = this.messages.findIndex(msg => msg.superMessageId === message.superMessageId);
        if (existedMessageIndex != -1) {
            this.messages.splice(existedMessageIndex, 1, message)
        }
    };

    private deleteMessage(message: SuperMessage) {
        this.messages = this.messages.filter(msg => msg.superMessageId !== message.superMessageId);
    }

    private updateChat(chat: Chat) {
        if (chat.chatId === this.chatId)
            this.currentChat = chat;
    }
}
