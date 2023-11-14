import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {Wireframe, WireframeDashboardStatistic} from "../../../transport-interfaces";
import {ApiService} from "../../../services/api.service";
import {RealTimeUpdateService} from "../../../services/real-time-update.service";
import {merge, mergeMap, of, startWith} from "rxjs";
import {SubscriptionsHolder} from "../../../util";

@Component({
    selector: 'app-dashboard-task-statistic-panel',
    templateUrl: './dashboard-task-statistic-panel.component.html',
    styleUrls: ['./dashboard-task-statistic-panel.component.scss']
})
export class DashboardTaskStatisticPanelComponent implements OnInit, OnDestroy {

    title = "";
    statistic?: WireframeDashboardStatistic;
    subscriptions = new SubscriptionsHolder();

    constructor(private api: ApiService, private rt: RealTimeUpdateService) {
    }

    _wireframe?: Wireframe;

    get wireframe() {
        if (!this._wireframe) throw new Error("Шаблон не установлен");
        return this._wireframe;
    }

    @Input() set wireframe(value: Wireframe) {
        this._wireframe = value;
        this.title = value.name;

        this.subscriptions.addSubscription('upd',
            merge(this.rt.taskCreated(), this.rt.taskUpdated(), this.rt.taskDeleted())
                .pipe(startWith(null), mergeMap(() => this.api.getWireframeDashboardStatistic(value.wireframeId)))
                .subscribe(statistic => {
                    this.statistic = statistic;
                })
        );
    }

    ngOnInit(): void {
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribeAll();
    }
}
