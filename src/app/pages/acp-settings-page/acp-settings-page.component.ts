import {Component, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {Subscription} from "rxjs";
import {RealTimeUpdateService} from "../../services/real-time-update.service";
import {ApiService} from "../../services/api.service";

@Component({
    templateUrl: './acp-settings-page.component.html',
    styleUrls: ['./acp-settings-page.component.scss']
})
export class AcpSettingsPageComponent implements OnInit, OnDestroy {

    isLoading = true;
    isSaving = false;
    acpConfigForm = new FormGroup({
        acpFlexConnectorEndpoint: new FormControl('', [Validators.required]),
    });
    subscription?: Subscription;

    constructor(private api: ApiService, private rt: RealTimeUpdateService) {
    }

    ngOnInit(): void {
        this.api.getAcpConfiguration().subscribe(config => {
            this.acpConfigForm.patchValue(config);
            this.isLoading = false;
        })
        this.subscription = this.rt.acpConfigChanged().subscribe(config => this.acpConfigForm.patchValue(config))
    }

    ngOnDestroy(): void {
        this.subscription?.unsubscribe();
    }

    saveConf() {
        this.isSaving = true;
        this.acpConfigForm.disable({emitEvent: false});
        const config = this.acpConfigForm.value as any;
        this.api.setAcpConfiguration(config).subscribe({
            next: () => {
                this.isSaving = false;
                this.acpConfigForm.enable({emitEvent: false});
            },
            error: () => {
                this.isSaving = false;
                this.acpConfigForm.enable({emitEvent: false});
            }
        })
    }
}
