import {distinctUntilChanged, filter, fromEvent, map, shareReplay, Subject, Subscription, tap} from "rxjs";
import {EnvironmentInjector, inject, Inject, Injectable, SimpleChanges} from "@angular/core";
import {ActivatedRoute, OutletContext} from "@angular/router";
import {AppModule} from "./app.module";
import {MainModule} from "./moduls/main/main.module";
import {MainRoutingModule} from "./moduls/main/main-routing.module";

export function FromEvent(selector: string, eventName: string) {
    return function (prototype: any, name: string) {
        const originalAfterInit = prototype.ngAfterViewInit ? prototype.ngAfterViewInit : () => {
        };
        const originalOnDestroy = prototype.ngOnDestroy ? prototype.ngOnDestroy : () => {
        };
        const subject = new Subject<Event>();
        let sub: Subscription;
        Object.defineProperty(prototype, name, {value: subject.asObservable()});
        prototype.ngAfterViewInit = function () {
            const elementById = document.getElementById(selector);
            if (!elementById)
                throw new Error(`Element with id ${selector} not found`);
            else
                sub = fromEvent(elementById, eventName).subscribe(subject);
            originalAfterInit.apply(this, arguments);
        }
        prototype.ngOnDestroy = function () {
            sub?.unsubscribe();
            originalOnDestroy.apply(this, arguments);
        }
    }
}

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

export function RouteParam(paramName?: string) {
    return function (prototype: any, name: string) {
        const originalAfterViewInit = prototype.ngAfterViewInit ? prototype.ngAfterViewInit : () => {};
        const originalOnDestroy = prototype.ngOnDestroy ? prototype.ngOnDestroy : () => {};
        const subject = new Subject<String>();
        let sub: Subscription;
        Object.defineProperty(prototype, name, {value: subject.pipe(shareReplay(1))});
        prototype.ngAfterViewInit = function () {
            sub = this.route.params.pipe(
                filter((p:{[key:string]:string}) => p[paramName?paramName:name] !== undefined),
                map((p:{[key:string]:string}) => p[paramName?paramName:name]),
                distinctUntilChanged(),
            ).subscribe(subject);
            originalAfterViewInit.apply(this, arguments);
        }
        prototype.ngOnDestroy = function () {
            sub?.unsubscribe();
            originalOnDestroy.apply(this, arguments);
        }
    }
}

export function OnChange(fieldName: string){
    return function (prototype: any, name: string, descriptor: PropertyDescriptor) {
        const originalOnChange = prototype.ngOnChanges ? prototype.ngOnChanges : () => {};
        prototype.ngOnChanges = function (simpleChanges: SimpleChanges) {
            if(simpleChanges[fieldName]) descriptor.value.call(this, simpleChanges[fieldName].currentValue);
            originalOnChange.apply(this, arguments);
        }
    }
}

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

function getCurrentOutlet(contextsMap: Map<string, OutletContext>, component: any) {
    const contextsArray = Array.from(contextsMap.values());

    while (contextsArray.length) {
        const outlet = contextsArray.shift();

        if (outlet?.route?.component === component) {
            return outlet;
        }

        const childrenContexts = (outlet?.children as any)?.contexts as Map<string, OutletContext>;

        contextsArray.push(...Array.from(childrenContexts.values()));
    }

    return null;
}
