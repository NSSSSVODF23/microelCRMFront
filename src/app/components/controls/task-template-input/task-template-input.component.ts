import {Component, ElementRef, forwardRef, Input, OnInit} from '@angular/core';
import {FieldItem, ModelItem, WireframeFieldType} from "../../../types/transport-interfaces";
import {ApiService} from "../../../services/api.service";
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from "@angular/forms";
import {MenuItem} from "primeng/api";

/**
 * Элемент списка вариаций поля ввода. Нужен для добавления бизнес-логики для одинаковых типов данных.
 * Как пример разные валидаторы при заполнении.
 * @param id идентификатор поля
 * @param name русскоязычное название
 */
export interface VariationItem {
    value: string;
    label: string;
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
    disable = false;
    connectionTypes$ = this.api.getConnectionTypesList();
    adSources$ = this.api.getAdSourcesList();
    displayTypeOptions$ = this.api.getFieldDisplayTypes();

    constructor(readonly api: ApiService, private el: ElementRef) {
    }

    get classes(){
        const element: HTMLElement = this.el.nativeElement;
        return {
            "ng-dirty": element.classList.contains("ng-touched"),
            "ng-invalid": element.classList.contains("ng-invalid")
        }
    }

    get type() {
        if (!this.field) return '';
        if ('type' in this.field) return this.field.type;
        else if ('wireframeFieldType' in this.field) return this.field.wireframeFieldType;
        return '';
    }

    // todo Для добавления типа поля, нужно добавить сюда5
    get currentVariationsList(): VariationItem[] {
        if (!this.field) return [];
        if ('type' in this.field) {
            switch (this.field.type) {
                case WireframeFieldType.SMALL_TEXT:
                case WireframeFieldType.LARGE_TEXT:
                case WireframeFieldType.BOOLEAN:
                case WireframeFieldType.INTEGER:
                case WireframeFieldType.FLOAT:
                case WireframeFieldType.LOGIN:
                case WireframeFieldType.IP:
                case WireframeFieldType.CONNECTION_TYPE:
                case WireframeFieldType.CONNECTION_SERVICES:
                case WireframeFieldType.EQUIPMENTS:
                case WireframeFieldType.PHONE_ARRAY:
                case WireframeFieldType.AD_SOURCE:
                case WireframeFieldType.REQUEST_INITIATOR:
                case WireframeFieldType.COUNTING_LIVES:
                case WireframeFieldType.PASSPORT_DETAILS:
                    return [{value: "MANDATORY", label: "Обязательное поле"}, {value: "OPTIONAL", label: "Необязательное поле"}];
                case WireframeFieldType.ADDRESS:
                    return [{value: "ALL", label: "Все данные"}, {
                        value: "APARTMENT_ONLY",
                        label: "Только номер квартиры"
                    }, {value: "HOUSE_ONLY", label: "Только номер дома"}, {value: "OPTIONAL", label: "Необязательное поле"}];
                default:
                    return [];
            }
        }
        return [];
    }

    get currentVariation(): string {
        if (!this.field) return '';
        if ('variation' in this.field) return this.field.variation ?? '';
        return '';
    }

    set currentVariation(value: string) {
        if (!this.field) return;
        if ('type' in this.field) this.field.variation = value;
    }

    get currentDisplayType(): string {
        if (!this.field) return 'LIST_AND_TELEGRAM';
        if ('displayType' in this.field) return this.field.displayType ?? 'LIST_AND_TELEGRAM';
        return '';
    }

    set currentDisplayType(value: string) {
        if (!this.field) return;
        if ('displayType' in this.field) this.field.displayType = value;
    }

    get isHasModelItemId(){
        return this.field && 'modelItemId' in this.field && this.field.modelItemId;
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

    setDisabledState(isDisabled: boolean) {
        this.disable = isDisabled;
    }

    onChange = (value: any) => {
    };

    onTouched = () => {
    };

    loginInputContextMenuModel: MenuItem[] = [
        {
            label: "Создать логин",
            command: ()=>{
                if(this.field && 'modelItemId' in this.field && this.field.modelItemId)
                    this.api.createUserInBilling(this.field.modelItemId).subscribe(console.log)
            }
        },
        {
            label: "Создать BIZ логин",
            command: ()=>{
                if(this.field && 'modelItemId' in this.field && this.field.modelItemId)
                    this.api.createUserInBilling(this.field.modelItemId, true).subscribe(console.log)
            }
        }
    ];

    ngOnInit(): void {
    }

    isName(field: any) {
        return 'name' in field;
    }

    setName(event: string) {
        if (this.field && 'name' in this.field) this.field.name = event
    }
}
