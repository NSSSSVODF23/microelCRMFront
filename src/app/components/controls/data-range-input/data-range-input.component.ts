import {Component, OnDestroy, OnInit} from '@angular/core';
import {ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR} from "@angular/forms";
import {filter, tap} from 'rxjs';
import {SubscriptionsHolder} from "../../../util";
import {DateRange, TimeFrame} from "../../../types/transport-interfaces";

@Component({
    selector: 'app-data-range-input',
    templateUrl: './data-range-input.component.html',
    styleUrls: ['./data-range-input.component.scss'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: DataRangeInputComponent,
            multi: true
        }
    ]
})
export class DataRangeInputComponent implements OnInit, OnDestroy, ControlValueAccessor {

    control = new FormControl<DateRange | null>(null);
    dropDownControl = new FormControl<TimeFrame | 'manual' | null>(null);
    calendarControl = new FormControl<[Date|null, Date|null] | null>(null);

    calendarVisible = false;

    rangeOptions: { label: string, value: TimeFrame | 'manual' }[] = [
        {label: 'Сегодня', value: TimeFrame.TODAY},
        {label: 'Вчера', value: TimeFrame.YESTERDAY},
        {label: 'Эта неделя', value: TimeFrame.THIS_WEEK},
        {label: 'Прошлая неделя', value: TimeFrame.LAST_WEEK},
        {label: 'Этот месяц', value: TimeFrame.THIS_MONTH},
        {label: 'Прошлый месяц', value: TimeFrame.LAST_MONTH},
        {label: 'Вручную', value: 'manual'}
    ];

    mainControlChange$ = this.control.valueChanges;
    selectTimeFrame$ = this.dropDownControl.valueChanges.pipe(filter(item => item !== 'manual'))
    selectManual$ = this.dropDownControl.valueChanges.pipe(filter(item => item === 'manual'))
    calendarChange$ = this.calendarControl.valueChanges;

    subscription = new SubscriptionsHolder()

    constructor() {
    }

    private static formatDate(date: Date | string): string {
        if (typeof date === 'string')
            date = new Date(date);
        return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
    }

    onChange = (value: any) => {
    }
    onTouched = () => {
    }

    setDisabledState(isDisabled: boolean) {
        if (isDisabled) {
            this.control.disable({emitEvent: false});
        } else {
            this.control.enable({emitEvent: false});
        }
    }

    ngOnInit(): void {
        this.subscription.addSubscription('change', this.mainControlChange$
            .pipe(
                tap(this.setManualLabel.bind(this))
            )
            .subscribe(value => this.onChange(value))
        );

        this.subscription.addSubscription('timeFrameSelected', this.selectTimeFrame$.subscribe((value) => {
            this.calendarVisible = false;
            if(value === null) {
                this.control.setValue(null);
                this.calendarControl.setValue(null);
                return;
            }
            this.control.setValue({timeFrame: value as TimeFrame, start: null, end: null});
        }))
        this.subscription.addSubscription('manualSelected', this.selectManual$.subscribe(() => {
            this.calendarVisible = true;
        }))
        this.subscription.addSubscription('calendarChange', this.calendarChange$.subscribe(value => {
            if(value && value[0] && value[1]){
                const DATE_RANGE = {timeFrame: null, start: value[0], end: value[1]};
                this.control.setValue(DATE_RANGE);
                this.calendarVisible = false;
            }
        }));
    }

    setManualLabel(value: DateRange | null) {
        if (value && value.start && value.end) {
            const MANUAL_ITEM = this.rangeOptions.find(i => i.value === 'manual');
            if (MANUAL_ITEM) {
                MANUAL_ITEM.label = DataRangeInputComponent.formatDate(value.start) + ' - ' + DataRangeInputComponent.formatDate(value.end);
                this.rangeOptions = [...this.rangeOptions];
            }
        } else {
            const MANUAL_ITEM = this.rangeOptions.find(i => i.value === 'manual');
            if (MANUAL_ITEM) {
                MANUAL_ITEM.label = 'Вручную';
                this.rangeOptions = [...this.rangeOptions];
            }
        }
    }

    ngOnDestroy(): void {
        this.subscription.unsubscribeAll();
    }

    registerOnChange(fn: any): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: any): void {
        this.onTouched = fn;
    }

    writeValue(obj: DateRange | null): void {
        this.setupDropdown(obj);
    }

    setupDropdown(value: DateRange | null){
        if(!value) {
            this.dropDownControl.setValue(null);
            this.calendarControl.setValue(null);
            return;
        }
        if (value.timeFrame){
            this.dropDownControl.setValue(value.timeFrame);
            this.calendarControl.setValue(null);
            return;
        }
        if(value.start && value.end){
            this.dropDownControl.setValue('manual');
            this.calendarControl.setValue([value.start, value.end]);
            return;
        }
    }

    clearIsUnselect() {
        if(!this.control.value) return;
        const {start, end} = this.control.value;
        if(!start || !end){
            this.dropDownControl.setValue(null);
            this.calendarControl.setValue(null);
        }
    }
}
