import {Component, Input, OnInit} from '@angular/core';
import {WorkLog} from "../../../types/transport-interfaces";
import {ApiService} from "../../../services/api.service";

@Component({
    selector: 'app-appointed-installers',
    templateUrl: './appointed-installers.component.html',
    styleUrls: ['./appointed-installers.component.scss']
})
export class AppointedInstallersComponent implements OnInit {
    workLog: WorkLog = {} as WorkLog;

    constructor(readonly api: ApiService) {
    }

    @Input() set logId(id: number) {
        this.api.getWorkLog(id, true).subscribe(log => {
            this.workLog = log;
        });
    }

    ngOnInit(): void {
    }

    static createElement(data: number) {
        const element = document.createElement('appointed-installers-element') as any;
        element.logId = data;
        return element;
    }
}
