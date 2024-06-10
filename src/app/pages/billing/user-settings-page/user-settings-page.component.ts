import {Component, OnInit} from '@angular/core';
import {TelegramUserTariff} from "../../../types/user-types";
import {ApiService} from "../../../services/api.service";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {EventType, UpdateCarrier, UserTariff} from "../../../types/transport-interfaces";
import {AutoUnsubscribe} from "../../../decorators";
import {RealTimeUpdateService} from "../../../services/real-time-update.service";
import {ConfirmationService} from "primeng/api";

@Component({
    templateUrl: './user-settings-page.component.html',
    styleUrls: ['./user-settings-page.component.scss']
})
@AutoUnsubscribe()
export class UserSettingsPage implements OnInit {

    userTariffs: TelegramUserTariff[] = [];
    loadingUserTariffs = true;
    userTariffDialogVisible = false;
    editableTariff?: Partial<TelegramUserTariff>;
    billingTariffs$ = this.api.getBillingUserTariffs("bond");
    billingServices$ = this.api.getBillingUserServices("bond");
    userTariffForm = new FormGroup({
        baseName: new FormControl("", [Validators.required]),
        baseId: new FormControl("", [Validators.required]),
        name: new FormControl("", [Validators.required]),
        isService: new FormControl(false, [Validators.required]),
        price: new FormControl(0, [Validators.required]),
        paymentPeriod: new FormControl(1, [Validators.required]),
    })
    updateTariffSub = this.rt.receiveTlgUserTariff().subscribe(this.handleUpdateTariff.bind(this));

    constructor(private api: ApiService, private rt: RealTimeUpdateService, private confirmationService: ConfirmationService) {
    }

    ngOnInit(): void {
    }

    lazyLoadUserTariffs(event: any) {
        this.loadingUserTariffs = true;
        this.api.getTelegramUserTariffs().subscribe({
            next: (data) => {
                this.userTariffs = data;
                this.loadingUserTariffs = false;
            },
            error: (error) => {
                this.userTariffs = [];
                this.loadingUserTariffs = false;
            }
        })
    }

    addTariff() {
        this.loadingUserTariffs = true;
        this.api.createTelegramUserTariff(this.userTariffForm.value as Partial<TelegramUserTariff>)
            .subscribe({
                next: (data) => {
                    this.loadingUserTariffs = false;
                    this.userTariffDialogVisible = false;
                },
                error: (error) => {
                    this.loadingUserTariffs = false;
                }
            });
    }

    editTariff() {
        if(!this.editableTariff?.userTariffId)  return;
        this.loadingUserTariffs  = true;
        this.api.updateTelegramUserTariff(this.editableTariff.userTariffId, this.userTariffForm.value as Partial<TelegramUserTariff>).subscribe({
            next: (data) => {
                this.loadingUserTariffs = false;
                this.userTariffDialogVisible = false;
            },
            error: (error) => {
                this.loadingUserTariffs = false;
            }
        })
    }

    resetUserTariffForm(isService: boolean = false) {
        this.userTariffForm.reset({
            isService,
            price: 0,
            paymentPeriod: 1,
            baseName: "",
            baseId: "",
            name: "",
        });
        this.editableTariff = undefined;
    }

    handleChangeTariff(value: UserTariff) {
        this.userTariffForm.patchValue({
            baseName: value.name,
            baseId: value.id.toString(),
            name: value.name,
            paymentPeriod: 1,
            price: value.cost
        })
    }

    toTariff(val: any): TelegramUserTariff {
        return val as TelegramUserTariff
    }

    showTariffDialog() {
        this.userTariffDialogVisible = true;
    }

    showEditTariffDialog(tariff: TelegramUserTariff) {
        this.editableTariff = tariff;
        this.userTariffForm.patchValue({
            baseName: tariff.name,
            baseId: tariff.baseId,
            name: tariff.name,
            isService: tariff.isService,
            price: tariff.price,
            paymentPeriod: tariff.paymentPeriod,
        })
        this.userTariffDialogVisible = true;
    }

    deleteTariff(tariff: TelegramUserTariff) {
        this.confirmationService.confirm({
            message: 'Вы уверены, что хотите удалить тариф?',
            header: 'Удаление тарифа',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.loadingUserTariffs = true;
                this.api.deleteTelegramUserTariff(tariff.userTariffId).subscribe({
                    next: (data) => {
                        this.loadingUserTariffs = false;
                    },
                    error: (error) => {
                        this.loadingUserTariffs = false;
                    }
                })
            }
        });
    }

    private handleUpdateTariff(event: UpdateCarrier<TelegramUserTariff>) {
        switch (event.type) {
            case EventType.CREATE:
                this.userTariffs.push(event.data);
                this.sortTariffs();
                break;
            case EventType.UPDATE:
                this.userTariffs.splice(this.userTariffs.findIndex(item => item.userTariffId === event.data.userTariffId), 1, event.data);
                break;
            case EventType.DELETE:
                this.userTariffs.splice(this.userTariffs.findIndex(item => item.userTariffId === event.data.userTariffId), 1);
                break;
        }
    }

    sortTariffs()  {
        this.userTariffs.sort((a: TelegramUserTariff, b: TelegramUserTariff) => ((a.isService ? 1 : -1) - (b.isService? 1 : -1)) + Math.sign(a.price - b.price));
    }
}
