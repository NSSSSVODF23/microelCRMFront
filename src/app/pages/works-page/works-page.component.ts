import {Component, OnDestroy, OnInit} from '@angular/core';
import {ApiService} from "../../services/api.service";
import {ConfirmationService, TreeDragDropService, TreeNode} from "primeng/api";
import {
    LoadingState,
    PaidAction,
    PaidActionTemplate,
    PaidActionUnit,
    PaidWork,
    PaidWorkGroup,
    TreeDragDropEvent,
    TreeElementPosition,
    TreeNodeMoveEvent,
    TreeNodeUpdateEvent
} from "../../types/transport-interfaces";
import {FormArray, FormControl, FormGroup, Validators} from "@angular/forms";
import {Tree} from "primeng/tree";
import {SubscriptionsHolder} from "../../util";
import {RealTimeUpdateService} from "../../services/real-time-update.service";
import {CustomValidators} from "../../custom-validators";
import {flowInChild} from "../../animations";

@Component({
    templateUrl: './works-page.component.html',
    styleUrls: ['./works-page.component.scss'],
    providers: [TreeDragDropService],
    animations: [flowInChild]
})
export class WorksPageComponent implements OnInit, OnDestroy {
    rootContextMenuItems = [
        {label: 'Создать группу', icon: 'mdi-folder', command: () => this.openCreateGroupDialog()},
        {label: 'Создать работу', icon: 'mdi-construction', command: () => this.openCreateWorkDialog()}
    ];

    treeMenuItems: TreeNode<any>[] = []

    selectedNodeInTree?: TreeNode;
    createGroupDialogVisible = false;
    createGroupDialogMode: 'create' | 'edit' = 'create';
    editingGroupId?: number;

    createGroupForm = new FormGroup(
        {
            name: new FormControl<string>('', [Validators.required]),
            description: new FormControl<string>(''),
            parentGroupId: new FormControl<number | null>(null)
        }
    );

    treeContextMenuItems: any = []

    subscriptions = new SubscriptionsHolder();
    // treeLoading = true;

    createWorkDialogVisible = false;
    createWorkDialogMode: 'create' | 'edit' = 'create';
    createWorkForm = new FormGroup({
        name: new FormControl<string>('', [Validators.required]),
        description: new FormControl<string>(''),
        parentGroupId: new FormControl<number | null>(null),
        actions: new FormArray([] as any[], [CustomValidators.notEmpty])
    });
    breadcrumbHome = {
        icon: 'mdi-home',
        command: () => {
            this.selectedNodeInTree = undefined;
            this.changeBreadcrumbs()
        }
    };
    breadcrumb: any[] = [];
    editingWorkId?: number;

    availablePaidActions: PaidAction[] = [];
    selectedPaidActions: PaidAction[] = [];

    loadingTreeState: LoadingState = LoadingState.LOADING;
    currentWork?: PaidWork;
    workLoadingState: LoadingState = LoadingState.LOADING;
    inViewContextMenuItems = [
        {label: 'Создать группу', icon: 'mdi-folder', command: () => this.openCreateGroupDialog(this.selectedNodeInTree ? this.selectedNodeInTree.key : undefined)},
        {label: 'Создать работу', icon: 'mdi-construction', command: () => this.openCreateWorkDialog(this.selectedNodeInTree ? this.selectedNodeInTree.key : undefined)}
    ];

    constructor(private api: ApiService, private rt: RealTimeUpdateService, private confirmation: ConfirmationService) {
        Tree.prototype.isNodeLeaf = (node) => node.leaf
    }

    get currentWorkActionsSum() {
        if (this.currentWork) {
            return this.currentWork.actions.reduce((sum, action) => sum + (action.count * action.action.cost), 0)
        } else {
            return 0
        }
    };

    trackByAction(index: number, action: PaidActionTemplate) {
        return action.paidActionTemplateId + action.count;
    };

    trackByNode(index: number, node: TreeNode) {
        return node.key ?? '' + node.leaf ?? '' + node.label + JSON.stringify(node.data);
    };

