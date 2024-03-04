import {Component, EventEmitter, forwardRef, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {ControlValueAccessor, FormControl, FormGroup, NG_VALUE_ACCESSOR, Validators} from "@angular/forms";
import {fromEvent, Subscription} from "rxjs";
import {ApiService} from "../../../../services/api.service";
import {Address} from "../../../../types/transport-interfaces";
import {SubscriptionsHolder} from "../../../../util";

@Component({
    selector: 'app-counting-lives-input',
    templateUrl: './counting-lives-input.component.html',
    styleUrls: ['./counting-lives-input.component.scss'],
    providers: [{provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => CountingLivesInputComponent), multi: true}]
})
export class CountingLivesInputComponent implements OnInit, OnDestroy, ControlValueAccessor {

    addressCounterLivesForm = new FormGroup({
        address: new FormControl<Address | null>(null, Validators.required),
        startApart: new FormControl<number | null>(null, Validators.required),
        endApart: new FormControl<number | null>(null, Validators.required),
    });
    control = new FormControl("");
    isDisabled = false;
    isLoading = false;
    @Input() inputClasses: {[key:string]:boolean} = {};
    @Output() onBlur = new EventEmitter();
    subscriptions: SubscriptionsHolder = new SubscriptionsHolder();

    constructor(private api: ApiService) {
    }

    onChange = (value: string) => {
    };

    onTouched = () => {
    };

    ngOnInit(): void {
        this.subscriptions.addSubscription('chng', this.control.valueChanges.subscribe(value => {
            this.onChange(value ?? "");
            this.onTouched();
        }));
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribeAll()
    }

    registerOnChange(fn: any): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: any): void {
        this.onTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        this.isDisabled = isDisabled;
    }

    writeValue(obj: any): void {
        if (!obj) return;
        this.control.setValue(obj);
    }

    getCalculation() {
        if (this.addressCounterLivesForm.invalid) return;
        this.isLoading = true;
        const {address, startApart, endApart} = this.addressCounterLivesForm.value;
        this.api.getCountingLivesCalculation({address:address!, startApart: startApart!, endApart: endApart!}).subscribe({
            next: (res) => {
                this.isLoading = false;
                this.control.setValue(this.control.value + " " + res.result);
            }, error: () => {
                this.isLoading = false;
            }
        });
    }
}
