import {fromEvent, Subject, Subscription} from "rxjs";

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
