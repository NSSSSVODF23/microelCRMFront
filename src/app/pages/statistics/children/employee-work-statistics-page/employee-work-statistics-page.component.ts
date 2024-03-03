import {Component, OnInit} from '@angular/core';
import {DateRange} from "../../../../types/transport-interfaces";
import {FromEvent} from "../../../../decorators";
import {filter, Observable, ReplaySubject, shareReplay, switchMap, tap} from "rxjs";
import {ApiService} from "../../../../services/api.service";
import {BlockUiService} from "../../../../services/block-ui.service";

@Component({
    templateUrl: './employee-work-statistics-page.component.html',
    styleUrls: ['./employee-work-statistics-page.component.scss']
})
export class EmployeeWorkStatisticsPage implements OnInit {

    statisticsPeriod: DateRange | null = null;
    // statisticsPeriod: DateRange | null = {start: new Date(2021, 0, 1), end: new Date(2024, 1, 31)};
    @FromEvent('submitButton', 'click')
    submit$ = new ReplaySubject<PointerEvent>(1);

    statisticsTable$ = this.submit$
        .pipe(
            filter(() => !!this.statisticsPeriod),
            tap(() => this.blockService.wait({message: 'Формирование статистики'})),
            switchMap(() => this.api.getEmployeeWorkStatistics({period: this.statisticsPeriod!})),
            tap({
                next: () => this.blockService.unblock(),
                error: () => this.blockService.unblock(),
            }),
            shareReplay(1)
        )

    timingsChartOptions = {
        scales: {
            y: {
                ticks: {
                    callback: this.amountTimeMapping
                }
            }
        },
        plugins: {
            tooltip: {
                callbacks: {
                    label: (context: any) => {
                        let label = context.dataset.label || '';

                        if (label) {
                            label += ': ';
                        }
                        if (context.parsed.y !== null) {
                            label += this.amountTimeMapping(context.parsed.y);
                        }
                        return label;
                    }
                }
            }
        }
    };

    moneyChartOptions = {
        scales: {
            y: {
                ticks: {
                    callback: (value: number, index: number, ticks: number[]) => {
                        return value + " р.";
                    }
                }
            }
        }
    };

    constructor(private api: ApiService, private blockService: BlockUiService) {
    }

    ngOnInit(): void {
    }

    private amountTimeMapping(value: number) {
        const hours = Math.floor(value / 3600000);
        const minutes = Math.floor((value - hours * 3600000) / 60000);
        const seconds = Math.floor((value - hours * 3600000 - minutes * 60000) / 1000);
        let stringValue = "";
        if (hours) {
            stringValue += hours + " ч.";
        }
        if (minutes) {
            stringValue += minutes + " мин.";
        }
        if (!hours && seconds) {
            stringValue += seconds + " сек.";
        }
        if (!hours && !minutes && !seconds) {
            stringValue += value + " мс.";
        }
        return stringValue;
    }

}
