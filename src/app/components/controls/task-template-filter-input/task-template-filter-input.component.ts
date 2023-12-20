import {Component, forwardRef, Input, OnInit} from '@angular/core';
import {ControlValueAccessor, FormGroup, NG_VALUE_ACCESSOR} from "@angular/forms";
import {FieldItem, FilterModelItem} from "../../../transport-interfaces";
import {ApiService} from "../../../services/api.service";

@Component({
    selector: 'app-task-template-filter-input',
    templateUrl: './task-template-filter-input.component.html',
    styleUrls: ['./task-template-filter-input.component.scss'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => TaskTemplateFilterInputComponent),
            multi: true
        }
    ]
})
export class TaskTemplateFilterInputComponent implements OnInit, ControlValueAccessor {

    @Input() field?: FormGroup;
    controlValue: any;

    connectionTypes$ = this.api.getConnectionTypesList();
    adSources$ = this.api.getAdSourcesList();

    constructor(readonly api: ApiService) {
    }

    onChange = (value: any) => {
    };

    onTouched = () => {
    };

    ngOnInit(): void {
    }

    registerOnChange(fn: any): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: any): void {
        this.onTouched = fn;
    }

    writeValue(obj: any): void {
        this.controlValue = obj;
    }
}
