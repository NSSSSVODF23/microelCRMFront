import {Component, Input, OnInit} from '@angular/core';
import {ModelItem} from "../../../transport-interfaces";
import {fade} from "../../../animations";

@Component({
    selector: 'app-task-field-view',
    templateUrl: './task-field-view.component.html',
    styleUrls: ['./task-field-view.component.scss'],
    animations: [fade]
})
export class TaskFieldViewComponent implements OnInit {

    @Input() item?: ModelItem;

    constructor() {
    }

    get address(): string {
        const a = this.item?.addressData;
        if (a) {
            let addressResult = '';
            addressResult += `${a.city?.name} ${a.street?.name} ${a.houseNum}`;
            if (a.fraction) addressResult += `/${a.fraction}`;
            if (a.letter) addressResult += a.letter;
            if (a.build) addressResult += ` стр.${a.build}`;
            if (a.entrance) addressResult += ` под.${a.entrance}`;
            if (a.floor) addressResult += ` эт.${a.floor}`;
            if (a.apartmentNum) addressResult += ` кв.${a.apartmentNum}`;
            if (a.apartmentMod) addressResult += ` ${a.apartmentMod}`;
            return addressResult;
        }
        return 'Адреса нет';
    }

    ngOnInit(): void {
    }
}
