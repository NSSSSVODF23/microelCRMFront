import {Component, OnDestroy, OnInit} from '@angular/core';
import {ApiService} from "../../services/api.service";
import {LoadingState, PaidAction, PaidWork, WorkLog} from "../../transport-interfaces";
import {ConfirmationService, TreeDragDropService, TreeNode} from "primeng/api";
import {FormControl, FormGroup} from "@angular/forms";
import {SubscriptionsHolder} from "../../util";
import {v4} from "uuid";
import {RealTimeUpdateService} from "../../services/real-time-update.service";
import {filter} from "rxjs";

@Component({
    templateUrl: './salary-estimation-page.component.html',
    styleUrls: ['./salary-estimation-page.component.scss'],
    providers: [TreeDragDropService],
})
export class SalaryEstimationPageComponentBK implements OnInit, OnDestroy {

    uncalculatedWorkLogs: WorkLog[] = [];
    loadingState = LoadingState.LOADING;

    selectedWorkLog?: WorkLog;

    treeMenuWorksItems: TreeNode<any>[] = [];

    worksTablePath: string[] = [];
    worksTableLoading: boolean = false;
    draggablePaidWork?: PaidWork;
    actionsTaken: any[] = [];
    isDragging = false;
    dragEnterCounter = 0;

    tableMenuActionsItems: PaidAction[] = [];
    actionsTableLoading: boolean = false;
    draggableAction?: PaidAction;

    employeeRatioForm = new FormGroup<{ [key: string]: FormGroup }>({})
    employeeRatioSubscriptions: SubscriptionsHolder = new SubscriptionsHolder();
    workActionsRatioMenu: any[] = [];
    selectedWorkName?: string;
    selectedUuidActions?: string[];

    factorsActions: {
        factor: number,
        login: string,
        name: string,
        actionUuids: string[],
        uuid: string
    }[] = [];

    emptyCalculationConformationDialogVisible = false;
    emptyCalculationDescription = "";
    isSendingCalculation = false;

    subscriptions: SubscriptionsHolder = new SubscriptionsHolder();

    constructor(readonly api: ApiService, private confirmation: ConfirmationService, private rt: RealTimeUpdateService) {
    }

    get totalCostOfWork() {
        return this.actionsTaken.reduce((total, action) => total + action.cost, 0);
    };

    get allMoney() {
        return Object.values(this.employeeRatioForm.value).reduce((prev, curr) => {
            return prev + curr.sum
        }, 0)
    }

    get allMoneyWithRatio() {
        return this.allMoney + this.getTotalWorkActionsRatioSum();
    }

    trackByField(index: number, field: any) {
        return field.name + field.textRepresentation + field.modelItemId;
    };

    trackByEmployee(index: number, employee: any) {
        return employee.login + employee.fullName + employee.avatar;
    };

    trackByWar(index: number, war: any) {
        return war.uuid + war.name + war.factor;
    };

    deselectFactor() {
        this.selectedUuidActions = undefined;
    }

    trackByWorkLog(index: number, workLog: WorkLog) {
        return workLog.workLogId;
    };

    ngOnInit(): void {
        this.loadUncalculatedWorkLogs()
        this.loadWorks()
        this.loadActions()
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
        this.subscriptions.addSubscription("wlUpd", this.rt.workLogUpdated().pipe(filter(wl=>wl.calculated)).subscribe(this.removeWorkLogFromListHandler))
        this.subscriptions.addSubscription("wlCr", this.rt.workLogClosed().pipe(filter(wl=>!wl.calculated)).subscribe(this.addWorkLogToListHandler))
    }

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

    loadActions() {
        this.actionsTableLoading = true;
        this.api.getListAvailablePaidActions().subscribe({
            next: actions => {
                this.tableMenuActionsItems = actions;
                this.actionsTableLoading = false;
            }, error: error => {
                this.actionsTableLoading = false;
            }
        })
    }

    loadWorks() {
        this.worksTableLoading = true;
        this.api.getRootTreeOfWorks(true).subscribe({
            next: tree => {
                this.treeMenuWorksItems = tree;
                this.worksTableLoading = false;
            },
        })
    }

