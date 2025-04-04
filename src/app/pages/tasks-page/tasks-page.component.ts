import {AfterViewInit, Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {TasksPageCacheService} from "../../services/tasks-page-cache.service";
import {ApiService} from "../../services/api.service";
import {Employee, FieldItem, Task} from "../../types/transport-interfaces";
import {Paginator} from "primeng/paginator";
import {FormControl, FormGroup} from "@angular/forms";


@Component({
    templateUrl: './tasks-page.component.html', styleUrls: ['./tasks-page.component.scss']
})
export class TasksPageComponent implements OnInit, AfterViewInit, OnDestroy {

    employees: Employee[] = [];
    @ViewChild('paginator') paginator!: Paginator;
    loadingItems = Array.from({length: 10}).fill(null);
    filterDialogVisible = false;

    constructor(readonly taskService: TasksPageCacheService, readonly api: ApiService, readonly route: ActivatedRoute) {
    }

    trackByField(index: number, field: FormGroup) {
        return field.value.id + field.value.wireframeFieldType + field.value.name;
    };

    trackByTask(index: number, task: Task) {
        return task.taskId + (task.updated ?? '');
    };

    ngOnInit(): void {
        this.api.getEmployees().subscribe(employees => {
            this.employees = employees;
        })
    }

    ngAfterViewInit(): void {
        // setTimeout(()=>window.scrollTo({top: this.taskService.readScrollPos()}),10)
    }

    ngOnDestroy(): void {
        // this.taskService.saveScrollPos(window.scrollY)
    }

    isNewDate(taskItems: any, i: number) {
        if (i === 0)
            return true;
        const prev = taskItems[i - 1];
        const current = taskItems[i];
        if (!prev || !current) return false;
        const prevDate = new Date(prev.created)
        prevDate.setHours(0, 0, 0, 0)
        const currentDate = new Date(current.created)
        currentDate.setHours(0, 0, 0, 0)
        return prevDate.getTime() > currentDate.getTime();
    }

    taskLazyLoad(item: Task) {
        if (!item.fields || item.fields.length === 0)
            this.api.getFieldsTask(item.taskId).subscribe(fields => {
                item.fields = fields;
            })
    }

    clearTemplateFilters() {
        // this.taskService.templateFilterForm.reset()
    }
}
