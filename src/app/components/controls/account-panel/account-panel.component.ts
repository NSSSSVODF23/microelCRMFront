import {Component, OnInit} from '@angular/core';
import {MenuItem} from "primeng/api";
import {PersonalityService} from "../../../services/personality.service";
import {ApiService} from "../../../services/api.service";
import {NotificationsService} from "../../../services/notifications.service";
import {Router} from "@angular/router";

@Component({
    selector: 'app-account-panel',
    templateUrl: './account-panel.component.html',
    styleUrls: ['./account-panel.component.scss']
})
export class AccountPanelComponent implements OnInit {
    isShowAvatarChangeDialog = false;
    controls: MenuItem[] = [
        {label: "Изменить аватар", command: () => this.isShowAvatarChangeDialog = true},
        {label: "Настройки"},
        {label: "Выйти из аккаунта", command: this.exitFromAccount.bind(this)}
    ];

    constructor(readonly personality: PersonalityService, readonly router: Router,
                readonly api: ApiService, readonly notifyService: NotificationsService) {
    }

    ngOnInit(): void {
    }

    exitFromAccount() {
        this.api.signOut().subscribe(() => {
            this.router.navigate(['/login']).then()
        })
    }

}
