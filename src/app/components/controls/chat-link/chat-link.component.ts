import {Component, Input, OnInit} from '@angular/core';
import {ApiService} from "../../../services/api.service";
import {Chat, LoadingState} from "../../../transport-interfaces";
import {ChatService} from "../../../services/chat.service";

@Component({
  selector: 'app-chat-link',
  templateUrl: './chat-link.component.html',
  styleUrls: ['./chat-link.component.scss']
})
export class ChatLinkComponent implements OnInit {

  _chat?: Chat;
  loadingState = LoadingState.LOADING;

  @Input() set chatId(id: number) {
    this.loadingState = LoadingState.LOADING;
    this.api.getChat(id).subscribe({
      next: chat => {
        this._chat = chat
        this.loadingState = LoadingState.READY;
      },
      error: () => this.loadingState = LoadingState.ERROR
    });
  }

  get chat(): Chat | undefined {
      return this._chat;
  }

  constructor(private api: ApiService, private chatService: ChatService) { }

  ngOnInit(): void {
  }

  static createElement(data: number) {
    const element = document.createElement('chat-link-element') as any;
    element.chatId = data;
    return element;
  }

  openChat() {
    if(this.chat) this.chatService.open.emit(this.chat.chatId)
  }
}
