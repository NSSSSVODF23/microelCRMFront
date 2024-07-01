import {Component, OnDestroy, OnInit} from '@angular/core';
import {ApiService} from "../../services/api.service";
import {ActionTaken, Employee, LoadingState, WorkActionFormItem, WorkLog} from "../../types/transport-interfaces";
import {ConfirmationService, MenuItem, TreeDragDropService} from "primeng/api";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {SubscriptionsHolder} from "../../util";
import {RealTimeUpdateService} from "../../services/real-time-update.service";
import {filter, map, Observable, of, shareReplay, switchMap} from "rxjs";
import {TFactorAction, WorksPickerValue} from "../../components/controls/works-picker/works-picker.component";
import {ActivatedRoute, Router} from "@angular/router";
import {CustomNavigationService} from "../../services/custom-navigation.service";
import {v4} from "uuid";
import {AutoUnsubscribe} from "../../decorators";

@Component({
    templateUrl: './salary-estimation-page.component.html',
    styleUrls: ['./salary-estimation-page.component.scss'],
    providers: [TreeDragDropService],
})
@AutoUnsubscribe()
export class SalaryEstimationPageComponent implements OnInit, OnDestroy {

    uncalculatedWorkLogs: WorkLog[] = [];
    loadingState = LoadingState.LOADING;

    selectedWorkLog?: WorkLog;

    actionsTaken: any[] = [];

    employeeRatioForm = new FormControl<{ [key: string]: { ratio: number, sum: number } }>({});

    factorsActions: TFactorAction[] = [];

    emptyCalculationConformationDialogVisible = false;
    emptyCalculationDescription = "";
    recalculationConformationDialogVisible = false;
    recalculationDescription = "";
    isSendingCalculation = false;

    subscriptions: SubscriptionsHolder = new SubscriptionsHolder();
    removeWorkLogFromListHandler = {
        next: (workLog: WorkLog) => {
            this.uncalculatedWorkLogs.splice(this.uncalculatedWorkLogs.findIndex(wl =>  wl.workLogId === workLog.workLogId), 1);
        }
    }
    addWorkLogToListHandler = {
        next: (workLog: WorkLog) => {
            this.uncalculatedWorkLogs.unshift(workLog)
        }
    }
    sendingCalculationHandlers = {
        next: () => {
            this.isSendingCalculation = false;
            this.emptyCalculationConformationDialogVisible = false;
            this.emptyCalculationDescription = '';
            this.recalculationConformationDialogVisible = false;
            this.recalculationDescription = '';
            this.resetCalculation()
            if (this.selectedWorkLog) {
                this.uncalculatedWorkLogs.splice(this.uncalculatedWorkLogs.findIndex(wl =>  wl.workLogId === this.selectedWorkLog?.workLogId), 1);
                // this.uncalculatedWorkLogs = this.uncalculatedWorkLogs.filter(wl => wl.workLogId !== this.selectedWorkLog?.workLogId);
                if (this.uncalculatedWorkLogs.length > 0) {
                    this.selectWork(this.uncalculatedWorkLogs[0]);
                }else{
                    this.unselectWorkLog();
                }
            }
        },
        error: () => {
            this.isSendingCalculation = false;
        }
    }

    worksPickerForm = new FormControl<WorksPickerValue | null>(null);
    worksPickerForm$ = this.worksPickerForm.valueChanges.pipe(
        shareReplay(1)
    )

    workLogId$: Observable<number | undefined> = <Observable<number | undefined>>this.route.queryParams
        .pipe(
            map(params => params['workLogId']),
            shareReplay(1)
        );

    selectedWorkLog$ = this.workLogId$.pipe(
        switchMap(id => {
            if (!id) return of(undefined);
            return this.api.getWorkLog(id, true)
        }),
        shareReplay(1)
    )

    setupFormValues$ = this.selectedWorkLog$.pipe(
        switchMap(workLog => {
            if (workLog)
                return this.api.getAlreadyCalculatedWorkForm(workLog?.workLogId)
            else
                return of(null)
        }),
    )

    recalculate$ = this.setupFormValues$.pipe(
        map(workLog=>workLog?"RECALCULATE":"CALCULATE"),
    )

