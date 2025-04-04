import {AfterViewInit, Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {ApiService} from "../../services/api.service";
import {RealTimeUpdateService} from "../../services/real-time-update.service";
import {Task} from "../../types/transport-interfaces";
import {PersonalityService} from "../../services/personality.service";
import {IncomingPageCacheService} from "../../services/incoming-page-cache.service";
import {fromEvent, Subscription} from "rxjs";

@Component({
    templateUrl: './incoming-tasks-page.component.html',
    styleUrls: ['./incoming-tasks-page.component.scss']
})
export class IncomingTasksPageComponent implements OnInit, OnDestroy, AfterViewInit {

    constructor(readonly api: ApiService, readonly rt: RealTimeUpdateService, readonly personality: PersonalityService, readonly ic: IncomingPageCacheService) {
    }

    ngOnInit(): void {
    }

    ngOnDestroy() {
        // this.ic.saveScrollPos(window.scrollY);
    }

    ngAfterViewInit() {
        // setTimeout(()=>window.scrollTo({top: this.ic.readScrollPos()}),10)
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
