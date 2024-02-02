import {Component, OnInit} from '@angular/core';
import {FormControl, FormGroup} from "@angular/forms";
import {DateRange} from "../../../../types/transport-interfaces";
import {FromEvent} from "../../../../decorators";
import {filter, Observable, shareReplay, switchMap, tap} from "rxjs";
import {ApiService} from "../../../../services/api.service";

@Component({
    templateUrl: './employee-work-statistics-page.component.html',
    styleUrls: ['./employee-work-statistics-page.component.scss']
})
export class EmployeeWorkStatisticsPage implements OnInit {

    statisticsPeriod: DateRange | null = {start: new Date("2021-01-01 00:00:00"), end: new Date("2024-01-31 23:59:59")};
    @FromEvent('submitButton', 'click')
    submit$!: Observable<PointerEvent>;

    statisticsLoading = false;

    statisticsTable$ = this.submit$
        .pipe(
            filter(()=>!!this.statisticsPeriod && !this.statisticsLoading),
            tap(()=>this.statisticsLoading = true),
            switchMap(()=>this.api.getEmployeeWorkStatistics({period: this.statisticsPeriod!})),
            tap({
                next: () => this.statisticsLoading = false,
                error: () => this.statisticsLoading = false,
            }),
            shareReplay(1)
        )

    constructor(private api: ApiService) {
    }

    ngOnInit(): void {
    }

}
