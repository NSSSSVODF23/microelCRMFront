import {Injectable} from '@angular/core';
import {ApiService} from "./api.service";
import {RealTimeUpdateService} from "./real-time-update.service";
import {Employee, TypesOfContractsSuggestion, WorkLog} from "../types/transport-interfaces";
import {Router} from "@angular/router";
import {map, Observable, of, switchMap, tap} from "rxjs";
import {DynamicValueFactory} from "../util";
import {PersonalityService} from "./personality.service";

@Injectable({
    providedIn: 'root'
})
export class AfterWorkService {

    afterWorks$ = this.personality.userLogin$.pipe(switchMap(login => {
        return DynamicValueFactory.of(this.api.getAfterWorkList(), 'workLogId', this.rt.afterWorksAppend(login), null, this.rt.afterWorksRemoved(login)
            .pipe(map(workLogId => ({workLogId} as WorkLog))));
    }))

    constructor(private api: ApiService, private rt: RealTimeUpdateService, private router: Router, private personality: PersonalityService) {
        this.afterWorks$.subscribe(data => this._isEmpty = !data.value || data.value.length === 0)
    }

    _isEmpty = true;

    get isEmpty() {
        return this._isEmpty;
    }

    markAsCompleted(workLog: WorkLog, typesOfContracts?: TypesOfContractsSuggestion[] | null) {
        return this.api.markWorkLogAsCompleted(workLog.workLogId, typesOfContracts ?? undefined);
    }

    markAsUncompleted(workLog: WorkLog, isOpenTask = false) {
        this.api.markWorkLogAsUncompleted(workLog.workLogId).subscribe(() => {
            if (isOpenTask) this.openTask(workLog);
        });
    }

    closeAndMarkAsUncompleted(workLog: WorkLog) {
        this.api.markWorkLogAsUncompletedAndClose(workLog.workLogId).subscribe();
    }

    openTask(workLog: WorkLog) {
        this.router.navigate(['/task', workLog.task.taskId])
    }
}
