import {Component, OnInit} from '@angular/core';
import {TelegramUserRequest} from "../../../types/user-types";
import {UserRequestListService} from "../../../services/page-cache/user-request-list.service";

@Component({
    templateUrl: './user-requests-page.component.html',
    styleUrls: ['./user-requests-page.component.scss']
})
export class UserRequestsPage implements OnInit {

    constructor(readonly service: UserRequestListService) {
    }

    ngOnInit(): void {
    }

    toRequest(val: any) {
        return val as TelegramUserRequest
    }

    onRequestLazyLoad(event: any) {
        this.service.isFirst = false;
        this.service.requestsForm.patchValue({
            page: event.first / event.rows,
            size: event.rows,
        })
    }
}
