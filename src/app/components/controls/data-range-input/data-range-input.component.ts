import {Component, OnDestroy, OnInit} from '@angular/core';
import {ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR} from "@angular/forms";
import {map, tap} from 'rxjs';
import {SubscriptionsHolder, Utils} from "../../../util";
import {DateRange} from "../../../transport-interfaces";

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

    control: FormControl<Date[] | null> = new FormControl(null);
    subscription = new SubscriptionsHolder()

    constructor() {
    }

    onChange = (value: any) => {
    }

    onTouched = () => {
    }

    setDisabledState(isDisabled: boolean) {
        if (isDisabled) {
            this.control.disable({ emitEvent: false });
        } else {
            this.control.enable({ emitEvent: false });
        }
    }

    ngOnInit(): void {
        this.subscription.addSubscription('change', this.control.valueChanges
            .pipe(
                map(value => Utils.dateArrayToRange(value)),
            )
            .subscribe(value => this.onChange(value))
        );
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
        if (!obj) {
            this.control.setValue(null);
            return;
        }
        const range = [] as Date[];
        if(obj.start){
            range[0] = new Date(obj.start);
        }
        if(obj.end){
            range[1] = new Date(obj.end);
        }
        this.control.setValue(range);
    }

}
