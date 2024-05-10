import {Component, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {Task} from "../../../types/transport-interfaces";
import {OverlayPanel} from "primeng/overlaypanel";
import {ApiService} from "../../../services/api.service";
import {BehaviorSubject, debounceTime, Observable, of, Subscription} from "rxjs";

@Component({
    selector: 'app-task-link',
    templateUrl: './task-link.component.html',
    styleUrls: ['./task-link.component.scss']
})
export class TaskLinkComponent implements OnInit, OnDestroy {

    // @Input() task?: Task;
    _taskId?: number;
    @ViewChild('previewConnectedTask') previewConnectedTask?: OverlayPanel;
    panelShowSubject = new BehaviorSubject<MouseEvent | null>(null);
    panelShow$ = this.panelShowSubject.pipe(debounceTime(500));
    panelShowSub?: Subscription;

    task$: Observable<Task> = of();


    constructor(readonly api: ApiService) {
    }

    @Input() set taskId(value: number) {
        if (value === 0) return;
        this._taskId = value;
        this.task$ = this.api.getTask(value, true);
    }

    static createElement(taskId: number): HTMLElement {
        const element = document.createElement('task-link-element') as any;
        element.taskId = taskId;
        return element;
    }

    ngOnInit(): void {
        this.panelShowSub = this.panelShow$.subscribe(event => {
            if (event) this.showPreview(event);
            else this.hidePreview();
        });;
    }

    ngOnDestroy() {
        this.panelShowSub?.unsubscribe();
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
