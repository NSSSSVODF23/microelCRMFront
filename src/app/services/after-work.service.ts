import {Injectable} from '@angular/core';
import {ApiService} from "./api.service";
import {RealTimeUpdateService} from "./real-time-update.service";
import {LoadingState, WorkLog} from "../types/transport-interfaces";
import {Router} from "@angular/router";
import {map} from "rxjs";
import {DynamicValueFactory} from "../util";

@Injectable({
    providedIn: 'root'
})
export class AfterWorkService {

    _isEmpty = true;

    afterWorks$ = DynamicValueFactory.of(this.api.getAfterWorkList(), 'workLogId', this.rt.afterWorksAppend(), null, this.rt.afterWorksRemoved()
        .pipe(map(workLogId => ({workLogId}))));

    constructor(private api: ApiService, private rt: RealTimeUpdateService, private router: Router) {
        this.afterWorks$.subscribe(data => this._isEmpty = !data.value || data.value.length === 0)
    }

    get isEmpty() {
        return this._isEmpty;
    }

    markAsCompleted(workLog: WorkLog) {
        this.api.markWorkLogAsCompleted(workLog.workLogId).subscribe();
    }

    markAsUncompleted(workLog: WorkLog, isOpenTask = false) {
        this.api.markWorkLogAsUncompleted(workLog.workLogId).subscribe(()=>{
            if(isOpenTask) this.openTask(workLog);
        });
    }

    closeAndMarkAsUncompleted(workLog: WorkLog) {
        this.api.markWorkLogAsUncompletedAndClose(workLog.workLogId).subscribe();
    }

    openTask(workLog: WorkLog) {
        this.router.navigate(['/task', workLog.task.taskId])
    }
}
