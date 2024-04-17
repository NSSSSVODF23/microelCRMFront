import {Injectable} from '@angular/core';
import {Address} from "../types/transport-interfaces";
import {delay, filter, fromEvent, map, of, Subject, switchMap, tap} from "rxjs";

export type TaskCreationMode = 'standard' | 'child' | 'parent' | 'billing';
export type BillingInfo = {
    address: Address|null,
    login: string|null,
}

@Injectable({
    providedIn: 'root'
})
export class TaskCreatorService {

    private creationMode: TaskCreationMode = 'standard';
    private _dimensions: { width: number, height: number } = {width: 1000, height: 650};
    private _openSubject = new Subject<undefined>();

    constructor() {
        this.openObserver.pipe(
            map(() => window.open('/task/create', '_blank', this.features)),
            switchMap((w)=> {
                if(w)
                    return  fromEvent(w, 'load').pipe(map(()=>w))
                else
                    return  of(null)
            }),
            delay(200),
            tap((win)=> {
                if(win) {
                    // console.log(event)
                    // const target: Window = event.target as Window;
                    win.postMessage(this.transferObject, '*');
                }
            })
        ).subscribe()
    }

    private _dependencyIdentifier?: number;

    get dependencyIdentifier() {
        return this._dependencyIdentifier
    }

    private _wireframeId?: number;

    get wireframeId() {
        return this._wireframeId;
    }

    private _billingInfo?: BillingInfo

    get billingInfo() {
        return this._billingInfo
    }

    get features() {
        return `popup=yes,width=${this._dimensions.width},height=${this._dimensions.height},left=${(screen.width / 2) - (this._dimensions.width / 2)},top=${(screen.height / 2) - (this._dimensions.height / 2)}`
    }

    get mode() {
        return this.creationMode
    }

    get openObserver() {
        return this._openSubject.asObservable();
    }

    get transferObject(){
        return {
            mode: this.mode,
            dependencyIdentifier: this._dependencyIdentifier,
            wireframeId: this._wireframeId,
            billingInfo: this._billingInfo
        }
    }

    standard() {
        this.creationMode = 'standard';
        this._dependencyIdentifier = undefined;
        this._wireframeId = undefined;
        this._billingInfo = undefined;
        this.open();
    }

    dependency(type: 'child' | 'parent', id: number) {
        this.creationMode = type === 'parent' ? 'parent' : 'child';
        this._dependencyIdentifier = id;
        this._wireframeId = undefined;
        this._billingInfo = undefined;
        this.open();
    }

    wireframe(id: number, billingInfo: BillingInfo) {
        this.creationMode = 'billing';
        this._dependencyIdentifier = undefined;
        this._wireframeId = id;
        this._billingInfo = billingInfo;
        this.open();
    }

    private open() {
        this._openSubject.next(undefined);
    }
}
