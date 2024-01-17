import {Injectable} from '@angular/core';
import {BillingUserItemData, LoadingState} from "../types/transport-interfaces";
import {FormControl, FormGroup} from "@angular/forms";
import {
    catchError,
    filter,
    merge,
    of,
    repeat,
    shareReplay,
    startWith,
    Subject,
    switchMap,
    tap,
    first,
    map,
    mergeMap
} from "rxjs";
import {ApiService} from "./api.service";

type FiltrationValue = {mode: string | null, isActive: boolean | null, query: string | null};

@Injectable({
    providedIn: 'root'
})
export class BillingUserSearchingService {

    users: BillingUserItemData[] = [];
    page: BillingUserItemData[] = [];
    first: number = 0;
    PAGE_SIZE: number = 10;
    userLoadingState: LoadingState = LoadingState.EMPTY;
    filtrationForm = new FormGroup({
        mode: new FormControl('address'), query: new FormControl(''), isActive: new FormControl(false)
    })
    changeUsersSubject = new Subject<BillingUserItemData[]>();
    changeUsers$ = this.changeUsersSubject.asObservable();
    enterSearch = new Subject<null>();
    enterSearch$ = this.enterSearch
        .pipe(
            map(()=>this.filtrationForm.value),
            map((value)=>{
                if(value.query){
                    value.query = value.query.trim();
                }
                return value;
            })
        );
    modeChange$ = this.filtrationForm.controls.mode.valueChanges.pipe(map(value => ({mode: value, query: null, isActive: false})));

    users$ = merge(this.enterSearch$, this.modeChange$).pipe(
            tap(() => {
                this.userLoadingState = LoadingState.LOADING
            }),
            switchMap((value: any) => {
                if (!value.query) return of([] as BillingUserItemData[]);
                switch (value.mode) {
                    case 'login':
                        return this.api.getBillingUsersByLogin(value.query, !value.isActive);
                    case 'fio':
                        return this.api.getBillingUsersByFio(value.query, !value.isActive);
                    case 'address':
                        return this.api.getBillingUsersByAddress(value.query, !value.isActive);
                }
                return of([] as BillingUserItemData[]);
            }),
            catchError((err, caught) => {
                this.userLoadingState = LoadingState.ERROR;
                this.users = [];
                return of([] as BillingUserItemData[]);
            }),
            repeat(),
        )

    usersHandler = {
        next: (users: BillingUserItemData[]) => {
            this.userLoadingState = !users || users.length === 0 ? LoadingState.EMPTY : LoadingState.READY;
            this.users = !users || users.length === 0 ? [] : users.sort((a,b)=>{
                if (a.addr < b.addr) {
                    return -1;
                }
                if (a.addr > b.addr) {
                    return 1;
                }
                return 0;
            });
            this.first = 1;
            this.page = this.users.slice(0, this.PAGE_SIZE);
        }
    }

    constructor(private api: ApiService) {
        this.users$.subscribe((users) => this.changeUsersSubject.next(users))
        this.modeChange$.subscribe(() => {
            this.filtrationForm.patchValue({query: ''})
        })
        this.changeUsers$.subscribe(this.usersHandler)
    }
}
