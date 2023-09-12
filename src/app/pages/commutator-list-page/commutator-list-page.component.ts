import {Component, OnInit} from '@angular/core';
import {AbstractControl, FormControl, FormGroup, ValidationErrors, Validators} from "@angular/forms";
import {ApiService} from "../../services/api.service";
import {RealTimeUpdateService} from "../../services/real-time-update.service";
import {
    BehaviorSubject,
    combineLatest,
    debounceTime,
    delay,
    distinctUntilChanged, filter,
    map, merge,
    Observable,
    of,
    shareReplay,
    startWith,
    Subject,
    switchMap,
    tap
} from "rxjs";
import {Address, LoadingState, Switch, SwitchModel, SwitchWithAddress} from "../../transport-interfaces";
import {flowInChild} from "../../animations";
import {DynamicPageContent, DynamicValueFactory} from "../../util";
import {ConfirmationService, MenuItem} from "primeng/api";

@Component({
    templateUrl: './commutator-list-page.component.html',
    styleUrls: ['./commutator-list-page.component.scss'],
    animations: [flowInChild]
})
export class CommutatorListPageComponent implements OnInit {
    commutatorFilterForm = new FormGroup({
        name: new FormControl(null),
        ip: new FormControl(null),
        address: new FormControl<Address | null>(null)
    });
    changeFilterForm$ = this.commutatorFilterForm.valueChanges.pipe(
        startWith(this.commutatorFilterForm.value),
        debounceTime(1000),
        shareReplay(1)
    )
    changeCommutatorPage = new BehaviorSubject(0);
    loadingState = LoadingState.LOADING;
    changePageOrFilters$ = combineLatest([this.changeCommutatorPage, this.changeFilterForm$]).pipe(
        map(([page, filter]) => {
            return [page, filter.name, filter.ip, filter.address?.acpHouseBind?.buildingId]
        })
    )
    updateCommutators$ = merge(this.rt.acpCommutatorUpdated(), this.rt.acpCommutatorStatusUpdated().pipe(
        map(info=>{
            return {id: info.externalId, additionalInfo: info} as Switch
        })
    ));
    commutatorPage$:Observable<DynamicPageContent<Switch[]>> = DynamicValueFactory.ofPageAlt(
        this.changePageOrFilters$,
        this.api.getCommutators.bind(this.api),
        'id',
        this.rt.acpCommutatorCreated(),
        this.updateCommutators$,
        this.rt.acpCommutatorDeleted(),
    );

    commutatorDialogVisible = false;
    commutatorModelQueryChange = new Subject<string>();
    commutatorModels$ = this.commutatorModelQueryChange.pipe(
        debounceTime(1000),
        switchMap(query => this.api.getCommutatorModels(query)),
        shareReplay(1)
    )
    commutatorNameKeyFilter = /^[^А-я ]+$/;

    commutatorUplinkQuerySearch = new Subject<string>();
    editableSwitch?: Switch;
    commutatorUplinks$ = this.commutatorUplinkQuerySearch.pipe(
        debounceTime(1000),
        switchMap(query => this.api.searchCommutators(query)),
        map(commutators => commutators.filter(com => com.value !== this.editableSwitch?.id)),
        shareReplay(1)
    )
    beginCommutatorsEditing = false;

    contextMenuItems: MenuItem[] = []

    openContextMenu(commutator: Switch){
        this.contextMenuItems = [
            {label: 'Изменить', icon: 'mdi-edit', command: () => this.openEditCommutatorDialog(commutator)},
            {label: 'Удалить', styleClass: 'danger-menu-button', icon: 'mdi-delete', command: () => this.confirm.confirm({
                    header: 'Подтверждение',
                    message: 'Вы хотите удалить '+commutator.name+' коммутатор?',
                    accept: () => this.deleteCommutator(commutator)
                })},
            {label: 'Обновить', icon: 'mdi-sync', command: ()=> this.commutatorRemoteUpdate(commutator)}
        ]
    }

    constructor(private api: ApiService, private rt: RealTimeUpdateService, private confirm: ConfirmationService) {
    }

    get commutatorFormErrors() {
        return Object.entries(this.commutatorForm.controls)
            .flatMap(([inputName, control]) => {
                if (!control.dirty) return [];
                if (control.errors === null) return [];
                return Object.entries(control.errors as { [key: string]: any }).map(([errorName, value]) => {
                    switch (inputName) {
                        case 'model':
                            if (errorName === 'required') return 'Модель не выбрана';
                            break;
                        case 'name':
                            if (errorName === 'required') return 'Имя не заполнено';
                            if (errorName === 'nameAlreadyExists') return 'Имя уже существует';
                            break;
                        case 'ipaddr':
                            if (errorName === 'required') return 'IP-адрес не заполнен';
                            if (errorName === 'ipAlreadyExists') return 'IP-адрес уже существует';
                            break;
                        case 'address':
                            if (errorName === 'required') return 'Адрес установки не выбран';
                            break;
                        case 'uplink':
                            if (errorName === 'required') return 'Uplink не назначен';
                            break;
                    }
                    return inputName + ': Неизвестная ошибка';
                });
            })
    }

