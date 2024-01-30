import {Injectable} from '@angular/core';
import {ApiService} from "./api.service";
import {Employee, EmployeeStatus} from "../types/transport-interfaces";
import {RealTimeUpdateService} from "./real-time-update.service";
import {
    BehaviorSubject,
    distinctUntilChanged,
    filter,
    fromEvent, map,
    shareReplay, startWith,
    Subscription,
    switchMap,
    tap
} from "rxjs";
import jwtDecode from "jwt-decode";
import {Router} from "@angular/router";
import {AccessFlag} from "../types/access-flag";

interface Token {
    access: number;
    sub: string;
    exp: number;
}

export enum FocusStatus {
    FOCUS = 'FOCUS',
    NO_TOUCH = 'NO_TOUCH',
    BLUR = 'BLUR'
}

@Injectable({
    providedIn: 'root'
})
export class PersonalityService {

    me?: Employee;
    meUpdate?: Subscription;
    focusStatus: FocusStatus = FocusStatus.BLUR;
    onGettingUserData = new BehaviorSubject<Employee | null>(null);
    userData$ = this.onGettingUserData.pipe(filter(e => !!e), shareReplay(1));
    userLogin$ = this.userData$.pipe(distinctUntilChanged((e1, e2) => {
        return e1?.login === e2?.login
    }), map(e => e!.login), shareReplay(1));
    private lastTouch = 0;

    constructor(readonly api: ApiService, readonly rt: RealTimeUpdateService, private router: Router) {

        this.updateMe().subscribe();

        fromEvent(window, 'focus').subscribe(event => {
            if (!this.api.loggedIn) return;
            this.focusStatus = FocusStatus.FOCUS;
            this.api.changeMyStatus(EmployeeStatus.ONLINE).subscribe();
        })

        fromEvent(window, 'blur').subscribe(event => {
            if (!this.api.loggedIn) return;
            this.focusStatus = FocusStatus.BLUR;
            this.api.changeMyStatus(EmployeeStatus.AWAY).subscribe();
        })

        fromEvent(document, 'mousemove').subscribe(() => {
            this.lastTouch = new Date().getTime();
        })

        // Проверяем время последнего касания, если было больше 30 секунд назад, изменяем статус
        setInterval(() => {
            if (!this.api.loggedIn) return;
            if (new Date().getTime() - this.lastTouch > 30000 && this.focusStatus === FocusStatus.FOCUS) {
                this.focusStatus = FocusStatus.NO_TOUCH;
                this.api.changeMyStatus(EmployeeStatus.AWAY).subscribe();
            }
        }, 1000);

        // Проверяем истекает ли срок действия токена, если да обновляем его
        setInterval(() => {
            const now = new Date().getTime();
            const rawToken = localStorage.getItem('token');
            if (!rawToken) return;
            const token = jwtDecode(rawToken) as Token;
            if ((token.exp * 1000) - now < 30000) {
                this.api.authCheckout().subscribe();
                console.log("Проверка токена")
            }
        }, 10000)
    }

    updateMe() {
        return this.api.getMe().pipe(
            tap({
                next: (value) => {
                    this.me = value;
                    this.onGettingUserData.next(value);
                    if (this.meUpdate) this.meUpdate.unsubscribe();
                    this.meUpdate = this.rt.employeeUpdated(value.login).subscribe(emp => {
                        this.me = emp;
                        this.onGettingUserData.next(emp);
                    });
                }
            })
        )
    }

    isHasAccess(...access: number[]) {
        if(!this.me) return false;
        if(this.me.access)
            return AccessFlag.isHasFlag(this.me.access, ...access);
        if(!this.me.position?.access)
            return false;
        return AccessFlag.isHasFlag(this.me.position.access, ...access);
    }
}