    selectWork(work: WorkLog) {
        this.selectedWorkLog = work;
        if (this.selectedWorkLog && this.selectedWorkLog.employees.length > 0) {
            this.workActionsRatioMenu = this.selectedWorkLog.employees.map(employee => {
                return {
                    label: employee.fullName,
                    items: [
                        {label: "x0.1", command: () => this.addActionRatio(0.1, employee.login)},
                        {label: "x0.25", command: () => this.addActionRatio(0.2, employee.login)},
                        {label: "x0.5", command: () => this.addActionRatio(0.5, employee.login)},
                        {label: "x0.75", command: () => this.addActionRatio(0.75, employee.login)},
                        {label: "x1.25", command: () => this.addActionRatio(1.25, employee.login)},
                        {label: "x1.5", command: () => this.addActionRatio(1.5, employee.login)},
                        {label: "x2", command: () => this.addActionRatio(2, employee.login)},
                        {label: "x3", command: () => this.addActionRatio(3, employee.login)},
                    ]
                }
            })
            const employeesCount = this.selectedWorkLog.employees.length;
            const initRatio = 1 / employeesCount;
            this.employeeRatioForm = new FormGroup(this.selectedWorkLog.employees.reduce((prev, curr) => {
                const employeeGroup = new FormGroup({
                    ratio: new FormControl(initRatio),
                    sum: new FormControl(Math.floor(initRatio * this.totalCostOfWork))
                })
                this.employeeRatioSubscriptions.addSubscription(curr.login + 'rt', employeeGroup.controls.ratio.valueChanges.subscribe((currRatio) => {
                    if (currRatio === null) return;
                    const currentLogin = curr.login;
                    const sumOfOtherRatios = Object.keys(this.employeeRatioForm.value)
                        .filter(login => login !== currentLogin)
                        .map(login => this.employeeRatioForm.value[login].ratio)
                        .reduce((prev, curr) => {
                            return prev + curr;
                        }, 0);
                    if ((currRatio + sumOfOtherRatios) > 1) {
                        const delta = (currRatio + sumOfOtherRatios) - 1;
                        const patchValue: { [key: string]: { ratio: number, sum: number } } = {};
                        for (let login in this.employeeRatioForm.value) {
                            patchValue[login] = {ratio: 0, sum: 0};
                            if (login === currentLogin) continue;
                            const ratio = this.employeeRatioForm.value[login].ratio;
                            const ratioPercent = ratio / sumOfOtherRatios;
                            patchValue[login].ratio = ratio - (delta * ratioPercent);
                            patchValue[login].sum = Math.floor(patchValue[login].ratio * this.totalCostOfWork);
                        }
                        patchValue[currentLogin].ratio = currRatio;
                        patchValue[currentLogin].sum = Math.floor(currRatio * this.totalCostOfWork);
                        this.employeeRatioForm.patchValue(patchValue, {emitEvent: false});
                    } else {
                        this.employeeRatioForm.patchValue({
                            [currentLogin]: {
                                ratio: currRatio,
                                sum: Math.floor(currRatio * this.totalCostOfWork)
                            }
                        }, {emitEvent: false});
                    }
                }));
                this.employeeRatioSubscriptions.addSubscription(curr.login + 'sum', employeeGroup.controls.sum.valueChanges.subscribe((currSum) => {
                    if (currSum !== null && currSum > this.totalCostOfWork) currSum = this.totalCostOfWork;
                    if (currSum === null) return;
                    const currentLogin = curr.login;
                    const sumOfOtherAmounts = Object.keys(this.employeeRatioForm.value)
                        .filter(login => login !== currentLogin)
                        .map(login => this.employeeRatioForm.value[login].sum)
                        .reduce((prev, curr) => {
                            return prev + curr;
                        }, 0);
                    if ((currSum + sumOfOtherAmounts) > this.totalCostOfWork) {
                        const delta = (currSum + sumOfOtherAmounts) - this.totalCostOfWork;
                        const patchValue: { [key: string]: { ratio: number, sum: number } } = {};
                        for (let login in this.employeeRatioForm.value) {
                            patchValue[login] = {ratio: 0, sum: 0};
                            if (login === currentLogin) continue;
                            const sum = this.employeeRatioForm.value[login].sum;
                            const ratioPercent = sum / sumOfOtherAmounts;
                            patchValue[login].sum = Math.floor(sum - (delta * ratioPercent));
                            patchValue[login].ratio = patchValue[login].sum / this.totalCostOfWork;
                        }
                        patchValue[currentLogin].sum = Math.floor(currSum);
                        patchValue[currentLogin].ratio = currSum / this.totalCostOfWork;
                        this.employeeRatioForm.patchValue(patchValue, {emitEvent: false});
                    } else {
                        this.employeeRatioForm.patchValue({
                            [currentLogin]: {
                                ratio: currSum / this.totalCostOfWork,
                                sum: Math.floor(currSum)
                            }
                        }, {emitEvent: false});
                    }
                }));
                return {
                    ...prev,
                    [curr.login]: employeeGroup
                }
            }, {}))
        }
    }

