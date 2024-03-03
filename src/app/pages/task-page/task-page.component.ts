import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {ApiService} from "../../services/api.service";
import {ActivatedRoute} from "@angular/router";
import {
    Comment, DateRange,
    Department,
    Employee,
    FieldItem,
    FileData,
    LoadingState,
    ModelItem,
    Page,
    Task,
    TaskFieldsSnapshot,
    TaskJournalSortingTypes,
    TaskStatus,
    TaskTag,
    WorkLog
} from "../../types/transport-interfaces";
import {FileInputComponent} from "../../components/controls/file-input/file-input.component";
import {ConfirmationService, MenuItem, MessageService, TreeNode} from "primeng/api";
import {RealTimeUpdateService} from "../../services/real-time-update.service";
import {
    DurationCounter,
    FormToModelItemConverter,
    quillDefaultModules,
    Storage,
    SubscriptionsHolder,
    Utils
} from "../../util";
import {fade, fadeIn} from "../../animations";
import {OverlayPanel} from "primeng/overlaypanel";
import {AbstractControl, AsyncValidatorFn, FormControl, FormGroup, ValidationErrors} from "@angular/forms";
import {CustomValidators} from "../../custom-validators";
import {delay, map, Observable, of, shareReplay, switchMap} from 'rxjs';
import {CustomNavigationService} from "../../services/custom-navigation.service";
import {QuillEditorComponent} from "ngx-quill";
import {
    TaskSelectingDialogComponent
} from "../../components/panels/task-linking-dialog/task-selecting-dialog.component";
import {ChatService} from "../../services/chat.service";
import {WorkLogsDialogComponent} from "../../components/panels/work-logs-dialog/work-logs-dialog.component";
import {TaskCreatorService} from "../../services/task-creator.service";
import {CommentCachingService} from "../../services/comment-caching.service";

@Component({
    templateUrl: './task-page.component.html',
    styleUrls: ['./task-page.component.scss'],
    animations: [fade, fadeIn]
})
export class TaskPageComponent implements OnInit, OnDestroy {

    currentTask?: Task;
    loadingState: LoadingState = LoadingState.LOADING;

    commentSending = false;

    quillModules = quillDefaultModules;

    attachedFiles: FileData[] = [];
    @ViewChild("filesInput") filesInput!: FileInputComponent;


    countAllAttachments: number = 0;
    showFilesHistory = false;

    stageMenuItems: MenuItem[] = [];

    editComment?: Comment;
    replyComment?: Comment;

    showAppointInstallersMenu = false;
    showChangeObserversDialog = false;
    showTaskLinkingDialog = false;
    taskLinkingType: "parent" | "child" = "parent";
    isLinkingBegin = false;
    listOfChildTaskLinking: number[] = [];

    departmentList: Department[] = [];
    employeeList: Employee[] = [];
    selectedDepartmentObservers: number[] = [];
    selectedEmployeeObservers: string[] = [];
    changingTaskObservers = false;

    employees$ = this.api.getEmployeesOptionsList();

    linkingTaskSkeletonArray: any[] = Array.from({length: 50})

    subscriptions: SubscriptionsHolder = new SubscriptionsHolder();
    taskChain: TreeNode[] = [];
    showTaskChainDialog = false;

    listOfExistingTasksToLink: Task[] = [];
    totalExistingTasksToLink = 0;
    loadingExistingTasksToLink = false;
    globalTaskSearchString = "";
    taskCreationDateFilterForLinking: string[] = [];
    taskAuthorEmployeeFilter = "";

    showChangeResponsibleDialog = false;
    selectedEmployeeAsResponsible?: Employee;
    selectingResponsible = false;

    schedulingTaskDialogVisible = false;
    schedulingTaskType: 'from' | 'to' = 'from';

    @ViewChild('taskActualDateSetPanel') taskActualDateSetPanel?: OverlayPanel;

    showChatHistory = false;
    isShowEditTaskDialog = false;


    // Отображается ли окно просмотра истории изменений задачи
    isShowEditHistoryDialog = false;
    // Снимки истории изменений задачи
    editTaskSnapshots: TaskFieldsSnapshot[] = [];
    indexEditSnapshot = 0;
    managementMenu: MenuItem[] = [];

