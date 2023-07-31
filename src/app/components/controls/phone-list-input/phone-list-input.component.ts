import {AfterViewInit, Component, EventEmitter, forwardRef, OnInit, Output} from '@angular/core';
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from "@angular/forms";
import {v4} from "uuid";
import {KeyValue} from "@angular/common";

@Component({
    selector: 'app-phone-list-input',
    templateUrl: './phone-list-input.component.html',
    styleUrls: ['./phone-list-input.component.scss'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => PhoneListInputComponent),
            multi: true
        }
    ]
})
export class PhoneListInputComponent implements OnInit, ControlValueAccessor, AfterViewInit {

    controlValue: { [key: string]: string; } = {};
    disable = false;

    @Output() onBlur = new EventEmitter();

    constructor() {
    }

    get count() {
        if (!this.controlValue) return 0;
        return Object.keys(this.controlValue).length;
    }

    setDisabledState(isDisabled: boolean) {
        this.disable = isDisabled;
    }

    ngAfterViewInit(): void {

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

    appendPhone() {
        if (!this.controlValue) this.controlValue = {};
        const id = v4();
        this.controlValue[id] = "";
        this.onChange(this.controlValue);
    }

    removePhone(id: string) {
        if (!this.controlValue) return;
        delete this.controlValue[id];
        this.onChange(this.controlValue);
    }

    valuesTrack(index: number, keyValue: KeyValue<string, string>) {
        return keyValue.key;
    }
}
