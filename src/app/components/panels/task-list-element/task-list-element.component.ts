import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild} from '@angular/core';
import {FieldItem, ModelItem, Task, TaskStatus, TaskTag, WorkLog} from "../../../transport-interfaces";
import {TasksPageCacheService} from "../../../services/tasks-page-cache.service";
import {OverlayPanel} from "primeng/overlaypanel";
import {ApiService} from "../../../services/api.service";
import {mediaQuery} from "../../../util";

@Component({
    selector: 'app-task-list-element',
    templateUrl: './task-list-element.component.html',
    styleUrls: ['./task-list-element.component.scss']
})
export class TaskListElementComponent implements OnInit, OnChanges {

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

    @ViewChild('tagsPreview') tagsPreview?: OverlayPanel;

    isWide$ = mediaQuery("(min-width: 1024px)");

    statusClass: any = {};
    itemClass: any = {};

    actualWorkLog?: WorkLog;

    constructor(readonly taskService: TasksPageCacheService, readonly api: ApiService) {
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

    get taskFields(){
        const blocks = ['LARGE_TEXT', 'COUNTING_LIVES'];
        return {
            inline: this.item?.fields?.filter(f=>!blocks.includes(f.wireframeFieldType)) ?? [],
            block: this.item?.fields?.filter(f=>blocks.includes(f.wireframeFieldType)) ?? []
        }
    }

    get isMoreTwoTags() {
        if (!this.item?.tags) return false;
        return this.item.tags.length > 2;
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

    get actualWorkLogWorkers(){
        return this.actualWorkLog?.employees.map(e=>e.fullName).join(", ") ?? "";
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
            this.updateActualWorkLog();
        }
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