    @ViewChild('commentEditor') commentEditor?: QuillEditorComponent;
    @ViewChild('taskLinkingDialog') taskLinkingDialog?: TaskSelectingDialogComponent;
    @ViewChild('workLogsDialogEl') workLogsDialogEl?: WorkLogsDialogComponent;
    forceCloseWorkLogDialogVisible: boolean = false;
    isForceClosingWorkLog = false;
    activeWorkLog?: WorkLog;
    commentInputForm = new FormGroup({
        text: new FormControl<string>(''),
        files: new FormControl<FileData[]>([]),
    });
    commentEditorMode: 'simple' | 'extended' = 'simple';
    taskEventsVisible = true;
    journalVisible: boolean = false;
    installedTags = new FormControl<TaskTag[]>([]);
    // Объект подсчета кол-ва времени actualFrom задачи
    private actualFromDurationCounter = new DurationCounter();
    // Возвращает текущее время до actualFrom задачи
    actualFromTime$ = this.actualFromDurationCounter.observer.pipe(map(dur => dur.actualLabel));
    // Возвращает состояние времени actualFrom задачи (до или после заданного времени)
    isBeforeActualFrom$ = this.actualFromDurationCounter.observer.pipe(map(dur => dur.mode == "before"));
    // Объект подсчета кол-ва времени actualTo задачи
    private actualToDurationCounter = new DurationCounter();
    // Возвращает текущее время до actualTo задачи
    actualToTime$ = this.actualToDurationCounter.observer.pipe(map(dur => dur.mode === 'after' ? '-' + dur.actualLabel : dur.actualLabel));
    @ViewChild('fileInput') fileInput?: FileInputComponent;

    @ViewChild('oldTrackerPanel') oldTrackerPanel?: OverlayPanel;
    oldTrackerBindInfoForm = new FormGroup({
        id: new FormControl<number|null>(null, [], [this.compatibilityTaskValidator()]),
        taskClassId: new FormControl<number|null>(null),
        taskStageId: new FormControl<number|null>(null)
    });
    oldTrackerClassOptions$ = this.api.getOldTrackerClasses().pipe(shareReplay(1));
    currentOldTrackerClass$ = this.oldTrackerClassOptions$.pipe(map(classes=>classes.find(cls=>cls.id===this.currentTask?.currentStage?.oldTrackerBind?.classId)));
    oldTrackerStageOptions$ = this.oldTrackerBindInfoForm.controls.taskClassId.valueChanges
        .pipe(
            switchMap(taskClassId => {
                return this.oldTrackerClassOptions$.pipe(map(classes=>classes.find(cls=>cls.id === taskClassId)?.stages ?? []))
            }),
            shareReplay(1)
        );
    isChangeOldTrackerBindDisabled = false;
    isTaskInConnectionProcess = false;
    isTaskInStageChangeProcess = false;

    compatibilityTaskValidator(): AsyncValidatorFn {
        return (control: AbstractControl): Observable<ValidationErrors> => {
            if(!this._taskId || !control.value) return of({});
            return of(control.value).pipe(delay(1500), switchMap(oldTaskId=>this.api.checkCompatibility(this._taskId, oldTaskId)))
        };
    }

    get taskStatusColor(){
        if(this.currentTask){
            switch (this.currentTask.taskStatus){
                case 'ACTIVE':
                    return 'text-primary';
                case 'PROCESSING':
                    return 'text-orange-400';
                case 'CLOSE':
                    return 'text-bluegray-300';
            }
        }
        return '';
    };

    constructor(readonly api: ApiService,
                readonly route: ActivatedRoute,
                readonly chatService: ChatService,
                readonly confirmation: ConfirmationService,
                readonly toast: MessageService,
                readonly customNav: CustomNavigationService,
                readonly rt: RealTimeUpdateService,
                readonly taskCreator: TaskCreatorService,
                private commentCachingService: CommentCachingService) {
    }

    _taskId: number = 0;

    get taskId(): number {
        return this._taskId;
    }

