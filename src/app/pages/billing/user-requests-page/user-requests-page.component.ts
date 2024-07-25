import {Component, OnInit} from '@angular/core';
import {TelegramUserRequest} from "../../../types/user-types";
import {UserRequestListService} from "../../../services/page-cache/user-request-list.service";
import {ApiService} from "../../../services/api.service";
import {TaskCreatorService} from "../../../services/task-creator.service";
import {map, shareReplay} from "rxjs";
import {OverlayPanel} from "primeng/overlaypanel";

@Component({
    templateUrl: './user-requests-page.component.html',
    styleUrls: ['./user-requests-page.component.scss']
})
export class UserRequestsPage implements OnInit {

    wireframes$ = this.api.getWireframes()
        .pipe(
            map(wireframes=> wireframes.map(({name, wireframeId}) => ({label: name, value: wireframeId}))),
            shareReplay(1)
        );
    selectedRequest: TelegramUserRequest | null = null;

    constructor(private api: ApiService, private taskCreation: TaskCreatorService, readonly service: UserRequestListService) {
    }

    ngOnInit(): void {
      // TODO document why this method 'ngOnInit' is empty
    }

    toRequest(val: any) {
        return val as TelegramUserRequest
    }

    isUnprocessed() {
        return this.service.requestsForm.value.unprocessed;
    }

    onRequestLazyLoad(event: any) {
        this.service.isFirst = false;
        this.service.requestsForm.patchValue({
            page: event.first / event.rows,
            size: event.rows,
        })
    }

    createChat(request: TelegramUserRequest) {
        if(request.chatId){
            this.service.createTlgChatById(request.chatId);
        }else{
            this.service.createTlgChatByLogin(request.userLogin);
        }
    }

    createTask(request: TelegramUserRequest | null, wireframeId: number, panel: OverlayPanel) {
        if (!request) return;
        panel.hide();
        this.api.getBillingUserInfo(request.userLogin).subscribe((userInfo) => {
            this.api.convertBillingAddress(userInfo.ibase?.addr).subscribe((address) => {
                this.taskCreation.wireframe(wireframeId, {
                    login: request.userLogin,
                    address,
                    phone: request.phoneNumber,
                    description: request.description
                })
            })
        });
    }

}
