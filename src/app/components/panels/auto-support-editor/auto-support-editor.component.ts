import {AfterViewInit, Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {ApiService} from "../../../services/api.service";
import {debounceTime, distinctUntilChanged, filter, fromEvent, map, shareReplay, Subscription} from "rxjs";
import {ConfirmationService, TreeNode} from "primeng/api";
import {
    Node,
    NodeEditorAction,
    NodeEditorOperation,
    NodeType,
    PredicateType,
    PreprocessorType
} from "../../../types/auto-support-types";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {v4} from "uuid";
import {OrganizationChart} from "primeng/organizationchart";
import {DraggingScroll} from "../../../util";

type ValuesToken = { name: string, token: string, type: 'INPUT' | 'PREPROCESSOR' }

enum EditorMode {
    SELECT,
    PICK_NODE
}

type PickTargetsType = 'parent' | 'child' | 'all';

@Component({
    selector: 'app-auto-support-editor',
    templateUrl: './auto-support-editor.component.html',
    styleUrls: ['./auto-support-editor.component.scss']
})
export class AutoSupportEditorComponent implements OnInit, OnDestroy, AfterViewInit {

    @ViewChild('graph') graph?: OrganizationChart;
    draggingController = new DraggingScroll();
    editorMode = EditorMode.SELECT;
    targetControlForPickNode: FormControl | null = null;
    autoSupportConfiguration$ = this.api.getAutoSupportNodes();
    nodeTypes$ = this.api.getAutoSupportTypes().pipe(shareReplay(1));
    preprocessorTypes$ = this.api.getAutoSupportPreprocessorTypes().pipe(shareReplay(1));
    predicateTypes$ = this.api.getAutoSupportPredicateTypes().pipe(shareReplay(1));
    preprocessorsOutputValuesMap: { [key: string]: string[] } = {};
    predicatesArgumentsMap: { [key: string]: string[] } = {};
    parentOptionsList: { label: string, value: string }[] = [];
    childOptionsList: { label: string, value: string }[] = [];
    valuesTokensList: ValuesToken[] = [];
    mainNodeVisual: TreeNode<Node> = {};
    mainNodeData: Node | null = null;
    selectedTreeNode: TreeNode<Node> | null = null;
    selectedNodeSettingsForm = new FormGroup({
        id: new FormControl<string>(""),
        name: new FormControl<string>("Нода"),
        type: new FormControl<NodeType>(NodeType.NORMAL),
        preprocessorTypes: new FormControl<PreprocessorType[]>([]),
        predicateType: new FormControl<PredicateType | null>(null, [Validators.required]),
        predicateArgumentsToTokensMap: new FormGroup({}, [Validators.required]),
        predicateRedirection: new FormGroup({
            1: new FormControl<string | null>(null),
            0: new FormControl<string | null>(null),
        }, [Validators.required]),
        redirectId: new FormControl<string | null>(null, [Validators.required]),
        messageTemplate: new FormControl<string | null>(null, [Validators.required]),
        ticketTitle: new FormControl<string | null>(null, [Validators.required]),
        ticketTemplate: new FormControl<string | null>(null, [Validators.required]),
        // parent: new FormControl<string | null>(null),
        // children: new FormControl<Node[] | null>([]),
    });
    selectedNodeSettingsFormChange$ = this.selectedNodeSettingsForm.valueChanges
        .pipe(debounceTime(300));
    selectedNodeTypeChange$ = this.selectedNodeSettingsForm.controls.type.valueChanges;
    selectedNodePredicateTypeChange$ = this.selectedNodeSettingsFormChange$
        .pipe(
            distinctUntilChanged((previous, current) => previous.predicateType === current.predicateType)
        );
    draggableNode: Node | null = null;
    dropDisabledNodes: { [key: string]: boolean } = {};
    pickNodeMask: string[] = [];
    leafStyle: { [key: string]: Partial<CSSStyleDeclaration> } = {
        "NORMAL": {
            backgroundColor: '#e8d7f8',
            color: '#725593',
            padding: '1rem',
            borderRadius: '.3rem',
        },
        "PREDICATE": {
            backgroundColor: '#f24822',
            color: '#fceae6',
            padding: '1rem',
            borderRadius: '.3rem',
        },
        "INPUT": {
            backgroundColor: '#385aef',
            color: '#c8d0f5',
            padding: '1rem',
            borderRadius: '.3rem',
        },
        "TRUNK": {
            backgroundColor: '#14ae5c',
            color: '#d3fae5',
            padding: '1rem',
            borderRadius: '.3rem',
        },
        "REDIRECT": {
            backgroundColor: '#c6e8b9',
            color: '#578347',
            padding: '1rem',
            borderRadius: '.3rem',
        },
        "TICKET": {
            backgroundColor: '#f37c32',
            color: '#ffe2d1',
            padding: '1rem',
            borderRadius: '.3rem',
        }
    }
    leafSelectedStyle: { [key: string]: Partial<CSSStyleDeclaration> } = {
        "NORMAL": {
            backgroundColor: '#c4a7e5',
            color: '#55317e',
            padding: '1rem',
            borderRadius: '.3rem',
        },
        "PREDICATE": {
            backgroundColor: '#d73815',
            color: '#fceae6',
            padding: '1rem',
            borderRadius: '.3rem',
        },
        "INPUT": {
            backgroundColor: '#2949d5',
            color: '#c8d0f5',
            padding: '1rem',
            borderRadius: '.3rem',
        },
        "TRUNK": {
            backgroundColor: '#0c944c',
            color: '#d3fae5',
            padding: '1rem',
            borderRadius: '.3rem',
        },
        "REDIRECT": {
            backgroundColor: '#a4d591',
            color: '#578347',
            padding: '1rem',
            borderRadius: '.3rem',
        },
        "TICKET": {
            backgroundColor: '#e06214',
            color: '#ffe2d1',
            padding: '1rem',
            borderRadius: '.3rem',
        }
    }
    icon = {
        "NORMAL": "mdi-mail_outline",
        "PREDICATE": "mdi-alt_route",
        "INPUT": "mdi-edit_note",
        "TRUNK": "mdi-south",
        "REDIRECT": "mdi-move_up",
        "TICKET": "mdi-task"
    }
    actionsCache: NodeEditorAction[] = [];
    actionPointer = 0;
    isAllValid = false;
    isLoading = true;
    isSaving = false;
    protected readonly NodeType = NodeType;
    protected readonly Object = Object;
    protected readonly EditorMode = EditorMode;
    private autoSupportLoadSub?: Subscription;
    private modifyNodeSub?: Subscription;
    private changePredicateTypeSub?: Subscription;
    private undoRedoNodeSub?: Subscription;
    private preventDefaultUndoSub?: Subscription;
    private changeNodeTypeSub?: Subscription;
    private escapeSub?: Subscription;

    constructor(private api: ApiService, private confirmationService: ConfirmationService) {
    }

    ngOnInit(): void {
        this.loadAutoSupportConfiguration();
        this.subscribeToNodeFormChanges();
        this.loadMetadata();
        this.initShortcuts();
    }

    ngOnDestroy(): void {
        this.autoSupportLoadSub?.unsubscribe();
        this.modifyNodeSub?.unsubscribe();
        this.changeNodeTypeSub?.unsubscribe();
        this.changePredicateTypeSub?.unsubscribe();
        this.undoRedoNodeSub?.unsubscribe();
        this.preventDefaultUndoSub?.unsubscribe();
        this.escapeSub?.unsubscribe();
        this.draggingController.destroy();
    }

    ngAfterViewInit() {
        const rootScrollElement: HTMLDivElement = this.graph?.el.nativeElement.children[0];
        this.draggingController.appoint(rootScrollElement);
    }

    handleNodeSelect(node: TreeNode<Node>) {
        switch (this.editorMode) {
            case EditorMode.SELECT:
                this.selectedTreeNode = node;
                this.doSelectNode(node.data!);
                break;
            case EditorMode.PICK_NODE:
                this.doPickNode(node.data!);
                break;
        }
    }

    handleNodeUnselect(node: TreeNode<Node>) {
        if (this.editorMode === EditorMode.SELECT) {
            this.selectedTreeNode = null;
        }
    }

    isRootNode(node?: Node) {
        return node && !node.parent;
    }

    isShowFormControl(nodeTypes: NodeType[], currentNodeType?: NodeType | null) {
        if (!currentNodeType) return false;
        return nodeTypes.includes(currentNodeType);
    }

    createRootNode() {
        this.mainNodeData = this.createDefaultNode(null);
        this.renderVisual("createRootNode");
        this.selectedTreeNode = this.mainNodeVisual;
    }

    addSubNode() {
        if (!this.selectedTreeNode || !this.mainNodeData) return;
        const targetNode = this.selectedTreeNode.data;
        if (!targetNode) return;
        const createdNode = this.createDefaultNode(targetNode);
        if (!targetNode.children) targetNode.children = [];
        targetNode.children.push(createdNode);
        this.selectedTreeNode.expanded = true;
        const selectedNodeKey = this.selectedTreeNode.key;
        this.renderVisual("addSubNode");
        if (!selectedNodeKey) return;
        this.selectedTreeNode = this.findVisualNode(selectedNodeKey, this.mainNodeVisual);

        this.appendAction('APPEND_NODE', null, createdNode);

        this.isAllValid = true;
        this.checkNodeValidity(this.mainNodeData);
    }

    removeNode() {
        this.confirmationService.confirm({
            header: 'Удалить ноду?',
            message: 'Также удалятся все дочерние ноды',
            accept: () => {
                this.handleRemoveNode();
            }
        })
    }

    startDragNode(node: Node) {
        this.draggingController.preventScrolling();
        setTimeout(() => {
            if (!this.mainNodeData) return;
            this.draggableNode = node;
            this.sameOrDescendantNodeCheck(this.mainNodeData)
        });
    }

    handleDropNode(currentParent: Node) {
        if (!this.draggableNode || !this.mainNodeData) return;

        const draggableNode = this.draggableNode;
        const mainNodeData = this.mainNodeData;

        const previousParent = this.findParentNode(draggableNode, mainNodeData);

        if (!previousParent?.children) return;
        previousParent.children.splice(previousParent.children.indexOf(draggableNode), 1);
        if (!currentParent.children) currentParent.children = [];
        currentParent.children.push(draggableNode);
        const previousData = JSON.parse(JSON.stringify(draggableNode));
        draggableNode.parent = currentParent.id;
        this.renderVisual("handleDropNode");
        this.dropDisabledNodes = {};

        this.appendAction('MOVE_NODE', previousData, draggableNode);
    }

    endDragNode(node: any) {
        this.draggableNode = null;
        this.dropDisabledNodes = {};
    }

    findParentNode(node: Node, root: Node | null): Node | null {
        if (!root) return null;
        if (node.parent === null) return null;
        if (node.parent === root.id) return root;
        const children = root.children;
        if (children && children.length > 0) {
            for (const child of children) {
                if (child.id === node.parent) {
                    return child;
                }
                const result = this.findParentNode(node, child);
                if (result) return result;
            }
        }
        return null;
    }

    findNode(id: string, root: Node | null): Node | null {
        if (!root) return null;
        if (root.id === id) return root;
        if (root.children && root.children.length > 0) {
            for (const child of root.children) {
                const result = this.findNode(id, child);
                if (result) return result;
            }
        }
        return null;
    }

    findVisualNode(id: string, root: TreeNode | null): TreeNode | null {
        if (!root) return null;
        if (root.key === id) return root;
        if (root.children && root.children.length > 0) {
            for (const child of root.children) {
                const result = this.findVisualNode(id, child);
                if (result) return result;
            }
        }
        return null;
    }

    sameOrDescendantNodeCheck(node: Node, isDescendant: boolean = false) {
        if (!this.draggableNode) return;
        let isSameOrDescendant = isDescendant || this.draggableNode.id === node.id;
        let isChildLimitExceeded = false;
        switch (node.type) {
            case NodeType.TRUNK:
            case NodeType.INPUT:
                isChildLimitExceeded = node.children?.length === 1;
                break;
            case NodeType.PREDICATE:
                isChildLimitExceeded = node.children?.length === 2;
                break;
            case NodeType.REDIRECT:
                isChildLimitExceeded = true;
                break;
            case NodeType.TICKET:
                isChildLimitExceeded = true;
                break;
        }

        this.dropDisabledNodes[node.id] = isSameOrDescendant || isChildLimitExceeded;
        if (node.children && node.children.length > 0) {
            for (const child of node.children) {
                this.sameOrDescendantNodeCheck(child, isSameOrDescendant);
            }
        }
    }

    renderVisual(type: string) {
        if (!this.mainNodeData) return;
        const expandedMap = this.getExpandedMap(this.mainNodeVisual);
        this.mainNodeVisual = this.convertNodeToTreeNode(this.mainNodeData, expandedMap);
    }

    getExpandedMap(root: TreeNode | null, currentMap: { [key: string]: boolean } = {}): { [key: string]: boolean } {
        if (!root?.key) return currentMap;
        currentMap[root.key] = root.expanded ?? false;
        if (root.children && root.children.length > 0) {
            for (const child of root.children) {
                this.getExpandedMap(child, currentMap);
            }
        }
        return currentMap;
    }

    saveToServer() {
        if (!this.mainNodeData) return;
        this.isSaving = true;
        this.selectedTreeNode = null;
        this.api.setAutoSupportNodes({defaultNodes: this.mainNodeData}).subscribe({
            next: () => this.isSaving = false,
            error: () => this.isSaving = false,
        });
    }

    toNode(value: any) {
        return value as Node
    }

    isShowAddSubNodeButton(data: Node | undefined) {
        if (!data) return false;
        switch (data.type) {
            case NodeType.TRUNK:
                return (data.children?.length ?? 0) < 1;
            case NodeType.PREDICATE:
                return (data.children?.length ?? 0) < 2;
            case NodeType.INPUT:
                return (data.children?.length ?? 0) < 1;
            case NodeType.REDIRECT:
            case NodeType.TICKET:
                return false;
            case NodeType.NORMAL:
                return true;
        }
    }

    appendValueTokenToMessageTemplate(token: ValuesToken, control: FormControl<string>) {
        let messageTemplateValue = control?.value;
        if (!messageTemplateValue) messageTemplateValue = '';
        control.setValue(`${messageTemplateValue} {${token.token}}`);
    }

    hasPreviousAction() {
        return this.actionPointer > 0;
    }

    hasNextAction() {
        return this.actionPointer < this.actionsCache.length;
    }

    undo() {
        if (!this.hasPreviousAction()) return;
        this.actionPointer--;
        const action = this.actionsCache[this.actionPointer];
        let previousParent: Node | null = null;
        let nextParent: Node | null = null;
        let foundNode: Node | null = null;
        switch (action.operation) {
            case "APPEND_NODE":
                if (!action.newState) return;
                previousParent = this.findParentNode(action.newState, this.mainNodeData);
                foundNode = this.findNode(action.newState.id, previousParent);
                if (!previousParent?.children || !foundNode) return;
                previousParent.children.splice(previousParent.children.indexOf(foundNode), 1);
                break;
            case "REMOVE_NODE":
                if (!action.previousState) return;
                previousParent = this.findParentNode(action.previousState, this.mainNodeData);
                if (!previousParent?.children) return;
                previousParent.children.push(action.previousState);
                break;
            case "CHANGE_NODE":
                if (!action.previousState) return;
                foundNode = this.findNode(action.previousState.id, this.mainNodeData);
                if (!foundNode) return;
                foundNode.name = action.previousState.name;
                foundNode.type = action.previousState.type;
                foundNode.predicateType = action.previousState.predicateType;
                foundNode.predicateRedirection = action.previousState.predicateRedirection;
                foundNode.predicateArgumentsToTokensMap = action.previousState.predicateArgumentsToTokensMap;
                foundNode.preprocessorTypes = action.previousState.preprocessorTypes;
                foundNode.redirectId = action.previousState.redirectId;
                foundNode.messageTemplate = action.previousState.messageTemplate;
                foundNode.ticketTitle = action.previousState.ticketTitle;
                foundNode.ticketTemplate = action.previousState.ticketTemplate;
                foundNode.isValid = action.previousState.isValid;
                this.updateSelectedNodeForm(foundNode);
                break;
            case "MOVE_NODE":
                if (!action.previousState || !action.newState) return;
                nextParent = this.findParentNode(action.newState, this.mainNodeData);
                foundNode = this.findNode(action.newState.id, nextParent);
                previousParent = this.findParentNode(action.previousState, this.mainNodeData);
                if (!previousParent?.children || !nextParent?.children || !foundNode) return;
                nextParent.children.splice(nextParent.children.indexOf(foundNode), 1);
                previousParent.children.push(foundNode);
                break;
        }
        this.renderVisual("Undo");
    }

    redo() {
        if (!this.hasNextAction()) return;
        this.actionPointer++;
        const action = this.actionsCache[this.actionPointer - 1];
        let previousParent: Node | null = null;
        let nextParent: Node | null = null;
        let foundNode: Node | null = null;

        switch (action.operation) {
            case "APPEND_NODE":
                if (!action.newState) return;
                previousParent = this.findParentNode(action.newState, this.mainNodeData);
                if (!previousParent?.children) return;
                previousParent.children.push(action.newState);
                break;
            case "REMOVE_NODE":
                if (!action.previousState) return;
                previousParent = this.findParentNode(action.previousState, this.mainNodeData);
                foundNode = this.findNode(action.previousState.id, previousParent);
                if (!previousParent?.children || !foundNode) return;
                previousParent.children.splice(previousParent.children.indexOf(foundNode), 1);
                break;
            case "CHANGE_NODE":
                if (!action.newState) return;
                foundNode = this.findNode(action.newState.id, this.mainNodeData);
                if (!foundNode) return;
                foundNode.name = action.newState.name;
                foundNode.type = action.newState.type;
                foundNode.predicateType = action.newState.predicateType;
                foundNode.predicateRedirection = action.newState.predicateRedirection;
                foundNode.predicateArgumentsToTokensMap = action.newState.predicateArgumentsToTokensMap;
                foundNode.preprocessorTypes = action.newState.preprocessorTypes;
                foundNode.redirectId = action.newState.redirectId;
                foundNode.messageTemplate = action.newState.messageTemplate;
                foundNode.ticketTitle = action.newState.ticketTitle;
                foundNode.ticketTemplate = action.newState.ticketTemplate;
                foundNode.isValid = action.newState.isValid;
                this.updateSelectedNodeForm(foundNode);
                break;
            case "MOVE_NODE":
                if (!action.previousState || !action.newState) return;
                previousParent = this.findParentNode(action.previousState, this.mainNodeData);
                foundNode = this.findNode(action.newState.id, previousParent);
                nextParent = this.findParentNode(action.newState, this.mainNodeData);
                if (!previousParent?.children || !nextParent?.children || !foundNode) return;
                previousParent.children.splice(nextParent.children.indexOf(foundNode), 1);
                nextParent.children.push(foundNode);
                break;
        }
        this.renderVisual("Redo");
    }

    foldAll() {
        this.setExpandedRecursively(this.mainNodeVisual, false);
        this.renderVisual("Fold All");
    }

    unfoldAll() {
        this.setExpandedRecursively(this.mainNodeVisual, true);
        this.renderVisual("Unfold All");
    }

    changeToSelectMode() {
        this.editorMode = EditorMode.SELECT;
        this.pickNodeMask = [];
    }

    changeToPickMode(control: FormControl, targets: PickTargetsType = 'all') {
        this.editorMode = EditorMode.PICK_NODE;
        this.targetControlForPickNode = control;
        if (this.selectedTreeNode?.data)
            this.setupNodePickMask(this.selectedTreeNode.data, targets);
    }

    findNodeNameById(value: string): string | null {
        return this.findNode(value, this.mainNodeData)?.name ?? null;
    }

    isShadedNode(node: Node) {
        return (this.dropDisabledNodes[node.id] || (this.editorMode === EditorMode.PICK_NODE && !this.pickNodeMask.includes(node.id)))
    }

    private doSelectNode(node: Node) {
        if (node.predicateType) {
            this.setPredicateArgumentsControls(node.predicateType);
        }
        this.selectedNodeSettingsForm.patchValue({
            id: node.id,
            name: node.name,
            type: node.type,
            preprocessorTypes: node.preprocessorTypes,
            predicateType: node.predicateType,
            predicateRedirection: node.predicateRedirection ?? undefined,
            predicateArgumentsToTokensMap: node.predicateArgumentsToTokensMap ?? undefined,
            redirectId: node.redirectId,
            messageTemplate: node.messageTemplate,
            ticketTitle: node.ticketTitle,
            ticketTemplate: node.ticketTemplate,
            // parent: node.parent,
            // children: node.children,
        }, {emitEvent: false});
        this.parentOptionsList = this.getParentOptionsList(node);
        this.childOptionsList = this.getChildOptionsList(node);
        this.valuesTokensList = this.getValuesTokens(node);
    }

    private doPickNode(node: Node) {
        if (!this.pickNodeMask.includes(node.id)) return;
        this.targetControlForPickNode?.setValue(node.id);
        this.changeToSelectMode();
    }

    private setExpandedRecursively(visualNode: TreeNode | null, expanded: boolean) {
        if (!visualNode) return;
        visualNode.expanded = expanded;
        if (!visualNode.children) return;
        for (const child of visualNode.children) {
            this.setExpandedRecursively(child, expanded);
        }
    }

    private updateSelectedNodeForm(node: Node | null) {
        if (!this.selectedTreeNode?.data || !node) return;
        const selectedNode = this.selectedTreeNode.data;
        if (selectedNode.id !== node.id) return;
        this.handleNodeSelect(this.selectedTreeNode);
    }

    private getChildOptionsList(node: Node | null) {
        const children = node?.children;
        if (!children) return [];
        return children.map(child => ({label: child.name, value: child.id}));
    }

    private getParentOptionsList(node: Node | null) {
        const optionsList: { label: string, value: string }[] = [];
        if (!node) return optionsList;
        let currentNode = this.findParentNode(node, this.mainNodeData);
        while (currentNode) {
            optionsList.push({label: currentNode.name, value: currentNode.id});
            if (!currentNode.parent) break;
            currentNode = this.findParentNode(currentNode, this.mainNodeData);
        }
        return optionsList;
    }

    private setupNodePickMask(targetNode: Node, targets: PickTargetsType) {
        if (targets === 'child') {
            this.pickNodeMask = this.getChildNodeIds(targetNode);
        } else if (targets === 'parent') {
            this.pickNodeMask = this.getRecursiveParentNodeIds(targetNode);
        } else {
            this.pickNodeMask = [];
        }
    }

    private getChildNodeIds(node: Node | null, ids: string[] = []): string[] {
        if (!node) return ids;
        if (node.children) {
            ids = node.children.map(child => child.id);
        }
        return ids;
    }

    private getRecursiveParentNodeIds(node: Node | null, ids: string[] = []): string[] {
        if (!node) return ids;
        ids.push(node.id);
        if (node.parent) {
            const parentNode = this.findParentNode(node, this.mainNodeData);
            ids = this.getRecursiveParentNodeIds(parentNode, ids);
        }
        return ids;
    }

    private getValuesTokens(node: Node | null): ValuesToken[] {
        let isFirst = true;
        const valuesTokens: ValuesToken[] = [];
        while (node) {
            if (node.type === NodeType.INPUT) {
                if (!isFirst) valuesTokens.push({name: node.name, token: `INPUT:${node.id}`, type: 'INPUT'});
                if (node.preprocessorTypes && node.preprocessorTypes.length > 0) {
                    for (const type of node.preprocessorTypes) {
                        const valuesMapElements = this.preprocessorsOutputValuesMap[type];
                        for (const valuesMapElement of valuesMapElements) {
                            valuesTokens.push({
                                name: `${node.name} - ${valuesMapElement}`,
                                token: `PREPROCESSOR:${node.id}:${valuesMapElement}`,
                                type: 'PREPROCESSOR'
                            })
                        }
                    }
                }
            } else if (node.type === NodeType.NORMAL) {
                if (node.preprocessorTypes && node.preprocessorTypes.length > 0) {
                    for (const type of node.preprocessorTypes) {
                        const valuesMapElements = this.preprocessorsOutputValuesMap[type];
                        for (const valuesMapElement of valuesMapElements) {
                            valuesTokens.push({
                                name: `${node.name} - ${valuesMapElement}`,
                                token: `PREPROCESSOR:${node.id}:${valuesMapElement}`,
                                type: 'PREPROCESSOR'
                            })
                        }
                    }
                }
            }
            node = this.findParentNode(node, this.mainNodeData);
            isFirst = false;
        }
        return valuesTokens;
    }

    private createDefaultNode(targetNode: Node | null) {
        return {
            id: v4(),
            name: "Новая нода",
            type: NodeType.NORMAL,
            preprocessorTypes: [],
            predicateType: null,
            predicateRedirection: null,
            predicateArgumentsToTokensMap: null,
            redirectId: null,
            messageTemplate: null,
            ticketTitle: null,
            ticketTemplate: null,
            parent: targetNode?.id ?? null,
            children: [],
            isValid: false
        }
    }

    private convertNodeToTreeNode(node: Node, expandedMap: { [key: string]: boolean } = {}) {
        const treeNode: TreeNode = {};
        treeNode.label = node.name;
        treeNode.key = node.id;
        treeNode.data = node;
        treeNode.expanded = expandedMap[node.id] ?? false;
        if (node.children) {
            treeNode.children = [];
            for (const child of node.children) {
                treeNode.children.push(this.convertNodeToTreeNode(child, expandedMap));
            }
        }
        return treeNode;
    }

    private loadAutoSupportConfiguration() {
        this.isLoading = true;
        this.autoSupportLoadSub = this.autoSupportConfiguration$.subscribe(data => {
            this.mainNodeData = data.defaultNodes;
            this.isAllValid = true;
            this.checkNodeValidity(this.mainNodeData);
            this.renderVisual("loadAutoSupportConfiguration");
            this.isLoading = false;
        });
    }

    private subscribeToNodeFormChanges() {
        this.modifyNodeSub = this.selectedNodeSettingsFormChange$
            .subscribe(data => this.handleModifyNode(data as Partial<Node>))
        this.changeNodeTypeSub = this.selectedNodeTypeChange$
            .subscribe(data => this.handleChangeNodeType(data as Partial<Node>))
        this.changePredicateTypeSub = this.selectedNodePredicateTypeChange$
            .subscribe(data => this.handleChangePredicateType(data as Partial<Node>))
    }

    private loadMetadata() {
        this.api.getAutoSupportPreprocessorsOutputValues().subscribe(values => this.preprocessorsOutputValuesMap = values);
        this.api.getAutoSupportPredicatesArguments().subscribe(data => this.predicatesArgumentsMap = data);
    }

    private initShortcuts() {
        this.preventDefaultUndoSub = fromEvent<KeyboardEvent>(window, 'keydown')
            .pipe(filter(event => {
                return (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z';

            })).subscribe((event) => {
                event.preventDefault();
            });

        this.undoRedoNodeSub = fromEvent<KeyboardEvent>(document.body, 'keyup')
            .pipe(
                debounceTime(100),
                filter((event) => {
                    return event.key.toLowerCase() === 'z' && ((event.shiftKey && event.ctrlKey) || event.ctrlKey)
                }),
                map((event) => {
                    return event.shiftKey ? 'redo' : 'undo'
                })
            ).subscribe((action) => {
                if (action === 'redo') {
                    this.redo();
                } else if (action === 'undo') {
                    this.undo();
                }
            });

        this.escapeSub = fromEvent<KeyboardEvent>(document.body, 'keyup')
            .pipe(
                filter(event => (event.key.toLowerCase() === 'escape'))
            ).subscribe(() => this.handleEscape())
    }

    private handleModifyNode(modifyData: Partial<Node>) {
        if (!this.selectedTreeNode || !this.mainNodeData) return;
        const node = this.selectedTreeNode.data;
        if (!node) return;

        const previousData = JSON.parse(JSON.stringify(node));

        node.name = modifyData.name ?? "";
        node.type = modifyData.type ?? NodeType.NORMAL;
        node.preprocessorTypes = modifyData.preprocessorTypes ?? null;
        node.predicateType = modifyData.predicateType ?? null;
        node.predicateRedirection = modifyData.predicateRedirection ?? null;
        node.predicateArgumentsToTokensMap = modifyData.predicateArgumentsToTokensMap ?? null;
        node.redirectId = modifyData.redirectId ?? null;
        node.messageTemplate = modifyData.messageTemplate ?? null;
        node.ticketTitle = modifyData.ticketTitle ?? null;
        node.ticketTemplate = modifyData.ticketTemplate ?? null;

        const currentData = JSON.parse(JSON.stringify(node));

        this.isAllValid = true;
        this.checkNodeValidity(this.mainNodeData);

        this.appendAction("CHANGE_NODE", previousData, currentData);
    }

    private handleChangeNodeType(nodeForm: Partial<Node>) {
        if (!this.selectedTreeNode || !this.mainNodeData) return;
        const node = this.selectedTreeNode.data;
        if (!node) return;

        switch (nodeForm.type) {
            case NodeType.TRUNK:
                node.preprocessorTypes = [];
                node.predicateType = null;
                node.predicateRedirection = null;
                node.predicateArgumentsToTokensMap = null;
                node.messageTemplate = null;
                node.ticketTemplate = null;
                node.ticketTitle = null;
                node.redirectId = null;
                if (!node.children) node.children = [];
                node.children = node.children.slice(0, 1);
                break;
            case NodeType.REDIRECT:
                node.preprocessorTypes = [];
                node.predicateType = null;
                node.predicateRedirection = null;
                node.predicateArgumentsToTokensMap = null;
                node.messageTemplate = null;
                node.ticketTemplate = null;
                node.ticketTitle = null;
                node.children = [];
                break;
            case NodeType.PREDICATE:
                node.preprocessorTypes = [];
                node.messageTemplate = null;
                node.redirectId = null;
                // node.predicateArgumentsToTokensMap = {};
                node.ticketTemplate = null;
                node.ticketTitle = null;
                if (!node.children) node.children = [];
                node.children = node.children.slice(0, 2);
                break;
            case NodeType.INPUT:
                node.predicateType = null;
                node.predicateRedirection = null;
                node.redirectId = null;
                node.predicateArgumentsToTokensMap = null;
                node.ticketTemplate = null;
                node.ticketTitle = null;
                if (!node.children) node.children = [];
                node.children = node.children.slice(0, 1);
                break;
            case NodeType.TICKET:
                node.predicateType = null;
                node.predicateRedirection = null;
                node.redirectId = null;
                node.predicateArgumentsToTokensMap = null;
                node.preprocessorTypes = [];
                node.children = [];
                break;
            case NodeType.NORMAL:
                node.predicateType = null;
                node.predicateRedirection = null;
                node.redirectId = null;
                node.predicateArgumentsToTokensMap = null;
                node.ticketTemplate = null;
                node.ticketTitle = null;
                break;
        }

        this.renderVisual("handleChangeNodeType");
        // this.handleNodeSelect(node);
    }

    private handleChangePredicateType(data: Partial<Node>) {
        if (!this.selectedTreeNode || !this.mainNodeData) return;
        const node = this.selectedTreeNode.data;
        const type = data.predicateType;
        if (!node || !type) return;
        this.setPredicateArgumentsControls(type);
    }

    private setPredicateArgumentsControls(type: string) {
        this.selectedNodeSettingsForm.setControl("predicateArgumentsToTokensMap", new FormGroup({}), {emitEvent: false})
        const args = this.predicatesArgumentsMap[type];
        if (!args) return;
        for (const arg of args)
            this.selectedNodeSettingsForm.controls.predicateArgumentsToTokensMap.addControl(arg, new FormControl(null), {emitEvent: false});
    }

    private handleRemoveNode() {
        if (!this.selectedTreeNode || !this.mainNodeData) return;
        const targetNode = this.selectedTreeNode.data;
        if (!targetNode) return;
        const parentNode = this.findParentNode(targetNode, this.mainNodeData);
        if (!parentNode) return;
        const index = parentNode.children?.indexOf(targetNode) ?? -1;
        if (index >= 0) {
            parentNode.children?.splice(index, 1);
        }
        this.selectedTreeNode = null;
        this.renderVisual("handleRemoveNode");

        this.appendAction('REMOVE_NODE', targetNode, null);
    }

    private checkNodeValidity(node: Node): void {
        if (!node) return;
        switch (node.type) {
            case NodeType.NORMAL:
            case NodeType.INPUT:
                this.isAllValid = this.validateNormalNode(node) && this.isAllValid;
                break;
            case NodeType.TRUNK:
                node.isValid = true;
                break;
            case NodeType.REDIRECT:
                this.isAllValid = this.validateRedirectNode(node) && this.isAllValid;
                break;
            case NodeType.PREDICATE:
                this.isAllValid = this.validatePredicateNode(node) && this.isAllValid;
                break;
            case NodeType.TICKET:
                node.isValid = this.validateTicketNode(node) && this.isAllValid;
                break;
        }
        if (!node.children) return;
        for (const child of node.children) {
            this.checkNodeValidity(child);
        }
    }

    private validateNormalNode(node: Node): boolean {
        if (!node) return false;
        node.isValid = !!node.messageTemplate && node.messageTemplate.trim().length > 0;
        return node.isValid;
    }

    private validateTicketNode(node: Node): boolean {
        if (!node) return false;
        const messageTemplateValid = !!node.messageTemplate && node.messageTemplate.trim().length > 0;
        const ticketTemplateValid = !!node.ticketTemplate && node.ticketTemplate.trim().length > 0;
        const ticketTitleValid = !!node.ticketTitle && node.ticketTitle.trim().length > 0;
        node.isValid = messageTemplateValid && ticketTemplateValid && ticketTitleValid;
        return node.isValid;
    }

    private validateRedirectNode(node: Node): boolean {
        if (!node) return false;
        return node.isValid = !!node.redirectId;
    }

    private validatePredicateNode(node: Node): boolean {
        if (!node) return false;
        let predicateTypeValid = false;
        let predicateArgumentsValid = false;
        let predicateRedirectionValid = false;

        if (node.predicateType) {
            predicateTypeValid = true;
        }

        if (node.predicateArgumentsToTokensMap) {
            const values = Object.values(node.predicateArgumentsToTokensMap);
            console.log(values)
            predicateArgumentsValid = values.reduce((acc, val) => acc && !!val, true);
        }

        if (node.predicateRedirection) {
            predicateRedirectionValid = !!node.predicateRedirection[0] && !!node.predicateRedirection[1];
        }

        node.isValid = predicateTypeValid && predicateArgumentsValid && predicateRedirectionValid;

        return node.isValid;
    }

    private appendAction(operation: NodeEditorOperation, previousState: Node | null, newState: Node | null): void {
        if (this.actionPointer < this.actionsCache.length) {
            this.actionsCache.splice(this.actionPointer, this.actionsCache.length - this.actionPointer);
        }
        this.actionsCache.push({operation, previousState, newState});
        this.actionPointer = this.actionsCache.length;
        if (this.actionsCache.length > 250) {
            this.actionsCache.shift(); // remove first element from cache
        }
    }

    private handleEscape() {
        if (this.editorMode !== EditorMode.SELECT) {
            this.changeToSelectMode();
        }
    }
}
