import {Injectable} from '@angular/core';
import {
    DateRange,
    FieldItem,
    FilterModelItem,
    LoadingState,
    Page,
    Task,
    TaskStatus,
    TaskTag
} from "../transport-interfaces";
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
import {FormArray, FormControl, FormGroup} from "@angular/forms";
import {DynamicValueFactory, Storage} from "../util";


@Injectable({
    providedIn: 'root'
})
export class TasksPageCacheService {

    // Количество задач загружаемых одновременно
    TASK_PAGE_SIZE = 15;

    mainFilterForm = new FormGroup({
        searchPhrase: new FormControl<string>(""),
        status: new FormControl<string[]>(['ACTIVE', 'PROCESSING']),
        template: new FormControl<number[]>(Storage.loadOrDefault('listPageTempFilter', [])),
        templateFilter: new FormArray<FormGroup>([]),
        tags: new FormControl<number[]>([]),
        stage: new FormControl<string|null>(null),
        author: new FormControl<string|null>(null),
        dateOfCreation: new FormControl<DateRange|null>(null),
        limit: new FormControl<number>(15),
    });

    searchPhraseChange$ = this.mainFilterForm.controls.searchPhrase.valueChanges.pipe(startWith(this.mainFilterForm.controls.searchPhrase.value), debounceTime(1500));
    statusChange$ = this.mainFilterForm.controls.status.valueChanges.pipe(startWith(this.mainFilterForm.controls.status.value), debounceTime(300));
    templateChange$ = this.mainFilterForm.controls.template.valueChanges.pipe(startWith(this.mainFilterForm.controls.template.value), debounceTime(300));
    tagsChange$ = this.mainFilterForm.controls.tags.valueChanges.pipe(startWith(this.mainFilterForm.controls.tags.value), debounceTime(300));
    stageChange$ = this.mainFilterForm.controls.stage.valueChanges.pipe(startWith(this.mainFilterForm.controls.stage.value), debounceTime(300));

    delayedFilterChange$ = combineLatest([this.searchPhraseChange$, this.statusChange$, this.templateChange$, this.tagsChange$, this.stageChange$]);

    beforeFilters = "";

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
        this.mainFilterForm.controls.template.valueChanges.pipe(startWith(this.mainFilterForm.controls.template.value))])
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
            return  this.api.getCountTasksByWireframeIdByTags(this.mainFilterForm.controls.template.value ?? [])
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
    stageList$ = this.mainFilterForm.controls.template.valueChanges.pipe(
        startWith(this.mainFilterForm.controls.template.value),
        tap(templates=>Storage.save('incomListPageTempFilter', templates)),
        switchMap(templates=>{
            this.mainFilterForm.controls.stage.setValue(null, {emitEvent: false});
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
    pageNumberChange$ = this.pageNumber.valueChanges.pipe(startWith(0),shareReplay(1));

    filters$ = combineLatest([
        this.pageNumberChange$,
        this.delayedFilterChange$
    ]).pipe(map(([page])=>[page, this.mainFilterForm.value]));

    templateFilterCount$ = this.filters$.pipe(map(()=>{
        const filters = this.mainFilterForm.value;
        let counter = 0;
        if(!!filters.author){
            counter++;
        }
        if(!!filters.dateOfCreation && ('start' in filters.dateOfCreation && 'end' in filters.dateOfCreation)){
            counter++;
        }
        if(filters.templateFilter && filters.templateFilter.length > 0){
            filters.templateFilter.filter(f=>{
                if(Array.isArray(f.value)) {
                    return f.value.length > 0;
                }
                return !!f.value;
            }).forEach(f=> {
                console.log(f)
                counter++
            });
        }
        return counter;
    }), map(counter=>counter ? counter.toString() : ''), shareReplay(1));

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
                        this.mainFilterForm.value.template?.forEach(wfid=>{
                            if(wireframeMap[wfid]) wfCount += wireframeMap[wfid];
                        });
                        tag.tasksCount = wfCount;
                    }else{
                        tag.tasksCount = 0;
                    }
                })
            })

        // Загрузка полей для фильтрации задач, если выделен 1 шаблон
        this.mainFilterForm.controls.template.valueChanges.pipe(startWith(this.mainFilterForm.value.template)).subscribe((selectedTemp: number[] | null | undefined) => {
            Storage.save('listPageTempFilter', selectedTemp);
            this.mainFilterForm.controls.templateFilter.clear();
            if (selectedTemp != null && selectedTemp.length === 1) {
                this.api.getWireframeFiltrationFields(selectedTemp[0]).subscribe(fields => {
                    for(let field of fields){
                        this.mainFilterForm.controls.templateFilter.push(new FormGroup({
                            id: new FormControl(field.id),
                            wireframeFieldType: new FormControl(field.wireframeFieldType),
                            name: new FormControl(field.name),
                            value: new FormControl(null)
                        }))
                    }
                })
                // this.api.getWireframe(this.firstWireframeId).subscribe(wireframe => {
                //     const fieldItems = wireframe.allFields ?? [];
                //     const controls = {
                //         ...fieldItems.reduce((prev, fieldItem) => {
                //             return {...prev, [fieldItem.id]: new FormControl(null)};
                //         }, {})
                //     };
                //     this.templateFilterForm = new FormGroup(controls);
                //     this.templateFilterFields = fieldItems;
                //     Storage.save('templateFilterFormControls', [...fieldItems.map(fieldItem => fieldItem.id)]);
                //     Storage.save('templateFilterFields', this.templateFilterFields);
                // })
            } else {
                // this.templateFilterForm = new FormGroup({});
                // this.templateFilterFields = [];
            }
        });
    }

    get isSelectOneTemplate(): boolean {
        return this.mainFilterForm.value.template?.length === 1;
    }

    get firstWireframeId(): number {
        return this.mainFilterForm.value.template ? this.mainFilterForm.value.template[0] : 0;
    }

    applyFilters(){
        if(this.beforeFilters !== JSON.stringify(this.mainFilterForm.value))
            this.pageNumber.setValue(0);
    }

    cacheFilters(){
        this.beforeFilters = JSON.stringify(this.mainFilterForm.value);
    }

    clearFilters(){
        this.mainFilterForm.patchValue({
            author: null,
            dateOfCreation: null,
        });
        this.mainFilterForm.controls.template.setValue(this.mainFilterForm.value.template ?? null);
    }
}
