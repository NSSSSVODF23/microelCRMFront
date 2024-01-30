import {Injectable} from '@angular/core';
import {ApiService} from "./api.service";
import {RealTimeUpdateService} from "./real-time-update.service";
import {EmployeeWorkLogs} from "../types/transport-interfaces";
import {DynamicValueFactory} from "../util";
import {shareReplay} from "rxjs";

@Injectable({
    providedIn: 'root'
})
export class ActiveWorkLogService {

    employeeWorkLogs$ = DynamicValueFactory.ofAll(this.api.getEmployeeWorkLogs(), [this.rt.workLogCreated(), this.rt.workLogClosed(), this.rt.workLogUpdated()]).pipe(shareReplay(1));

    constructor(private api: ApiService, private rt: RealTimeUpdateService) {}
}
