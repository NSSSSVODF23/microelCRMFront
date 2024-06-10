import {Component, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {Subscription} from "rxjs";
import {ApiService} from "../../services/api.service";
import {RealTimeUpdateService} from "../../services/real-time-update.service";
import {AutoUnsubscribe} from "../../decorators";

@Component({
    templateUrl: './telegram-settings-page.component.html',
    styleUrls: ['./telegram-settings-page.component.scss']
})
@AutoUnsubscribe()
export class TelegramSettingsPageComponent implements OnInit,OnDestroy {

    isLoading = true;
    isSaving = false;
    telegramConfigForm = new FormGroup({
        botToken: new FormControl('', [Validators.required]),
        botName: new FormControl('', [Validators.required]),
        dhcpNotificationChatId: new FormControl(''),
        ponAlertChatId: new FormControl(''),
        sensorsAlertChatId: new FormControl(''),
    });
    userTelegramConfigForm = new FormGroup({
        botToken: new FormControl('', [Validators.required]),
        botName: new FormControl('', [Validators.required]),
        microelHubIpPort: new FormControl('',  [Validators.required]),
    });
    updateTelegramConfigSub = this.rt.telegramConfigChanged().subscribe(config=> this.telegramConfigForm.patchValue(config));
    updateUserTelegramConfigSub  = this.rt.userTelegramConfigChanged().subscribe(config=> this.userTelegramConfigForm.patchValue(config));

    constructor(private api: ApiService, private rt: RealTimeUpdateService) {
    }

    ngOnInit(): void {
        this.api.getTelegramConfiguration().subscribe(config => {
            this.telegramConfigForm.patchValue(config);
            this.isLoading = false;
        })
        this.api.getUserTelegramConfiguration().subscribe(config => {
            this.userTelegramConfigForm.patchValue(config);
            this.isLoading = false;
        })
    }

    ngOnDestroy(): void {
    }

    saveConf() {
        this.isSaving = true;
        this.telegramConfigForm.disable({emitEvent: false});
        const config = this.telegramConfigForm.value as any;
        this.api.setTelegramConfiguration(config).subscribe({
            next: () => {
                this.isSaving = false;
                this.telegramConfigForm.enable({emitEvent: false});
            },
            error: () => {
                this.isSaving = false;
                this.telegramConfigForm.enable({emitEvent: false});
            }
        })
    }

    saveUserConf() {
        this.isSaving = true;
        this.userTelegramConfigForm.disable({emitEvent: false});
        const config = this.userTelegramConfigForm.value as any;
        this.api.setUserTelegramConfiguration(config).subscribe({
            next: () => {
                this.isSaving = false;
                this.userTelegramConfigForm.enable({emitEvent: false});
            },
            error: () => {
                this.isSaving = false;
                this.userTelegramConfigForm.enable({emitEvent: false});
            }
        })
    }
}