    selectPaidAction(event: any) {
        event.items.forEach((item: any) => {
            item.mode = "select"
            item.controlIndex = this.createWorkForm.controls.actions.length;
            item.control = new FormGroup({
                actionId: new FormControl(item.paidActionId),
                count: new FormControl(1)
            });
            this.createWorkForm.controls.actions.push(item.control);
        })
    }

    unselectPaidAction(event: any) {
        event.items.forEach((item: any) => {
            item.mode = undefined
            item.control = undefined;
            this.createWorkForm.controls.actions.removeAt(item.controlIndex)
        })
    }

    unitName(unit: PaidActionUnit) {
        switch (unit) {
            case PaidActionUnit.AMOUNT:
                return 'шт.';
            case PaidActionUnit.METRES:
                return 'м.';
            case PaidActionUnit.KILOGRAMS:
                return 'кг.';
        }
    }

    changeContextMenuItems() {
        if (this.selectedNodeInTree) {
            switch (this.selectedNodeInTree.type) {
                case 'group':
                    this.treeContextMenuItems = [
                        {
                            label: "Создать",
                            icon: "mdi-add",
                            items: [
                                {
                                    label: "Группу",
                                    icon: "mdi-folder",
                                    command: () => this.openCreateGroupDialog(this.selectedNodeInTree ? this.selectedNodeInTree.key : undefined)
                                },
                                {
                                    label: "Работу",
                                    icon: "mdi-construction",
                                    command: () => this.openCreateWorkDialog(this.selectedNodeInTree ? this.selectedNodeInTree.key : undefined)
                                }
                            ]
                        },
                        {
                            label: "Редактировать",
                            icon: "mdi-edit",
                            command: () => this.openEditGroupDialog()
                        },
                        {
                            label: "Удалить",
                            icon: "mdi-delete",
                            command: () => this.deleteGroup()
                        }
                    ]

                    break;
                case 'work':
                    this.treeContextMenuItems = [
                        {
                            label: "Редактировать",
                            icon: "mdi-edit",
                            command: () => this.openEditWorkDialog()
                        },
                        {
                            label: "Удалить",
                            icon: "mdi-delete",
                            command: () => this.deleteWork()
                        }
                    ]
                    break;
            }
        }
        if (this.selectedNodeInTree?.type === 'group') {
            this.loadOfGroup({node: this.selectedNodeInTree}, () => this.changeBreadcrumbs());
        } else if(this.selectedNodeInTree?.type === 'work') {
            if (this.selectedNodeInTree?.key) this.loadWork(this.selectedNodeInTree.key)
        }
    }

    changeBreadcrumbs() {
        if (this.selectedNodeInTree) {
            let parent: TreeNode | undefined = this.selectedNodeInTree
            const path: any[] = [];
            while (parent) {
                let key = parent.key;
                path.push({
                    label: parent.label, key: key, command: () => {
                        if (this.selectedNodeInTree?.key === key) return;
                        let node: TreeNode<PaidWorkGroup> | undefined = undefined;
                        const newPath = [];
                        for (let bc of this.breadcrumb) {
                            if (node === undefined) {
                                node = this.treeMenuItems.find(tmi => tmi.key === bc.key);
                            } else if (node.children) {
                                node = node.children.find((tmi: any) => tmi.key === bc.key);
                            }
                            newPath.push(bc);
                            if (node && node.key === key) break;
                        }
                        this.selectedNodeInTree = node;
                        this.breadcrumb = newPath;
                    }
                });
                parent = parent.parent;
            }
            this.breadcrumb = path.reverse();
            return;
        }
        this.breadcrumb = [];
    }

    openCreateGroupDialog(rootId?: string) {
        this.createGroupForm.reset();
        this.createGroupDialogMode = 'create';
        this.createGroupDialogVisible = true;
        this.createGroupForm.patchValue({parentGroupId: rootId ? parseInt(rootId.substring(1)) : null});
    };

    openEditGroupDialog() {
        if (!this.selectedNodeInTree?.key) return;
        this.createGroupForm.reset();
        this.editingGroupId = parseInt(this.selectedNodeInTree?.key.substring(1))
        this.createGroupDialogMode = 'edit';
        this.createGroupDialogVisible = true;
        this.createGroupForm.setValue({
            name: this.selectedNodeInTree?.label ?? '',
            description: this.selectedNodeInTree?.data.description ?? '',
            parentGroupId: this.selectedNodeInTree?.parent?.key ? parseInt(this.selectedNodeInTree?.parent?.key) : null
        })
    }

