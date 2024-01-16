import {Component, OnDestroy, OnInit} from '@angular/core';
import {AbstractControl, FormControl, FormGroup, ValidationErrors, Validators} from "@angular/forms";
import {ApiService} from "../../services/api.service";
import {RealTimeUpdateService} from "../../services/real-time-update.service";
import {
    BehaviorSubject,
    combineLatest,
    debounceTime,
    delay,
    map,
    merge,
    Observable,
    of,
    shareReplay,
    startWith,
    Subject,
    switchMap,
    tap
} from "rxjs";
import {
    Address,
    LoadingState,
    Switch,
    SwitchBaseInfo,
    SwitchModel,
    SwitchWithAddress
} from "../../types/transport-interfaces";
import {flowInChild} from "../../animations";
import {DynamicPageContent, DynamicValueFactory, SubscriptionsHolder} from "../../util";
import {ConfirmationService, MenuItem} from "primeng/api";

@Component({
    templateUrl: './commutator-list-page.component.html',
    styleUrls: ['./commutator-list-page.component.scss'],
    animations: [flowInChild]
})
export class CommutatorListPageComponent implements OnInit, OnDestroy {
    pageNum = 0;
    commutatorFilterForm = new FormGroup({
        name: new FormControl(null),
        ip: new FormControl(null),
        address: new FormControl<Address | null>(null)
    });
    changeFilterForm$ = this.commutatorFilterForm.valueChanges.pipe(
        startWith(this.commutatorFilterForm.value),
        debounceTime(1000),
        tap(()=>this.pageNum = 0)
    )
    changeCommutatorPage = new BehaviorSubject(0);
    page$ = this.changeCommutatorPage.pipe(
        tap(page=>this.pageNum=page)
    );
    loadingState = LoadingState.LOADING;
    changePageOrFilters$ = combineLatest([this.page$, this.changeFilterForm$]).pipe(
        map(([page, filter]) => {
            return [this.pageNum, filter.name, filter.ip, filter.address?.acpHouseBind?.buildingId]
        })
    )
    commutatorPage$:Observable<DynamicPageContent<SwitchBaseInfo[]>> = DynamicValueFactory.ofPageAlt(
        this.changePageOrFilters$,
        this.api.getCommutators.bind(this.api),
        'id',
        this.rt.acpBaseCommutatorCreated(),
        this.rt.acpBaseCommutatorUpdated(),
        this.rt.acpBaseCommutatorDeleted(),
    );

    commutatorDialogVisible = false;
    commutatorModelQueryChange = new Subject<string>();
    commutatorModels$ = this.commutatorModelQueryChange.pipe(
        debounceTime(1000),
        switchMap(query => this.api.getCommutatorModels(query)),
        shareReplay(1)
    )
    commutatorNameKeyFilter = /^[^А-я ]+$/;

    editableSwitch?: Switch;
    commutatorUplinkQuerySearch = new Subject<string>();
    commutatorUplinks$ = this.commutatorUplinkQuerySearch.pipe(
        debounceTime(1000),
        switchMap(query => this.api.searchCommutators(query)),
        map(commutators => commutators.filter(com => com.value !== this.editableSwitch?.id)),
        shareReplay(1)
    )
    beginCommutatorsEditing = false;

    contextMenuItems: MenuItem[] = [];

    commutatorViewDialogVisible = false;
    commutatorInfoLoadingState = LoadingState.LOADING;
    selectedToViewCommutator?: Switch;
    private subscriptions = new SubscriptionsHolder();

    openContextMenu(commutator: SwitchBaseInfo){
        this.contextMenuItems = [
            {label: 'Изменить', icon: 'mdi-edit', command: () => this.openEditCommutatorDialog(commutator.id)},
            {label: 'Удалить', styleClass: 'danger-menu-button', icon: 'mdi-delete', command: () => this.confirm.confirm({
                    header: 'Подтверждение',
                    message: 'Вы хотите удалить '+commutator.name+' коммутатор?',
                    accept: () => this.deleteCommutator(commutator.id)
                })},
            {label: 'Обновить', icon: 'mdi-sync', command: ()=> this.commutatorRemoteUpdate(commutator.id)}
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

    trackByCommutator(index: number, commutator: SwitchBaseInfo) {
        return commutator.id + commutator.ip + commutator.name + commutator.model + commutator.isOnline;
    };

    ngOnInit(): void {
        this.subscriptions.addSubscription('updCom', this.rt.acpCommutatorUpdated().subscribe(commutator=>{
            if(commutator.id === this.selectedToViewCommutator?.id) this.selectedToViewCommutator = commutator;
        }));
    }

    ngOnDestroy() {
        this.subscriptions.unsubscribeAll();
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

    openEditCommutatorDialog(id:number) {
        this.api.getCommutatorEditingPreset(id).subscribe((preset) => {
            this.commutatorForm = new FormGroup({
                type: new FormControl(preset.targetCommutator.swtype, [Validators.required]),
                model: new FormControl(preset.model, [Validators.required]),
                name: new FormControl(preset.targetCommutator.name, [Validators.required], [this.commutatorNameValidator]),
                ipaddr: new FormControl(preset.targetCommutator.ipaddr, [Validators.required], [this.commutatorIpValidator]),
                address: new FormControl(preset.address, [Validators.required]),
                entrance: new FormControl(preset.targetCommutator.entrance, [Validators.required]),
                floor: new FormControl(preset.targetCommutator.storey, [Validators.required]),
                uplink: new FormControl(preset.uplinkCommutator, [Validators.required]),
                nagios: new FormControl(preset.targetCommutator.enableMonitor === 1),
                sms: new FormControl(preset.targetCommutator.enableSms === 1)
            })
            this.commutatorDialogVisible = true;
            this.editableSwitch = preset.targetCommutator;
        })
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

    deleteCommutator(id: number) {
        this.api.deleteCommutator(id).subscribe();
    }

    commutatorRemoteUpdate(id: number) {
        return this.api.commutatorRemoteUpdate(id).subscribe();
    }

    openCommutatorViewDialog(commutator: SwitchBaseInfo) {
        this.selectedToViewCommutator = undefined;
        this.commutatorInfoLoadingState = LoadingState.LOADING;
        this.commutatorViewDialogVisible = true;
        this.api.getCommutator(commutator.id).subscribe({
            next:(commutator)=>{
                if(commutator?.commutator?.additionalInfo) {
                    this.commutatorInfoLoadingState = LoadingState.READY;
                    this.selectedToViewCommutator = commutator.commutator;
                }
                else{
                    this.commutatorInfoLoadingState = LoadingState.EMPTY;
                }
            },
            error:()=>{
                this.commutatorInfoLoadingState = LoadingState.ERROR;
            }
        })
    }
}