    paidWorkForm = new FormGroup({
        isPaidWork: new FormControl(false),
        amountOfMoneyTaken: new FormControl(null, [Validators.min(0), Validators.required]),
        comment: new FormControl(''),
        isLegalEntity: new FormControl(false),
    })

    amountValidatorSub = this.paidWorkForm.controls.isPaidWork.valueChanges.subscribe(value => {
        if (value) {
            this.paidWorkForm.controls.amountOfMoneyTaken.setValidators([Validators.min(0), Validators.required])
        } else {
            this.paidWorkForm.controls.amountOfMoneyTaken.clearValidators();
        }
        this.paidWorkForm.controls.amountOfMoneyTaken.updateValueAndValidity()
    })

    globalRatioMenuOptions: MenuItem[] = [
        {label: "x0.1", command: () => this.setFactorToAllActions(0.1)},
        {label: "x0.25", command: () => this.setFactorToAllActions(0.25)},
        {label: "x0.5", command: () => this.setFactorToAllActions(0.5)},
        {label: "x0.75", command: () => this.setFactorToAllActions(0.75)},
        {label: "x1.25", command: () => this.setFactorToAllActions(1.25)},
        {label: "x1.5", command: () => this.setFactorToAllActions(1.5)},
        {label: "x2", command: () => this.setFactorToAllActions(2)},
        {label: "x3", command: () => this.setFactorToAllActions(3)},
        {label: "Отчистить", command: () => this.clearFactors()},
    ]

    noActions$ = this.worksPickerForm.valueChanges.pipe(
        map(value => !value?.actionsTaken || value.actionsTaken.length === 0),
        shareReplay(1)
    )

    setFactorToAllActions(factor: number) {
        const value = this.worksPickerForm.value;
        if(!value || !value.actionsTaken || value.actionsTaken.length === 0) return;
        const factors: TFactorAction[] = [];
        const employees = this.selectedWorkLog?.employees;
        value.actionsTaken.forEach((action: WorkActionFormItem) => {
            employees?.forEach((employee: Employee) => {
                const factorAction: TFactorAction = {
                    factor: factor,
                    login: employee.login,
                    name: action.actionName,
                    actionUuids: [action.uuid],
                    uuid: v4()
                }
                factors.push(factorAction);
            });
        });
        value.factorsActions = factors;
        this.worksPickerForm.setValue(value);
    }

    clearFactors() {
        const value = this.worksPickerForm.value;
        if(!value) return;
        value.factorsActions = [];
        this.worksPickerForm.setValue(value);
    }

    constructor(readonly api: ApiService, private confirmation: ConfirmationService, private rt: RealTimeUpdateService,
                private router: Router, private route: ActivatedRoute, private nav: CustomNavigationService) {
    }

    get totalCostOfWork() {
        return this.actionsTaken.reduce((total, action) => total + action.cost, 0);
    };

    trackByField(index: number, field: any) {
        return field.name + field.textRepresentation + field.modelItemId;
    };

    trackByEmployee(index: number, employee: any) {
        return employee.login + employee.fullName + employee.avatar;
    };

    trackByWorkLog(index: number, workLog: WorkLog) {
        return workLog.workLogId;
    };

    getUncompletedMessage(workLog: WorkLog) {
        const reportAwaitingWriting = workLog.workReports.filter(report => report.awaitingWriting);
        if (reportAwaitingWriting.length > 0) {
            return `Не написали отчеты: ${reportAwaitingWriting.map(report => report.author.fullName).join(', ')}`;
        }
        return '';
    }

