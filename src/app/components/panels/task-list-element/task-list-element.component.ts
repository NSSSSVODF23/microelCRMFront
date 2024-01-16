import {
    Component,
    EventEmitter,
    Input,
    OnChanges,
    OnDestroy,
    OnInit,
    Output,
    SimpleChanges,
    ViewChild
} from '@angular/core';
import {FieldItem, ModelItem, Task, TaskStatus, TaskTag, WorkLog} from "../../../types/transport-interfaces";
import {TasksPageCacheService} from "../../../services/tasks-page-cache.service";
import {OverlayPanel} from "primeng/overlaypanel";
import {ApiService} from "../../../services/api.service";
import {dotAnimation, mediaQuery} from "../../../util";
import {FormControl} from "@angular/forms";
import {map, Observable, Subscription} from "rxjs";
import {RealTimeUpdateService} from "../../../services/real-time-update.service";
import {MenuItem} from "primeng/api";

@Component({
    selector: 'app-task-list-element',
    templateUrl: './task-list-element.component.html',
    styleUrls: ['./task-list-element.component.scss']
})
export class TaskListElementComponent implements OnInit, OnChanges, OnDestroy {

    @Input() item?: Task;

    @Input() viewExample: boolean = false;
    @Input() wireframeFieldsList: FieldItem[] = [];

    @Input() check?: number[];
    @Output() checkChange: EventEmitter<number[]> = new EventEmitter();
    @Input() checkGroup: string = 'task';

    @Output() selectFieldToView: EventEmitter<{ id: string, index: number }> = new EventEmitter();

    @Input() isHover = true;
    @Input() inlined = false;

    @Output() onClick: EventEmitter<Task> = new EventEmitter();
    @Input() customClickHandler = false;

    @Input() isCommentInput = false;

    @ViewChild('tagsPreview') tagsPreview?: OverlayPanel;
    @ViewChild('typeChangePanel') typeChangePanel?: OverlayPanel;
    @ViewChild('categoryChangePanel') categoryChangePanel?: OverlayPanel;
    @ViewChild('contextMenuPanel') contextMenuPanel?: OverlayPanel;

    isWide$ = mediaQuery("(min-width: 1024px)");

    statusClass: any = {};
    itemClass: any = {};

    actualWorkLog?: WorkLog;
    commentInputControl = new FormControl("");
    commentSending = false;

    dotAnimation = dotAnimation;

    updateSubscribe?: Subscription;
    changeTagsSubscribe?: Subscription;

    typesMenuModel$?: Observable<MenuItem[]>;
    categoryMenuModel$?: Observable<MenuItem[]>;

    tagsControl = new FormControl<TaskTag[]>([]);
    isBlockBackground = false;

    contextMenuModel: MenuItem[] = [];
    contextMenuTargetX = 0;
    contextMenuTargetY = 0;

    isAppointInstallersDialogVisible = false;
    isShowEditTaskDialogVisible = false;
    isShowTaskSchedulingDialogVisible = false;
    taskSchedulingType: 'from' | 'to' = 'from';

    constructor(readonly taskService: TasksPageCacheService, readonly api: ApiService, private rt: RealTimeUpdateService) {
    }

    get contextMenuTargetStyle() {
        return {
            top: this.contextMenuTargetY + 'px',
            left: this.contextMenuTargetX + 'px'
        }
    }

    get fieldCountArray() {
        switch (this.item?.modelWireframe?.listViewType) {
            case 'SIMPLE':
                return [1];
            case 'COMPOSITE':
                return [1, 2];
            case 'DETAILED':
                return [1, 2, 3];
            default:
                return [];
        }
    }

    get statusColor() {
        return {
            'text-primary': this.item?.taskStatus === TaskStatus.ACTIVE,
            'text-orange-400': this.item?.taskStatus === TaskStatus.PROCESSING,
            'text-bluegray-200': this.item?.taskStatus === TaskStatus.CLOSE
        }
    };

    get isExpired(){
        let expiredFlag = false;
        if(this.item && this.item.actualTo){
            expiredFlag = new Date(this.item.actualTo).getTime() < new Date().getTime();
        }
        return expiredFlag;
    }

    get statusBgColor() {
        if(this.item){
            const {taskStatus} = this.item;
            const IS_EXPIRED = taskStatus === TaskStatus.ACTIVE && this.isExpired;
            const IS_ACTIVE = taskStatus === TaskStatus.ACTIVE && !this.isExpired;
            const IS_PROCESSING = taskStatus === TaskStatus.PROCESSING;
            const IS_CLOSE = taskStatus === TaskStatus.CLOSE;
            return {
                'bg-red-500': IS_EXPIRED,
                'bg-primary': IS_ACTIVE,
                'bg-orange-500': IS_PROCESSING,
                'bg-bluegray-200': IS_CLOSE
            }
        }
        return null;
    };

    get taskFields() {
        const blocks = ['LARGE_TEXT', 'COUNTING_LIVES'];
        return {
            inline: this.item?.fields?.filter(f => !blocks.includes(f.wireframeFieldType)) ?? [],
            block: this.item?.fields?.filter(f => blocks.includes(f.wireframeFieldType)) ?? []
        }
    }

    get isMoreTags() {
        if (!this.item?.tags) return false;
        return this.item.tags.length > 4;
    };

    get remainingNumberOfTags() {
        if (!this.item?.tags) return 0;
        return this.item.tags.length - 2;
    }

    get bodyClass() {
        return {
            'simple': this.item?.modelWireframe?.listViewType === 'SIMPLE',
            'composite': this.item?.modelWireframe?.listViewType === 'COMPOSITE',
            'detailed': this.item?.modelWireframe?.listViewType === 'DETAILED'
        }
    }

