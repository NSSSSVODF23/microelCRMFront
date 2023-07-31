import {Component, forwardRef, Input, OnDestroy, OnInit} from '@angular/core';
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from "@angular/forms";
import {Employee, PaidAction, PaidWork, WorkLog} from "../../../transport-interfaces";
import {ConfirmationService, TreeDragDropService, TreeNode} from "primeng/api";
import {SubscriptionsHolder} from "../../../util";
import {v4} from "uuid";
import {ApiService} from "../../../services/api.service";
import {RealTimeUpdateService} from "../../../services/real-time-update.service";

export type WorksPickerValue = {
    actionsTaken: any[],
    factorsActions?: TFactorAction[]
}

export type TFactorAction = {
    factor: number,
    login: string,
    name: string,
    actionUuids: string[],
    uuid: string
}

@Component({
    selector: 'app-works-picker',
    templateUrl: './works-picker.component.html',
    styleUrls: ['./works-picker.component.scss'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => WorksPickerComponent),
            multi: true
        },
        TreeDragDropService
    ],
})
export class WorksPickerComponent implements OnInit, OnDestroy, ControlValueAccessor {
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

    workActionsRatioMenu: any[] = [];
    selectedWorkName?: string;
    selectedUuidActions?: string[];

    factorsActions: TFactorAction[] = [];
    subscriptions: SubscriptionsHolder = new SubscriptionsHolder();
    isDisabled = false;

    constructor(private api: ApiService) {
    }

    private _employees: Employee[] = [];

    get employees(): Employee[] {
        return this._employees
    }

    @Input() set employees(employees: Employee[] | null | undefined) {
        if (employees === null || employees === undefined) {
            this._employees = [];
            return;
        }
        this._employees = employees;
        this.workActionsRatioMenu = this.employees.map(employee => {
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
    }

    get totalCostOfWork() {
        return this.actionsTaken.reduce((total, action) => total + action.cost, 0);
    };

    onChange = (value: WorksPickerValue) => {
    };

    onTouched = () => {
    };

    registerOnChange(fn: any): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: any): void {
        this.onTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        this.isDisabled = isDisabled;
    }

    writeValue(obj: WorksPickerValue): void {
        if (obj) {
            this.actionsTaken = obj.actionsTaken;
            if (obj.factorsActions) {
                this.factorsActions = obj.factorsActions;
            }
        } else {
            this.actionsTaken = [];
            this.factorsActions = [];
        }
    }

    trackByField(index: number, field: any) {
        return field.name + field.textRepresentation + field.modelItemId;
    };

    trackByEmployee(index: number, employee: any) {
        return employee.login + employee.fullName + employee.avatar;
    };

    deselectFactor() {
        this.selectedUuidActions = undefined;
    }

    trackByWorkLog(index: number, workLog: WorkLog) {
        return workLog.workLogId;
    };

    ngOnInit(): void {
        this.loadWorks()
        this.loadActions()
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribeAll()
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
            this.onChange({actionsTaken: this.actionsTaken, factorsActions: this.factorsActions})
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
            this.onChange({actionsTaken: this.actionsTaken, factorsActions: this.factorsActions})
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
        this.factorsActions = this.factorsActions.filter(fa => !fa.actionUuids.some(a => a === actions[0].uuid));
        this.actionsTaken = this.actionsTaken.filter(at => !actions.some(a => a.uuid == at.uuid));
        this.onChange({actionsTaken: this.actionsTaken, factorsActions: this.factorsActions})
    }

    updateActionCount(event: any, node: any) {
        node.cost = event * node.price;
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
        this.factorsActions = this.factorsActions.filter(fa => !(fa.actionUuids.some(a => a === uuid)));
        this.actionsTaken = this.actionsTaken.filter(at => at.uuid !== uuid);
        this.onChange({actionsTaken: this.actionsTaken, factorsActions: this.factorsActions})
    }

    selectAllValue(event: FocusEvent) {
        const eventTarget: HTMLInputElement = <HTMLInputElement>event.target;
        // select all string
        const length = eventTarget.value.length;
        eventTarget.setSelectionRange(0, length);
    }

    addActionRatio(factor: number, login: string) {
        if (!this.selectedUuidActions || !this.selectedWorkName) return;
        this.factorsActions.push({
            factor,
            login,
            name: this.selectedWorkName,
            actionUuids: this.selectedUuidActions,
            uuid: v4()
        });
        this.onChange({actionsTaken: this.actionsTaken, factorsActions: this.factorsActions})
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
