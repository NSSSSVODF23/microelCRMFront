import {Component, OnDestroy, OnInit} from '@angular/core';
import {ApiService} from "../../../services/api.service";
import {RealTimeUpdateService} from "../../../services/real-time-update.service";
import {SubscriptionsHolder} from "../../../util";
import {EmployeeWorkLogs, WorkLog} from "../../../types/transport-interfaces";
import {ActiveWorkLogService} from "../../../services/active-work-log.service";
import {OverlayPanel} from "primeng/overlaypanel";

@Component({
    selector: 'app-active-work-logs-panel',
    templateUrl: './active-work-logs-panel.component.html',
    styleUrls: ['./active-work-logs-panel.component.scss']
})
export class ActiveWorkLogsPanelComponent implements OnInit, OnDestroy {

    activeWorkLog?: WorkLog | null;
    unactiveWorkLogs: WorkLog[] = [];
    forceCloseDialogVisible = false;
    targetTaskId?: number;

    constructor(readonly service: ActiveWorkLogService) {
    }

    ngOnInit(): void {
    }

    ngOnDestroy(): void {
    }

    trackByWorkLog(index: number, workLog: WorkLog) {
        return workLog.workLogId + JSON.stringify(workLog.whoAccepted) + JSON.stringify(workLog.workReports);
    }

    openPanel(event: MouseEvent, panel: OverlayPanel, employeeWorkLogs: EmployeeWorkLogs) {
        panel.toggle(event);
        this.activeWorkLog = employeeWorkLogs.active;
        this.unactiveWorkLogs = employeeWorkLogs.unactive;
    }

    forceCloseWorkLog(taskId: number) {
        this.targetTaskId = taskId;
        this.forceCloseDialogVisible = true;
    }
}
