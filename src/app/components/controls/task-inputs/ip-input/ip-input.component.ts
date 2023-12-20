import {
    Component,
    EventEmitter,
    forwardRef,
    Inject, Injector,
    INJECTOR, Input,
    OnDestroy,
    OnInit,
    Optional,
    Output,
    Self
} from '@angular/core';
import {
    AbstractControl, AsyncValidator, AsyncValidatorFn,
    ControlValueAccessor,
    FormArray,
    FormControl,
    FormGroup, NG_ASYNC_VALIDATORS,
    NG_VALIDATORS,
    NG_VALUE_ACCESSOR, NgControl, ValidationErrors, Validator, ValidatorFn
} from '@angular/forms';
import {map, Subscription} from "rxjs";

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
export class IpInputComponent implements ControlValueAccessor, OnInit, OnDestroy {

    @Input() inputClasses: {[key:string]:boolean} = {};
    @Output() onBlur = new EventEmitter();
    control1 = new FormControl(0);
    control2 = new FormControl(0);
    control3 = new FormControl(0);
    control4 = new FormControl(0);
    formGroup = new FormGroup({octets:new FormArray([this.control1, this.control2, this.control3, this.control4])});
    subscription?: Subscription;
    updateValue = "";

    constructor() {
    }

    setDisabledState(isDisabled: boolean) {
        if (isDisabled) {
            this.formGroup.disable({emitEvent: false});
        } else {
            this.formGroup.enable({emitEvent: false});
        }
    }

    parseString(value?: string) {
        if (!value) return [0, 0, 0, 0];
        return value
            .trim()
            .split(".")
            .map(octet => {
                let digit = parseInt(octet.replace(/\D/g, ""));
                return isNaN(digit) ? 0 : digit;
            })
            .slice(0, 4);
    }

    onChange = (_: any) => {
    };
    onTouch = () => {
    }

    registerOnChange(fn: (value: any) => void) {
        this.onChange = fn;
    }

    registerOnTouched(fn: ()=>void) {
        this.onTouch = fn;
    }

    writeValue(obj?: string | any[]): void {
        if (obj) {
            if (typeof obj === "string") {
                obj = this.parseString(obj);
            }
            if (obj.length !== 4) {
                obj = [0, 0, 0, 0];
            }
            this.formGroup.patchValue({octets:this.mapOctets(obj)});
            this.updateValue = obj.join(".");
        }
    }

    mapOctets(octets: any[]) {
        return octets.map(octet => {
            octet = parseInt(octet);
            if (typeof octet !== "number" || isNaN(octet)) return 0;
            return Math.min(Math.max(0, octet), 255)
        })
    }

    octetFocus(event: FocusEvent) {
        const target: HTMLInputElement = <HTMLInputElement>event.target;
        target.select();
    }

    ngOnInit(): void {
        this.subscription = this.formGroup.valueChanges.pipe(map(value => {
            let octets = value.octets;
            if(octets === undefined) {
                this.formGroup.patchValue({octets: [0, 0, 0, 0]}, {emitEvent: false});
                return "0.0.0.0";
            }
            octets = this.mapOctets(octets);
            this.formGroup.patchValue({octets}, {emitEvent: false, onlySelf: true});
            return octets.join(".")
        })).subscribe(value => {
            this.onChange(value === "0.0.0.0" ? null : value);
        })
    }

    ngOnDestroy(): void {
        this.subscription?.unsubscribe();
    }

    focusNext(event: Event, next: HTMLInputElement) {
        const target = (event.target as HTMLInputElement)
        let value = target.value;
        if(value.length === 3) {
            next.focus();
        }
    }
}

