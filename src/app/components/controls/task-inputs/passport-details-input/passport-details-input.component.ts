import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {ControlValueAccessor, FormControl, FormGroup, NG_VALUE_ACCESSOR} from "@angular/forms";
import {Address} from "../../../../types/transport-interfaces";
import {Subscription} from "rxjs";

@Component({
    selector: 'app-passport-details-input',
    templateUrl: './passport-details-input.component.html',
    styleUrls: ['./passport-details-input.component.scss'],
    providers: [{
        provide: NG_VALUE_ACCESSOR, useExisting: PassportDetailsInputComponent, multi: true
    }]
})
export class PassportDetailsInputComponent implements OnInit, OnDestroy, ControlValueAccessor {

    @Input() inputClasses: { [key: string]: boolean } = {};
    @Output() onBlur = new EventEmitter<void>();
    dataForm = new FormGroup({
        passportSeries: new FormControl(""),
        passportNumber: new FormControl(""),
        passportIssuedDate: new FormControl<Date | null>(null),
        passportIssuedBy: new FormControl(""),
        departmentCode: new FormControl(""),
        registrationAddress: new FormControl("")
    })
    disabled = false;
    changeSubscription?: Subscription;

    onChange = (value: any) => {
    };

    onTouched = () => {
    };

    constructor() {
    }

    ngOnInit(): void {
        this.changeSubscription = this.dataForm.valueChanges.subscribe(data=>this.onChange(data));
    }

    ngOnDestroy() {
        this.changeSubscription?.unsubscribe();
    }

    registerOnChange(fn: any): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: any): void {
        this.onTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        this.disabled = isDisabled;
    }

    writeValue(obj: any): void {
        if(!!obj){
            this.dataForm.patchValue({
                passportSeries: obj.passportSeries ?? "",
                passportNumber: obj.passportNumber ?? "",
                passportIssuedBy: obj.passportIssuedBy ?? "",
                passportIssuedDate: obj.passportIssuedDate ? new Date(obj.passportIssuedDate) : null,
                departmentCode: obj.departmentCode ?? "",
                registrationAddress: obj.registrationAddress ?? ""
            });
        }else{
            this.dataForm.patchValue({
                passportSeries: "",
                passportNumber: "",
                passportIssuedBy: "",
                passportIssuedDate: null,
                departmentCode: "",
                registrationAddress: ""
            });
        }
    }

}
