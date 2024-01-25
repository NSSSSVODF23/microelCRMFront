import {Injectable} from '@angular/core';
import {ApiService} from "./api.service";
import {RealTimeUpdateService} from "./real-time-update.service";

@Injectable({
    providedIn: 'root'
})
export class AfterWorkService {

    afterWorks$ = this.api.getAfterWorkList();

    constructor(private api: ApiService, private rt: RealTimeUpdateService) {
    }

}