    unselectWork() {
        this.selectedWorkLog = undefined;
        this.employeeRatioSubscriptions.unsubscribeAll();
        this.resetCalculation();
    }

    resetCalculation(){
        this.actionsTaken = [];
        this.employeeRatioForm.reset();
        this.factorsActions = [];
    }

    loadWorksByGroup(key: any) {
        this.worksTableLoading = true;

        this.api.getWorksOfGroup(key.substring(1), true).subscribe({
            next: works => {
                this.treeMenuWorksItems = works;
                this.worksTablePath.push(key);
                this.treeMenuWorksItems.unshift({type: 'back', key})
                this.worksTableLoading = false;
            }
        })
    }

    workingTableBack() {
        this.worksTablePath.pop();
        const key = this.worksTablePath.pop();
        this.worksTableLoading = true;
        if (key) {
            this.api.getWorksOfGroup(key.substring(1), true).subscribe({
                next: works => {
                    this.treeMenuWorksItems = works;
                    this.treeMenuWorksItems.unshift({type: 'back'});
                    this.worksTableLoading = false;
                }
            })
        } else {
            this.api.getRootTreeOfWorks(true).subscribe({
                next: tree => {
                    this.treeMenuWorksItems = tree;
                    this.worksTableLoading = false;
                }
            })
        }
    }

    dropped() {
        if (this.draggablePaidWork) {
            const workExist = this.actionsTaken.filter(at => at.workId === this.draggablePaidWork?.paidWorkId);
            if (workExist.length === 0) {
                for (let action of this.draggablePaidWork.actions) {
                    this.actionsTaken.push({
                        workName: this.draggablePaidWork.name,
                        workId: this.draggablePaidWork.paidWorkId,
                        actionName: action.action.name,
                        count: action.count,
                        unit: action.action.unit,
                        price: action.action.cost,
                        cost: action.action.cost * action.count,
                        actionId: action.action.paidActionId,
                        uuid: v4()
                    })
                }
            } else {
                workExist.forEach(w => {
                    const targetAction = this.draggablePaidWork?.actions.find(at => at.action.paidActionId === w.actionId);
                    if (targetAction) {
                        w.count += targetAction.count
                        w.cost = w.price * w.count
                    }
                })
            }
            this.actionsTaken = [...this.actionsTaken]
            this.recalculateAmountsForEmployees()
        }
        if (this.draggableAction) {
            const actionExist = this.actionsTaken.find(at => (!at.workId && at.actionId === this.draggableAction?.paidActionId));
            if (!actionExist) {
                this.actionsTaken.push({
                    workName: undefined,
                    workId: undefined,
                    actionName: this.draggableAction.name,
                    count: 1,
                    unit: this.draggableAction.unit,
                    price: this.draggableAction.cost,
                    cost: this.draggableAction.cost,
                    actionId: this.draggableAction.paidActionId,
                    uuid: v4()
                })
            } else {
                actionExist.count += 1;
                actionExist.cost = actionExist.price * actionExist.count;
            }
            this.actionsTaken = [...this.actionsTaken]
            this.recalculateAmountsForEmployees()
        }
        this.draggablePaidWork = undefined;
        this.draggableAction = undefined;
        this.isDragging = false;
        this.dragEnterCounter = 0;
    }

    workDragging(paidWork: PaidWork) {
        this.draggablePaidWork = paidWork;
    }

    actionDragging(paidAction: PaidAction) {
        this.draggableAction = paidAction;
    }

    workCost(work: PaidWork) {
        let cost = 0;
        for (let action of work.actions) {
            cost += action.action.cost * action.count;
        }
        return cost;
    }

    removeWork(workId: any) {
        const actions = this.actionsTaken.filter(at => at.workId === workId);
        this.factorsActions = this.factorsActions.filter(fa=> !fa.actionUuids.some(a => a === actions[0].uuid));
        this.actionsTaken = this.actionsTaken.filter(at=> !actions.some(a=>a.uuid == at.uuid));
        this.recalculateAmountsForEmployees()
    }

    updateActionCount(event: any, node: any) {
        node.cost = event * node.price;
        this.recalculateAmountsForEmployees()
    }

    dragEnter() {
        this.dragEnterCounter++;
        this.isDragging = true;
    }

    dragLeave() {
        this.dragEnterCounter--;
        if (this.dragEnterCounter === 0) this.isDragging = false;
    }

    removeAction(uuid: string) {
        this.factorsActions = this.factorsActions.filter(fa=> !(fa.actionUuids.some(a => a === uuid)));
        this.actionsTaken = this.actionsTaken.filter(at => at.uuid !== uuid);
        this.recalculateAmountsForEmployees()
    }

