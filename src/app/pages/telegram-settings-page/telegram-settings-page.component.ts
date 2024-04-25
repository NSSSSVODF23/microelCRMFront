import {Component, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {Subscription} from "rxjs";
import {ApiService} from "../../services/api.service";
import {RealTimeUpdateService} from "../../services/real-time-update.service";

@Component({
    templateUrl: './telegram-settings-page.component.html',
    styleUrls: ['./telegram-settings-page.component.scss']
})
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
    subscription?: Subscription;

    constructor(private api: ApiService, private rt: RealTimeUpdateService) {
    }

    ngOnInit(): void {
        this.api.getTelegramConfiguration().subscribe(config => {
            this.telegramConfigForm.patchValue(config);
            this.isLoading = false;
        })
        this.subscription = this.rt.telegramConfigChanged().subscribe(config=> this.telegramConfigForm.patchValue(config))
    }

    ngOnDestroy(): void {
        this.subscription?.unsubscribe();
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
}