    set taskId(value: number) {
        this._taskId = value;
        this.api.getTask(this._taskId).subscribe({
            next: task => {
                this.currentTask = task;
                if (task.deleted) {
                    this.loadingState = LoadingState.ERROR;
                } else {
                    this.loadingState = LoadingState.READY;
                }
                this.installedTags.setValue(task.tags ?? [], {emitEvent: false});
                if (this.isTaskClose()) {
                    this.installedTags.disable({emitEvent: false});
                } else {
                    this.installedTags.enable({emitEvent: false});
                }
                this.subscriptions.addSubscription('edTaskTg', this.installedTags.valueChanges
                    .subscribe(value => {
                        if (!value) return;
                        this.api.setTaskTags(task.taskId, value).subscribe();
                    }))
                this.api.getActiveWorkLogByTaskId(task.taskId).subscribe(workLog => {
                    this.activeWorkLog = workLog
                })
                this.orderFields();
                this.stageMenuItems = this.getStageMenuItems();
                this.subscriptions.addSubscription('taskUpd', this.rt.taskUpdated(value).subscribe(update => {
                    this.currentTask = update;
                    this.installedTags.setValue(update.tags ?? [], {emitEvent: false});
                    if (this.isTaskClose()) {
                        this.installedTags.disable({emitEvent: false});
                    } else {
                        this.installedTags.enable({emitEvent: false});
                    }
                    this.stageMenuItems = this.getStageMenuItems();
                    this.orderFields();
                    this.managementMenu = this.taskManagementMenu();
                    this.updateTaskActualTimers();
                }));
                this.managementMenu = this.taskManagementMenu();
                this.updateTaskActualTimers();
            },
            error: () => {
                this.loadingState = LoadingState.ERROR;
            }
        });
    }

    // Возвращает идентификаторы уже связанных с этой задачей задач
    get excludedTasks(): number[] {
        if (!this.currentTask) return [];
        const ids = [];
        if (this.currentTask.children) {
            this.currentTask.children.forEach(child => ids.push(child.taskId))
        }
        if (this.currentTask.parent) {
            ids.push(this.currentTask.parent)
        }
        ids.push(this._taskId)
        return ids;
    };

    trackSnapshotPair(index: number, snapshotPair: { before: ModelItem, after: ModelItem }) {
        return snapshotPair.before.modelItemId;
    };

    // Складывает поля в кортежи из истории изменений задачи
    snapshotFieldPairs(snapshot: TaskFieldsSnapshot): { before: ModelItem, after: ModelItem }[] {
        if (!snapshot) return [];
        const pairs: any = [];
        snapshot.beforeEditing.forEach(beforeField => {
            const afterField = snapshot.afterEditing.find(f => f.id === beforeField.id);
            if (afterField) {
                pairs.push({
                    before: beforeField,
                    after: afterField
                });
            }
        })
        return pairs;
    }

    // Проверяем равны ли ModelItems
    areFieldsEqual(before: ModelItem, after: ModelItem): boolean {
        return JSON.stringify(before) === JSON.stringify(after);
    }

    ngOnInit(): void {
        this.route.params.subscribe(params => {
            this.taskId = parseInt(params['id']);
            this.api.getCountAllTaskAttachments(this._taskId).subscribe(count => this.countAllAttachments = count);
            this.updateObservableList();
        })
        this.commentInputForm.patchValue({
            text: this.commentCachingService.read(this.taskId)
        })
        this.subscriptions.addSubscription("wlCrd", this.rt.workLogCreated().subscribe(this.workLogCreated.bind(this)));
        this.subscriptions.addSubscription("wlCls", this.rt.workLogClosed().subscribe(this.workLogClosed.bind(this)));
        this.subscriptions.addSubscription('comCh', this.commentInputForm.controls.text.valueChanges.subscribe(value => {
            this.commentCachingService.write(this.taskId, value ?? '');
        }))
    }

    updateObservableList() {
        this.api.getDepartments().subscribe(departments => {
            this.departmentList = departments
            this.selectedDepartmentObservers = [];
            for (const department of departments) {
                if (department.departmentId && (this.currentTask?.departmentsObservers?.some(dep => dep.departmentId === department.departmentId) ?? false))
                    this.selectedDepartmentObservers.push(department.departmentId);
            }
        });
        this.api.getEmployees(undefined, false, false).subscribe(employees => {
            this.employeeList = employees
            this.selectedEmployeeObservers = [];
            for (const employee of employees) {
                if (employee.login && (this.currentTask?.employeesObservers?.some(emp => emp.login === employee.login) ?? false))
                    this.selectedEmployeeObservers.push(employee.login);
            }
        });
    }

