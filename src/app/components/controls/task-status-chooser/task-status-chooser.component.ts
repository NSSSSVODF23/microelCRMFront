import {Component, OnInit} from '@angular/core';
import {ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR} from "@angular/forms";
import {TaskStatus} from "../../../types/transport-interfaces";

@Component({
    selector: 'app-task-status-chooser',
    templateUrl: './task-status-chooser.component.html',
    styleUrls: ['./task-status-chooser.component.scss'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            multi: true,
            useExisting: TaskStatusChooserComponent
        }
    ]
})
export class TaskStatusChooserComponent implements OnInit, ControlValueAccessor {
    chooserControl = new FormControl([] as string[]);
    options = [{
        name: "Активные",
        value: TaskStatus.ACTIVE
    }, {
        name: "У монтажников",
        value: TaskStatus.PROCESSING
    }, {
        name: "Закрытые",
        value: TaskStatus.CLOSE
    }];

    constructor() {
    }

    onChange: (value: string[]) => void = () => {
    }

    onTouched: () => void = () => {
    }

    ngOnInit(): void {
        this.chooserControl.valueChanges.subscribe(value => {
            if (value) {
                this.onChange(value);
            } else {
                this.onChange([]);
            }
        });
    }

    registerOnChange(fn: any): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: any): void {
        this.onTouched = fn;
    }

    setDisabledState(isDisabled: boolean) {
        if (isDisabled) {
            this.chooserControl.disable({emitEvent: false });
        } else {
            this.chooserControl.enable({emitEvent: false });
        }
    }

    writeValue(obj: string[]): void {
        if (!obj) {
            this.chooserControl.setValue([]);
            return;
        }
        this.chooserControl.setValue(obj)
    }

}
