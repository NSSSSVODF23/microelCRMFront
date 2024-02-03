import {fromEvent, Subject, Subscription} from "rxjs";
import {SimpleChange, SimpleChanges} from "@angular/core";

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
            console.log(sub.closed)
            sub?.unsubscribe();
            console.log(sub.closed)
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
