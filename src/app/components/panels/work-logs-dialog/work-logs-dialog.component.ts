import {Component, OnDestroy, OnInit} from '@angular/core';
import {WorkLog} from "../../../transport-interfaces";
import {ApiService} from "../../../services/api.service";
import {SubscriptionsHolder} from "../../../util";
import {RealTimeUpdateService} from "../../../services/real-time-update.service";
import {ChatService} from "../../../services/chat.service";

@Component({
    selector: 'app-work-logs-dialog',
    templateUrl: './work-logs-dialog.component.html',
    styleUrls: ['./work-logs-dialog.component.scss']
})
export class WorkLogsDialogComponent implements OnInit, OnDestroy {
    dialogVisible = false;
    workLogs: WorkLog[] = [];
    isLoading = false;
    subscriptions: SubscriptionsHolder = new SubscriptionsHolder();
    loadingPlaceholders = Array(3).fill(null);

    constructor(readonly api: ApiService, readonly rt: RealTimeUpdateService, readonly chatService: ChatService) {
    }

    ngOnInit(): void {
        this.rt.workLogCreated().subscribe(this.workLogCreate.bind(this));
        this.rt.workLogUpdated().subscribe(this.workLogUpdate.bind(this));
        this.rt.workLogDeleted().subscribe(this.workLogDelete.bind(this));
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribeAll();
    }

    private workLogCreate(workLog: WorkLog) {
        this.workLogs.unshift(workLog);
    }

    private workLogUpdate(workLog: WorkLog) {
        const index = this.workLogs.findIndex(w => w.workLogId === workLog.workLogId);
        this.workLogs[index] = workLog;
    }

    private workLogDelete(workLog: WorkLog) {
        const index = this.workLogs.findIndex(w => w.workLogId === workLog.workLogId);
        this.workLogs.splice(index, 1);
    }

    trackByWorkLog(index: number, workLog: WorkLog) {
        return workLog.workLogId+workLog.status+workLog.whoAccepted.length+workLog.workReports.length;
    }

    open(taskId: number){
        this.dialogVisible = true;
        this.isLoading = true;
        this.api.getWorkLogsByTaskId(taskId).subscribe({
            next: this.loadWorkLogs.bind(this),
            error: this.onErrorDuringLoad.bind(this)
        })
    }

    private loadWorkLogs(workLogs:WorkLog[]){
        this.isLoading = false;
        this.workLogs = workLogs;
    }

    private onErrorDuringLoad(){
        this.isLoading = false;
    }
}