    openCreateWorkDialog(rootId?: string) {
        this.createWorkForm.reset();
        this.createWorkDialogMode = 'create';
        this.createWorkDialogVisible = true;
        this.createWorkForm.controls.actions.clear();
        this.createWorkForm.patchValue({parentGroupId: rootId ? parseInt(rootId.substring(1)) : null});
        this.selectedPaidActions = [];
        this.api.getListAvailablePaidActions().subscribe({
            next: actions => this.availablePaidActions = actions
        })
    }

    openEditWorkDialog() {
        if (!this.selectedNodeInTree?.key) return;
        this.createWorkForm.reset();
        this.editingWorkId = parseInt(this.selectedNodeInTree?.key.substring(1))
        this.createWorkDialogMode = 'edit';
        this.createWorkDialogVisible = true;
        this.createWorkForm.patchValue({
            name: this.selectedNodeInTree?.label ?? '',
            description: this.selectedNodeInTree?.data.description ?? '',
            parentGroupId: this.selectedNodeInTree?.parent?.key ? parseInt(this.selectedNodeInTree?.parent?.key) : null,
        })
        this.selectedPaidActions = [];
        this.createWorkForm.controls.actions.clear();
        this.api.getListAvailablePaidActions().subscribe({
            next: actions => {
                if (this.selectedNodeInTree?.data.actions) {
                    this.selectedNodeInTree.data.actions.forEach((action: PaidActionTemplate) => {
                        let actionItem = structuredClone(action.action);
                        actionItem.mode = "select"
                        actionItem.controlIndex = this.createWorkForm.controls.actions.length;
                        actionItem.control = new FormGroup({
                            actionId: new FormControl(actionItem.paidActionId),
                            count: new FormControl(action.count)
                        });
                        this.selectedPaidActions.push(actionItem)
                        this.createWorkForm.controls.actions.push(actionItem.control);
                    })
                }
                this.availablePaidActions = actions.filter(action => this.selectedPaidActions.findIndex(item => item.paidActionId === action.paidActionId) === -1)
            }
        })
    }

