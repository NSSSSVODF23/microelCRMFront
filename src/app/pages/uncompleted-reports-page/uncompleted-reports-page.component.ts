import {Component, OnInit} from '@angular/core';
import {ApiService} from "../../services/api.service";
import {LoadingState, WorkLog} from "../../transport-interfaces";
import {Subscription} from "rxjs";
import {SubscriptionsHolder} from "../../util";
import {RealTimeUpdateService} from "../../services/real-time-update.service";

@Component({
  templateUrl: './uncompleted-reports-page.component.html',
  styleUrls: ['./uncompleted-reports-page.component.scss']
})
export class UncompletedReportsPageComponent implements OnInit {

    uncompletedReports: WorkLog[] = [];
    loadingState = LoadingState.LOADING;
    subscriptions = new SubscriptionsHolder();

    constructor(private api: ApiService, private rt: RealTimeUpdateService) { }

    getUncompletedReports() {
        this.api.getUncompletedReports().subscribe({
            next: reports => {
                this.uncompletedReports = reports;
                this.loadingState = reports.length > 0 ? LoadingState.READY : LoadingState.EMPTY;
            },
            error: ()=> this.loadingState = LoadingState.ERROR,
        });
    }

    ngOnInit() {
        this.loadingState = LoadingState.LOADING;
        this.subscriptions.addSubscription('updList', this.rt.workLogUpdated().subscribe(() => this.getUncompletedReports()));
        this.getUncompletedReports();
    }
}
