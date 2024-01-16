import {Component, OnDestroy, OnInit} from '@angular/core';
import {ApiService} from "../../services/api.service";
import {LoadingState, WorkLog} from "../../types/transport-interfaces";
import {ConfirmationService, TreeDragDropService} from "primeng/api";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {SubscriptionsHolder} from "../../util";
import {RealTimeUpdateService} from "../../services/real-time-update.service";
import {filter, map, Observable, of, shareReplay, switchMap} from "rxjs";
import {TFactorAction, WorksPickerValue} from "../../components/controls/works-picker/works-picker.component";
import {ActivatedRoute, Router} from "@angular/router";
import {CustomNavigationService} from "../../services/custom-navigation.service";

@Component({
    templateUrl: './salary-estimation-page.component.html',
    styleUrls: ['./salary-estimation-page.component.scss'],
    providers: [TreeDragDropService],
})
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
            this.uncalculatedWorkLogs = this.uncalculatedWorkLogs.filter(wl => wl.workLogId !== workLog.workLogId)
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
                this.uncalculatedWorkLogs = this.uncalculatedWorkLogs.filter(wl => wl.workLogId !== this.selectedWorkLog?.workLogId);
                if (this.uncalculatedWorkLogs.length > 0) {
                    this.selectWork(this.uncalculatedWorkLogs[0]);
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

    workLogId$: Observable<number | undefined> = <Observable<number | undefined>>this.route.queryParams.pipe(map(params => params['workLogId']));

    selectedWorkLog$ = this.workLogId$.pipe(
        switchMap(id => {
            if (!id) return of(undefined);
            return this.api.getWorkLog(id, true)
        })
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
        amountOfMoneyTaken: new FormControl(null, [Validators.min(0), Validators.required])
    })

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

    ngOnInit(): void {
        this.loadUncalculatedWorkLogs()
        this.subscriptions.addSubscription('wp', this.worksPickerForm.valueChanges.subscribe(value => {
            if (!value) return;
            this.actionsTaken = value.actionsTaken;
            this.factorsActions = value.factorsActions ?? [];
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
                    amountOfMoneyTaken: value.amountOfMoneyTaken ?? null
                })
            }else{
                this.worksPickerForm.reset();
                this.employeeRatioForm.reset();
                this.paidWorkForm.reset();
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
        // this.selectedWorkLog = work;
        this.router.navigate(['.'], {relativeTo: this.route, queryParams: {workLogId: work.workLogId}}).then();
    }

    unselectWork() {
        // // this.selectedWorkLog = undefined;
        // this.router.navigate(['.'], {relativeTo: this.route}).then();
        this.nav.backOrDefault(["/salary","estimation"]);
        this.resetCalculation();
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
                    amountOfMoneyTaken: this.paidWorkForm.value.amountOfMoneyTaken
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
            amountOfMoneyTaken: this.paidWorkForm.value.amountOfMoneyTaken
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
            amountOfMoneyTaken: this.paidWorkForm.value.amountOfMoneyTaken
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