    sendComment() {
        const commentValue = this.commentInputForm.getRawValue();
        if (commentValue.text?.trim().length === 0
            && commentValue.files?.length === 0) return;
        this.commentInputForm.disable({emitEvent: false});

        if (this.editComment) {
            if (commentValue.text === null || commentValue.text.trim().length === 0 || commentValue.text === this.editComment.message) return;
            this.editComment.message = commentValue.text;
            this.api.updateComment(this.editComment).subscribe({
                complete: () => {
                    this.commentInputForm.enable({emitEvent: false});
                    this.commentInputForm.reset({text: '', files: []});
                    this.editComment = undefined;
                }, error: () => this.commentInputForm.enable({emitEvent: false})
            });
            return;
        }

        this.api.createComment(commentValue.text, this._taskId, commentValue.files, this.replyComment?.commentId).subscribe({
            complete: () => {
                this.commentInputForm.enable({emitEvent: false});
                this.commentInputForm.reset({text: '', files: []});
                this.replyComment = undefined;
                this.commentCachingService.flush(this.taskId);
            }, error: () => this.commentInputForm.enable({emitEvent: false})
        });
    }

    sendCommentByEnter(event: KeyboardEvent) {
        if (event.key === 'Enter') {
            if (event.ctrlKey) {
                this.sendComment();
            }
        }
    }

    deleteTask() {
        this.confirmation.confirm({
            header: "Подтверждение",
            message: "Удалить эту задачу?",
            accept: () => this.api.deleteTask(this._taskId).subscribe()
        })
    }

    getStageMenuItems() {
        if (!this.currentTask?.modelWireframe?.stages) return [];
        return this.currentTask.modelWireframe.stages
            .sort((a, b) => a.orderIndex - b.orderIndex)
            .map(stage => {
                if (stage.stageId == this.currentTask?.currentStage?.stageId) {
                    return <MenuItem>{
                        label: `${stage.label}` ?? '', disabled: true, icon: 'pi pi-fw pi-check'
                    }
                }
                return <MenuItem>{
                    label: stage.label ?? '',
                    command: () => this.api.changeTaskStage(this.taskId, stage.stageId).subscribe(),
                    icon: 'pi pi-fw pi-chevron-circle-right'
                }
            });
    }

    moveToNextStage() {
        if (!this.currentTask?.modelWireframe?.stages) return;
        const taskStages = this.currentTask.modelWireframe.stages
            .sort((a, b) => a.orderIndex - b.orderIndex);
        const index = taskStages.findIndex(stage => stage.stageId === this.currentTask?.currentStage?.stageId);
        if (index < taskStages.length - 1) {
            this.api.changeTaskStage(this.taskId, taskStages[index + 1].stageId).subscribe()
        }
    }

    isLastStage() {
        if (!this.currentTask?.modelWireframe?.stages) return;
        const taskStages = this.currentTask.modelWireframe.stages
            .sort((a, b) => a.orderIndex - b.orderIndex);
        const index = taskStages.findIndex(stage => stage.stageId === this.currentTask?.currentStage?.stageId);
        return index === taskStages.length - 1;
    }

    editCommentChanged(event: Comment) {
        this.commentInputForm.patchValue({text: event.message})
        this.commentEditor?.quillEditor.focus();
        window.scroll(0,0);
    }

    replyCommentChanged(event: Comment) {
        this.commentEditor?.quillEditor.focus();
        window.scroll(0,0);
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribeAll()
    }


    sendObservableList() {
        this.changingTaskObservers = true;
        this.api.changeTaskObservers(this._taskId, this.selectedDepartmentObservers, this.selectedEmployeeObservers).subscribe({
            next: () => {
                this.showChangeObserversDialog = false;
                this.changingTaskObservers = false;
            },
            error: () => {
                this.changingTaskObservers = false;
            }
        })
    }

    createLinkedTask(type: "parent" | "child") {
        const width = 800;
        const height = 800;
        // Открывает окно для создания новой связанной задачи с параметром taskId, используя метод Window.open()
        window.open(`/task/create?${type}=${this._taskId}`, '_blank', `popup=yes,width=${width},height=${height},left=${(screen.width / 2) - (width / 2)},top=${(screen.height / 2) - (height / 2)}`);
    }

