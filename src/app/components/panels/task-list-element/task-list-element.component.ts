import {Component, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import {FieldItem, Task, TaskStatus} from "../../../transport-interfaces";
import {TaskSearchCacheService} from "../../../services/task-search-cache.service";
import {OverlayPanel} from "primeng/overlaypanel";

@Component({
    selector: 'app-task-list-element',
    templateUrl: './task-list-element.component.html',
    styleUrls: ['./task-list-element.component.scss']
})
export class TaskListElementComponent implements OnInit {

    @Input() item?: Task;
    @Input() viewExample: boolean = false;
    @Input() wireframeFieldsList: FieldItem[] = [];
    @Input() check?: number[];
    @Output() checkChange: EventEmitter<number[]> = new EventEmitter();
    @Input() checkGroup: string = 'task';
    @Output() selectFieldToView: EventEmitter<{ id: string, index: number }> = new EventEmitter();
    @Input() isHover = true;
    @Input() fullDate = false;
    @Output() onClick: EventEmitter<Task> = new EventEmitter();
    @Input() customClickHandler = false;
    @ViewChild('tagsPreview') tagsPreview?: OverlayPanel;
    statusClass: any = {};
    itemClass: any = {};
    showTags = false;
    @Input() isLoading = false;
    get isMoreTwoTags(){
        if(!this.item?.tags) return false;
        return this.item.tags.length > 2;
    };

    get remainingNumberOfTags(){
        if(!this.item?.tags) return 0;
        return this.item.tags.length - 2;
    }

    constructor(readonly taskService: TaskSearchCacheService) {
    }

    ngOnInit(): void {
        if (this.item?.taskStatus) {
            this.statusClass = {
                active: this.item.taskStatus === TaskStatus.ACTIVE,
                processed: this.item.taskStatus === TaskStatus.PROCESSING,
                close: this.item.taskStatus === TaskStatus.CLOSE
            }
        }
        this.itemClass = {'view-example':this.viewExample, 'hovered':this.isHover, 'selected':this.check, ...this.statusClass}
    }

    tagsPreviewShow(event: MouseEvent) {
        this.tagsPreview?.show(event)
    }

    tagsPreviewHide() {
        setTimeout(() => {
            this.tagsPreview?.hide()
        })
    }
}
