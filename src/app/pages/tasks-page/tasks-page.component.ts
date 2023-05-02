import {AfterViewInit, Component, OnInit, ViewChild} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {TaskSearchCacheService} from "../../services/task-search-cache.service";
import {ApiService} from "../../services/api.service";
import {Task} from "../../transport-interfaces";
import {Paginator} from "primeng/paginator";


@Component({
    templateUrl: './tasks-page.component.html', styleUrls: ['./tasks-page.component.scss']
})
export class TasksPageComponent implements OnInit, AfterViewInit {

    employees$ = this.api.getEmployeesOptionsList();
    @ViewChild('paginator') paginator!: Paginator;
    loadingItems = Array.from({length: 10}).fill(null);

    constructor(readonly taskService: TaskSearchCacheService, readonly api: ApiService, readonly route: ActivatedRoute) {
    }

    ngOnInit(): void {
        this.taskService.loadPage();
    }

    ngAfterViewInit(): void {
        this.taskService.setPaginatorPage = (page) => {
            if (this.paginator) this.paginator.changePage(page);
        }
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
}
