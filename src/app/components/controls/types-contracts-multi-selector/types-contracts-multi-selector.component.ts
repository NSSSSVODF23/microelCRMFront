import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR} from "@angular/forms";
import {Employee, TypesOfContractsSuggestion} from "../../../types/transport-interfaces";
import {SubscriptionsHolder} from "../../../util";
import {EmployeeAttributesOptions} from "../employee-multiply-selector/employee-multiply-selector.component";
import {ApiService} from "../../../services/api.service";
import {RealTimeUpdateService} from "../../../services/real-time-update.service";
import {delay, Subject, switchMap} from "rxjs";

@Component({
    selector: 'app-types-contracts-multi-selector',
    templateUrl: './types-contracts-multi-selector.component.html',
    styleUrls: ['./types-contracts-multi-selector.component.scss'],
    providers: [{
        provide: NG_VALUE_ACCESSOR, useExisting: TypesContractsMultiSelectorComponent, multi: true
    }]
})
export class TypesContractsMultiSelectorComponent implements OnInit, OnDestroy, ControlValueAccessor {

    querySubject = new Subject<string>();
    typesOfContracts$ = this.querySubject.pipe(switchMap(query => this.api.getContractTypesSuggestionList(query)));
    control = new FormControl<TypesOfContractsSuggestion[]>([]);
    isDisabled = false;
    subscriptions = new SubscriptionsHolder();

    @Output() onAfterChange = new EventEmitter<TypesOfContractsSuggestion[]>();

    constructor(private api: ApiService) {
    }

    onChange = (value: TypesOfContractsSuggestion[]) => {
    }
    onTouched = () => {
    }

    ngOnInit(): void {
        this.subscriptions.addSubscription('ch', this.control.valueChanges.subscribe(value => this.onChange(value ?? [])));
        this.subscriptions.addSubscription('ach', this.control.valueChanges.pipe(delay(100)).subscribe(value => this.onAfterChange.emit(value ?? [])));
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
        this.isDisabled = isDisabled;
    }

    writeValue(obj: any): void {
        if(!Array.isArray(obj)){
            this.control.setValue([])
            return;
        }
        this.control.setValue(obj?obj:[]);
    }

}
