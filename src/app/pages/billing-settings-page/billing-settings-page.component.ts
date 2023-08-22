import {Component, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {ApiService} from "../../services/api.service";
import {RealTimeUpdateService} from "../../services/real-time-update.service";
import {Subject, Subscription, switchMap, tap} from "rxjs";

@Component({
    templateUrl: './billing-settings-page.component.html',
    styleUrls: ['./billing-settings-page.component.scss']
})
export class BillingSettingsPageComponent implements OnInit, OnDestroy {

    billingConfigForm = new FormGroup({
        host: new FormControl('', [Validators.required]),
        port: new FormControl(80, [Validators.required]),
        login: new FormControl('', [Validators.required]),
        password: new FormControl('', [Validators.required]),
        daemonName: new FormControl('', [Validators.required]),
        selfIp: new FormControl('', [Validators.required]),
    });

    isLoading = true;
    isSaving = false;
    subscription?: Subscription;

    constructor(private api: ApiService, private rt: RealTimeUpdateService) {
    }

    ngOnInit(): void {
        this.api.getBillingConfiguration().subscribe(config => {
            this.billingConfigForm.patchValue(config);
            this.isLoading = false;
        })
        this.subscription = this.rt.billingConfigChanged().subscribe(config=> this.billingConfigForm.patchValue(config))
    }

    ngOnDestroy(): void {
        this.subscription?.unsubscribe();
    }

    saveConf() {
        this.isSaving = true;
        this.billingConfigForm.disable({emitEvent: false});
        const config = this.billingConfigForm.value as any;
        this.api.setBillingConfiguration(config).subscribe({
            next: () => {
                this.isSaving = false;
                this.billingConfigForm.enable({emitEvent: false});
            },
            error: () => {
                this.isSaving = false;
                this.billingConfigForm.enable({emitEvent: false});
            }
        })
    }
}
