import {Injectable} from '@angular/core';
import {ApiService} from "./api.service";
import {RealTimeUpdateService} from "./real-time-update.service";
import {DynamicValueFactory} from "../util";
import {shareReplay, tap} from "rxjs";

@Injectable({
    providedIn: 'root'
})
export class ActiveWorkLogService {

    constructor(private api: ApiService, private rt: RealTimeUpdateService) {
    }

    private _isEmpty = true;

    employeeWorkLogs$ = DynamicValueFactory.ofAll(this.api.getEmployeeWorkLogs(), [this.rt.workLogCreated(), this.rt.workLogClosed(), this.rt.workLogUpdated()])
        .pipe(
            tap({
                next: (workLogs) => {
                    workLogs.value.length > 0 ? this._isEmpty = false : this._isEmpty = true;
                },
                error: () => {
                    this._isEmpty = true;
                }
            }),
            shareReplay(1)
        );

    get isEmpty() {
        return this._isEmpty;
    };
}
