import {Component, OnInit, ViewChild} from '@angular/core';
import {ApiService} from "../../../../services/api.service";
import {AutoUnsubscribe} from "../../../../decorators";
import {RealTimeUpdateService} from "../../../../services/real-time-update.service";
import {
    BehaviorSubject,
    combineLatest,
    debounceTime,
    distinctUntilChanged,
    filter,
    map,
    of,
    startWith,
    switchMap,
    tap
} from "rxjs";
import {TemperatureRange, TemperatureSensor} from "../../../../types/sensors-types";
import {DateRange, EventType, TimeFrame} from "../../../../types/transport-interfaces";
import {DynamicValueFactory} from "../../../../util";
import {ConfirmationService} from "primeng/api";
import {BlockUiService} from "../../../../services/block-ui.service";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {UIChart} from "primeng/chart";

@Component({
    templateUrl: './topology-sensors-page.component.html',
    styleUrls: ['./topology-sensors-page.component.scss']
})
@AutoUnsubscribe()
export class TopologySensorsPage implements OnInit {

    appendTemperature$ = this.rt.receiveSensorUpdateEvent()
        .pipe(
            filter(event => event.eventType === EventType.CREATE),
            map((event) => event.data)
        )
    updateTemperature$ = this.rt.receiveSensorUpdateEvent()
        .pipe(
            filter(event => event.eventType === EventType.UPDATE),
            map((event) => event.data),
            tap((sensor: TemperatureSensor) => {
                if (sensor.temperatureSensorId === this.selectedTemperatureSensor$.value?.temperatureSensorId) {
                    this.selectedTemperatureSensor$.next(sensor);
                }
            })
        )
    deleteTemperature$ = this.rt.receiveSensorUpdateEvent()
        .pipe(
            filter(event => event.eventType === EventType.DELETE),
            map((event) => event.data)
        )
    temperatureSensors$ = DynamicValueFactory.of(this.api.getTemperatureSensors(),
        'temperatureSensorId', this.appendTemperature$, this.updateTemperature$, this.deleteTemperature$);
    @ViewChild('tempSensorSignalChart') tempSensorSignalChart?: UIChart;
    selectedTemperatureSensor$ = new BehaviorSubject<TemperatureSensor | null>(null);

    distinctTempSens$ = this.selectedTemperatureSensor$.pipe(distinctUntilChanged((a, b) => a?.temperatureSensorId === b?.temperatureSensorId));
    temperatureSensorDialogVisible = false;
    tempSensorChartDateRange = new FormControl<DateRange | null>({timeFrame: TimeFrame.TODAY});
    tempSensorChartDateRangeChange$ = this.tempSensorChartDateRange.valueChanges.pipe(startWith(this.tempSensorChartDateRange.value));
    updateTempSensorChart$ = new BehaviorSubject(true);
    tempSensorChartOptions$ = this.distinctTempSens$.pipe(map(this.generateTemperatureChartOptions.bind(this)));
    isTempSensorChartLoading = true;
    tempSensorChartData$ = combineLatest([this.distinctTempSens$, this.tempSensorChartDateRangeChange$, this.updateTempSensorChart$])
        .pipe(
            debounceTime(100),
            tap(() => this.isTempSensorChartLoading = true),
            switchMap(([sensor, dateRange]) => {
                if (!sensor) return of({label: "", data: []});
                return this.api.getTemperatureSensorChart(sensor.temperatureSensorId, dateRange ?? {timeFrame: TimeFrame.THIS_WEEK} as DateRange)
            }),
            tap((dataSet) => {
                this.isTempSensorChartLoading = false;
                this.tempSensorSignalChart?.chart.reset();
            }),
        );

    temperatureRangeForm = new FormGroup({
        name: new FormControl('', [Validators.required]),
        color: new FormControl('#0000FF', [Validators.required]),
        minTemp: new FormControl(0, [Validators.required]),
        maxTemp: new FormControl(0, [Validators.required]),
    })
    tempRangeDialogVisible = false;
    editedTemperatureRange: TemperatureRange | null = null;

    constructor(private api: ApiService, private rt: RealTimeUpdateService, private blockUi: BlockUiService,
                private confirmationService: ConfirmationService) {
    }

