import {DateRange, FieldItem, ModelItem, Wireframe, WireframeFieldType} from "./transport-interfaces";
import {of, Subscription, switchMap, timer} from "rxjs";
import {ContentChange, QuillModules} from "ngx-quill";
import {createCustomElement} from "@angular/elements";
import {EmployeeLabelComponent} from "./components/controls/employee-label/employee-label.component";
import {TaskLinkComponent} from "./components/controls/task-link/task-link.component";
import {DepartmentLabelComponent} from "./components/controls/department-label/department-label.component";
import {Injector} from "@angular/core";
import {PrimeNGConfig} from "primeng/api";
import {AppointedInstallersComponent} from "./components/controls/appointed-installers/appointed-installers.component";

export class Utils {
    static convertModelItemToString(model: ModelItem) {
        switch (model.wireframeFieldType) {
            case WireframeFieldType.ADDRESS:
                const a = model.addressData;
                if (a) {
                    const result = `${a.city?.name} ${a.street?.name} ${a.houseNum}${a.fraction ? '/' + a.fraction : ''}${a.letter}${a.build ? ' стр.' + a.build : ''} кв.${a.apartmentNum}`
                    return result;
                }
                return "";
        }
        return "";
    }

    static isCorrectSequenceOfCharacters(event: ContentChange, char: string, prefixSubstr: string[] = []) {
        const currentDelta = event.delta.ops;
        const oldDelta = event.oldDelta.ops;
        const cursorPos = event.editor.getSelection(true).index;

        if (!currentDelta || !oldDelta) return false;

        if (currentDelta.length === 1) {
            const currentInsertChar = currentDelta[0]['insert'];
            if (currentInsertChar === char) return true;
        } else if (currentDelta.length === 2) {
            const previousSubstring = oldDelta.reduce((acc, item) => acc + item['insert'], '').slice(0, cursorPos - 1);
            const currentInsertChar = currentDelta[1]['insert'];
            if (prefixSubstr.length === 0 && currentInsertChar === char) return true;
            if (currentInsertChar === char && prefixSubstr.some(substr => previousSubstring.endsWith(substr))) {
                return true;
            }
        }
        return false;
    }

    static dateArrayToStringRange(dateArray?: Date[]): string {
        if (!dateArray) return "{}";
        const dateStrings = dateArray.map((date, index) => {
            if (!date) return undefined;
            if (index === 1) {
                date.setHours(23,59,59,999);
                return this.dateFormat(date);
            } else {
                date.setHours(0,0,0,0);
                return this.dateFormat(date);
            }
        });
        const rangeObject: DateRange = {
            start: dateStrings[0],
            end: dateStrings[1]
        };
        return JSON.stringify(rangeObject);
    }

    static dateFormat(date: Date) {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const day = date.getDate().toString().padStart(2, "0");
        const hour = date.getHours().toString().padStart(2, "0");
        const minute = date.getMinutes().toString().padStart(2, "0");
        const second = date.getSeconds().toString().padStart(2, "0");
        return `${year}-${month}-${day}T${hour}:${minute}:${second}Z`;
    }

    static dateFormatTS(date: Date) {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const day = date.getDate().toString().padStart(2, "0");
        const hour = date.getHours().toString().padStart(2, "0");
        const minute = date.getMinutes().toString().padStart(2, "0");
        const second = date.getSeconds().toString().padStart(2, "0");
        return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
    }

