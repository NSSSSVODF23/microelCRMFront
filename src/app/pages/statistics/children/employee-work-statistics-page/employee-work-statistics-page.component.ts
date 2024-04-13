import {Component, OnInit} from '@angular/core';
import {DateRange, Employee, Statistics, WorkLog} from "../../../../types/transport-interfaces";
import {AutoUnsubscribe} from "../../../../decorators";
import {map, Observable, shareReplay, startWith, switchMap} from "rxjs";
import {ApiService} from "../../../../services/api.service";
import {BlockUiService} from "../../../../services/block-ui.service";
import {FormControl, FormGroup, Validators} from "@angular/forms";

@Component({
    templateUrl: './employee-work-statistics-page.component.html',
    styleUrls: ['./employee-work-statistics-page.component.scss']
})
@AutoUnsubscribe()
export class EmployeeWorkStatisticsPage implements OnInit {

    statisticsForm = new FormGroup({
        employees: new FormControl<string[] | null>(null, [Validators.required]),
        period: new FormControl<DateRange | null>(null, [Validators.required])
    });

    positionControl = new FormControl<number | null>(null);

    positions$: Observable<{ label: string, value: number | null }[]> = this.api.getPositions()
        .pipe(
            map(positions => {
                return positions.map(position => {
                    return {
                        label: position.name,
                        value: position.positionId
                    }
                })
            }),
            map(list => [{label: 'Все', value: null}, ...list]),
            shareReplay(1)
        );

    employees$: Observable<{ label: string, value: string }[]> = this.positionControl.valueChanges
        .pipe(
            startWith(null),
            switchMap(positionId => this.api.getEmployeesListFiltered({positionId, offsite: true, deleted: false})),
            map((employees: Employee[]) => {
                return employees.map(employee => {
                    return {
                        label: employee.fullName ?? "Неизвестный",
                        value: employee.login
                    }
                })
            }),
            shareReplay(1)
        );

    employeesChangeSub = this.employees$.subscribe(employees => {
        this.statisticsForm.patchValue({
            employees: employees.map(employee => employee.value)
        });
    });

    statisticsTable?: Statistics.EmployeeWorkStatisticsTable;

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

    zeroWorkLogDialogVisible = false;
    zeroWorkLogList: WorkLog[] = [];

    constructor(private api: ApiService, private blockService: BlockUiService) {
    }

    ngOnInit(): void {
    }

    openZeroWorkLogDialog(workLogs: WorkLog[]) {
        this.zeroWorkLogDialogVisible = true;
        this.zeroWorkLogList = workLogs;
    }

    getStatistics() {
        this.blockService.wait({message: 'Формирование статистики'})
        this.api.getEmployeeWorkStatistics(this.statisticsForm.value as Statistics.EmployeeWorkStatisticsForm)
            .subscribe({
                next: (statistics) => {
                    this.statisticsTable = statistics;
                    this.blockService.unblock();
                },
                error: () => this.blockService.unblock()
            })
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
