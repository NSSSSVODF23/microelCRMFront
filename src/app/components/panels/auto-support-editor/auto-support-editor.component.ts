import {AfterViewInit, Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {ApiService} from "../../../services/api.service";
import {debounceTime, distinctUntilChanged, shareReplay, Subscription} from "rxjs";
import {ConfirmationService, TreeNode} from "primeng/api";
import {Node, NodeType, PredicateType, PreprocessorType} from "../../../types/auto-support-types";
import {FormControl, FormGroup} from "@angular/forms";
import {v4} from "uuid";
import {OrganizationChart} from "primeng/organizationchart";
import {DraggingScroll} from "../../../util";

type ValuesToken = { name: string, token: string, type: 'INPUT' | 'PREPROCESSOR' }

@Component({
    selector: 'app-auto-support-editor',
    templateUrl: './auto-support-editor.component.html',
    styleUrls: ['./auto-support-editor.component.scss']
})
export class AutoSupportEditorComponent implements OnInit, OnDestroy, AfterViewInit {

    NodeType = NodeType;

    @ViewChild('graph') graph?: OrganizationChart;
    draggingController = new DraggingScroll();

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
        predicateType: new FormControl<PredicateType | null>(null),
        predicateArgumentsToTokensMap: new FormGroup({}),
        predicateRedirection: new FormGroup({
            1: new FormControl<string | null>(null),
            0: new FormControl<string | null>(null),
        }),
        redirectId: new FormControl<string | null>(null),
        messageTemplate: new FormControl<string | null>(null),
        parent: new FormControl<string | null>(null),
        children: new FormControl<Node[] | null>([]),
    });
    selectedNodeSettingsFormChange$ = this.selectedNodeSettingsForm.valueChanges
        .pipe(debounceTime(300));
    selectedNodeTypeChange$ = this.selectedNodeSettingsFormChange$
        .pipe(
            distinctUntilChanged((previous, current) => previous.type === current.type)
        );
    selectedNodePredicateTypeChange$ = this.selectedNodeSettingsFormChange$
        .pipe(
            distinctUntilChanged((previous, current) => previous.predicateType === current.predicateType)
        );

    autoSupportLoadSub?: Subscription;
    modifyNodeSub?: Subscription;
    changePredicateTypeSub?: Subscription;

    changeNodeTypeSub?: Subscription;
    draggableNode: Node | null = null;

    dropDisabledNodes: { [key: string]: boolean } = {};
    leafStyle: { [key: string]: Partial<CSSStyleDeclaration> } = {
        "NORMAL": {
            backgroundColor: '#e4ccff',
            color: '#341359',
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
        }
    }
    leafSelectedStyle: { [key: string]: Partial<CSSStyleDeclaration> } = {
        "NORMAL": {
            backgroundColor: '#c4a7e5',
            color: '#341359',
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
        }
    }

    icon = {
        "NORMAL": "mdi-mail_outline",
        "PREDICATE": "mdi-alt_route",
        "INPUT": "mdi-edit_note",
        "TRUNK": "mdi-south",
        "REDIRECT": "mdi-move_up"
    }
    isSaving = false;
    protected readonly Object = Object;

    constructor(private api: ApiService, private confirmationService: ConfirmationService) {
    }

    ngOnInit(): void {
        this.loadAutoSupportConfiguration();
        this.modifyNodeSub = this.selectedNodeSettingsFormChange$
            .subscribe(data => this.handleModifyNode(data as Partial<Node>))
        this.changeNodeTypeSub = this.selectedNodeTypeChange$
            .subscribe(data => this.handleChangeNodeType(data as Partial<Node>))
        this.changePredicateTypeSub = this.selectedNodePredicateTypeChange$
            .subscribe(data => this.handleChangePredicateType(data as Partial<Node>))
        this.api.getAutoSupportPreprocessorsOutputValues().subscribe(values => this.preprocessorsOutputValuesMap = values);
        this.api.getAutoSupportPredicatesArguments().subscribe(data => this.predicatesArgumentsMap = data);
    }

    ngOnDestroy(): void {
        this.autoSupportLoadSub?.unsubscribe();
        this.modifyNodeSub?.unsubscribe();
        this.draggingController.destroy();
    }

    ngAfterViewInit() {
        const rootScrollElement: HTMLDivElement = this.graph?.el.nativeElement.children[0];
        this.draggingController.appoint(rootScrollElement);
    }

    handleNodeSelect(node: Node) {
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
            parent: node.parent,
            children: node.children,
        }, {emitEvent: false});
        this.parentOptionsList = this.getParentOptionsList(node);
        this.childOptionsList = this.getChildOptionsList(node);
        this.valuesTokensList = this.getValuesTokens(node);
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
        this.renderVisual();
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
        this.renderVisual();
        if (!selectedNodeKey) return;
        this.selectedTreeNode = this.findVisualNode(selectedNodeKey, this.mainNodeVisual);
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

        console.log("Draggable", draggableNode);

        const previousParent = this.findParentNode(draggableNode, mainNodeData);

        console.log("previousParent", previousParent);

        if (!previousParent?.children) return;
        previousParent.children.splice(previousParent.children.indexOf(draggableNode), 1);
        if (!currentParent.children) currentParent.children = [];
        currentParent.children.push(draggableNode);
        draggableNode.parent = currentParent.id;
        this.renderVisual();
        this.dropDisabledNodes = {};
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
        }

        this.dropDisabledNodes[node.id] = isSameOrDescendant || isChildLimitExceeded;
        if (node.children && node.children.length > 0) {
            for (const child of node.children) {
                this.sameOrDescendantNodeCheck(child, isSameOrDescendant);
            }
        }
    }

    renderVisual() {
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

    getAvailableValues(preprocessorTypes?: PreprocessorType[] | null) {
        if (!preprocessorTypes) return [];
        return preprocessorTypes.map(type => {
            return this.preprocessorsOutputValuesMap[type] ?? [];
        }).flatMap(values => values);
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
                return false;
            case NodeType.NORMAL:
                return true;
        }
    }

    appendValueTokenToMessageTemplate(token: ValuesToken) {
        const messageTemplateProperty = this.selectedNodeSettingsForm.controls.messageTemplate;
        if (!messageTemplateProperty) return;
        let messageTemplateValue = messageTemplateProperty?.value;
        if (!messageTemplateValue) messageTemplateValue = '';
        messageTemplateProperty.setValue(`${messageTemplateValue} {${token.token}}`);
    }

    getPredicateArgumentsList(node: Node | null) {
        if (!this.predicatesArgumentsMap || !node?.predicateType) return [];
        return this.predicatesArgumentsMap[node.predicateType];
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
            parent: targetNode?.id ?? null,
            children: [],
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
        this.autoSupportLoadSub = this.autoSupportConfiguration$.subscribe(data => {
            this.mainNodeData = data.defaultNodes;
            this.renderVisual();
        });
    }

    private handleModifyNode(modifyData: Partial<Node>) {
        if (!this.selectedTreeNode || !this.mainNodeData) return;
        const node = this.selectedTreeNode.data;
        if (!node) return;

        node.name = modifyData.name ?? "";
        node.type = modifyData.type ?? NodeType.NORMAL;
        node.preprocessorTypes = modifyData.preprocessorTypes ?? null;
        node.predicateType = modifyData.predicateType ?? null;
        node.predicateRedirection = modifyData.predicateRedirection ?? null;
        node.predicateArgumentsToTokensMap = modifyData.predicateArgumentsToTokensMap ?? null;
        node.redirectId = modifyData.redirectId ?? null;
        node.messageTemplate = modifyData.messageTemplate ?? null;
        node.parent = modifyData.parent ?? null;
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
                node.children = [];
                break;
            case NodeType.PREDICATE:
                node.preprocessorTypes = [];
                node.messageTemplate = null;
                node.redirectId = null;
                node.predicateArgumentsToTokensMap = {};
                if (!node.children) node.children = [];
                node.children = node.children.slice(0, 2);
                break;
            case NodeType.INPUT:
                node.predicateType = null;
                node.predicateRedirection = null;
                node.redirectId = null;
                node.predicateArgumentsToTokensMap = null;
                if (!node.children) node.children = [];
                node.children = node.children.slice(0, 1);
                break;
            case NodeType.NORMAL:
                node.predicateType = null;
                node.predicateRedirection = null;
                node.redirectId = null;
                node.predicateArgumentsToTokensMap = null;
                break;
        }

        this.renderVisual();
        this.handleNodeSelect(node);
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
        this.renderVisual();
    }
}
