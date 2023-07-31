import {Component, OnDestroy, OnInit} from '@angular/core';
import {ApiService} from "../../services/api.service";
import {LoadingState, PaidAction, PaidWork, WorkLog} from "../../transport-interfaces";
import {ConfirmationService, TreeDragDropService, TreeNode} from "primeng/api";
import {FormControl, FormGroup} from "@angular/forms";
import {SubscriptionsHolder} from "../../util";
import {v4} from "uuid";
import {RealTimeUpdateService} from "../../services/real-time-update.service";
import {count, delay, filter, map, merge, of, repeat, tap, zip} from "rxjs";
import {TFactorAction, WorksPickerValue} from "../../components/controls/works-picker/works-picker.component";

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

    employeeRatioForm = new FormControl<{[key: string]: {ratio: number, sum: number}}>({});

    factorsActions: TFactorAction[] = [];

    emptyCalculationConformationDialogVisible = false;
    emptyCalculationDescription = "";
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
    worksPicker = new FormControl<WorksPickerValue | null>(null);

    constructor(readonly api: ApiService, private confirmation: ConfirmationService, private rt: RealTimeUpdateService) {
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
        this.subscriptions.addSubscription('wp', this.worksPicker.valueChanges.subscribe(value => {
            if (!value) return;
            this.actionsTaken = value.actionsTaken;
            this.factorsActions = value.factorsActions ?? [];
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
        this.selectedWorkLog = work;
    }

    unselectWork() {
        this.selectedWorkLog = undefined;
        this.resetCalculation();
    }

    resetCalculation() {
        this.worksPicker.reset();
        this.employeeRatioForm.reset();
    }

    sendCalculation() {
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
                    })
                }).subscribe(this.sendingCalculationHandlers)
            }
        })
    }

    sendEmptyCalculation() {
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
                    ratio: this.employeeRatioForm.value? this.employeeRatioForm.value[emp.login].ratio:0,
                    factorsActions: this.getFactorsActions(emp.login).filter(war => war).map((war: any) => ({
                        factor: war.factor,
                        name: war.name,
                        actionUuids: war.actionUuids,
                    })),
                }
            })
        }).subscribe(this.sendingCalculationHandlers)
    }

    getWorkActionsRatioSum(uuid: string) {
        const factorAction = this.factorsActions.find(war => war.uuid === uuid);
        if (factorAction) {
            const costOfWork = factorAction.actionUuids.reduce((prev, curr) => {
                const actionTaken = this.actionsTaken.find(at => at.uuid === curr);
                if (!actionTaken) return prev;
                return prev + actionTaken.cost;
            }, 0);
            const employeeRatio = this.employeeRatioForm.value ? this.employeeRatioForm.value[factorAction.login].ratio : 0;
            const cost = costOfWork * employeeRatio;
            return Math.floor((cost * factorAction.factor) - cost);
        }
        return 0;
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

    getEmployeeTotalPayment(login: string) {
        return (this.employeeRatioForm.value ? this.employeeRatioForm.value[login].sum : 0) + this.getFactorsActions(login).reduce((prev, curr) => {
            return prev + this.getWorkActionsRatioSum(curr.uuid);
        }, 0)
    }

    onRemoveFactorAction(event: TFactorAction[]) {
        if (this.worksPicker.value)
            this.worksPicker.setValue({
                actionsTaken: this.worksPicker.value.actionsTaken,
                factorsActions: event
            })
    }
}