    static stringToColor(str: string, minSaturation = 70, maxSaturation = 100, minLightness = 50, maxLightness = 80) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }

        let h = hash % 360;
        let s = Math.max(minSaturation, Math.min(maxSaturation, (hash % 100) / 100 * (maxSaturation - minSaturation) + minSaturation));
        let l = Math.max(minLightness, Math.min(maxLightness, (hash % 100) / 100 * (maxLightness - minLightness) + minLightness));

        return `hsl(${h}, ${s}%, ${l}%)`;
    }

    static stringToGradient(value: string, maxSaturation = 90, minSaturation = 70, maxLightness = 85, minLightness = 65): string {
        let hash = 0;
        for (let i = 0; i < value.length; i++) {
            hash = value.charCodeAt(i) + ((hash << 5) - hash);
        }
        const color1Hue = hash % 360;
        const color1Saturation = (hash % (maxSaturation - minSaturation + 1) + minSaturation);
        const color1Lightness = (hash % (maxLightness - minLightness + 1) + minLightness);
        const color1 = `hsl(${color1Hue}, ${color1Saturation}%, ${color1Lightness}%)`;

        // const color2Hue = (color1Hue + 180) % 360;
        const color2Hue = (color1Hue - 30) % 360;
        const color2Saturation = color1Saturation;
        const color2Lightness = color1Lightness - 10;
        const color2 = `hsl(${color2Hue}, ${color2Saturation}%, ${color2Lightness}%)`;

        return `linear-gradient(0deg, ${color1} 0%, ${color2} 100%)`;
    }

    static declineOfNumber(val: number, suffixArray: string[]) {
        val = Math.abs(val) % 100;
        const n1 = val % 10;
        if (val > 10 && val < 20) {
            return suffixArray[2];
        }
        if (n1 > 1 && n1 < 5) {
            return suffixArray[1];
        }
        if (n1 == 1) {
            return suffixArray[0];
        }
        return suffixArray[2];
    }

    static getValueFromModelItem(modelItem: ModelItem) {
        switch (modelItem.wireframeFieldType) {
            case WireframeFieldType.ADDRESS:
                return modelItem.addressData;
            case WireframeFieldType.INTEGER:
                return modelItem.integerData;
            case WireframeFieldType.FLOAT:
                return modelItem.floatData;
            case WireframeFieldType.BOOLEAN:
                return modelItem.booleanData;
            case WireframeFieldType.PHONE_ARRAY:
                return modelItem.phoneData;
            case WireframeFieldType.IP:
            case WireframeFieldType.LARGE_TEXT:
            case WireframeFieldType.LOGIN:
            case WireframeFieldType.SMALL_TEXT:
                return modelItem.stringData;
            default:
                return null;
        }
    }

    static setValueToModelItem(fieldItem: ModelItem, formValue: any) {
        switch (fieldItem.wireframeFieldType) {
            case WireframeFieldType.ADDRESS:
                fieldItem.addressData = formValue;
                break;
            case WireframeFieldType.INTEGER:
                fieldItem.integerData = formValue;
                break;
            case WireframeFieldType.FLOAT:
                fieldItem.floatData = formValue;
                break;
            case WireframeFieldType.BOOLEAN:
                fieldItem.booleanData = formValue;
                break;
            case WireframeFieldType.PHONE_ARRAY:
                fieldItem.phoneData = formValue;
                break;
            case WireframeFieldType.IP:
            case WireframeFieldType.LARGE_TEXT:
            case WireframeFieldType.LOGIN:
            case WireframeFieldType.SMALL_TEXT:
                fieldItem.stringData = formValue;
                break;
            default:
                break;
        }
        return fieldItem;
    }
}

export class FormToModelItemConverter {

    static convert(formValues: { [id: string]: any }, wireframe: Wireframe): ModelItem[] {

        const fieldItems = wireframe.steps.reduce<FieldItem[]>((acc, curr) => [...acc, ...curr.fields], []);

        return fieldItems.filter(value => Object.keys(formValues).includes(value.id)).map<ModelItem>((fieldItem) => {
            const formValue = formValues[fieldItem.id];

            const modelItem: any = {
                id: fieldItem.id,
                wireframeFieldType: fieldItem.type,
                name: fieldItem.name,
            }

            switch (fieldItem.type) {
                case WireframeFieldType.SMALL_TEXT:
                case WireframeFieldType.LARGE_TEXT:
                case WireframeFieldType.LOGIN:
                case WireframeFieldType.IP:
                    modelItem.stringData = formValue;
                    break;
                case WireframeFieldType.ADDRESS:
                    modelItem.addressData = formValue;
                    break;
                case WireframeFieldType.PHONE_ARRAY:
                    modelItem.phoneData = formValue;
                    break;
                case WireframeFieldType.INTEGER:
                    modelItem.integerData = formValue;
                    break;
                case WireframeFieldType.BOOLEAN:
                    modelItem.booleanData = formValue;
                    break;
                case WireframeFieldType.FLOAT:
                    modelItem.floatData = formValue;
                    break;
            }

            return modelItem;
        })
    }

