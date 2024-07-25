import {Injectable} from '@angular/core';
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {debounceTime, map, shareReplay} from "rxjs";
import {DynamicValueFactory} from "../../util";
import {ApiService} from "../api.service";
import {RealTimeUpdateService} from "../real-time-update.service";
import {TelegramUserRequest} from "../../types/user-types";
import {OverlayPanel} from "primeng/overlaypanel";
import {environment} from "../../../environments/environment";

@Injectable({
    providedIn: 'root'
})
export class UserRequestListService {

    isFirst = true;

    requestsForm = new FormGroup({
        page: new FormControl(0),
        size: new FormControl(25),
        unprocessed: new FormControl(true),
        login: new FormControl(""),
    })

    processingForm = new FormGroup({
        userRequestId: new FormControl<number | null>(null, [Validators.required]),
        userMessage: new FormControl("", [Validators.required]),
    });
    acceptRequestLoading = false;

    filters$ = this.requestsForm.valueChanges
        .pipe(
            debounceTime(1000),
            map(value => {
                return [value.page, value.size, value.unprocessed, value.login]
            }),
            shareReplay(1)
        )

    requestsPage$ = DynamicValueFactory.ofPageAltAll(this.filters$, this.api.getTelegramUserRequests.bind(this.api), [this.rt.receiveTlgUserRequest()])
        .pipe(
            shareReplay(1)
        )

    constructor(private api: ApiService, private rt: RealTimeUpdateService) {
    }

    onRequestProcessed(event: any, request: TelegramUserRequest, panel: OverlayPanel) {
        this.processingForm.patchValue({
            userRequestId: request.userRequestId,
            userMessage: this.generateUserMessage(request)
        });
        panel.show(event);
        if (panel.overlayVisible) {
            panel.align();
        }
    }

    createTlgChatByLogin(userLogin: string) {
        this.api.createTelegramUserChat(userLogin).subscribe(chatUuids => {
            window.open(`http://${environment['microelHub']}/messenger/${chatUuids[0]}`, '_blank');
        })
    }

    createTlgChatById(id: string) {
        this.api.createTelegramUserChatByChatId(id).subscribe(chatUuids => {
            window.open(`http://${environment['microelHub']}/messenger/${chatUuids[0]}`, '_blank');
        })
    }

    sendRequestProcessingAccept(event: any, acceptRequestPanel: OverlayPanel) {
        this.acceptRequestLoading = true;
        const {userRequestId, userMessage} = this.processingForm.value;
        this.api.sendRequestProcessingAccept(userRequestId, userMessage).subscribe({
            next: () => {
                this.acceptRequestLoading = false;
                acceptRequestPanel.hide();
            },
            error: () => {
                this.acceptRequestLoading = false;
                acceptRequestPanel.hide();
            }
        })
    }

    private generateUserMessage(request: TelegramUserRequest) {
        switch (request.type) {
            case "APPEND_SERVICE":
                return "Услуга успешно подключена"
            case "REMOVE_SERVICE":
                return "Услуга успешно отключена"
            case "REPLACE_TARIFF":
                return "Тариф успешно изменен"
        }
    }
}
