import {Injectable} from '@angular/core';
import {Address, BillingUserItemData, LoadingState} from "../types/transport-interfaces";
import {FormControl, FormGroup} from "@angular/forms";
import {
    catchError,
    combineLatest,
    debounceTime,
    filter,
    map,
    merge,
    of,
    repeatWhen,
    startWith,
    Subject,
    switchMap,
    takeUntil,
    tap
} from "rxjs";
import {ApiService} from "./api.service";
import {Utils} from "../util";
import {MessageService} from "primeng/api";

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
        query: new FormControl(''), isActive: new FormControl(true)
    })
    changeUsersSubject = new Subject<BillingUserItemData[]>();
    changeUsers$ = this.changeUsersSubject.asObservable();
    enterSearch = new Subject<boolean>();

    aliveCountingControl = new FormControl<Address | null>(null);
    aliveCountingChange$ = this.aliveCountingControl.valueChanges
        .pipe(
            filter((value) => (value !== null && !!value.houseNum)),
        );
    aliveCountingSub = this.aliveCountingChange$
        .pipe(
            switchMap(address=>this.api.getCountingLivesCalculation({address: address!, startApart: 1, endApart: 500}))
        )
        .subscribe((value)=>{
            Utils.copyToClipboard(value.result, this.toast, 'Живые скопированы', 'Не удалось скопировать живых');
        });

    enterDown$ = this.enterSearch.pipe(filter(()=>this.userLoadingState!==LoadingState.LOADING), startWith(true));
    // modeChange$ = this.filtrationForm.controls.mode.valueChanges.pipe(startWith('address'));
    activeChange$ = this.filtrationForm.controls.isActive.valueChanges.pipe(filter(()=>this.userLoadingState!==LoadingState.LOADING), startWith(false));
    queryChange$ = this.filtrationForm.controls.query.valueChanges
        .pipe(
            filter((q)=>(this.userLoadingState!==LoadingState.LOADING && !!q && q.length > 3)),
            debounceTime(1300),
            takeUntil(merge(this.enterSearch, this.filtrationForm.controls.isActive.valueChanges)),
            repeatWhen(completed => completed)
        );

    queryChangeSub = this.queryChange$.subscribe(console.log)

    enterSearch$ = combineLatest([this.enterDown$, this.queryChange$, this.activeChange$])
        .pipe(
            debounceTime(100),
            map(()=>this.filtrationForm.value),
        );

    users$ = this.enterSearch$.pipe(
            tap((data) => {
                this.userLoadingState = LoadingState.LOADING
            }),
            switchMap((value) => {
                if (!value.query) return of([] as BillingUserItemData[]);
                return this.api.searchBillingUsers(value.query, !value.isActive)
            }),
            catchError((err, caught) => {
                this.userLoadingState = LoadingState.ERROR;
                this.users = [];
                return of([] as BillingUserItemData[]);
            }),
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

    constructor(private api: ApiService, private toast: MessageService) {
        this.users$.subscribe((users) => this.changeUsersSubject.next(users))
        // this.modeChange$.subscribe(() => {
        //     this.filtrationForm.patchValue({query: ''})
        // })
        this.changeUsers$.subscribe(this.usersHandler)
    }
}
