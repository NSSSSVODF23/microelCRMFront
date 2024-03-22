import {Injectable} from '@angular/core';
import {FormControl} from "@angular/forms";
import {DynamicTableCell, Page, TaskStatus} from "../types/transport-interfaces";
import {ApiService} from "./api.service";
import {
    BehaviorSubject,
    combineLatest, delay,
    distinctUntilChanged, filter,
    map,
    of,
    ReplaySubject,
    shareReplay,
    startWith,
    switchMap,
    tap
} from "rxjs";

type DropdownOption = { label: string, value: any };

@Injectable({
    providedIn: 'root'
})
export class TaskRegistryService {

    isFirstLoad = true;

    taskStatusSelector = new FormControl<TaskStatus>(TaskStatus.ACTIVE);
    taskStatusOptions: DropdownOption[] = [
        {label: 'Активные', value: TaskStatus.ACTIVE},
        {label: 'Закрытые', value: TaskStatus.CLOSE},
        {label: 'В работе', value: TaskStatus.PROCESSING},
    ];

    taskClassSelector = new FormControl<number | null>(null);
    taskClassOptions: DropdownOption[] = [];

    tagFilterModeSelector = new FormControl<'all' | 'selected' | 'none'>('all');
    tagFilterModeOptions = [
        {label: 'Все', value: 'all'},
        {label: 'Теги', value: 'selected'},
        {label: 'Без тегов', value: 'none'},
    ];

    taskStatus$ = this.taskStatusSelector.valueChanges.pipe(startWith(TaskStatus.ACTIVE));

    taskClass$ = this.taskClassSelector.valueChanges.pipe(shareReplay(1));

    tagsSelector = new FormControl<number[] | null>(null);
    tagMode$ = this.tagFilterModeSelector.valueChanges
        .pipe(
            startWith('all'),
            tap(mode=>{
                if(mode != 'selected') this.tagsSelector.reset(null);
            }),
            shareReplay(1)
        );
    isTagMode$ = this.tagMode$.pipe(map(mode => mode === 'selected'));

    tagModeWithTags$ = this.tagMode$.pipe(
        switchMap(mode => {
            if(mode === 'all' || mode === 'none') return of({mode, tags: null});
            return this.tagsSelector.valueChanges.pipe(map(tags=>({mode, tags})))
        })
    )

    changeTableType$ = combineLatest([this.taskStatus$, this.taskClass$, this.tagModeWithTags$])
        .pipe(
            tap(()=>this.tableOffset = 0)
        );

    tabelColumns$ = this.changeTableType$
        .pipe(
            switchMap(([taskStatus, taskClass, tagMode]) => this.api.getTaskRegistryTableHeaders(taskStatus!, taskClass!)),
            shareReplay(1)
        );

    tableOffset = 0;

    tableLazyLoad$ = new ReplaySubject<any>(1);
    updateContent$ = new BehaviorSubject(true);
    previousPaging = "";
    tableLazyLoadDistinctChanges$ = this.tableLazyLoad$
        .pipe(
            delay(1),
            filter(paging => {
                let b = paging !== this.previousPaging;
                this.previousPaging = paging;
                return b;
            }),
        )

    tableContent?: Page<{ [key: string]: DynamicTableCell }>;

    taskTypesList$ = this.taskClass$
        .pipe(
            switchMap(taskClass => this.api.getWireframe(taskClass!)),
            map(wireframe => {
                return wireframe.stages?.map(stage => {
                    return {label: stage.label, value: stage.stageId} as DropdownOption;
                }) ?? []
            }),
            shareReplay(1)
        )

    taskCategoriesList$ = this.taskClass$
        .pipe(
            switchMap(taskClass => this.api.getWireframe(taskClass!)),
            map(wireframe => {
                return wireframe.stages?.flatMap(stage => {
                    return stage.directories.map(dir => {
                        return {label: `${stage.label} • ${dir.name}`, value: dir.taskTypeDirectoryId.toString()} as DropdownOption;
                    })
                }) ?? []
            }),
            shareReplay(1)
        )

    employeesList$ = this.api.getEmployees(undefined, false, false)
        .pipe(
            map(employees => employees.map(employee => ({label: employee.fullName, value: employee.login}) as DropdownOption)),
        )
    connectionTypesList$ = this.api.getConnectionTypesList();
    connectionServicesList$ = this.api.getConnectionServicesList();
    equipmentsList$ = this.api.getClientEquipments(null, false)
        .pipe(
            map(equipments => equipments.map(equipment => ({label: equipment.name, value: equipment.clientEquipmentId}) as DropdownOption)),
        );

    tableContentLoading = false;

    filterCache: any;
    sortCache: any;
    globalFilter: string | null = null;

    constructor(private api: ApiService) {
        this.api.getWireframes().subscribe(wireframes => {
            this.taskClassOptions = wireframes.map(wf => ({label: wf.name, value: wf.wireframeId}));
            this.taskClassSelector.setValue(this.taskClassOptions[0].value);
        });
        combineLatest([this.changeTableType$, this.tableLazyLoadDistinctChanges$, this.updateContent$])
            .pipe(
                tap(() => this.tableContentLoading = true),
                switchMap(([[taskStatus, taskClass, {mode, tags}], paging]) => {
                    delete paging.filters['global'];
                    paging.globalFilter = this.globalFilter;
                    this.filterCache = paging.filters;
                    this.sortCache = paging.multiSortMeta;
                    return this.api.getTaskRegistryTableContent(taskStatus!, taskClass!, mode!, tags!, paging)
                }),
            ).subscribe(loadedPage => {
                this.tableContent = loadedPage;
                this.tableContentLoading = false;
                this.isFirstLoad = false;
            })
    }
}
