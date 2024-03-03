import {distinctUntilChanged, filter, fromEvent, map, shareReplay, Subject, Subscription, tap} from "rxjs";
import {EnvironmentInjector, inject, Inject, Injectable, SimpleChanges} from "@angular/core";
import {ActivatedRoute, OutletContext} from "@angular/router";
import {AppModule} from "./app.module";
import {MainModule} from "./moduls/main/main.module";
import {MainRoutingModule} from "./moduls/main/main-routing.module";

/**
 * Создает наблюдателя испускающего сигнал при событии в html элементе
 * @param selector id элемента
 * @param eventName название события
 * @constructor
 */
export function FromEvent(selector: string, eventName: string) {
    return function (prototype: any, name: string) {
        const originalAfterInit = prototype.ngAfterViewInit ? prototype.ngAfterViewInit : () => {
        };
        const originalOnDestroy = prototype.ngOnDestroy ? prototype.ngOnDestroy : () => {
        };
        let sub: Subscription;
        prototype.ngAfterViewInit = function () {
            const elementById = document.getElementById(selector);
            if (!elementById)
                throw new Error(`Element with id ${selector} not found`);
            else
                sub = fromEvent(elementById, eventName).subscribe(this[name]);
            originalAfterInit.apply(this, arguments);
        }
        prototype.ngOnDestroy = function () {
            sub?.unsubscribe();
            originalOnDestroy.apply(this, arguments);
        }
    }
}

/**
 * Вызывает метод компонента при инициализации элемента html с заданным id.
 * @param selector id элемента html.
 * @constructor
 */
export function OnElementInit(selector: string) {
    return function (prototype: any, name: string, descriptor: PropertyDescriptor) {
        const originalAfterInit = prototype.ngAfterViewInit ? prototype.ngAfterViewInit : () => {
        };
        prototype.ngAfterViewInit = function () {
            const elementById = document.getElementById(selector);
            if (elementById)
                descriptor.value.call(this, elementById);
            originalAfterInit.apply(this, arguments);
        }
    }
}

/**
 * Создает наблюдателя испускающего сигнал при изменении значения параметра маршрута.
 * Так же нужно объявить ActivatedRoute в конструкторе компонента.
 * @param paramName Название параметра маршрута. Если не задано, то используется имя атрибута компонента.
 * @constructor
 */
export function RouteParam(paramName?: string) {
    return function (prototype: any, name: string) {
        const originalAfterViewInit = prototype.ngAfterViewInit ? prototype.ngAfterViewInit : () => {};
        // const originalOnDestroy = prototype.ngOnDestroy ? prototype.ngOnDestroy : () => {};
        // const subject = new Subject<String>();
        // let sub: Subscription;
        // Object.defineProperty(prototype, name, {value: subject.pipe(shareReplay(1))});
        prototype.ngAfterViewInit = function () {
            this.route.params.pipe(
                filter((p:{[key:string]:string}) => p[paramName?paramName:name] !== undefined),
                map((p:{[key:string]:string}) => p[paramName?paramName:name]),
                distinctUntilChanged(),
            ).subscribe(this[name]);
            originalAfterViewInit.apply(this, arguments);
        }
        // prototype.ngOnDestroy = function () {
        //     sub?.unsubscribe();
        //     originalOnDestroy.apply(this, arguments);
        // }
    }
}

/**
 * Вызывает метод компонента при изменении @Input атрибута компонента.
 * @param fieldName Имя атрибута компонента.
 * @constructor
 */
export function OnChange(fieldName: string){
    return function (prototype: any, name: string, descriptor: PropertyDescriptor) {
        const originalOnChange = prototype.ngOnChanges ? prototype.ngOnChanges : () => {};
        prototype.ngOnChanges = function (simpleChanges: SimpleChanges) {
            if(simpleChanges[fieldName]) descriptor.value.call(this, simpleChanges[fieldName].currentValue);
            originalOnChange.apply(this, arguments);
        }
    }
}

/**
 * Создает наблюдателя испускающего сигнал при изменении @Input атрибута компонента.
 * @param fieldName
 * @constructor
 */
export function OnChangeObservable(fieldName: string) {
    return function (prototype: any, name: string) {
        const originalOnChange = prototype.ngOnChanges ? prototype.ngOnChanges : () => {};
        prototype.ngOnChanges = function (simpleChanges: SimpleChanges) {
            if(simpleChanges[fieldName]) {
                this[name].next(simpleChanges[fieldName].currentValue);
            }
            originalOnChange.apply(this, arguments);
        }
    }
}

/**
 * Декоратор класса для автоматической отмены всех объявленных подписок в компоненте при его уничтожении.
 * @constructor
 */
export function AutoUnsubscribe() {
    return function (constructor: any) {
        const originalOnDestroy = constructor.prototype.ngOnDestroy ? constructor.prototype.ngOnDestroy : () => {};
        constructor.prototype.ngOnDestroy = function () {
            for(let prop in this){
                if(this[prop] instanceof Subscription)
                    this[prop].unsubscribe();
            }
            originalOnDestroy.apply(this, arguments);
        }
    }
}
