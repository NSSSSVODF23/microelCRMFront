import {Component, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import {TaskTag} from "../../../transport-interfaces";
import {ConfirmPopup} from "primeng/confirmpopup";
import {ConfirmationService} from "primeng/api";
import {ApiService} from "../../../services/api.service";

@Component({
    selector: 'app-task-tag-list-item',
    templateUrl: './task-tag-list-item.component.html',
    styleUrls: ['./task-tag-list-item.component.scss']
})
export class TaskTagListItemComponent implements OnInit {
    @Input() tag?: TaskTag;
    @Output() onEditTag: EventEmitter<TaskTag> = new EventEmitter();

    constructor(readonly confirm: ConfirmationService, readonly api: ApiService) {
    }

    ngOnInit(): void {
    }

    deleteTag(event: any) {
        this.confirm.confirm({
            key: this.tag?.taskTagId.toString(),
            target: event.target,
            message: 'Удалить тег?',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                if(this.tag?.taskTagId) this.api.deleteTaskTag(this.tag.taskTagId).subscribe()
            },
            reject: () => {
            }
        });
    }
}
