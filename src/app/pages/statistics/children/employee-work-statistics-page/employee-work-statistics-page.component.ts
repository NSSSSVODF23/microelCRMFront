import {Component, OnInit} from '@angular/core';
import {FormControl, FormGroup} from "@angular/forms";
import {DateRange} from "../../../../types/transport-interfaces";
import {FromEvent} from "../../../../decorators";
import {filter, Observable, shareReplay, switchMap, tap} from "rxjs";
import {ApiService} from "../../../../services/api.service";
import {BlockUiService} from "../../../../services/block-ui.service";

@Component({
    templateUrl: './employee-work-statistics-page.component.html',
    styleUrls: ['./employee-work-statistics-page.component.scss']
})
export class EmployeeWorkStatisticsPage implements OnInit {

    statisticsPeriod: DateRange | null = null;
    @FromEvent('submitButton', 'click')
    submit$!: Observable<PointerEvent>;

    statisticsTable$ = this.submit$
        .pipe(
            filter(()=>!!this.statisticsPeriod),
            tap(()=>this.blockService.wait({message: 'Формирование статистики'})),
            switchMap(()=>this.api.getEmployeeWorkStatistics({period: this.statisticsPeriod!})),
            tap({
                next: () => this.blockService.unblock(),
                error: () => this.blockService.unblock(),
            }),
            shareReplay(1)
        )

    constructor(private api: ApiService, private blockService: BlockUiService) {
    }

    ngOnInit(): void {
    }

}
