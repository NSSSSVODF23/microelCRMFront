import {Injectable} from '@angular/core';
import {ApiService} from "./api.service";
import {RealTimeUpdateService} from "./real-time-update.service";
import {FormArray, FormControl, FormGroup} from "@angular/forms";
import {
    BehaviorSubject,
    combineLatest,
    debounceTime,
    distinctUntilChanged,
    first,
    fromEvent,
    lastValueFrom,
    map,
    merge,
    mergeMap,
    Observable,
    of, repeat, retry,
    shareReplay, skipUntil,
    startWith, Subject,
    switchMap,
    tap
} from "rxjs";
import {
    Address, AdvertisingSource, ConnectionType,
    DateRange, Employee, FilteringType,
    LoadingState,
    SchedulingType,
    TagListItem,
    Task, TaskFiltrationConditions,
    TaskTag,
    TaskTypeDirectory,
    TimeFrame,
    Wireframe
} from "../types/transport-interfaces";
import {Data, Params} from "@angular/router";
import {MenuItem} from "primeng/api";
import {EmptyPage} from "../types/service-interfaces";

@Injectable({
    providedIn: 'root'
})
export class TasksCatalogSearchPageCacheService {

    searchSubject = new Subject<any>();
    search$ = this.searchSubject.pipe(
        tap(() => {
            this.pageControl.setValue(0);
            this.taskLoadingState = LoadingState.LOADING;
        }),
        shareReplay(1)
    );

    filterForm = new FormGroup({
        searchPhrase: new FormControl(''),
        author: new FormControl<string | null>(null),
        assignedEmployee: new FormControl<string | null>(null),
        dateOfCreation: new FormControl<DateRange | null>(null),
        dateOfClose: new FormControl<DateRange | null>(null),
        tags: new FormControl<number[] | null>(null),
        fieldFilters: new FormArray([
            new FormGroup({
                name: new FormControl('Текст в задаче'),
                type: new FormControl(FilteringType.TEXT),
                textValue: new FormControl<string | null>('')
            }),
            new FormGroup({
                name: new FormControl('Логин'),
                type: new FormControl(FilteringType.LOGIN),
                textValue: new FormControl<string | null>('')
            }),
            new FormGroup({
                name: new FormControl('Адрес'),
                type: new FormControl(FilteringType.ADDRESS),
                addressValue: new FormControl<Address | null>(null)
            }),
            new FormGroup({
                name: new FormControl('Телефон'),
                type: new FormControl(FilteringType.PHONE),
                textValue: new FormControl<string | null>('')
            }),
            new FormGroup({
                name: new FormControl('Рекламный источник'),
                type: new FormControl(FilteringType.AD_SOURCE),
                adSourceValue: new FormControl<AdvertisingSource | null>(null)
            }),
            new FormGroup({
                name: new FormControl('Тип подключения'),
                type: new FormControl(FilteringType.CONNECTION_TYPE),
                connectionTypeValue: new FormControl<ConnectionType | null>(null)
            }),
            new FormGroup({
                name: new FormControl('Подключаемая услуга'),
                type: new FormControl(FilteringType.CONNECTION_SERVICE),
                connectionServiceValue: new FormControl<number | null>(null)
            })
        ])
    })
    filtersChange$ = this.filterForm.valueChanges.pipe(shareReplay(1));

    filtersNames: {[key:string]:string} = {
        searchPhrase: 'Строка поиска',
        author: 'Автор',
        dateOfCreation: 'Дата создания',
        dateOfClose: 'Дата закрытия',
        tags: 'Теги'
    }

    applySearch$ = this.search$.pipe(map(()=>this.filterForm.value));

    applyingFilters$ = this.applySearch$
        .pipe(
            map((value: {[key:string]:any})=>{
                const FILTER_CHIP = [];
                for(const key in value){
                    if(!value[key] || key === 'fieldFilters') continue;
                    if(Array.isArray(value[key]) && value[key].length === 0) continue;
                    FILTER_CHIP.push({
                        label: this.filtersNames[key], value: key, type: 'unfield'
                    })
                }
                return FILTER_CHIP;
            }),
        )

    applyingFieldFilters$ = this.applySearch$
        .pipe(
            map((value: {[key:string]:any})=>{
                const FILTER_CHIP = [];
                for(const filter of value['fieldFilters']){
                    if(!filter.textValue && !filter.addressValue && !filter.adSourceValue && !filter.connectionTypeValue && !filter.connectionServiceValue) continue;
                    FILTER_CHIP.push({
                        label: filter.name, value: filter.name, type: 'field'
                    })
                }
                return FILTER_CHIP;
            })
        );

    applyingAllFilters$ = combineLatest([this.applyingFilters$, this.applyingFieldFilters$])
        .pipe(
            map(([filters, fieldFilters]) => filters.concat(fieldFilters)),
            shareReplay(1)
        )

    statusSubject = new BehaviorSubject<string | null>(null);
    classSubject = new BehaviorSubject<number | null>(null);
    typeSubject = new BehaviorSubject<string | null>(null);

    status$ = this.statusSubject.asObservable();
    class$ = this.classSubject.asObservable();
    type$ = this.typeSubject.asObservable();

    pageControl = new FormControl(0);

    taskLoadingState = LoadingState.EMPTY;

