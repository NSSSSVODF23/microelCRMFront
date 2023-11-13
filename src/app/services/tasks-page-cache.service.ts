import {Injectable} from '@angular/core';
import {FieldItem, LoadingState, Page, Task, TaskStatus, TaskTag} from "../transport-interfaces";
import {ApiService} from "./api.service";
import {RealTimeUpdateService} from "./real-time-update.service";
import {
    combineLatest,
    debounceTime,
    distinctUntilChanged, filter,
    map,
    mergeMap,
    Observer, shareReplay,
    startWith,
    switchMap,
    tap
} from "rxjs";
import {FormControl, FormGroup} from "@angular/forms";
import {DynamicValueFactory, Storage} from "../util";


@Injectable({
    providedIn: 'root'
})
export class TasksPageCacheService {

    // Количество задач загружаемых одновременно
    TASK_PAGE_SIZE = 15;

    // Форма поиска по полям из шаблона задачи, устанавливается из компонента страницы

    templateFilterForm = new FormGroup<any>(this.templateFilterFormInit);
    // Массив доступных фильтров полученный из шаблона
    templateFilterFields: FieldItem[] = Storage.loadOrDefault('templateFilterFields', []);

    searchPhrase = new FormControl<string | null>(null);

    // Форма поиска по основным параметрам задач
    filterForm = new FormGroup({
        status: new FormControl<string[]>(['ACTIVE', 'PROCESSING']),
        template: new FormControl<number[]>(Storage.loadOrDefault('listPageTempFilter', [])),
        tags: new FormControl<number[]>([]),
        stage: new FormControl(null),
        author: new FormControl(null),
        dateOfCreation: new FormControl(null),
    })

    stageList:{
        label: string,
        value: string | null,
        orderIndex: number,
        tasksCount: number
    }[] = [];
    tagsList: TaskTag[] = [];

    tagsFilterControl = new FormControl("");
    tagsNameFilter$ = this.tagsFilterControl.valueChanges.pipe(debounceTime(300), distinctUntilChanged());
    tagsFilters$ = combineLatest([this.tagsNameFilter$.pipe(startWith('')),
        this.filterForm.controls.template.valueChanges.pipe(startWith(this.filterForm.controls.template.value))])
        .pipe(map(([name, templates])=>[name,false]))
    tagsList$ = DynamicValueFactory.ofWithFilter(
        this.tagsFilters$,
        this.api.getTaskTags.bind(this.api),
        'taskTagId',
        this.rt.taskTagCreated(),
        this.rt.taskTagUpdated(),
        this.rt.taskTagDeleted()
    ).pipe(
        switchMap(tags=> {
            return  this.api.getCountTasksByWireframeIdByTags(this.filterForm.controls.template.value ?? [])
                .pipe(
                    map(tasksCount=>{
                        tags.value.map(tag=>{
                            const count = tasksCount[tag.taskTagId];
                            tag.tasksCount = count ? count : 0;
                            return tag;
                        })
                        return tags;
                    })
                )
        })
    );
    stageList$ = this.filterForm.controls.template.valueChanges.pipe(
        startWith(this.filterForm.controls.template.value),
        tap(templates=>Storage.save('incomListPageTempFilter', templates)),
        switchMap(templates=>{
            this.filterForm.controls.stage.setValue(null, {emitEvent: false});
            if(templates?.length === 1){
                return this.api.getWireframeStages(templates[0]).pipe(
                    mergeMap(stages=>{
                        return this.api.getCountTasksByStages(templates[0]).pipe(
                            map((tasksCount)=>{
                                return stages.map(stage=>{
                                    const count = tasksCount[stage.stageId];
                                    return {
                                        label: stage.label,
                                        value: stage.stageId,
                                        orderIndex: stage.orderIndex,
                                        tasksCount: count ? count : 0
                                    }
                                })
                            })
                        )
                    })
                )
            }else{
                return []
            }
        }),
        map((stages:{label:string, value:string|null, orderIndex:number, tasksCount:number}[])=> {
            const stageMap = stages.sort((a, b) => a.orderIndex - b.orderIndex);
            stageMap.unshift({
                label: 'Все',
                value: null,
                orderIndex: -1,
                tasksCount: stages.reduce((prev, curr)=>{
                    prev = prev + curr.tasksCount;
                    return prev;
                },0)
            });
            return stageMap;
        }),
        shareReplay(1)
    )

    pageNumber = new FormControl(0);
    pageNumber$ = this.pageNumber.valueChanges.pipe(startWith(0),shareReplay(1));
    mainFilters$ = this.filterForm.valueChanges.pipe(startWith(this.filterForm.value),shareReplay(1));
    searchPhrase$ = this.searchPhrase.valueChanges.pipe(startWith(this.searchPhrase.value),debounceTime(1500),distinctUntilChanged(),shareReplay(1));
    templateFilterFields$ = this.templateFilterForm.valueChanges.pipe(startWith(this.templateFilterForm.value), debounceTime(1500), map(this.translateTemplateForm.bind(this)), map(obj=>JSON.stringify(obj)),shareReplay(1));