    static editExisting(fromValues: { [id: number]: any }, currentFields: ModelItem[]): ModelItem[] {
        return currentFields.map<ModelItem>((fieldItem) => {
            const formValue = fromValues[fieldItem.modelItemId];
            return Utils.setValueToModelItem(fieldItem, formValue);
        })
    }

}

export interface Duration {
    current: { days: number, hours: number, minutes: number, seconds: number };
    biggestValue: number;
    biggestSuffix: string;
    biggestType: "days" | "hours" | "minutes" | "seconds" | "none";
    mode: "before" | "after" | "none";
    timeError: boolean;
    actualLabel: string;
}

export class DurationCounter {
    observer = timer(0, 1000).pipe(switchMap(() => of(this.getTime())));
    private time: number = 0;

    setTime(time: number | Date | string | null | undefined) {
        if (time instanceof Date) {
            this.time = time.getTime();
        } else if (typeof time === "string") {
            this.time = new Date(time).getTime();
        } else if (typeof time === "number") {
            this.time = time;
        } else {
            this.time = 0;
        }
    }

    private getTime(): Duration {
        // Время не установлено
        if (this.time === 0) {
            return {
                biggestSuffix: "",
                biggestType: "none",
                biggestValue: 0,
                current: {days: 0, hours: 0, minutes: 0, seconds: 0},
                mode: "none",
                timeError: true,
                actualLabel: "-"
            }
        }

        // Текущее время
        const currentTime = new Date().getTime();

        // Разница между текущим временем и установленным
        const deltaTime = Math.abs(this.time - currentTime);

        const mode = this.time < currentTime ? "after" : "before";

        // Кол-во дней, часов, минут, секунд из deltaTime
        let days = Math.floor(deltaTime / 86400000);
        let hours = Math.floor((deltaTime % 86400000) / 3600000);
        let minutes = Math.floor((deltaTime % 3600000) / 60000);
        let seconds = Math.floor((deltaTime % 60000) / 1000);


        if (days > 0) {
            const suffix = Utils.declineOfNumber(days, ["день", "дня", "дней"]);
            return {
                biggestSuffix: suffix,
                biggestType: "days",
                biggestValue: days,
                current: {days, hours, minutes, seconds},
                mode,
                timeError: false,
                actualLabel: `${days} ${suffix}`
            }
        } else if (hours > 0) {
            const suffix = Utils.declineOfNumber(hours, ["час", "часа", "часов"]);
            return {
                biggestSuffix: suffix,
                biggestType: "hours",
                biggestValue: hours,
                current: {days, hours, minutes, seconds},
                mode,
                timeError: false,
                actualLabel: `${hours} ${suffix}`
            }
        } else if (minutes > 0) {
            const suffix = Utils.declineOfNumber(minutes, ["минуту", "минуты", "минут"]);
            return {
                biggestSuffix: suffix,
                biggestType: "minutes",
                biggestValue: minutes,
                current: {days, hours, minutes, seconds},
                mode,
                timeError: false,
                actualLabel: `${minutes} ${suffix}`
            }
        } else {
            const suffix = Utils.declineOfNumber(seconds, ["секунду", "секунды", "секунд"]);
            return {
                biggestSuffix: suffix,
                biggestType: "seconds",
                biggestValue: seconds,
                current: {days, hours, minutes, seconds},
                mode,
                timeError: false,
                actualLabel: `${seconds} ${suffix}`
            }
        }
    }

}

export class SubscriptionsHolder {
    private subscriptions: Map<string, Subscription> = new Map();

