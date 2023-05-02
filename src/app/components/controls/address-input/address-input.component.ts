import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {ApiService} from "../../../services/api.service";
import {Observable, of, tap} from "rxjs";
import {Address, Street} from "../../../transport-interfaces";
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from "@angular/forms";

@Component({
    selector: 'app-address-input',
    templateUrl: './address-input.component.html',
    styleUrls: ['./address-input.component.scss'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: AddressInputComponent,
            multi: true
        }
    ]
})
export class AddressInputComponent implements OnInit, ControlValueAccessor {

    cities$ = this.api.getCities();
    streets$: Observable<Street[]> = of();

    @Output() onBlur = new EventEmitter();

    address: Address = {
        city: {cityId: undefined},
        street: {streetId: undefined},
        houseNum: undefined,
        fraction: undefined,
        letter: undefined,
        build: undefined,
        entrance: undefined,
        floor: undefined,
        apartmentNum: undefined,
        apartmentMod: undefined
    }

    constructor(readonly api: ApiService) {
    }

    get city(): number | undefined {
        return this.address.city?.cityId;
    }

    set city(value: number | undefined) {
        console.log(`city: ${value}`);
        if (!this.address.city)
            this.address.city = {cityId: value};
        else
            this.address.city.cityId = value;
        if (value) this.streets$ = this.api.getStreets(value);
        this.onChange(this.address);
    }

    get street(): number | undefined {
        return this.address.street?.streetId;
    }

    set street(value: number | undefined) {
        if (!this.address.street)
            this.address.street = {streetId: value};
        else
            this.address.street.streetId = value;
        this.onChange(this.address);
    }

    get houseNum(): number | undefined {
        return this.address.houseNum;
    }

    set houseNum(value: number | undefined) {
        this.address.houseNum = value;
        this.onChange(this.address);
    }

    get fraction(): number | undefined {
        return this.address.fraction;
    }

    set fraction(value: number | undefined) {
        this.address.fraction = value;
        this.onChange(this.address);
    }

    get letter(): string | undefined {
        return this.address.letter;
    }

    set letter(value: string | undefined) {
        this.address.letter = value;
        this.onChange(this.address);
    }

    get build(): number | undefined {
        return this.address.build;
    }

    set build(value: number | undefined) {
        this.address.build = value;
        this.onChange(this.address);
    }

    get entrance(): number | undefined {
        return this.address.entrance;
    }

    set entrance(value: number | undefined) {
        this.address.entrance = value;
        this.onChange(this.address);
    }

    get floor(): number | undefined {
        return this.address.floor;
    }

    set floor(value: number | undefined) {
        this.address.floor = value;
        this.onChange(this.address);
    }

    get apartmentNum(): number | undefined {
        return this.address.apartmentNum;
    }

    set apartmentNum(value: number | undefined) {
        this.address.apartmentNum = value;
        this.onChange(this.address);
    }

    get apartmentMod(): string | undefined {
        return this.address.apartmentMod;
    }

    set apartmentMod(value: string | undefined) {
        this.address.apartmentMod = value;
        this.onChange(this.address);
    }

    onChange = (value: Address) => {
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

    writeValue(obj: Address | null | undefined): void {
        if (obj) {
            this.city = obj.city?.cityId;
            this.street = obj.street?.streetId;
            this.houseNum = obj.houseNum;
            this.fraction = obj.fraction;
            this.letter = obj.letter;
            this.build = obj.build;
            this.entrance = obj.entrance;
            this.floor = obj.floor;
            this.apartmentNum = obj.apartmentNum;
            this.apartmentMod = obj.apartmentMod;
        } else {
            this.address = {
                city: {cityId: undefined},
                street: {streetId: undefined},
                houseNum: undefined,
                fraction: undefined,
                letter: undefined,
                build: undefined,
                entrance: undefined,
                floor: undefined,
                apartmentNum: undefined,
                apartmentMod: undefined
            }
        }
    }
}