    get actualWorkLogWorkers() {
        return this.actualWorkLog?.employees.map(e => e.fullName).join(", ") ?? "";
    }

    trackByIndex(index: number, item: any) {
        return index;
    };

    trackByTag(index: number, tag: TaskTag) {
        return tag.taskTagId + tag.name + tag.color;
    };

    trackByField(index: number, field: ModelItem) {
        if (!field) return "";
        return field.id + field.name + field.textRepresentation;
    };

    ngOnInit(): void {
        if (this.item?.taskStatus) {
            this.statusClass = {
                active: this.item.taskStatus === TaskStatus.ACTIVE,
                processed: this.item.taskStatus === TaskStatus.PROCESSING,
                close: this.item.taskStatus === TaskStatus.CLOSE
            }
        }
        this.updateActualWorkLog();
        this.itemClass = {
            'view-example': this.viewExample,
            'hovered': this.isHover,
            'selected': this.check, ...this.statusClass
        }

    }

    tagsPreviewShow(event: MouseEvent) {
        this.tagsPreview?.show(event)
    }

    tagsPreviewHide() {
        setTimeout(() => {
            this.tagsPreview?.hide()
        })
    }

    getFieldValue(index: number) {
        if (!this.item || this.item.listItemFields[index] === undefined || this.item.listItemFields[index] === null) {
            return ""
        }
        return this.item.listItemFields[index].textRepresentation;
    }

    ngOnChanges(changes: SimpleChanges): void {
        const {item} = changes;
        if (item && item.currentValue) {
            this.tagsControl.setValue(item.currentValue.tags, {emitEvent: false});
            this.typesMenuModel$ = this.api.getAvailableTaskTypesToChange(item.currentValue.taskId)
                .pipe(map(types => types.map(t => ({
                    label: t.label, command: () => {
                        this.api.changeTaskStage(item.currentValue.taskId, t.stageId).subscribe()
                        this.typeChangePanel?.hide();
                    }
                }))));
            this.categoryMenuModel$ = this.api.getAvailableDirectoriesToChange(item.currentValue.taskId)
                .pipe(map(dir => dir.map(d => ({
                    label: d.name, command: () => {
                        this.api.moveTaskToDirectory([item.currentValue.taskId], d.taskTypeDirectoryId).subscribe()
                        this.categoryChangePanel?.hide();
                    }
                }))));
            this.contextMenuModel = [
                {
                    label: 'Редактировать',
                    icon: 'mdi-edit',
                    disabled: item.currentValue.taskStatus !== TaskStatus.ACTIVE,
                    command: () => {
                        this.isShowEditTaskDialogVisible = true;
                        this.contextMenuPanel?.hide();
                    }
                },
                {
                    label: 'Запланировать',
                    icon: 'mdi-event_available',
                    disabled: item.currentValue.taskStatus !== TaskStatus.ACTIVE,
                    command: () => {
                        this.isShowTaskSchedulingDialogVisible = true;
                        this.taskSchedulingType = 'from';
                        this.contextMenuPanel?.hide();
                    }
                },
                {
                    label: 'Установить срок',
                    icon: 'mdi-event_available',
                    disabled: item.currentValue.taskStatus !== TaskStatus.ACTIVE,
                    command: () => {
                        this.isShowTaskSchedulingDialogVisible = true;
                        this.taskSchedulingType = 'to';
                        this.contextMenuPanel?.hide();
                    }
                },
                {
                    label: 'Отдать в работу',
                    icon: 'mdi-how_to_reg',
                    disabled: item.currentValue.taskStatus !== TaskStatus.ACTIVE,
                    command: () => {
                        this.isAppointInstallersDialogVisible = true;
                        this.contextMenuPanel?.hide();
                    }
                },
            ]
            this.updateActualWorkLog();
            this.updateSubscribe?.unsubscribe();
            this.updateSubscribe = this.rt.taskUpdated(item.currentValue.taskId).subscribe(updatedTask => this.item = updatedTask);
            this.changeTagsSubscribe = this.tagsControl.valueChanges.subscribe(tags => this.api.setTaskTags(item.currentValue.taskId, tags ?? []).subscribe())
        }
    }

    ngOnDestroy() {
        this.updateSubscribe?.unsubscribe();
        this.changeTagsSubscribe?.unsubscribe();
    }

    sendComment() {
        if (!this.item?.taskId || this.commentInputControl.value === "") return;
        this.commentSending = true;
        this.api.createComment(this.commentInputControl.value, this.item?.taskId, null).subscribe({
            next: () => {
                this.commentSending = false
                this.commentInputControl.setValue("");
            },
            error: () => this.commentSending = false,
        });
    }

    callToPhone(phone: any) {
        this.api.callToPhone(phone.value).subscribe({});
    }

    openTaskInOldTracker(oldTrackerTaskId: number | undefined) {
        if (oldTrackerTaskId) window.open(`http://tracker.vdonsk.ru/main.php?mode=show_obji&obji=${oldTrackerTaskId}&from_cat=1`, "_blank");
    }

    positioningContextMenuTarget(event: MouseEvent) {
        event.preventDefault();
        this.contextMenuTargetX = event.clientX;
        this.contextMenuTargetY = event.clientY;
    }

    private updateActualWorkLog() {
        if (this.item?.taskStatus === TaskStatus.PROCESSING) {
            this.api.getActiveWorkLogByTaskId(this.item.taskId).subscribe({
                next: (workLog: WorkLog) => {
                    this.actualWorkLog = workLog;
                }
            })
        }
    }
}