    ngOnInit(): void {
        this.loadUncalculatedWorkLogs()
        this.subscriptions.addSubscription('wp', this.worksPickerForm.valueChanges.subscribe(value => {
            if (!value) return;
            this.actionsTaken = value.actionsTaken;
            this.factorsActions = value.factorsActions ?? [];
            if(this.factorsActions.length > 0){
                this.paidWorkForm.controls.comment.addValidators(Validators.required);
            }else{
                this.paidWorkForm.controls.comment.clearValidators();
            }
            this.paidWorkForm.controls.comment.updateValueAndValidity()
        }));
        this.subscriptions.addSubscription('wlUpd', this.rt.workLogUpdated().subscribe(()=>this.api.getUncalculatedWorkLogs().subscribe({
            next: workLogs => {
                this.uncalculatedWorkLogs = workLogs;
                if (workLogs.length > 0) {
                    this.loadingState = LoadingState.READY;
                } else {
                    this.loadingState = LoadingState.EMPTY;
                }
            },
            error: error => {
                this.loadingState = LoadingState.ERROR;
            }
        })))
        this.subscriptions.addSubscription('chQue', this.selectedWorkLog$.subscribe(value => this.selectedWorkLog = value))
        this.subscriptions.addSubscription('setupForm', this.setupFormValues$.subscribe(value => {
            if (value) {
                this.worksPickerForm.setValue({
                    actionsTaken: value.actions,
                    factorsActions: value.factorsActions
                });
                this.employeeRatioForm.setValue(value.employeesRatio);
                this.paidWorkForm.setValue({
                    isPaidWork: value.isPaidWork ?? false,
                    amountOfMoneyTaken: value.amountOfMoneyTaken ?? null,
                    comment: value.comment ?? '',
                    isLegalEntity: value.isLegalEntity?? false
                })
            }else{
                this.worksPickerForm.reset();
                this.employeeRatioForm.reset();
                this.paidWorkForm.reset({
                    comment: '',
                    isPaidWork: false,
                    amountOfMoneyTaken: null,
                    isLegalEntity: false,
                });
            }
        }))
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribeAll()
    }

    loadUncalculatedWorkLogs() {
        this.loadingState = LoadingState.LOADING;
        this.api.getUncalculatedWorkLogs().subscribe({
            next: workLogs => {
                this.uncalculatedWorkLogs = workLogs;
                if (workLogs.length > 0) {
                    this.loadingState = LoadingState.READY;
                } else {
                    this.loadingState = LoadingState.EMPTY;
                }
            }, error: error => {
                this.loadingState = LoadingState.ERROR;
            }
        })
        this.subscriptions.addSubscription("wlUpd", this.rt.workLogUpdated().pipe(filter(wl => wl.calculated)).subscribe(this.removeWorkLogFromListHandler))
        this.subscriptions.addSubscription("wlCr", this.rt.workLogClosed().pipe(filter(wl => !wl.calculated)).subscribe(this.addWorkLogToListHandler))
    }

    selectWork(work: WorkLog) {
        this.router.navigate(['.'], {relativeTo: this.route, queryParams: {workLogId: work.workLogId}}).then();
    }

    unselectWorkLog()  {
        this.router.navigate(['.'], {relativeTo: this.route}).then();
    }

    unselectWork() {
        this.selectedWorkLog = undefined;
        this.resetCalculation();
        this.router.navigate(['.'], {relativeTo: this.route}).then();
        // this.nav.backOrDefault(["/salary","estimation"]);
    }

    resetCalculation() {
        this.worksPickerForm.reset();
        this.employeeRatioForm.reset();
    }

    sendCalculation() {
        this.paidWorkForm.markAllAsTouched();
        if(this.paidWorkForm.value.isPaidWork && this.paidWorkForm.invalid){
            return;
        }
        if (this.actionsTaken.length === 0) {
            this.emptyCalculationConformationDialogVisible = true;
            return;
        }
        this.confirmation.confirm({
            header: 'Подтверждение',
            message: 'Отправить расчет?',
            accept: () => {
                if (!this.selectedWorkLog) return;
                this.isSendingCalculation = true;
                this.api.sendWorkCalculation({
                    workLogId: this.selectedWorkLog.workLogId,
                    actions: this.actionsTaken.map(at => ({
                        workId: at.workId,
                        actionId: at.actionId,
                        count: at.count,
                        uuid: at.uuid
                    })),
                    spreading: this.selectedWorkLog.employees.map(emp => {
                        return {
                            login: emp.login,
                            ratio: this.employeeRatioForm.value ? this.employeeRatioForm.value[emp.login].ratio : 0,
                            factorsActions: this.getFactorsActions(emp.login).filter(war => war).map((war: any) => ({
                                factor: war.factor,
                                name: war.name,
                                actionUuids: war.actionUuids,
                            })),
                        }
                    }),
                    isPaidWork: this.paidWorkForm.value.isPaidWork,
                    amountOfMoneyTaken: this.paidWorkForm.value.amountOfMoneyTaken,
                    comment: this.paidWorkForm.value.comment,
                    isLegalEntity: this.paidWorkForm.value.isLegalEntity,
                }).subscribe(this.sendingCalculationHandlers)
            }
        })
    }

