import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {Task} from "../../../types/transport-interfaces";
import {OverlayPanel} from "primeng/overlaypanel";
import {ApiService} from "../../../services/api.service";

@Component({
    selector: 'app-task-link',
    templateUrl: './task-link.component.html',
    styleUrls: ['./task-link.component.scss']
})
export class TaskLinkComponent implements OnInit {

    @Input() task?: Task;
    failed = false;
    @ViewChild('previewConnectedTask') previewConnectedTask?: OverlayPanel;

    constructor(readonly api: ApiService) {
    }

    _taskId?: number;

    @Input() set taskId(value: number) {
        if (value === 0) return;
        this._taskId = value;
        this.api.getTask(this._taskId, true).subscribe({
            next: task => this.task = task,
            error: () => this.failed = true
        })
    }

    static createElement(taskId: number): HTMLElement {
        const element = document.createElement('task-link-element') as any;
        element.taskId = taskId;
        return element;
    }

    ngOnInit(): void {
    }

    showPreview(event: MouseEvent) {
        if (this.previewConnectedTask) this.previewConnectedTask.show(event)
    }

    hidePreview() {
        setTimeout(() => {
            if (this.previewConnectedTask) this.previewConnectedTask.hide()
        })
    }
}
