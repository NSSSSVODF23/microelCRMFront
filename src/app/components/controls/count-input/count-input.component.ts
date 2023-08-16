import {Component, EventEmitter, forwardRef, OnDestroy, OnInit, Output} from '@angular/core';
import {ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR} from "@angular/forms";
import {SubscriptionsHolder} from "../../../util";
import {map, tap} from "rxjs";

@Component({
    selector: 'app-count-input',
    templateUrl: './count-input.component.html',
    styleUrls: ['./count-input.component.scss'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => CountInputComponent),
            multi: true
        }
    ]
})
export class CountInputComponent implements OnInit, OnDestroy, ControlValueAccessor {

    control = new FormControl(0);
    @Output() onZero = new EventEmitter();
    subscriptions = new SubscriptionsHolder();

    constructor() {
    }

    onChange = (value: number) => {
    };

    onTouched = () => {
    };

    add(count = 1) {
        this.control.setValue((this.control.value ?? 0) + count);
    }

    remove(count = 1) {
        this.control.setValue((this.control.value ?? 0) - count);
    }

    ngOnInit(): void {
        this.subscriptions.addSubscription('cgVl',
            this.control.valueChanges
                .pipe(
                    map(value => {
                        if (typeof value === 'number' && !isNaN(value) && value >= 0) {
                            return value;
                        }
                        this.control.setValue(0, {emitEvent: false});
                        return 0;
                    }),
                    tap(value => value === 0 && this.onZero.emit()),
                )
                .subscribe((value) => this.onChange((value as number)))
        )
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribeAll();
    }

    registerOnChange(fn: any): void {
        this.onChange = fn
    }

    registerOnTouched(fn: any): void {
        this.onTouched = fn
    }

    setDisabledState(isDisabled: boolean): void {
        if (isDisabled) {
            this.control.disable({emitEvent: false});
        } else {
            this.control.enable({emitEvent: false});
        }
    }

    writeValue(obj: any): void {
        if (obj === undefined || obj === null || typeof obj !== 'number' || isNaN(obj)) {
            this.control.setValue(0, {emitEvent: false});
            return;
        }
        this.control.setValue(obj, {emitEvent: false});
    }

}