    templateFilterCount$ = combineLatest(
        [
            this.mainFilters$.pipe(map(filters=>{
                let counter = 0;
                if(!!filters.author){
                    counter++;
                }
                if(!!filters.dateOfCreation && ('start' in filters.dateOfCreation && 'end' in filters.dateOfCreation)){
                    counter++;
                }
                return counter;
            })),
        this.templateFilterForm.valueChanges.pipe(startWith(this.templateFilterForm.value), map(this.translateTemplateForm.bind(this)), map(templateFilter=>templateFilter.length))
        ]
    ).pipe(map(([mainFilters, templateFilter])=>{
        return (mainFilters + templateFilter).toString();
    }))


    combinedFilters$ = combineLatest([this.mainFilters$, this.searchPhrase$, this.templateFilterFields$])
        .pipe(map(([filter, searchPhrase, templateFilter])=>{return {...filter, searchPhrase, templateFilter}}), shareReplay(1));

    filters$ = combineLatest([
        this.pageNumber$,
        this.combinedFilters$
    ]);

    private translateTemplateForm(templateFilterValue: {[key:string]:any}){
        return Object.entries(templateFilterValue).filter(([key, value])=>value !== null && value !== undefined && value !== '' && !(Array.isArray(value) && value.length===0))
            .map(([key, value])=>{
                const fieldItem = this.templateFilterFields.find(ff=>ff.id === key);
                if(fieldItem){
                    return {
                        id: fieldItem.id,
                        wireframeFieldType: fieldItem.type,
                        value: value
                    }
                }else{
                    return null; // Не найдено поле в шаблоне для фильтрации, отменяем фильтрацию по этому полю
                }
            });
    }

    taskPage$ = DynamicValueFactory.ofPageAltAll(this.filters$,
        this.api.getPageOfTasks.bind(this.api), 'taskId',
        [this.rt.taskCreated(),
            this.rt.taskUpdated(),
            this.rt.taskDeleted()]
    ).pipe(shareReplay(1))

    constructor(readonly api: ApiService, readonly rt: RealTimeUpdateService) {

        this.stageList$.subscribe(s=>this.stageList = [...s]);
        this.tagsList$.subscribe(s=>this.tagsList = [...s.value]);

        this.rt.taskCountChange()
            .pipe(filter((counter)=>(this.isSelectOneTemplate && counter.id === this.firstWireframeId)))
            .subscribe(counter=>{
                this.stageList.forEach(stage=>{
                    const find = counter.stages.find(s=>stage.value === s.id);
                    if(find) stage.tasksCount = find.num;
                    else stage.tasksCount = 0;
                })
                const allCounter = this.stageList.find(s=>s.value === null);
                if(allCounter) allCounter.tasksCount = counter.stages.reduce((prev,curr)=>prev+curr.num,0);
            });
        this.rt.tagTaskCountChange()
            .subscribe(counter=>{
                this.tagsList.forEach(tag=>{
                    const wireframeMap = counter[tag.taskTagId];
                    if(wireframeMap){
                        let wfCount = 0;
                        this.filterForm.value.template?.forEach(wfid=>{
                            if(wireframeMap[wfid]) wfCount += wireframeMap[wfid];
                        });
                        tag.tasksCount = wfCount;
                    }else{
                        tag.tasksCount = 0;
                    }
                })
            })

        // Загрузка полей для фильтрации задач, если выделен 1 шаблон
        this.filterForm.controls.template.valueChanges.subscribe((selectedTemp: number[] | null) => {
            Storage.save('listPageTempFilter', selectedTemp);
            if (this.isSelectOneTemplate) {
                this.api.getWireframe(this.firstWireframeId).subscribe(wireframe => {
                    const fieldItems = wireframe.allFields ?? [];
                    const controls = {
                        ...fieldItems.reduce((prev, fieldItem) => {
                            return {...prev, [fieldItem.id]: new FormControl(null)};
                        }, {})
                    };
                    this.templateFilterForm = new FormGroup(controls);
                    this.templateFilterFields = fieldItems;
                    Storage.save('templateFilterFormControls', [...fieldItems.map(fieldItem => fieldItem.id)]);
                    Storage.save('templateFilterFields', this.templateFilterFields);
                })
            } else {
                this.templateFilterForm = new FormGroup({});
                this.templateFilterFields = [];
            }
        });
    }

    get isSelectOneTemplate(): boolean {
        return this.filterForm.value.template?.length === 1;
    }

    get firstWireframeId(): number {
        return this.filterForm.value.template ? this.filterForm.value.template[0] : 0;
    }

    get templateFilterFormInit() {
        return Storage.loadOrDefault('templateFilterFormControls', []).reduce((prev, curr) => {
            prev[curr] = new FormControl(null);
            return prev
        }, {} as any);
    }
}