    unlinkParentTask(targetId?: number) {
        this.confirmation.confirm({
            header: 'Подтверждение',
            message: 'Отсоединить родительскую задачу?',
            accept: () => {
                this.api.unlinkParentTask(targetId ? targetId : this._taskId).subscribe();
            }
        })
    }

    openTaskChainDialog() {
        this.taskChain = [];
        if (this.currentTask?.taskId)
            this.api.getRootTask(this.currentTask?.taskId).subscribe(rootTask => {
                this.taskChain = [{
                    data: rootTask,
                    expanded: true,
                    type: 'task',
                    children: this.recursivelyCreatingChainOfTasks(rootTask)
                }]
                this.showTaskChainDialog = true;
            })
    }

    changeTaskListPageToLink(event: any) {
        this.loadingExistingTasksToLink = true;
        const excludeIds = [this._taskId, ...this.currentTask?.children?.map(c => c.taskId) ?? []];
        if (this.currentTask?.parent) excludeIds.push(this.currentTask.parent);

        this.api.getPageOfTasks(event.page, {
            status: [TaskStatus.ACTIVE, TaskStatus.PROCESSING, TaskStatus.CLOSE],
            searchPhrase: this.globalTaskSearchString,
            author: this.taskAuthorEmployeeFilter,
            // dateOfCreation: this.taskCreationDateFilterForLinking ?
            //     {start: this.taskCreationDateFilterForLinking[0], end: this.taskCreationDateFilterForLinking[1]} as DateRange : undefined,
            exclusionIds: excludeIds
        }).subscribe({
                next: page => {
                    this.applyPageOfTasks(page)
                    this.loadingExistingTasksToLink = false;
                },
                error: () => {
                    this.loadingExistingTasksToLink = false;
                }
            }
        )
    }

    applyPageOfTasks(page: Page<Task>) {
        this.listOfExistingTasksToLink = page.content;
        this.totalExistingTasksToLink = page.totalElements;
    }

    filteringTasksToLink() {
        setTimeout(() => {
            this.changeTaskListPageToLink({page: 0});
        })
    }

    openChangeResponsibleDialog() {
        this.showChangeResponsibleDialog = true;
        this.selectedEmployeeAsResponsible = this.currentTask?.responsible;
    }

    changeResponsible() {
        if (!this.selectedEmployeeAsResponsible) return;
        this.selectingResponsible = true;
        this.api.changeTaskResponsible(this._taskId, this.selectedEmployeeAsResponsible).subscribe(
            {
                next: () => {
                    this.showChangeResponsibleDialog = false;
                    this.selectingResponsible = false;
                },
                error: () => {
                    this.selectingResponsible = false;
                }
            }
        )
    }

    confirmUnbindResponsible() {
        this.confirmation.confirm({
            header: "Подтверждение",
            message: 'Убрать ответственного?',
            accept: () => {
                this.api.unbindResponsible(this._taskId).subscribe()
            }
        })
    }

    openChangeObserversDialog() {
        this.showChangeObserversDialog = true;
        this.updateObservableList();
    }

    removeActualFromDate() {
        this.confirmation.confirm({
            header: "Подтверждение",
            message: 'Удалить дату на которую запланирована задача?',
            accept: () => {
                this.api.clearActualFromDate(this._taskId).subscribe()
            }
        })
    }

    removeActualToDate() {
        this.confirmation.confirm({
            header: "Подтверждение",
            message: 'Удалить дату окончания актуальности задачи?',
            accept: () => {
                this.api.clearActualToDate(this._taskId).subscribe()
            }
        })
    }

    closeTask() {
        this.confirmation.confirm({
            header: "Подтверждение",
            message: 'Закрыть задачу?',
            accept: () => {
                this.api.closeTask(this._taskId).subscribe()
            }
        })
    }

    isTaskActive() {
        if (this.currentTask?.taskStatus) {
            return this.currentTask?.taskStatus === TaskStatus.ACTIVE;
        }
        return false;
    }

    isTaskProcessing() {
        if (this.currentTask?.taskStatus) {
            return this.currentTask?.taskStatus === TaskStatus.PROCESSING;
        }
        return false;
    }

    isTaskClose() {
        if (this.currentTask?.taskStatus) {
            return this.currentTask?.taskStatus === TaskStatus.CLOSE;
        }
        return false;
    }

