import {Component, OnInit, ViewChild} from '@angular/core';
import {Storage, SubscriptionsHolder} from "../../util";
import {ApiService} from "../../services/api.service";
import {RealTimeUpdateService} from "../../services/real-time-update.service";
import {Page, Task} from "../../transport-interfaces";
import {FormControl, FormGroup} from "@angular/forms";
import {Paginator} from "primeng/paginator";
import {filter, of, switchMap} from "rxjs";
import {PersonalityService} from "../../services/personality.service";

@Component({
    templateUrl: './incoming-tasks-page.component.html',
    styleUrls: ['./incoming-tasks-page.component.scss']
})
export class IncomingTasksPageComponent implements OnInit {

    PAGE_SIZE = 25;

    taskPage?: Page<Task>;
    filtersForm = new FormGroup({
        template: new FormControl([] as number[])
    })
    status: 'ready' | 'loading' | 'error' | 'empty' = 'loading';
    subscribes = new SubscriptionsHolder();
    @ViewChild('paginator') paginator?: Paginator;

    constructor(readonly api: ApiService, readonly rt: RealTimeUpdateService, readonly personality: PersonalityService) {
    }

    _pageNum = 0;

    get pageNum(): number {
        return this._pageNum ?? 0;
    }

    set pageNum(value: number | null) {
        this._pageNum = value ?? 0;
    }

    get tasks() {
        return this.taskPage?.content || []
    }

    ngOnInit(): void {
        this.personality.onGettingUserData.subscribe(me=>{
            this.subscribes.addSubscription('tskCr', this.rt.incomingTaskCreated(me.login).subscribe(this.rtCreateTask.bind(this)));
        })
        this.subscribes.addSubscription('tskUp', this.rt.taskUpdated().subscribe(this.rtUpdateTask.bind(this)));
        this.subscribes.addSubscription('cngFltr', this.filtersForm.valueChanges.pipe(filter(filters => !!filters.template && filters.template.length > 0)).subscribe(filters => {
            this.toFirstPage();
            this.loadTasks(filters);
        }))
        this.pageNum = Storage.load<number>("incomingPageNum");
        const filters = Storage.load<any>("incomingFilters");
        if (filters) this.filtersForm.setValue(filters);
    }

    toFirstPage() {
        this.pageNum = 0;
        if (this.paginator) this.paginator.first = 0;
    }

    rtCreateTask(task: Task) {
        if (this.taskPage?.first) {
            this.taskPage.content?.unshift(task)
        }
    }

    rtUpdateTask(task: Task) {
        if (this.taskPage?.content) {
            const index = this.taskPage.content.findIndex(t => t.taskId === task.taskId)
            if (index !== -1) {
                this.taskPage.content[index] = task
            }
        }
    }

    loadTasks(filters: any) {
        this.status = 'loading';
        this.api.getIncomingTasks(this.pageNum, this.PAGE_SIZE, filters)
            .pipe(
                switchMap(page => {
                    if (page.pageable.pageNumber <= page.totalPages) {
                        return of(page);
                    } else {
                        this.toFirstPage();
                        return this.api.getIncomingTasks(this.pageNum, this.PAGE_SIZE, filters)
                    }
                })
            )
            .subscribe({
                next: page => {
                    this.taskPage = page;
                    Storage.save("incomingPageNum", this.pageNum);
                    Storage.save("incomingFilters", filters);
                    if(this.taskPage.totalElements === 0) {
                        this.status = 'empty';
                    }else {
                        this.status = 'ready';
                    }
                },
                error: () => {
                    this.status = 'error';
                }
            })
    }

    changePage(event: any) {
        this.pageNum = event.page;
        this.loadTasks(this.filtersForm.getRawValue());
    }

    taskTrack(index: number, task: Task) {
        return task.taskId;
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
}
