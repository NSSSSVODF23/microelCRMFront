import {Component, ElementRef, EventEmitter, forwardRef, Input, Output, ViewChild} from '@angular/core';
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from '@angular/forms';

@Component({
    selector: 'app-ip-input',
    styleUrls: ['./ip-input.component.scss'],
    templateUrl: './ip-input.component.html',
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => IpInputComponent),
            multi: true
        }
    ]
})
export class IpInputComponent implements ControlValueAccessor {

    _ipValue: number[] = []; // notice the '_'
    @Output() onBlur = new EventEmitter();
    @ViewChild('one') one!: ElementRef<HTMLInputElement>;
    @ViewChild('two') two!: ElementRef<HTMLInputElement>;
    @ViewChild('three') three!: ElementRef<HTMLInputElement>;
    @ViewChild('four') four!: ElementRef<HTMLInputElement>;

    get ipValue() {
        return this._ipValue.join('.');
    }

    @Input() set ipValue(val: string) {
        this._ipValue = this.ipFormat(val);
        this.propagateChange(this.ipValue);
        if(this.one) this.one.nativeElement.value = this._ipValue[0].toString();
        if(this.two) this.two.nativeElement.value = this._ipValue[1].toString();
        if(this.three) this.three.nativeElement.value = this._ipValue[2].toString();
        if(this.four) this.four.nativeElement.value = this._ipValue[3].toString();
    }

    ipFormat(value?: string) {
        if(!value) return [0,0,0,0];
        let octets = value.trim().split(".");
        return octets.map(octet => {
            let digit = parseInt(octet.replace(/\D/g, ""));
            if (isNaN(digit)) return 0;
            if (digit < 0) {
                return 0;
            } else if (digit > 255) {
                return 255;
            }
            return digit;
        }).slice(0, 4)
    }

    propagateChange = (_: any) => {
    };

    registerOnChange(fn: (value: any) => void) {
        this.propagateChange = fn;
    }

    registerOnTouched() {
    }

    writeValue(obj: string): void {
        if (obj) this.ipValue = "0.0.0.0";
        this.ipValue = obj;
    }

    octetChange(octetNum: number, event: Event) {
        const target: HTMLInputElement = <HTMLInputElement>event.target;
        this._ipValue[octetNum] = parseInt(target.value);
        this.ipValue = this._ipValue.join(".");
        target.value = this._ipValue[octetNum].toString();
    }

    octetFocus(event: FocusEvent) {
        const target: HTMLInputElement = <HTMLInputElement>event.target;
        target.select();
    }

    octetKeyUp(octetNum: number, event: KeyboardEvent) {
        const target: HTMLInputElement = <HTMLInputElement>event.target;
        if (event.key === " " || event.key === "," || event.key === "." || target.value.length === 3){
            if(octetNum === 0){
                this.two.nativeElement.focus();
            }else if(octetNum === 1){
                this.three.nativeElement.focus();
            }else if(octetNum === 2){
                this.four.nativeElement.focus();
            }
        }
    }
}

