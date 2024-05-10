import {Component, forwardRef, Input, OnDestroy, OnInit} from '@angular/core';
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from "@angular/forms";
import {
    Employee,
    PaidAction,
    PaidWork, PaidWorkGroup,
    TreeNodeMoveEvent,
    TreeNodeUpdateEvent,
    WorkLog
} from "../../../types/transport-interfaces";
import {MenuItem, TreeDragDropService, TreeNode} from "primeng/api";
import {SubscriptionsHolder} from "../../../util";
import {v4} from "uuid";
import {ApiService} from "../../../services/api.service";
import {Table} from "primeng/table";
import {RealTimeUpdateService} from "../../../services/real-time-update.service";
import {CharacterTranslator} from "../../../character-translator";

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

    constructor(private api: ApiService, private rt: RealTimeUpdateService) {
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
                    // {label: "x0", command: () => this.addActionRatio(0.0001, employee.login)},
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

    trackByActionItems(index: number, action: PaidAction) {
        return action.paidActionId + action.cost + action.name + action.description + action.unit + action.deleted;
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

        this.subscriptions.addSubscription('actUpdate', this.rt.paidActionUpdated().subscribe(
            update => {
                const findIndex = this.tableMenuActionsItems.findIndex(paidAction=> paidAction.identifier === update.identifier);
                if (findIndex > -1) {
                    this.tableMenuActionsItems[findIndex] = update
                }
            }
        ));

        this.subscriptions.addSubscription('actDelete', this.rt.paidActionDeleted().subscribe(
            del=>{
                const findIndex = this.tableMenuActionsItems.findIndex(paidAction=> paidAction.identifier === del.identifier);
                if (findIndex > -1) {
                    this.tableMenuActionsItems.splice(findIndex, 1)
                }
            }
        ))

        this.subscriptions.addSubscription('actAdd', this.rt.paidActionCreated().subscribe(
            create=>{
                this.tableMenuActionsItems.unshift(create)
            }
        ))
    }

    foundNodeByPath(path: number[]) {
        if (!path || path.length === 0) {
            return null;
        }
        let node: TreeNode<PaidWorkGroup> | null = null;
        let nodes: TreeNode<PaidWorkGroup>[] | undefined = this.treeMenuWorksItems;
        for (let id of path) {
            if (!nodes) {
                return null;
            }
            node = nodes.find(node => node.key === ("g" + id)) ?? null;
            if (node) {
                nodes = node.children
            } else {
                return null;
            }
        }
        return node;
    }

    loadWorks() {
        this.worksTableLoading = true;
        this.api.getRootTreeOfWorks(true).subscribe({
            next: tree => {
                this.treeMenuWorksItems = tree;
                this.worksTableLoading = false;
            },
        })
        this.subscriptions.addSubscription('trMove', this.rt.paidWorksTreeMoved().subscribe(
            (event: TreeNodeMoveEvent) => {
                const sourceNode = this.foundNodeByPath(event.sourcePath);
                const targetNode = this.foundNodeByPath(event.targetPath);
                if (!sourceNode) {
                    const remainingNode = this.treeMenuWorksItems.findIndex(node => (node.key === event.object.key && node.type === event.object.type));
                    if (remainingNode > -1) {
                        this.treeMenuWorksItems.splice(remainingNode, 1);
                    }
                } else if (sourceNode.children) {
                    const remainingNode = sourceNode.children.findIndex(node => (node.key === event.object.key && node.type === event.object.type));
                    if (remainingNode > -1) {
                        sourceNode.children.splice(remainingNode, 1);
                    }
                    if (sourceNode.children.length === 0) {
                        sourceNode.leaf = true;
                    }
                }

                if (!targetNode) {
                    const remainingNode = this.treeMenuWorksItems.findIndex(node => (node.key === event.object.key && node.type === event.object.type));
                    if (remainingNode === -1) {
                        this.treeMenuWorksItems.push(event.object);
                    }
                } else {
                    if (!targetNode.children) {
                        targetNode.children = [];
                        targetNode.children.push(event.object);
                    } else {
                        const remainingNode = targetNode.children.findIndex(node => (node.key === event.object.key && node.type === event.object.type));
                        if (remainingNode === -1) {
                            targetNode.children.push(event.object);
                        }
                    }
                    targetNode.leaf = false;
                }
            }
        ))
        this.subscriptions.addSubscription('trUpd', this.rt.paidWorksTreeUpdated().subscribe(
            (event: TreeNodeUpdateEvent) => {
                const node = this.foundNodeByPath(event.path);
                if (node && node.children) {
                    const index = node.children?.findIndex(n => (n.key === event.object.key && n.type === event.object.type));
                    if (index > -1) {
                        node.children[index] = event.object;
                    }
                } else if (!node) {
                    const index = this.treeMenuWorksItems.findIndex(n => (n.key === event.object.key && n.type === event.object.type));
                    if (index > -1) {
                        this.treeMenuWorksItems[index] = event.object;
                    }
                }
            }
        ))
        this.subscriptions.addSubscription('trCr', this.rt.paidWorksTreeCreated().subscribe(
            (event: TreeNodeUpdateEvent) => {
                const node = this.foundNodeByPath(event.path);
                if (node) {
                    if (!node.children) {
                        node.children = [];
                    }
                    node.children.push(event.object);
                    node.children.sort((a: any, b: any) => a.position - b.position);
                    node.leaf = false;
                } else {
                    this.treeMenuWorksItems.push(event.object);
                    this.treeMenuWorksItems.sort((a: any, b: any) => a.position - b.position);
                }
            }
        ))
        this.subscriptions.addSubscription('trDel', this.rt.paidWorksTreeDeleted().subscribe((event: TreeNodeUpdateEvent) => {
            const node = this.foundNodeByPath(event.path);
            if (node && node.children) {
                const index = node.children.findIndex(n => (n.key === event.object.key));
                if(index > -1) {
                    node.children?.splice(index, 1);
                }
            }else if(!node){
                const rootIndex = this.treeMenuWorksItems.findIndex(n => (n.key === event.object.key));
                if(rootIndex > -1)
                    this.treeMenuWorksItems.splice(rootIndex, 1);
            }
        }))
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
        setTimeout(() => {
            this.onChange({actionsTaken: this.actionsTaken, factorsActions: this.factorsActions})
        })
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

    filterTable(event: Event, actionTableRef: Table) {
        const target: HTMLInputElement = <HTMLInputElement>event.target;

        actionTableRef.filterGlobal(CharacterTranslator.translate(target.value), 'contains')
    }
}
