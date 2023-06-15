import {Component, OnDestroy, OnInit} from '@angular/core';
import {Employee} from "../../../transport-interfaces";
import {ApiService} from "../../../services/api.service";
import {ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR} from "@angular/forms";

@Component({
    selector: 'app-employee-selector',
    templateUrl: './employee-selector.component.html',
    styleUrls: ['./employee-selector.component.scss'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: EmployeeSelectorComponent,
            multi: true
        }
    ]
})
export class EmployeeSelectorComponent implements OnInit, OnDestroy, ControlValueAccessor {

    employees: Employee[] = [];
    control = new FormControl<string | null>(null);

    constructor(private api: ApiService) {
    }

    onChange = (value: string | null) => {

    }

    onTouched = () => {

    }

    ngOnInit(): void {
        this.api.getEmployees().subscribe(employees => {
            this.employees = employees;
        })
        this.control.valueChanges.subscribe(value => {
            this.onChange(value);
        })
    }

    ngOnDestroy(): void {
    }

    setDisabledState(isDisabled: boolean) {
        if(isDisabled) {
            this.control.disable({ emitEvent: false });
        } else {
            this.control.enable({ emitEvent: false });
        }
    }

    registerOnChange(fn: any): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: any): void {
        this.onTouched = fn;
    }

    writeValue(obj: any): void {
        if(!obj) {
            this.control.setValue(null);
            return;
        }
        this.control.setValue(obj);
    }

}
