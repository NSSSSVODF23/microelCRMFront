import {Pipe, PipeTransform} from '@angular/core';
import {Employee} from "../transport-interfaces";

@Pipe({
    name: 'eplName'
})
export class EplNamePipe implements PipeTransform {

    transform(value?: Employee, ...args: any[]): string {
        if (!value) return '';
        const {lastName, firstName, secondName, login} = value;
        if (!firstName && !secondName && !lastName) return login ?? '';
        return `${lastName} ${firstName}`;
    }

}
