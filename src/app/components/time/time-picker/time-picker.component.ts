import {Component, OnInit} from '@angular/core';
import {OnElementInit} from "../../../decorators";
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from "@angular/forms";

const TIMEZONE_OFFSET = 10800000;

@Component({
    selector: 'app-time-picker',
    templateUrl: './time-picker.component.html',
    styleUrls: ['./time-picker.component.scss'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: TimePickerComponent,
            multi: true
        }
    ]
})
export class TimePickerComponent implements OnInit, ControlValueAccessor {

    initialDate = new Date();
    timeOffset = 0;
    value = 0;

    thumbStyle: Partial<CSSStyleDeclaration> = {};
    isDisabled = false;
    wrapper?: HTMLDivElement;

    constructor() {
    }

    get time() {
        const hours = Math.floor(this.value / 3600000);
        const minutes = Math.floor((this.value - hours * 3600000) / 60000);
        return `${hours < 10 ? '0' + hours : hours}:${minutes < 10 ? '0' + minutes : minutes}`;
    }

    onChange = (value: Date) => {
    }

    onTouched = () => {
    }

    writeValue(obj: Date): void {
        this.initialDate = obj ? obj : new Date();
        this.updateDate();
    }

    registerOnChange(fn: any): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: any): void {
        this.onTouched = fn;
    }

    setDisabledState?(isDisabled: boolean): void {
        this.isDisabled = isDisabled;
    }

    ngOnInit(): void {
    }

    @OnElementInit("wrapper")
    wrapperInit(wrapper: HTMLDivElement) {
        this.wrapper = wrapper;
        this.updateThumbStyle(this.value);
    }

    changeValue(value: number) {
        const extraMinutes = this.value % 600000;
        if(extraMinutes > 0) this.value += 600000 - extraMinutes;
        this.changeTime();
    }

    private updateDate() {
        this.timeOffset = this.initialDate.getTime() % 86400000;
        this.value = this.timeOffset + TIMEZONE_OFFSET;
        this.changeTime();
    }

    private changeTime() {
        this.onChange(new Date((this.initialDate.getTime()-(this.timeOffset+TIMEZONE_OFFSET))+this.value));
        this.updateThumbStyle(this.value);
    }

    private updateThumbStyle(value: number) {
        if(!this.wrapper) return;
        const {width} = this.wrapper.getBoundingClientRect();
        const THUMB_POS = value / 86340000 * width;
        this.thumbStyle = {
            bottom: '1rem',
            left: `${THUMB_POS}px`,
            transform: 'translateX(-50%)'
        }
    }
}