    ngOnInit(): void {
        this.api.getRootTreeOfWorks().subscribe({
            next: tree => {
                this.treeMenuItems = tree;
                if (tree.length > 0) {
                    this.loadingTreeState = LoadingState.READY
                } else {
                    this.loadingTreeState = LoadingState.EMPTY
                }
            },
            error: () => {
                this.loadingTreeState = LoadingState.ERROR
            }
        })

        this.subscriptions.addSubscription('trMove', this.rt.paidWorksTreeMoved().subscribe(
            (event: TreeNodeMoveEvent) => {
                const sourceNode = this.foundNodeByPath(event.sourcePath);
                const targetNode = this.foundNodeByPath(event.targetPath);
                if (!sourceNode) {
                    const remainingNode = this.treeMenuItems.findIndex(node => (node.key === event.object.key && node.type === event.object.type));
                    if (remainingNode > -1) {
                        this.treeMenuItems.splice(remainingNode, 1);
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
                    const remainingNode = this.treeMenuItems.findIndex(node => (node.key === event.object.key && node.type === event.object.type));
                    if (remainingNode === -1) {
                        this.treeMenuItems.push(event.object);
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
                    const index = this.treeMenuItems.findIndex(n => (n.key === event.object.key && n.type === event.object.type));
                    if (index > -1) {
                        this.treeMenuItems[index] = event.object;
                    }
                }
                if (this.selectedNodeInTree?.key === event.object.key) {
                    this.selectedNodeInTree = event.object
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
                    this.treeMenuItems.push(event.object);
                    this.treeMenuItems.sort((a: any, b: any) => a.position - b.position);
                }
            }
        ))
        this.subscriptions.addSubscription('trDel', this.rt.paidWorksTreeDeleted().subscribe((event: TreeNodeUpdateEvent) => {
            const node = this.foundNodeByPath(event.path);
            if (node && node.children) {
                const index = node.children.findIndex(n => (n.key === event.object.key));
                if(this.selectedNodeInTree === node.children[index]){
                    this.selectedNodeInTree = undefined
                }
                if(index > -1) {
                    node.children?.splice(index, 1);
                }
            }else if(!node){
                const rootIndex = this.treeMenuItems.findIndex(n => (n.key === event.object.key));
                if(this.selectedNodeInTree === this.treeMenuItems[rootIndex]){
                    this.selectedNodeInTree = undefined
                }
                if(rootIndex > -1)
                    this.treeMenuItems.splice(rootIndex, 1);
            }
        }))
        this.subscriptions.addSubscription('workUp', this.rt.paidWorkUpdated().subscribe(
            {
                next: (work) => {
                    if (this.currentWork?.paidWorkId === work.paidWorkId) {
                        this.currentWork = work
                    }
                }
            }
        ))
        this.subscriptions.addSubscription('sort', this.rt.worksTreeReposition().subscribe((positions) => {
            positions.forEach(position => {
                const prefix = position.type === 'group' ? 'g' : 'w';
                if (position.path && position.path.length > 0) {
                    const node: any = this.foundNodeByPath(position.path);
                    if (node && node.children) {
                        const targetNode = node.children.find((n: any) => (n.key === (prefix + position.id)));
                        targetNode.position = position.position;
                        node.children.sort((a: any, b: any) => a.position - b.position);
                    }
                } else {
                    const targetNode: any = this.treeMenuItems.find(n => (n.key === (prefix + position.id)));
                    targetNode.position = position.position;
                    this.treeMenuItems.sort((a: any, b: any) => a.position - b.position);
                }
            })
        }))
    }

    foundNodeByPath(path: number[]) {
        if (!path || path.length === 0) {
            return null;
        }
        let node: TreeNode<PaidWorkGroup> | null = null;
        let nodes: TreeNode<PaidWorkGroup>[] | undefined = this.treeMenuItems;
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

    ngOnDestroy(): void {
        this.subscriptions.unsubscribeAll()
    }

    createGroup() {
        if (!this.createGroupForm.valid) return;
        const formValue: any = this.createGroupForm.value;
        this.api.createPaidWorkGroup(formValue).subscribe(() => {
            this.createGroupDialogVisible = false;
        })
    }

    updateGroup() {
        if (!this.editingGroupId) return;
        if (!this.createGroupForm.valid) return;
        const formValue: any = this.createGroupForm.value;
        this.api.editPaidWorkGroup(this.editingGroupId, formValue).subscribe(() => {
            this.createGroupDialogVisible = false;
        })
    }

    nodeDrop(event: any) {
        this.api.treeWorksDragDrop(new TreeDragDropEvent(event)).subscribe();
        this.api.paidWorkTreeReposition(this.getPositions(event)).subscribe(()=>this.changeBreadcrumbs());
        return;
    }

    getPositions(event: any) {
        const dragNode = event.dragNode.parent;
        const dropNode = event.dropNode.parent;
        let positions: TreeElementPosition[] = [];
        if (!dragNode && !dropNode) {
            positions = this.treeMenuItems.map((node: any, index: number) => {
                return {
                    id: node.key.substring(1),
                    type: node.type,
                    position: index
                }
            })
        } else if (!dragNode) {
            positions = [...this.treeMenuItems.map((node: any, index: number) => {
                return {
                    id: node.key.substring(1),
                    type: node.type,
                    position: index
                }
            }), ...dropNode.children.map((node: any, index: number) => {
                return {
                    id: node.key.substring(1),
                    type: node.type,
                    position: index
                }
            })]
        } else if (!dropNode) {
            positions = [...dragNode.children.map((node: any, index: number) => {
                return {
                    id: node.key.substring(1),
                    type: node.type,
                    position: index
                }
            }), ...this.treeMenuItems.map((node: any, index: number) => {
                return {
                    id: node.key.substring(1),
                    type: node.type,
                    position: index
                }
            })]
        } else if (dragNode === dropNode) {
            positions = [...dragNode.children.map((node: any, index: number) => {
                return {
                    id: node.key.substring(1),
                    type: node.type,
                    position: index
                }
            })]
        }
        return positions;
    }

    loadOfGroup(event: any, callback = () => {}) {
        if (event.node.type !== 'group' || (event.node.children && event.node.children.length > 0)) {
            if (event.node.type === 'group') {
                this.loadingTreeState = LoadingState.READY
                callback()
            }
            return;
        }
        this.loadingTreeState = LoadingState.LOADING
        this.api.getWorksOfGroup(event.node.key.substring(1)).subscribe({
            next: works => {
                event.node.children = works
                if (works.length > 0) {
                    this.loadingTreeState = LoadingState.READY
                } else {
                    this.loadingTreeState = LoadingState.EMPTY
                }
                callback()
            },
            error: () => {
                this.loadingTreeState = LoadingState.ERROR
            }
        })
    }

    createWork() {
        if (!this.createWorkForm.valid) return;
        const formValue: any = this.createWorkForm.value;
        this.api.createPaidWork(formValue).subscribe({
            next: () => {
                this.createWorkDialogVisible = false;
            },
            error: () => {
            }
        })
    }

    updateWork() {
        if (!this.editingWorkId) return;
        if (!this.createWorkForm.valid) return;
        const formValue: any = this.createWorkForm.value;
        this.api.editPaidWork(this.editingWorkId, formValue).subscribe(() => {
            this.createWorkDialogVisible = false;
        })
    }

    selectNode(event: any) {
        if (event.node.type === 'group') {
            this.loadOfGroup(event, () => this.changeBreadcrumbs());
        } else {
            if (this.selectedNodeInTree?.key) this.loadWork(this.selectedNodeInTree.key)
        }
    }

    selectGroupInView(group: any) {
        setTimeout(() => {
            if (this.selectedNodeInTree && !this.selectedNodeInTree.leaf)
                this.selectedNodeInTree.expanded = true
            this.selectedNodeInTree = group
            if (this.selectedNodeInTree?.type === 'group') {
                this.loadOfGroup({node: group}, () => this.changeBreadcrumbs());
            } else {
                if (this.selectedNodeInTree?.key) this.loadWork(this.selectedNodeInTree.key)
            }
        }, 200)
    }

    loadWork(id: string) {
        this.loadingTreeState = LoadingState.READY
        this.workLoadingState = LoadingState.LOADING
        this.api.getPaidWorkById(parseInt(id.substring(1))).subscribe({
            next: work => {
                this.currentWork = work
                this.workLoadingState = LoadingState.READY
                this.changeBreadcrumbs()
            },
            error: () => {
                this.workLoadingState = LoadingState.ERROR
            }
        })
    }

    back() {
        this.loadingTreeState = LoadingState.READY
        if (this.selectedNodeInTree) this.selectedNodeInTree.expanded = false;
        this.selectedNodeInTree = this.selectedNodeInTree?.parent;
        this.changeBreadcrumbs()
    }

    deleteGroup() {
        if (!this.selectedNodeInTree?.key) return;
        this.editingGroupId = parseInt(this.selectedNodeInTree?.key.substring(1))
        this.confirmation.confirm({
            header:"Подтверждение",
            message:"Удалить группу работ? (Работы в группе удалены не будут)",
            accept: () => {
                if (!this.editingGroupId) return;
                this.api.deletePaidWorkGroup(this.editingGroupId).subscribe(() => {
                })
            }
        })
    }

    deleteWork(){
        if (!this.selectedNodeInTree?.key) return;
        this.editingWorkId = parseInt(this.selectedNodeInTree?.key.substring(1))
        this.confirmation.confirm({
            header:"Подтверждение",
            message:"Удалить работу?",
            accept: () => {
                if (!this.editingWorkId) return;
                this.api.deletePaidWork(this.editingWorkId).subscribe(() => {
                })
            }
        })
    }

    enterButtonPress() {
        if(this.createGroupDialogMode === 'create'){
            this.createGroup()
        }else if (this.createGroupDialogMode === 'edit'){
            this.updateGroup()
        }
    }
}
