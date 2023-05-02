import {Component, OnInit} from '@angular/core';
import {FieldItem, WireframeFieldType} from "../../transport-interfaces";
import {v4} from "uuid";
import {FormControl, FormGroup} from "@angular/forms";

@Component({
    templateUrl: './testing-page.component.html',
    styleUrls: ['./testing-page.component.scss']
})
export class TestingPageComponent implements OnInit {

    items: string[] = [];

    fields: FieldItem[] = [
        {name: 'Булево', id: v4(), type: WireframeFieldType.BOOLEAN, orderPosition: 1, listViewIndex: 1},
        {name: 'Интегер', id: v4(), type: WireframeFieldType.INTEGER, orderPosition: 1, listViewIndex: 1},
        {name: 'Флоат', id: v4(), type: WireframeFieldType.FLOAT, orderPosition: 1, listViewIndex: 1},
        {name: 'Текст', id: v4(), type: WireframeFieldType.LARGE_TEXT, orderPosition: 1, listViewIndex: 1},
        {name: 'Строка', id: v4(), type: WireframeFieldType.SMALL_TEXT, orderPosition: 1, listViewIndex: 1},
        {name: 'Адрес', id: v4(), type: WireframeFieldType.ADDRESS, orderPosition: 1, listViewIndex: 1},
        {name: 'Телефон', id: v4(), type: WireframeFieldType.PHONE_ARRAY, orderPosition: 1, listViewIndex: 1},
    ]
    form: FormGroup = new FormGroup({});

    constructor() {
    }

    ngOnInit(): void {
        for (let i = 0; i < 10000; i++) {
            this.generateRandomString();
        }
        for (const field of this.fields) {
            this.form.addControl(field.id, new FormControl(null));
        }
        this.form.valueChanges.subscribe(value => console.log(value))
    }

    //Method to generate a random string and push it to the items array
    generateRandomString() {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result1 = '';
        const charactersLength = characters.length;
        for (let i = 0; i < 5; i++) {
            result1 += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        this.items.push(result1);
    }

}
