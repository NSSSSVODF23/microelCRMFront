import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {Task, TaskTag} from "../../../types/transport-interfaces";
import {OverlayPanel} from "primeng/overlaypanel";
import {ApiService} from "../../../services/api.service";

@Component({
    selector: 'app-task-tags-view',
    templateUrl: './task-tags-view.component.html',
    styleUrls: ['./task-tags-view.component.scss']
})
export class TaskTagsViewComponent implements OnInit {

    _task?: Task;
    @Input() set task(task: Task) {
        this._task = task;
        this.tags = task.tags ?? [];
    }
    @Input() disabled: boolean = false;
    @Input() readOnly: boolean = false;
    tags: TaskTag[] = [];
    editValueTags: TaskTag[] = []
    availableTags: TaskTag[] = []
    settingNewTags = false;

    @ViewChild("managementOp") managementOp!: OverlayPanel;
    extend = false;

    constructor(readonly api: ApiService) {
    }

    ngOnInit(): void {

    }

    openTagManagementDialog(event: MouseEvent): void {
        this.api.getTaskTags().subscribe(tags => {
            this.availableTags = tags;
            this.editValueTags = [...this.tags];
            this.tags.forEach(tag=>{
                if(tag.deleted){
                    this.availableTags.push(tag);
                }
            })
            this.managementOp.show(event);
        })
    }

    editTaskTags() {
        if(this.editValueTags.join()===this.tags.join()) return;
        this.settingNewTags = true;
        if (this._task?.taskId) this.api.setTaskTags(this._task.taskId, this.editValueTags).subscribe({
            next: () => {
                this.managementOp.hide();
                this.settingNewTags = false;
            },
            error: () => {
                this.settingNewTags = false;
            }
        })
    }
}
