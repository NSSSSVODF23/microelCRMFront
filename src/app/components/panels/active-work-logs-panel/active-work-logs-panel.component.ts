import {Component, OnDestroy, OnInit} from '@angular/core';
import {ApiService} from "../../../services/api.service";
import {RealTimeUpdateService} from "../../../services/real-time-update.service";
import {SubscriptionsHolder} from "../../../util";
import {WorkLog} from "../../../types/transport-interfaces";
import {ActiveWorkLogService} from "../../../services/active-work-log.service";

@Component({
    selector: 'app-active-work-logs-panel',
    templateUrl: './active-work-logs-panel.component.html',
    styleUrls: ['./active-work-logs-panel.component.scss']
})
export class ActiveWorkLogsPanelComponent implements OnInit, OnDestroy {

    workLogs: WorkLog[] = [];
    loading = false;
    countOfActive = 0;
    subscriptions: SubscriptionsHolder = new SubscriptionsHolder();

    constructor(readonly api: ApiService, readonly rt: RealTimeUpdateService, readonly service: ActiveWorkLogService) {
    }

    ngOnInit(): void {
        this.loading = true;
        this.api.getActiveWorkLogs().subscribe({
            next: this.loadWorkLogs.bind(this),
            error: () => this.loading = false
        })
        this.api.getCountOfActiveWorkLogs().subscribe({
            next: (count) => this.countOfActive = count,
            error: () => this.countOfActive = 0
        })
        this.subscriptions.addSubscription("wlCr", this.rt.workLogCreated().subscribe(this.createWorkLog.bind(this)));
        this.subscriptions.addSubscription('wlUpt', this.rt.workLogUpdated().subscribe(this.updateWorkLog.bind(this)));
        this.subscriptions.addSubscription('wlCls', this.rt.workLogClosed().subscribe(this.closeWorkLog.bind(this)));
    }

    createWorkLog(workLog: WorkLog) {
        this.workLogs.push(workLog);
        this.countOfActive++;
    }

    updateWorkLog(workLog: WorkLog) {
        const index = this.workLogs.findIndex(wl => wl.workLogId === workLog.workLogId);
        if (index >= 0) {
            this.workLogs[index] = workLog;
        }
    }

    closeWorkLog(workLog: WorkLog) {
        const index = this.workLogs.findIndex(wl => wl.workLogId === workLog.workLogId);
        if (index >= 0) {
            this.workLogs.splice(index, 1);
            this.countOfActive--;
        }
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribeAll();
    }

    loadWorkLogs(workLogs: WorkLog[]) {
        this.loading = false
        this.workLogs = workLogs;
    }

    trackByWorkLog(index: number, workLog: WorkLog) {
        return workLog.workLogId + JSON.stringify(workLog.whoAccepted) + JSON.stringify(workLog.workReports);
    }

}
