import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR} from "@angular/forms";
import {Employee} from "../../../types/transport-interfaces";
import {SubscriptionsHolder} from "../../../util";
import {ApiService} from "../../../services/api.service";
import {RealTimeUpdateService} from "../../../services/real-time-update.service";
import {merge, startWith, switchMap} from "rxjs";

export type EmployeeAttributesOptions = {
    showDeleted?: boolean,
    showOffsite?: boolean
}

@Component({
    selector: 'app-employee-multiply-selector',
    templateUrl: './employee-multiply-selector.component.html',
    styleUrls: ['./employee-multiply-selector.component.scss'],
    providers: [{
        provide: NG_VALUE_ACCESSOR, useExisting: EmployeeMultiplySelectorComponent, multi: true
    }]
})
export class EmployeeMultiplySelectorComponent implements OnInit, OnDestroy, ControlValueAccessor {

    @Input() set options(value: EmployeeAttributesOptions){
        this._options = value;
        this.initEmployeeLoader()
    }
    _options: EmployeeAttributesOptions = {}

    employees: Employee[] = [];
    employeesSuggestions: Employee[] = [];
    control = new FormControl<Employee[]>([]);
    isDisabled = false;
    subscriptions = new SubscriptionsHolder();

    constructor(private api: ApiService, private rt: RealTimeUpdateService) {
    }

    onChange = (value: Employee[]) => {}
    onTouched = () => {}

    ngOnInit(): void {
        this.subscriptions.addSubscription('chg',  this.control.valueChanges.subscribe(value=>this.onChange(value?value:[])));
        this.initEmployeeLoader();
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

    search(query: string) {
        this.employeesSuggestions = this.employees.filter(e => e.fullName?.toLowerCase().includes(query.toLowerCase()));
    }

    initEmployeeLoader(){
        const employeeLoad$ = merge(this.rt.employeeCreated(), this.rt.employeeUpdated(), this.rt.employeeDeleted())
            .pipe(
                startWith(null),
                switchMap(() => this.api.getEmployees(undefined, this._options.showDeleted, this._options.showOffsite))
            )
        this.subscriptions.addSubscription('employees', employeeLoad$.subscribe(employees => this.employees = employees))
    }
}
