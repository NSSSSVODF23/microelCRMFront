import {Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild} from '@angular/core';
import {ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR} from "@angular/forms";
import {SubscriptionsHolder} from "../../../../util";
import {debounceTime, distinctUntilChanged, Subject, switchMap} from "rxjs";
import {ApiService} from "../../../../services/api.service";
import {Address} from "../../../../transport-interfaces";
import {Overlay} from "primeng/overlay";

@Component({
    selector: 'app-address-input',
    templateUrl: './address-input.component.html',
    styleUrls: ['./address-input.component.scss'],
    providers: [{
        provide: NG_VALUE_ACCESSOR, useExisting: AddressInputComponent, multi: true
    }]
})
export class AddressInputComponent implements OnInit, ControlValueAccessor, OnDestroy {
    @Input() isAcpConnected: boolean | null = null;
    @Input() isHouseOnly = false;
    @Input() inputClasses: { [key: string]: boolean } = {};
    @Output() onBlur = new EventEmitter<void>();
    subscriptions: SubscriptionsHolder = new SubscriptionsHolder();
    disabled = false;
    control = new FormControl<Address | null>(null);
    changeInput = new Subject<string>();
    suggestions$ = this.changeInput.pipe(debounceTime(500), distinctUntilChanged(), switchMap(value => {
        return this.api.getAddressSuggestions(value, this.isAcpConnected, this.isHouseOnly)
    }))

    constructor(readonly api: ApiService) {
    }

    onChange = (value: Address | null) => {
    };

    onTouched = () => {
    };

    ngOnInit(): void {
        this.subscriptions.addSubscription('chn', this.control.valueChanges
            .pipe(distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)))
            .subscribe(address => {
                this.onChange(address);
            }))
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
        this.disabled = isDisabled;
    }

    writeValue(obj: Address | null): void {
        this.control.setValue(obj);
    }
}