    openRecalculationConformationDialog() {
        this.recalculationConformationDialogVisible = true;
    }

    sendRecalculation() {
        this.paidWorkForm.markAllAsTouched();
        if(this.paidWorkForm.value.isPaidWork  && this.paidWorkForm.invalid){
            return;
        }
        if (!this.selectedWorkLog) return;
        this.isSendingCalculation = true;
        this.api.sendWorkCalculation({
            workLogId: this.selectedWorkLog.workLogId,
            actions: this.actionsTaken.map(at => ({
                workId: at.workId,
                actionId: at.actionId,
                count: at.count,
                uuid: at.uuid
            })),
            emptyDescription: this.actionsTaken.length === 0 ? this.recalculationDescription : null,
            editingDescription: this.recalculationDescription,
            spreading: this.selectedWorkLog.employees.map(emp => {
                return {
                    login: emp.login,
                    ratio: this.employeeRatioForm.value ? this.employeeRatioForm.value[emp.login].ratio : 0,
                    factorsActions: this.getFactorsActions(emp.login).filter(war => war).map((war: any) => ({
                        factor: war.factor,
                        name: war.name,
                        actionUuids: war.actionUuids,
                    })),
                }
            }),
            isPaidWork: this.paidWorkForm.value.isPaidWork,
            amountOfMoneyTaken: this.paidWorkForm.value.amountOfMoneyTaken,
            comment: this.paidWorkForm.value.comment,
            isLegalEntity: this.paidWorkForm.value.isLegalEntity,
        }).subscribe(this.sendingCalculationHandlers)
    }

    sendEmptyCalculation() {
        if(this.paidWorkForm.value.isPaidWork && this.paidWorkForm.invalid){
            return;
        }
        if (!this.selectedWorkLog) return;
        this.isSendingCalculation = true;
        this.api.sendWorkCalculation({
            workLogId: this.selectedWorkLog.workLogId,
            emptyDescription: this.emptyCalculationDescription,
            actions: this.actionsTaken.map(at => ({
                workId: at.workId,
                actionId: at.actionId,
                count: at.count,
                uuid: at.uuid
            })),
            spreading: this.selectedWorkLog.employees.map(emp => {
                return {
                    login: emp.login,
                    ratio: this.employeeRatioForm.value ? this.employeeRatioForm.value[emp.login].ratio : 0,
                    factorsActions: this.getFactorsActions(emp.login).filter(war => war).map((war: any) => ({
                        factor: war.factor,
                        name: war.name,
                        actionUuids: war.actionUuids,
                    })),
                }
            }),
            isPaidWork: this.paidWorkForm.value.isPaidWork,
            amountOfMoneyTaken: this.paidWorkForm.value.amountOfMoneyTaken,
            comment: this.paidWorkForm.value.comment,
            isLegalEntity: this.paidWorkForm.value.isLegalEntity,
        }).subscribe(this.sendingCalculationHandlers)
    }

    getFactorsActions(login: string) {
        return this.factorsActions.filter(war => war.login === login)
    }

    removeWorkActionRatio(uuid: string) {
        this.factorsActions = this.factorsActions.filter(w => w.uuid !== uuid);
    }

    hasWorkActionRatio(login: string) {
        return this.factorsActions.find(w => w.login === login)
    }

    onRemoveFactorAction(event: TFactorAction[]) {
        if (this.worksPickerForm.value)
            this.worksPickerForm.setValue({
                actionsTaken: this.worksPickerForm.value.actionsTaken,
                factorsActions: event
            })
    }
}