    lastRoute$ = combineLatest([this.status$, this.class$, this.type$])
        .pipe(
            debounceTime(1),
            distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
            tap(() => {
                this.pageControl.setValue(0);
            }),
            shareReplay(1)
        );

    page$ = this.pageControl.valueChanges.pipe(startWith(0), distinctUntilChanged(), tap(() => {
        window.scrollTo({top: 0});
    }), shareReplay(1));


    taskCountersMap = new Map<string, Observable<string>>();
    taskCountersLoadingMap = new Map<string, boolean>();

    wireframes$ = this.api.getWireframes().pipe(shareReplay(1));

    tasks$ = combineLatest([this.page$, this.search$, this.lastRoute$]).pipe(
        tap(()=>this.taskLoadingState = LoadingState.LOADING),
        switchMap(([page, filters, [status, cls, type]]) => {
            if(TasksCatalogSearchPageCacheService.isFiltersEmpty(filters))
                return of(new EmptyPage());
            const allFilters={...filters, ...TasksCatalogSearchPageCacheService.getFilterPath(status,cls,type)}
            return this.api.getPageOfTasks(page ?? 0, allFilters)
        }),
        tap({
            next: (page) => page.totalElements === 0 ? this.taskLoadingState = LoadingState.EMPTY : this.taskLoadingState = LoadingState.READY,
            error: () => this.taskLoadingState = LoadingState.ERROR,
        }),
        shareReplay(1)
    );

    adSources$ = this.api.getAdSourcesList();
    connectionTypes$ = this.api.getConnectionTypesList();
    connectionServices$ = this.api.getConnectionServicesList();

    constructor(private api: ApiService) {
        // this.filterForm.controls.fieldFilters.valueChanges.subscribe((value)=>console.log(value))
    }

    static getFilterPath(status?: string | null, cls?: number | null, type?: string | null){
        const CONDITION = {} as TaskFiltrationConditions;
        if(status)
            CONDITION.status = [status.toUpperCase()];
        if(cls)
            CONDITION.template = [cls];
        if(type)
            CONDITION.stage = type;
        return CONDITION;
    }

    static isFiltersEmpty(filters: {[key:string]:any}){
        for(const key in filters){
            if(key === 'fieldFilters'){
                for(const filter of filters[key]){
                    if(!filter.textValue && !filter.addressValue && !filter.adSourceValue && !filter.connectionTypeValue && !filter.connectionServiceValue) continue;
                    return false;
                }
                continue;
            }
            if(!filters[key]) continue;
            if(Array.isArray(filters[key]) && filters[key].length === 0) continue;
            return false;
        }
        return true;
    }

    getTasksLoadingCounter(status?: string, cls?: number, type?: string){
        const KEY = TasksCatalogSearchPageCacheService.pathKeyGenerate(status, cls, type);

        if(this.taskCountersLoadingMap.has(KEY))
            return this.taskCountersLoadingMap.get(KEY) ?? false;

        this.taskCountersLoadingMap.set(KEY, false);
        return false;
    }

    setTasksLoadingCounter(key: string, value: boolean){
        this.taskCountersLoadingMap.set(key, value);
    }

    getTasksCounter(status?: string, cls?: number, type?: string) {
        const KEY = TasksCatalogSearchPageCacheService.pathKeyGenerate(status, cls, type);

        if (this.taskCountersMap.has(KEY))
            return this.taskCountersMap.get(KEY);

        const observable =
            this.search$
                .pipe(
                    tap(()=>this.setTasksLoadingCounter(KEY, true)),
                    switchMap(filters=>{
                        if(TasksCatalogSearchPageCacheService.isFiltersEmpty(filters)) return of('0');
                        const allFilters={...filters, ...TasksCatalogSearchPageCacheService.getFilterPath(status,cls,type)}
                        return this.api.getCountTasks(allFilters)
                            .pipe(map(c => c.toString()));
                    }),
                    startWith('0'),
                    tap(()=>this.setTasksLoadingCounter(KEY, false)),
                    shareReplay(1)
                )


        this.taskCountersMap.set(KEY, observable);
        return observable;
    }

    updatePath(params: Params) {
        this.statusSubject.next(params['status'] ?? null);
        this.classSubject.next(params['class'] ? parseInt(params['class']) : null);
        this.typeSubject.next(params['type'] ?? null);
    }

    search() {
        this.searchSubject.next(this.filterForm.value);
    }

    clearFilter(value: string, type?: string) {
        if(type === 'field'){
            const CONTROLS = this.filterForm.controls.fieldFilters.controls;
            const CONTROL = CONTROLS.find((control) => control.value.name === value);
            if(!CONTROL) return;
            CONTROL.patchValue({
                textValue: null,
                addressValue: null,
                adSourceValue: null,
                connectionTypeValue: null,
                connectionServiceValue: null,
            })
            this.search();
            return;
        }
        const CONTROLS = Object.entries(this.filterForm.controls);
        const CONTROL = CONTROLS.find(([key, control]) => key === value);
        if(!CONTROL) return;
        if(CONTROL[1] instanceof FormArray){
            // CONTROL[1].clear();
        }else{
            CONTROL[1].setValue(null);
        }
        this.search();
    }

    private static pathKeyGenerate(status?: string, cls?: number, type?: string){
        let key = ''+ status + cls + type;
        if(!status && !cls && !type) key = 'all';
        return key;
    }
}