    recalculateAmountsForEmployees() {
        for (const login in this.employeeRatioForm.value) {
            const current = this.employeeRatioForm.value[login];
            this.employeeRatioForm.patchValue({
                [login]: {
                    ratio: current.ratio,
                    sum: Math.floor(current.ratio * this.totalCostOfWork)
                }
            }, {emitEvent: false});
        }
    }

    selectAllValue(event: FocusEvent) {
        const eventTarget: HTMLInputElement = <HTMLInputElement>event.target;
        // select all string
        const length = eventTarget.value.length;
        eventTarget.setSelectionRange(0, length);
    }

    equalize() {
        if (!this.selectedWorkLog) return;
        const employeesCount = this.selectedWorkLog.employees.length;
        const initRatio = 1 / employeesCount;
        Object.keys(this.employeeRatioForm.value).forEach(login => {
            this.employeeRatioForm.patchValue({
                [login]: {
                    ratio: initRatio,
                    sum: Math.floor(initRatio * this.totalCostOfWork)
                }
            }, {emitEvent: false});
        })
    }

    sendCalculation() {
        if(this.actionsTaken.length === 0){
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
                    actions: this.actionsTaken.map(at => ({workId: at.workId, actionId: at.actionId, count: at.count, uuid: at.uuid})),
                    spreading: this.selectedWorkLog.employees.map(emp => {
                        return {
                            login: emp.login,
                            ratio: this.employeeRatioForm.value[emp.login].ratio,
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

    sendingCalculationHandlers = {
        next: ()=>{
            this.isSendingCalculation = false;
            this.emptyCalculationConformationDialogVisible = false;
            this.emptyCalculationDescription = '';
            this.resetCalculation()
            if(this.selectedWorkLog){
                this.uncalculatedWorkLogs = this.uncalculatedWorkLogs.filter(wl => wl.workLogId !== this.selectedWorkLog?.workLogId);
                if(this.uncalculatedWorkLogs.length > 0){
                    this.selectWork(this.uncalculatedWorkLogs[0]);
                }
            }
        },
        error: () => {
            this.isSendingCalculation = false;
        }
    }

    sendEmptyCalculation() {
        if (!this.selectedWorkLog) return;
        this.isSendingCalculation = true;
        this.api.sendWorkCalculation({
            workLogId: this.selectedWorkLog.workLogId,
            emptyDescription: this.emptyCalculationDescription,
            actions: this.actionsTaken.map(at => ({workId: at.workId, actionId: at.actionId, count: at.count, uuid: at.uuid})),
            spreading: this.selectedWorkLog.employees.map(emp => {
                return {
                    login: emp.login,
                    ratio: this.employeeRatioForm.value[emp.login].ratio,
                    factorsActions: this.getFactorsActions(emp.login).filter(war => war).map((war: any) => ({
                        factor: war.factor,
                        name: war.name,
                        actionUuids: war.actionUuids,
                    })),
                }
            })
        }).subscribe(this.sendingCalculationHandlers)
    }

    addActionRatio(factor: number, login: string) {
        if (!this.selectedUuidActions || !this.selectedWorkName) return;
        this.factorsActions.push({factor, login, name: this.selectedWorkName, actionUuids: this.selectedUuidActions, uuid: v4()});
    }

    getWorkActionsRatioSum(uuid:string) {
        const factorAction = this.factorsActions.find(war => war.uuid === uuid);
        if(factorAction){
            const costOfWork = factorAction.actionUuids.reduce((prev, curr)=>{
                const actionTaken = this.actionsTaken.find(at=>at.uuid === curr);
                if(!actionTaken) return prev;
                return prev + actionTaken.cost;
            },0);
            const employeeRatio = this.employeeRatioForm.value[factorAction.login].ratio;
            const cost = costOfWork * employeeRatio;
            return Math.floor((cost * factorAction.factor) - cost);
        }
        return 0;
    }

    getTotalWorkActionsRatioSum() {
        return this.factorsActions.reduce((prev, curr) => {
            return prev + this.getWorkActionsRatioSum(curr.uuid);
        }, 0);
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
        return this.employeeRatioForm.value[login].sum + this.getFactorsActions(login).reduce((prev, curr) => {
            return prev + this.getWorkActionsRatioSum(curr.uuid);
        }, 0)
    }

    selectWorkActions(workId: any, workName: any) {
        this.selectedUuidActions = this.actionsTaken.filter(at => at.workId === workId).map(at => at.uuid);
        this.selectedWorkName = workName;
    }

    selectAction(uuid: any, actionName: any) {
        this.selectedUuidActions = [uuid];
        this.selectedWorkName = actionName;
    }
}
