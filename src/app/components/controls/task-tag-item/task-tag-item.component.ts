import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {TaskTag} from "../../../transport-interfaces";
import {ConfirmPopup} from "primeng/confirmpopup";
import {ConfirmationService} from "primeng/api";
import {ApiService} from "../../../services/api.service";

@Component({
    selector: 'app-task-tag-item',
    templateUrl: './task-tag-item.component.html',
    styleUrls: ['./task-tag-item.component.scss']
})
export class TaskTagItemComponent implements OnInit {
    @Input() tag?: TaskTag;
    showEditTagDialog = false;
    tagNameToEdit: string = '';
    tagColorToEdit: string = '';
    isTagEditing = false;

    constructor(readonly confirm: ConfirmationService, readonly api: ApiService) {
    }

    ngOnInit(): void {
    }

    openEditTagDialog() {
        //Filling in the fields for editing
        this.tagNameToEdit = this.tag?.name ?? '';
        this.tagColorToEdit = this.tag?.color ?? '';
        //Opening dialog
        this.showEditTagDialog = true;
    }

    editTag() {
        this.isTagEditing = true;
        this.api.modifyTaskTag({
            taskTagId: this.tag?.taskTagId ?? 0,
            deleted: this.tag?.deleted ?? false,
            name: this.tagNameToEdit,
            color: this.tagColorToEdit
        }).subscribe({
            next: () => {
                this.isTagEditing = false;
                this.showEditTagDialog = false;
            },
            error: () => {
                this.isTagEditing = false;
            }
        })
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