    reopenTask() {
        this.confirmation.confirm({
            header: "Подтверждение",
            message: 'Вновь открыть данную задачу?',
            accept: () => {
                this.api.reopenTask(this._taskId).subscribe()
            }
        })
    }

    showEditHistoryDialog() {
        this.api.getEditTaskSnapshots(this._taskId).subscribe(
            (snapshots) => {
                this.editTaskSnapshots = snapshots;
                this.indexEditSnapshot = 0;
                this.isShowEditHistoryDialog = true;
            }
        )
    }

    changeCurrentSnapshot(shift: number) {
        this.indexEditSnapshot += shift;
        if (this.indexEditSnapshot > this.editTaskSnapshots.length - 1) {
            this.indexEditSnapshot = 0;
        } else if (this.indexEditSnapshot < 0) {
            this.indexEditSnapshot = this.editTaskSnapshots.length - 1;
        }
    }

    isTaskHasParent() {
        return typeof this.currentTask?.parent === "number";
    }

    isTaskHasChilds() {
        return this.currentTask?.children && this.currentTask?.children.length > 0;
    }

    isTaskHasObservers() {
        return (this.currentTask?.employeesObservers && this.currentTask?.employeesObservers.length > 0) ||
            (this.currentTask?.departmentsObservers && this.currentTask?.departmentsObservers.length > 0);
    }

    insertEmployeeToCommentEditor(event: Employee) {
        setTimeout(() => {
            const editor = this.commentEditor?.quillEditor;
            if (!editor) return;
            const range = editor.getSelection(true);
            const value = event.login + " " ?? "";
            editor.insertText(range.index, value, 'user');
            editor.setSelection(range.index + value.length, 0);
        }, 100)
    }

    forceFocusCommentInput() {
        this.commentEditor?.quillEditor.focus();
    }

    linkToParentTask(taskId: number) {
        if (!taskId) return;
        this.api.changeLinkToParentTask(this._taskId, taskId).subscribe({
            next: () => {
            },
            error: () => {
            }
        })
    }

    linkToChildTasks(childIds: number[]) {
        if (!childIds || childIds.length === 0) return;
        this.api.appendLinksToChildrenTasks(this._taskId, childIds).subscribe({
            next: () => {
            },
            error: () => {
            }
        })
    }

    // Отчищает набранный текст комментария от html тегов
    clearCommentText() {
        let text = this.commentInputForm.value.text;
        if (text) {
            text = text.replace(/<\/?[^>]+(>|$)/g, "");
        }
        this.commentInputForm.patchValue({text})
    }

    private workLogCreated(workLog: WorkLog) {
        if (workLog.task.taskId === this._taskId) {
            this.activeWorkLog = workLog;
        }
    }

    private workLogClosed(workLog: WorkLog) {
        if (workLog.task.taskId === this._taskId) {
            this.activeWorkLog = undefined;
        }
    }

    private openWorkLogsDialog() {
        if (!this.workLogsDialogEl) return;
        this.workLogsDialogEl.open(this._taskId);
    };

