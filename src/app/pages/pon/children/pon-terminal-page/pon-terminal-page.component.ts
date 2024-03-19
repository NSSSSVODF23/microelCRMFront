import {Component, OnInit, ViewChild} from '@angular/core';
import {ApiService} from "../../../../services/api.service";
import {RouteParam} from "../../../../decorators";
import {
    BehaviorSubject,
    combineLatest,
    debounceTime,
    filter,
    map,
    merge,
    ReplaySubject,
    startWith,
    switchMap,
    tap
} from "rxjs";
import {ActivatedRoute} from "@angular/router";
import {DateRange, TimeFrame} from "../../../../types/transport-interfaces";
import {FormControl} from "@angular/forms";
import {CustomNavigationService} from "../../../../services/custom-navigation.service";
import {Utils} from "../../../../util";
import {MessageService} from "primeng/api";
import {UIChart} from "primeng/chart";
import "chartjs-adapter-moment";
import {OntManagementService} from "../../../../services/pon/ont-management.service";
import {RealTimeUpdateService} from "../../../../services/real-time-update.service";

@Component({
    templateUrl: './pon-terminal-page.component.html',
    styleUrls: ['./pon-terminal-page.component.scss']
})
export class PonTerminalPage implements OnInit {

    chartOptions = {
        elements: {
            line: {
                // tension: .05,
                borderWidth: 1
            },
            point: {
                radius: 1
            }
        },
        scales: {
            x: {
                type: 'time',
                time: {
                    // unit: 'day',
                    tooltipFormat: 'DD-MM-YYYY HH:mm:ss',
                    displayFormats: {
                        millisecond: 'DD-MM HH:mm:ss.SSS',
                        second: 'DD-MM HH:mm:ss',
                        minute: 'DD-MM HH:mm',
                        hour: 'DD-MM HH:mm',
                        day: 'DD-MM-YYYY',
                        week: 'DD-MM-YYYY',
                        month: 'MM.YYYY',
                        quarter: 'MM.YYYY',
                    }
                }
            },
            y: {
                suggestedMin: -30,
                suggestedMax: -20,
            }
        },
        plugins: {
            zoom: {
                pan: {
                    enabled: true,
                    mode: 'x'
                },
                zoom: {
                    mode: 'x',
                    wheel: {
                        enabled: true,
                    },
                    pinch: {
                        enabled: true
                    },
                }
            },
            annotation: {
                annotations: {
                    line1: this.getLine(-25.5, 'Низкий уровень сигнала', 'rgb(243,129,58)'),
                    line2: this.getLine(-28.5, 'Критический уровень сигнала', 'rgb(215,28,28)')
                }
            }
        }
    };

    @RouteParam('id') terminalId$ = new ReplaySubject<string>(1);
    @ViewChild('signalChart') signalChart?: UIChart;

    chartDateRange = new FormControl<DateRange | null>({timeFrame: TimeFrame.TODAY});
    dateRangeChange$ = this.chartDateRange.valueChanges.pipe(startWith(this.chartDateRange.value));
    updateChart$ = new BehaviorSubject(true);
    isChartLoading = true;

    signalForUpdate$ = merge(this.rt.receiveNewOntStatusChangeEvents(), this.rt.receiveUpdatedOnt())
        .pipe(
            map(eventsOrOnt => {
                if(Array.isArray(eventsOrOnt)){
                    return eventsOrOnt.map(event => event.terminal);
                }else{
                    return [eventsOrOnt];
                }
            })
        )

    updateTerminal$ = combineLatest([this.terminalId$, this.signalForUpdate$])
        .pipe(
            map(([id, events]) => {
                let filter = events.filter(event=>event.id === parseInt(id));
                if(filter.length > 0) {
                    return filter[0];
                }else{
                    return null
                }
            }),
            filter(terminal => !!terminal),
        )

    loadTerminal$ = this.terminalId$
        .pipe(
            switchMap(id => this.api.getOnt(parseInt(id))),
        );

    terminal$ = merge(this.loadTerminal$, this.updateTerminal$);

    chartData$ = combineLatest([this.terminalId$, this.dateRangeChange$, this.updateChart$])
        .pipe(
            debounceTime(100),
            tap(() => this.isChartLoading = true),
            switchMap(([id, dateRange]) => this.api.getOntSignalChart(parseInt(id), dateRange ?? {timeFrame: TimeFrame.THIS_WEEK} as DateRange)),
            tap((dataSets) => {
                if(dataSets.length > 0) {
                    for (const dataSet of dataSets) {
                        dataSet.fill = 'origin';
                    }
                }
                this.isChartLoading = false
                this.signalChart?.chart.reset();
            }),
        );

    constructor(private api: ApiService, private rt: RealTimeUpdateService, private route: ActivatedRoute,
                readonly customNav: CustomNavigationService, private toast: MessageService, readonly ontMgmt: OntManagementService) {
    }

    ngOnInit(): void {
    }

    signalColor(signal: number) {
        if(signal > -25.5) return 'text-green-500';
        if(signal > -28.5) return 'text-orange-400';
        return 'text-red-600';
    }

    copyIp(ip: string) {
        Utils.copyToClipboard(ip, this.toast, 'IP адрес скопирован', 'Ошибка копирования IP адреса');
    }

    resetZoom() {
        this.signalChart?.chart.resetZoom();
    }

    getLine(val: number, label: string, color: string) {
        return {
            type: 'line',
            yMin: val,
            yMax: val,
            borderColor: color,
            borderWidth: 1,
            borderDash: [5, 5],
            label: {
                display: true,
                content: label,
                position: 'end',
                backgroundColor: 'transparent',
                color: color,
                yAdjust: 10
            }
        }
    }
}