    addSubscription(key: string, subscription: Subscription) {
        const existSub = this.subscriptions.get(key);
        if (existSub) existSub.unsubscribe()
        this.subscriptions.set(key, subscription);
    }

    unsubscribeAll() {
        this.subscriptions.forEach(subscription => subscription.unsubscribe());
        this.subscriptions.clear();
    }

    unsubscribe(id: string) {
        const existSub = this.subscriptions.get(id);
        if (existSub) existSub.unsubscribe();
        this.subscriptions.delete(id);
    }
}

export const quillDefaultModules: QuillModules = {
    toolbar: [
        ['bold', 'italic', 'underline', 'strike'],
        ['blockquote', 'code-block'],
        [{'header': 1}, {'header': 2}],
        [{'list': 'ordered'}, {'list': 'bullet'}],
        [{'script': 'sub'}, {'script': 'super'}],
        [{'indent': '-1'}, {'indent': '+1'}],
        [{'color': []}],
        ['clean'],
        ['link']
    ]
};

// Регистрирует пользовательские элементы в браузере на основе Angular компонентов
export function registerCustomElements(injector: Injector) {
    const elements = {
        'employee-label-element': createCustomElement(EmployeeLabelComponent, {injector}),
        'task-link-element': createCustomElement(TaskLinkComponent, {injector}),
        'department-label-element': createCustomElement(DepartmentLabelComponent, {injector}),
        'appointed-installers-element': createCustomElement(AppointedInstallersComponent, {injector}),
    }

    for (const [name, element] of Object.entries(elements)) {
        customElements.get(name) || customElements.define(name, element);
    }
}

export function configurePrimeng(config: PrimeNGConfig) {
    config.ripple = true;
    config.setTranslation({
        "startsWith": "Начинается с",
        "contains": "Содержит",
        "notContains": "Не содержит",
        "endsWith": "Кончается",
        "equals": "Равно",
        "notEquals": "Not equals",
        "noFilter": "No Filter",
        "lt": "Less than",
        "lte": "Less than or equal to",
        "gt": "Greater than",
        "gte": "Greater than or equal to",
        "is": "Is",
        "isNot": "Is not",
        "before": "Before",
        "after": "After",
        "dateIs": "Date is",
        "dateIsNot": "Date is not",
        "dateBefore": "Date is before",
        "dateAfter": "Date is after",
        "clear": "Отчистить",
        "apply": "Применить",
        "matchAll": "Сопоставить со всем",
        "matchAny": "Сопоставить с некоторыми",
        "addRule": "Добавить правило",
        "removeRule": "Удалить правило",
        "accept": "Да",
        "reject": "Нет",
        "choose": "Выбрать",
        "upload": "Загрузить",
        "cancel": "Отмена",
        "dayNames": ["Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"],
        "dayNamesShort": ["Вск", "Пон", "Вто", "Сре", "Чет", "Пят", "Суб"],
        "dayNamesMin": ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"],
        "monthNames": ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"],
        "monthNamesShort": ["Янв", "Фев", "Март", "Апр", "Май", "Июнь", "Июль", "Авг", "Сен", "Окт", "Ноя", "Дек"],
        "dateFormat": "dd-mm-yy",
        "firstDayOfWeek": 0,
        "today": "Сегодня",
        "weekHeader": "Нд",
        "weak": "Неделя",
        "medium": "Средний",
        "strong": "Жирный",
        "passwordPrompt": "Введите пароль",
        "emptyMessage": "Данных нет",
        "emptyFilterMessage": "Данных нет"
    });
}

export function cyrb53(str: string, seed = 0) {
    let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
    for (let i = 0, ch; i < str.length; i++) {
        ch = str.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
    h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
    h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);

    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
}

export class Storage {
    static save(key: string, value: any) {
        localStorage.setItem(key, JSON.stringify(value))
    }

    static load<T>(key: string): T | null {
        const item = localStorage.getItem(key);
        if (item === null) return null;
        return JSON.parse(item) as T;
    }
}