    private taskManagementMenu(): MenuItem[] {
        const docs = this.currentTask?.modelWireframe?.documentTemplates?.map((doc)=>{
            return {
                label: doc.name,
                command: ()=>{
                    window.open(`api/private/document-template?taskId=${this.currentTask?.taskId}&documentTemplateId=${doc.documentTemplateId}`)
                }
            }
        }) ?? [];
        return [
            {
                icon: 'mdi-task',
                label: "Задача",
                items: [
                    {
                        label: "История изменений",
                        icon: 'mdi-history',
                        command: this.showEditHistoryDialog.bind(this)
                    },
                    {
                        label: "Документы",
                        icon: 'mdi-document_scanner',
                        disabled: docs.length === 0,
                        items: docs
                    },
                    {
                        label: "Ответственный",
                        icon: 'mdi-person',
                        items: [
                            {
                                label: "Назначить",
                                icon: 'mdi-edit',
                                command: this.openChangeResponsibleDialog.bind(this)
                            },
                            {
                                label: "Убрать",
                                icon: 'mdi-close',
                                command: this.confirmUnbindResponsible.bind(this)
                            }
                        ],
                        disabled: this.isTaskClose()
                    },
                    {
                        label: "Наблюдатели",
                        icon: 'mdi-groups',
                        items: [
                            {
                                label: "Редактировать",
                                icon: 'mdi-edit',
                                command: this.openChangeObserversDialog.bind(this)
                            }
                        ],
                        disabled: this.isTaskClose()
                    },
                    {
                        label: "Связанные задачи",
                        icon: 'mdi-link',
                        items: [
                            {
                                label: "Родительская",
                                icon: 'mdi-call_merge',
                                items: [
                                    {
                                        label: "Создать",
                                        icon: 'mdi-add',
                                        command: ()=> this.taskCreator.dependency("child", this._taskId)
                                    },
                                    {
                                        label: "Назначить",
                                        icon: 'mdi-edit',
                                        command: () => {
                                            this.taskLinkingDialog?.open('single')
                                        }
                                    }
                                ]
                            },
                            {
                                label: "Дочерние",
                                icon: 'mdi-call_split',
                                items: [
                                    {
                                        label: "Создать",
                                        icon: 'mdi-add',
                                        command: ()=> this.taskCreator.dependency("parent", this._taskId)
                                    },
                                    {
                                        label: "Назначить",
                                        icon: 'mdi-edit',
                                        command: () => {
                                            this.taskLinkingDialog?.open('multiply')
                                        }
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        label: "Время выполнения",
                        icon: 'mdi-schedule',
                        items: [
                            {
                                label: "Начало",
                                icon: 'mdi-pending_actions',
                                items: [
                                    {
                                        label: "Назначить",
                                        command: () => {
                                            this.schedulingTaskDialogVisible = true;
                                            this.schedulingTaskType = 'from';
                                        }
                                    },
                                    {
                                        label: "Удалить",
                                        command: () => this.confirmUnbindDate("from")
                                    }
                                ]
                            },
                            {
                                label: "Конец",
                                icon: 'mdi-today',
                                items: [
                                    {
                                        label: "Назначить",
                                        command: () => {
                                            this.schedulingTaskDialogVisible = true;
                                            this.schedulingTaskType = 'to';
                                        }
                                    },
                                    {
                                        label: "Удалить",
                                        command: () => this.confirmUnbindDate("to")
                                    }
                                ]
                            }
                        ],
                        disabled: this.isTaskClose()
                    },
                    {
                        label: "Переоткрыть",
                        icon: 'mdi-swipe_up_alt',
                        command: this.reopenTask.bind(this),
                        visible: this.isTaskClose()
                    },
                    {
                        label: "Закрыть",
                        icon: 'mdi-swipe_down_alt',
                        command: this.closeTask.bind(this),
                        visible: this.isTaskActive()
                    },
                    {
                        label: "Удалить",
                        icon: 'mdi-delete',
                        command: this.deleteTask.bind(this),
                        disabled: !this.isTaskActive()
                    }
                ]
            },
            {
                label: "Редактировать задачу",
                icon: 'mdi-edit',
                command: ()=>this.isShowEditTaskDialog=true,
                disabled: this.isTaskClose()
            },
            {
                icon: 'mdi-engineering',
                label: "Монтажники",
                items: [
                    {
                        label: "Отдать в работу",
                        icon: 'mdi-how_to_reg',
                        command: ()=>this.showAppointInstallersMenu = true,
                        visible: this.isTaskActive()
                    },
                    {
                        label: "Принудительно забрать",
                        icon: 'mdi-assignment_return',
                        command: () => this.forceCloseWorkLogDialogVisible = true,
                        visible: this.isTaskProcessing()
                    },
                    {
                        label: "Отчеты",
                        icon: 'mdi-history_edu',
                        command: this.openWorkLogsDialog.bind(this)
                    }
                ]
            },
            {
                icon: 'mdi-inventory_2',
                label: "Прикрепленные файлы",
                command: () => this.showFilesHistory = true
            },
            {
                icon: 'mdi-sync',
                label: 'Старый трекер',
                command: (event:any)=> {
                    this.openOldTrackerDialog(event.originalEvent)
                },
            },
            // {
            //     icon: 'mdi-forum',
            //     label: "Активный чат",
            //     visible: this.isTaskProcessing(),
            //     command: () => this.api.getActiveTaskChat(this._taskId).subscribe(chat => this.chatService.open.emit(chat.chatId))
            // }
        ];
    }

    quillFormats = [
        'background',
        'bold',
        'color',
        'font',
        'code',
        'italic',
        'link',
        'size',
        'strike',
        'script',
        'underline',
        'blockquote',
        'header',
        'indent',
        'list',
        'align',
        'direction',
        'code-block',
        'formula'
        // 'image'
        // 'video'
    ];

    taskJournalSorting = Storage.loadOrDefault("taskJournalSortingType", TaskJournalSortingTypes.CREATE_DATE_DESC);
    taskJournalSortingOptions = [
        {label:"Сначала новые", value: TaskJournalSortingTypes.CREATE_DATE_DESC},
        {label:"Сначала старые", value: TaskJournalSortingTypes.CREATE_DATE_ASC},
    ];

    // Обновляет время в таймерах актуальности задачи
    private updateTaskActualTimers() {
        this.actualFromDurationCounter.setTime(this.currentTask?.actualFrom);
        this.actualToDurationCounter.setTime(this.currentTask?.actualTo);
    }

    private orderFields() {
        const wireframeFields: FieldItem[] = [];
        this.currentTask?.modelWireframe?.steps.forEach(step => step.fields.forEach(field => wireframeFields.push(field)))
        this.currentTask?.fields?.sort((a, b) => {
            const aWf = wireframeFields.find(field => field.id === a.id)?.orderPosition ?? 0;
            const bWf = wireframeFields.find(field => field.id === b.id)?.orderPosition ?? 0;
            return aWf - bWf;
        })
    }

    private recursivelyCreatingChainOfTasks(task?: Task): TreeNode[] {
        if (!task) return [];
        return task.children?.map(childTask => {
            return {
                data: childTask,
                expanded: true,
                type: 'task',
                children: this.recursivelyCreatingChainOfTasks(childTask)
            }
        }) ?? []
    }

    private confirmUnbindDate(state: "from"|"to") {
        if(state === "from") {
            this.confirmation.confirm({header: "Подтверждение", message: "Вы уверены, что хотите удалить запланированную дату?", accept: () => this.api.clearActualFromDate(this.taskId).subscribe()});
        } else {
            this.confirmation.confirm({header: "Подтверждение", message: "Вы уверены, что хотите удалить срок выполнения?", accept: () => this.api.clearActualToDate(this.taskId).subscribe()});
        }
    }

    pasteFiles(event: ClipboardEvent) {
        this.fileInput?.appendFiles(event);
    }

    openOldTrackerDialog(event: Event){
        if(this.oldTrackerPanel && this.currentTask){
            this.isChangeOldTrackerBindDisabled = !!this.currentTask.oldTrackerTaskId;
            if(this.isChangeOldTrackerBindDisabled){
                this.oldTrackerBindInfoForm.setValue({
                    id: this.currentTask.oldTrackerTaskId ?? null,
                    taskClassId: this.currentTask.oldTrackerTaskClassId ?? null,
                    taskStageId: this.currentTask.oldTrackerCurrentStageId ?? null
                })
            }
            this.oldTrackerPanel.show(event);
        }
    }

    bindTaskToTask() {
        if(this.currentTask && this.oldTrackerBindInfoForm.value.id && this.oldTrackerBindInfoForm.controls.id.valid && !this.oldTrackerBindInfoForm.controls.id.pending) {
            this.isTaskInConnectionProcess = true;
            this.api.connectToOldTracker(this.currentTask.taskId, this.oldTrackerBindInfoForm.value.id).subscribe({
                next:()=>{
                    this.isTaskInConnectionProcess = false;
                    this.oldTrackerPanel?.hide();
                },
                error:()=>{
                    this.isTaskInConnectionProcess = false;
                }
            })
        }
    }

    changeTaskStageInOldTracker(){
        if(this.currentTask && this.oldTrackerBindInfoForm.value.taskStageId) {
            this.isTaskInStageChangeProcess = true;
            this.api.changeTaskStageInOldTracker(this.currentTask.taskId, this.oldTrackerBindInfoForm.value.taskStageId).subscribe({
                next:()=>{
                    this.isTaskInStageChangeProcess = false;
                    this.oldTrackerPanel?.hide();
                },
                error:()=>{
                    this.isTaskInStageChangeProcess = false;
                }
            })
        }
    }
}
