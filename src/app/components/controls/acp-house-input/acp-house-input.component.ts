import {Component, forwardRef, OnDestroy, OnInit} from '@angular/core';
import {ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR} from "@angular/forms";
import {ApiService} from "../../../services/api.service";
import {debounceTime, repeat, shareReplay, Subject, switchMap} from "rxjs";
import {AcpHouse} from "../../../types/transport-interfaces";
import {SubscriptionsHolder} from "../../../util";

@Component({
    selector: 'app-acp-house-input',
    templateUrl: './acp-house-input.component.html',
    styleUrls: ['./acp-house-input.component.scss'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => AcpHouseInputComponent),
            multi: true
        }
    ]
})
export class AcpHouseInputComponent implements OnInit, OnDestroy, ControlValueAccessor {

    control = new FormControl<AcpHouse | null>(null);
    queryInput = new Subject<string>();
    suggestions$ = this.queryInput.pipe(
        debounceTime(500),
        switchMap((query) => this.api.getBuildings(query)),
        repeat(),
        shareReplay(1),
    )
    subscriptions: SubscriptionsHolder = new SubscriptionsHolder();

    constructor(private api: ApiService) {
    }

    onChange = (_: any) => {
    }

    onTouched = () => {
    }

    ngOnInit(): void {
        this.subscriptions.addSubscription("chng", this.control.valueChanges.subscribe(
            (value) => {
                this.onChange(value);
            }
        ))
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribeAll();
    }

    registerOnChange(fn: any): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: any): void {
        this.onTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        if (isDisabled) {
            this.control.disable({emitEvent: false});
        } else {
            this.control.enable({emitEvent: false});
        }
    }

    writeValue(obj: any): void {
        this.control.patchValue(obj)
    }
}