    ngOnInit(): void {

    }

    openAppendTempRange() {
        this.tempRangeDialogVisible = true;
        this.editedTemperatureRange = null;
        this.temperatureRangeForm.reset({
            name: '',
            color: '#0000FF',
            minTemp: 0,
            maxTemp: 0
        })
    }

    openEditTempRange(range: TemperatureRange) {
        this.tempRangeDialogVisible = true;
        this.editedTemperatureRange = range;
        this.temperatureRangeForm.reset({
            name: range.name,
            color: range.color,
            minTemp: range.minTemp,
            maxTemp: range.maxTemp
        })
    }

    appendTempRange() {
        const sensor = this.selectedTemperatureSensor$.value;
        if (sensor) {
            this.api.appendTemperatureRange(sensor.temperatureSensorId, this.temperatureRangeForm.value as Partial<TemperatureRange>)
                .subscribe(() => {
                    this.tempRangeDialogVisible = false;
                })
        }
    }

    editTempRange() {
        if(this.editedTemperatureRange){
            this.blockUi.wait({
                message: "Сохранение диапазона температур..."
            })
            this.api.editTemperatureRange(this.editedTemperatureRange.temperatureRangeId, this.temperatureRangeForm.value as Partial<TemperatureRange>)
                .subscribe({
                    next: () => {
                        this.blockUi.unblock();
                        this.tempRangeDialogVisible = false;
                    },
                    error: () => this.blockUi.unblock()
                });
        }
    }

    removeTempRange(range: TemperatureRange) {
        this.confirmationService.confirm({
            header: "Удаление диапазона температур",
            message: `Вы действительно хотите удалить диапазон ${range.name}?`,
            accept: () => {
                const sensor = this.selectedTemperatureSensor$.value;
                this.blockUi.wait({
                    message: "Удаление диапазона температур..."
                })
                if (sensor) {
                    this.api.deleteTemperatureRange(range.temperatureRangeId)
                        .subscribe({
                            next: () => this.blockUi.unblock(),
                            error: () => this.blockUi.unblock()
                        });
                }
            }
        });
    }

    openTemperatureSensorDialog(event: Event, sensor: TemperatureSensor) {
        event.preventDefault();
        this.selectedTemperatureSensor$.next(sensor);
        this.updateTempSensorChart$.next(true);
        this.temperatureSensorDialogVisible = true;
    }

    deleteTemperatureSensor(event: Event, sensor: TemperatureSensor) {
        event.stopPropagation();
        this.confirmationService.confirm({
            header: "Удаление датчика",
            message: `Вы действительно хотите удалить датчик ${sensor.name}?`,
            accept: () => {
                this.blockUi.wait({message: "Удаление датчика..."});
                this.api.deleteTemperatureSensor(sensor.temperatureSensorId)
                    .subscribe({
                        next: () => {
                            this.blockUi.unblock();
                        },
                        error: () => {
                            this.blockUi.unblock();
                        }
                    });
            }
        })
    }

    resetTempSensorZoom() {
        this.tempSensorSignalChart?.chart.resetZoom();
    }

    private generateTemperatureChartOptions(sensor: TemperatureSensor | null) {
        const annotations:any = {};
        if(sensor?.ranges && sensor.ranges.length > 0) {
            sensor.ranges.forEach(range => {
                annotations['box'+range.temperatureRangeId] = {
                    type: 'box',
                    yMin: range.minTemp,
                    yMax: range.maxTemp,
                    backgroundColor: range.color+"30",
                    borderWidth: 0,
                    label: {
                        display: true,
                        content: range.name,
                        position: 'start',
                        backgroundColor: 'transparent',
                        color: range.color,
                        xAdjust: 5,
                        yAdjust: 5
                    }
                }
            })
        }
        console.log(annotations);
        return  {
            elements: {
                line: {
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
                    suggestedMin: 0,
                        // suggestedMax: -20,
                        ticks: {
                        callback: this.tempVal
                    }
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
                    annotations
                }
            }
        };
    }

    private tempVal(value: number) {
        return value + " °C";
    }

    private getLine(val: number, label: string, color: string) {
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
