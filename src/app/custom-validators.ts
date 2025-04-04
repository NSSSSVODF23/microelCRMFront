import {AbstractControl, ValidationErrors, ValidatorFn} from "@angular/forms";
import {WireframeFieldType} from "./types/transport-interfaces";

export class CustomValidators {

    // todo Для добавления типа поля, нужно добавить сюда1
    static taskInput(type: WireframeFieldType, variation?: string) {
        if(variation === 'OPTIONAL') return null;
        switch (type) {
            case WireframeFieldType.BOOLEAN:
                return (control: AbstractControl): ValidationErrors | null => {
                    if (CustomValidators.isValueEmpty(control.value)) return {'required': true};
                    if (control.value === true || control.value === false) return null;
                    return {'required': true};
                }
            case WireframeFieldType.IP:
                return (control: AbstractControl): ValidationErrors | null => {
                    if (CustomValidators.isValueEmpty(control.value)) return {'required': true};
                    if (control.value === '0.0.0.0') return {'required': true};
                    return null;
                }
            case WireframeFieldType.AD_SOURCE:
            case WireframeFieldType.FLOAT:
            case WireframeFieldType.INTEGER:
            case WireframeFieldType.LOGIN:
            case WireframeFieldType.LARGE_TEXT:
            case WireframeFieldType.CONNECTION_TYPE:
            case WireframeFieldType.COUNTING_LIVES:
            case WireframeFieldType.REQUEST_INITIATOR:
            case WireframeFieldType.SMALL_TEXT:
                return (control: AbstractControl): ValidationErrors | null => {
                    if (CustomValidators.isValueEmpty(control.value)) return {'required': true};
                    return null;
                }
            case WireframeFieldType.CONNECTION_SERVICES:
                return (control: AbstractControl): ValidationErrors | null => {
                    if (CustomValidators.isValueEmpty(control.value)) return {'required': true};
                    if (!Array.isArray(control.value) || control.value.length === 0) return {'required': true};
                    return null;
                }
            case WireframeFieldType.EQUIPMENTS:
                return (control: AbstractControl): ValidationErrors | null => {
                    if (CustomValidators.isValueEmpty(control.value)) return {'required': true};
                    if (!Array.isArray(control.value) || control.value.length === 0) return {'required': true};
                    return null;
                }
            case WireframeFieldType.PHONE_ARRAY:
                return (control: AbstractControl): ValidationErrors | null => {
                    if (CustomValidators.isValueEmpty(control.value)) {
                        return {'required': true};
                    }
                    if(Array.isArray(control.value) && control.value.length === 0) return {'required': true}
                    if (
                        Object.keys(control.value)
                            .some(key => !CustomValidators.isValidUUID(key)) ||
                        Object.values(control.value)
                            .some(phone => !CustomValidators.isValidPhone(phone))
                    ) {
                        return {'required': true};
                    }
                    return null;
                }
            case WireframeFieldType.ADDRESS:
                return (control: AbstractControl): ValidationErrors | null => {
                    const address = control.value;
                    if (CustomValidators.isValueEmpty(address)) return {'required': true};
                    switch (variation) {
                        case 'APARTMENT_ONLY':
                            if (
                                CustomValidators.isValueEmpty(address.city?.cityId) ||
                                CustomValidators.isValueEmpty(address.street?.streetId) ||
                                CustomValidators.isValueEmpty(address.houseNum) ||
                                CustomValidators.isValueEmpty(address.apartmentNum)
                            ) return {'required': true};
                            break;
                        case 'HOUSE_ONLY':
                            if (
                                CustomValidators.isValueEmpty(address.city?.cityId) ||
                                CustomValidators.isValueEmpty(address.street?.streetId) ||
                                CustomValidators.isValueEmpty(address.houseNum)
                            ) return {'required': true};
                            break;
                        case 'ALL':
                            if (
                                CustomValidators.isValueEmpty(address.city?.cityId) ||
                                CustomValidators.isValueEmpty(address.street?.streetId) ||
                                CustomValidators.isValueEmpty(address.houseNum) ||
                                CustomValidators.isValueEmpty(address.entrance) ||
                                CustomValidators.isValueEmpty(address.floor) ||
                                CustomValidators.isValueEmpty(address.apartmentNum)
                            ) return {'required': true};
                            break;
                        default:
                            return null;

                    }
                    return null;
                }
            case WireframeFieldType.PASSPORT_DETAILS:
                return (control: AbstractControl): ValidationErrors | null => {
                    const passport = control.value;
                    if(!passport) return {'required': true};
                    if (
                        CustomValidators.isValueEmpty(passport.passportSeries) ||
                        CustomValidators.isValueEmpty(passport.passportNumber) ||
                        CustomValidators.isValueEmpty(passport.passportIssuedBy) ||
                        CustomValidators.isValueEmpty(passport.passportIssuedDate)
                    ) return {'required': true};
                    return null;
                }
            default:
                return (control: AbstractControl): ValidationErrors | null => {
                    if (CustomValidators.isValueEmpty(control.value)) return {'required': true};
                    return null;
                }
        }
    }

    static notEmpty(control: AbstractControl): ValidationErrors | null {
        if (CustomValidators.isValueEmpty(control.value)) return {'required': true};
        if (Array.isArray(control.value) && control.value.length === 0) return {'required': true}
        return null;
    }

    static isValueEmpty(value: any) {
        return value === null ||
            value === undefined ||
            value === ''
        // isNaN(value) ||
        // Object.keys(value).length === 0 ||
        // (Array.isArray(value) && value.length === 0);
    }

    static isValidUUID(uuid: any) {
        if (typeof uuid !== 'string') return false;
        const regexExp = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/gi;
        return regexExp.test(uuid);
    }

    static isValidPhone(phone: any) {
        if (typeof phone !== 'string') return false;
        const regexExp = /^8 \(\d{3}\) \d{3}-\d{2}-\d{2}$/;
        return regexExp.test(phone);
    }

    static typeIsSwitchWithAddress(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            if(!control) return null;
            if('commutator' in control.value && control.value.commutator) return null;
            return {typized: true}
        }
    }
}