    get commutatorFormValue() {
        const {
            type,
            model,
            name,
            ipaddr,
            address,
            entrance,
            floor,
            uplink,
            nagios,
            sms
        } = this.commutatorForm.value;
        return {
            swtype: type,
            swmodelId: model?.id,
            name,
            ipaddr,
            buildId: address?.acpHouseBind?.buildingId,
            entrance: entrance,
            storey: floor,
            phyUplinkId: uplink?.value,
            enableMonitor: nagios ? 1 : 0,
            enableSms: sms ? 1 : 0
        }
    }

    commutatorNameValidator = (control: AbstractControl): Observable<ValidationErrors | null> => {
        return of(control.value).pipe(
            delay(700),
            switchMap(() => this.api.checkCommutatorNameExist(control.value)),
            map((result: boolean) => result ? {nameAlreadyExists: true} : null));
    };

    commutatorIpValidator = (control: AbstractControl): Observable<ValidationErrors | null> => {
        return of(control.value).pipe(
            delay(700),
            switchMap(() => this.api.checkCommutatorIpExist(control.value)),
            map((result: boolean) => result ? {ipAlreadyExists: true} : null));
    }

    commutatorForm = new FormGroup({
        type: new FormControl(1, [Validators.required]),
        model: new FormControl<SwitchModel | null>(null, [Validators.required]),
        name: new FormControl<string | null>(null, [Validators.required], [this.commutatorNameValidator]),
        ipaddr: new FormControl<string | null>(null, [Validators.required], [this.commutatorIpValidator]),
        address: new FormControl<Address | null>(null, [Validators.required]),
        entrance: new FormControl(0, [Validators.required]),
        floor: new FormControl(0, [Validators.required]),
        uplink: new FormControl<SwitchWithAddress | null>(null, [Validators.required]),
        nagios: new FormControl(false),
        sms: new FormControl(false)
    });

    trackByCommutator(index: number, commutator: Switch) {
        return commutator.id + commutator.ipaddr + commutator.name + commutator.swtype;
    };

    ngOnInit(): void {
    }

    openCreateCommutatorDialog() {
        this.commutatorDialogVisible = true;
        this.editableSwitch = undefined;
        this.commutatorForm = new FormGroup({
            type: new FormControl(1, [Validators.required]),
            model: new FormControl<SwitchModel | null>(null, [Validators.required]),
            name: new FormControl<string | null>(null, [Validators.required], [this.commutatorNameValidator]),
            ipaddr: new FormControl<string | null>(null, [Validators.required], [this.commutatorIpValidator]),
            address: new FormControl<Address | null>(null, [Validators.required]),
            entrance: new FormControl(0, [Validators.required]),
            floor: new FormControl(0, [Validators.required]),
            uplink: new FormControl<SwitchWithAddress | null>(null, [Validators.required]),
            nagios: new FormControl(false),
            sms: new FormControl(false)
        });
    }

    openEditCommutatorDialog(commutator: Switch) {
        combineLatest(
            [this.api.getCommutatorModel(commutator.swmodelId),
                this.api.getBuildingAddress(commutator.buildId),
                this.api.getCommutator(commutator.phyUplinkId)]
        ).subscribe(
            ([swmodel, address, uplink]) => {
                this.commutatorForm = new FormGroup({
                    type: new FormControl(commutator.swtype, [Validators.required]),
                    model: new FormControl(swmodel, [Validators.required]),
                    name: new FormControl(commutator.name, [Validators.required], [this.commutatorNameValidator]),
                    ipaddr: new FormControl(commutator.ipaddr, [Validators.required], [this.commutatorIpValidator]),
                    address: new FormControl(address, [Validators.required]),
                    entrance: new FormControl(commutator.entrance, [Validators.required]),
                    floor: new FormControl(commutator.storey, [Validators.required]),
                    uplink: new FormControl(uplink, [Validators.required]),
                    nagios: new FormControl(commutator.enableMonitor === 1),
                    sms: new FormControl(commutator.enableSms === 1)
                })
                this.commutatorDialogVisible = true;
                this.editableSwitch = commutator;
            }
        )
    }

    editCommutator() {
        if (this.editableSwitch === undefined) return;
        this.beginCommutatorsEditing = true
        this.commutatorForm.disable({emitEvent: false})
        this.api.editCommutator(this.editableSwitch.id, this.commutatorFormValue).subscribe({
            next: () => {
                this.commutatorDialogVisible = false
                this.beginCommutatorsEditing = false
                this.commutatorForm.enable({emitEvent: false})
            },
            error: () => {
                this.beginCommutatorsEditing = false
                this.commutatorForm.enable({emitEvent: false})
            }
        })
    }

    createCommutator() {
        this.beginCommutatorsEditing = true
        this.commutatorForm.disable({emitEvent: false})
        this.api.createCommutator(this.commutatorFormValue).subscribe({
            next: () => {
                this.commutatorDialogVisible = false
                this.beginCommutatorsEditing = false
                this.commutatorForm.enable({emitEvent: false})
            },
            error: () => {
                this.beginCommutatorsEditing = false
                this.commutatorForm.enable({emitEvent: false})
            }
        })
    }

    deleteCommutator(commutator: Switch) {
        this.api.deleteCommutator(commutator.id).subscribe();
    }

    commutatorRemoteUpdate(commutator: Switch) {
        return this.api.commutatorRemoteUpdate(commutator.id).subscribe();
    }
}
