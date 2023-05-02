import {Component, forwardRef, Input, OnInit} from '@angular/core';
import {FieldItem, ModelItem} from "../../../transport-interfaces";
import {ApiService} from "../../../services/api.service";
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from "@angular/forms";

@Component({
    selector: 'app-task-template-input',
    templateUrl: './task-template-input.component.html',
    styleUrls: ['./task-template-input.component.scss'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => TaskTemplateInputComponent),
            multi: true
        }
    ]
})
export class TaskTemplateInputComponent implements OnInit, ControlValueAccessor {
    @Input() field?: FieldItem | ModelItem;
    controlValue: any;
    @Input() isExample: boolean = false;

    get type() {
        if(!this.field) return '';
        if('type' in this.field) return this.field.type;
        else if('wireframeFieldType' in this.field) return this.field.wireframeFieldType;
        return '';
    }

    constructor(readonly api: ApiService) {
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

    onChange = (value: any) => {
    };

    onTouched = () => {
    };

    ngOnInit(): void {
    }

    isName(field: any) {
       return 'name' in field;
    }

    setName(event: string) {
        if(this.field && 'name' in this.field) this.field.name = event
    }
}
