import {Component, forwardRef, Input, OnInit} from '@angular/core';
import {FieldItem, ModelItem, WireframeFieldType} from "../../../transport-interfaces";
import {ApiService} from "../../../services/api.service";
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from "@angular/forms";

/**
 * Элемент списка вариаций поля ввода. Нужен для добавления бизнес-логики для одинаковых типов данных.
 * Как пример разные валидаторы при заполнении.
 * @param id идентификатор поля
 * @param name русскоязычное название
 */
export interface VariationItem {
    id: string;
    name: string;
}

@Component({
    selector: 'app-task-template-input',
    templateUrl: './task-template-input.component.html',
    styleUrls: ['./task-template-input.component.scss'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => TaskTemplateInputComponent),
            multi: true
        }
    ]
})
export class TaskTemplateInputComponent implements OnInit, ControlValueAccessor {
    @Input() field?: FieldItem | ModelItem;
    controlValue: any;
    @Input() isExample: boolean = false;

    constructor(readonly api: ApiService) {
    }

    get type() {
        if (!this.field) return '';
        if ('type' in this.field) return this.field.type;
        else if ('wireframeFieldType' in this.field) return this.field.wireframeFieldType;
        return '';
    }

    get currentVariationsList(): VariationItem[] {
        if (!this.field) return [];
        if ('type' in this.field) {
            switch (this.field.type) {
                case WireframeFieldType.ADDRESS:
                    return [{id:"ALL", name:"Все данные"}, {id:"APARTMENT_ONLY", name: "Только номер квартиры"}, {id:"HOUSE_ONLY", name: "Только номер дома"}];
                default:
                    return [];
            }
        }
        return [];
    }

    get currentVariation(): string {
        if(!this.field) return '';
        if('variation' in this.field) return this.field.variation ?? '';
        return '';
    }

    set currentVariation(value: string) {
        if(!this.field) return;
        if('type' in this.field) this.field.variation = value;
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

    onChange = (value: any) => {
    };

    onTouched = () => {
    };

    ngOnInit(): void {
    }

    isName(field: any) {
        return 'name' in field;
    }

    setName(event: string) {
        if (this.field && 'name' in this.field) this.field.name = event
    }
}
