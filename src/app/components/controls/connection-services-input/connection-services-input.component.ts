import {Component, EventEmitter, forwardRef, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {debounceTime, map, mergeMap, Subject, Subscription} from "rxjs";
import {ApiService} from "../../../services/api.service";
import {ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR} from "@angular/forms";

@Component({
    selector: 'app-connection-services-input',
    templateUrl: './connection-services-input.component.html',
    styleUrls: ['./connection-services-input.component.scss'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => ConnectionServicesInputComponent),
            multi: true
        }
    ]
})
export class ConnectionServicesInputComponent implements OnInit, ControlValueAccessor, OnDestroy {
    control = new FormControl<{ label: string, value: string }[]>([]);
    changeValueSubscription?: Subscription;

    connectionServicesSuggestions = new Subject<string>();

    connectionServices$ = this.connectionServicesSuggestions.pipe(
        debounceTime(500),
        mergeMap(query => query ? this.api.getConnectionServicesSuggestionsList(query) : this.api.getConnectionServicesList())
    );
    @Input() isDisabled = false;
    @Input() inputClasses: {[key:string]:boolean} = {};
    @Output() changeIsDisabled = new EventEmitter<boolean>();

    @Output() onBlur = new EventEmitter();

    constructor(private api: ApiService) {
    }

    onChange = (val: any) => {

    }

    onTouched = () => {

    }

    ngOnInit(): void {
        this.changeValueSubscription = this.control.valueChanges
            .pipe(
                map(arr =>
                    arr ? arr.map(cs => ({connectionService: cs.value})) : []
                )
            )
            .subscribe(val => this.onChange(val));
    }

    ngOnDestroy(): void {
        this.changeValueSubscription?.unsubscribe();
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

    writeValue(obj: { connectionService: string }[]): void {
        this.api.getConnectionServicesList()
            .pipe(
                map(arr => {
                    return obj ? obj.map(v => {
                        return arr.find(av => av.value === v.connectionService)
                    }).filter(v=>v !== undefined) : [];
                })
            )
            .subscribe((val: any) => {
                this.control.setValue(val);
            })
    }

}
