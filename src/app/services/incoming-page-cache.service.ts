import {Injectable} from '@angular/core';
import {FieldItem, LoadingState, Page, Task, TaskTag} from "../types/transport-interfaces";
import {ApiService} from "./api.service";
import {RealTimeUpdateService} from "./real-time-update.service";
import {
    combineLatest,
    debounceTime,
    distinctUntilChanged, filter,
    first,
    flatMap,
    map, mergeMap, Observable,
    Observer, of,
    shareReplay,
    startWith,
    switchMap, tap
} from "rxjs";
import {FormControl, FormGroup} from "@angular/forms";
import {DynamicContent, DynamicPageContent, DynamicValueFactory, Storage} from "../util";
import {PersonalityService} from "./personality.service";


@Injectable({
    providedIn: 'root'
})
export class IncomingPageCacheService {

    private scrollPos = 0;

    pageControl = new FormControl(0);
    filtersForm =  new FormGroup({
        limit: new FormControl(15),
        template: new FormControl(Storage.loadOrDefault('incomListPageTempFilter', [])),
        stage: new FormControl(null),
        tags: new FormControl<string[]>([]),
    })

    searchPhrase = new FormControl('');

    pageChange$ = this.pageControl.valueChanges.pipe(startWith(0), tap(()=>window.scrollTo({top:0})));
    filtersChange$ = this.filtersForm.valueChanges.pipe(tap(()=>this.pageControl.setValue(0)),startWith(this.filtersForm.value));

    filters$ = combineLatest([this.pageChange$, this.filtersChange$]).pipe(map(([page, filter])=>{
        return [
            page,
            {...filter, searchPhrase: this.searchPhrase.value}
        ]
    }), shareReplay(1));

    stageList:{
        label: string,
        value: string | null,
        orderIndex: number,
        tasksCount: number
    }[] = [];
    tagsList: TaskTag[] = [];

    get tagsListNames(){
        return this.tagsList.map(tag=>tag.name)
    }

    stageList$ = this.filtersForm.controls.template.valueChanges.pipe(
        startWith(this.filtersForm.controls.template.value),
        tap(templates=>Storage.save('incomListPageTempFilter', templates)),
        switchMap(templates=>{
            this.filtersForm.controls.stage.setValue(null, {emitEvent: false});
            if(templates?.length === 1){
                return this.api.getWireframeStages(templates[0]).pipe(
                    mergeMap(stages=>{
                        return this.api.getCountIncomingTasksByStages(templates[0]).pipe(
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

    tagsFilterControl = new FormControl("");
    tagsNameFilter$ = this.tagsFilterControl.valueChanges.pipe(debounceTime(300), distinctUntilChanged());
    tagsFilters$ = combineLatest([this.tagsNameFilter$.pipe(startWith('')),
        this.filtersForm.controls.template.valueChanges.pipe(startWith(this.filtersForm.controls.template.value))])
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
            return  this.api.getCountIncomingTasksByWireframeIdByTags(this.filtersForm.controls.template.value ?? [])
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


    taskPage$ = DynamicValueFactory.ofPageAltAll(this.filters$,
        this.api.getIncomingTasks.bind(this.api),
        [this.rt.taskCreated(),
            this.rt.taskUpdated(),
            this.rt.taskDeleted()]
    ).pipe(shareReplay(1))

    constructor(private api: ApiService, private rt: RealTimeUpdateService, private personality: PersonalityService) {
        this.stageList$.subscribe(s=>this.stageList = [...s]);
        this.tagsList$.subscribe(s=>this.tagsList = [...s.value]);
        this.searchPhrase.valueChanges.pipe(debounceTime(1000), filter(phrase=>phrase === null || phrase.length === 0)).subscribe(()=>this.pageControl.setValue(0))
        this.personality.userLogin$.subscribe(login=>{
            this.rt.incomingTaskCountChange(login)
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
            this.rt.incomingTagTaskCountChange(login)
                .subscribe(counter=>{
                    this.tagsList.forEach(tag=>{
                        const wireframeMap = counter[tag.taskTagId];
                        if(wireframeMap){
                            let wfCount = 0;
                            this.filtersForm.value.template?.forEach(wfid=>{
                               if(wireframeMap[wfid]) wfCount += wireframeMap[wfid];
                            });
                            tag.tasksCount = wfCount;
                        }else{
                            tag.tasksCount = 0;
                        }
                    })
                })
        })
    }

    get isSelectOneTemplate(): boolean {
        return this.filtersForm.controls.template.value?.length === 1;
    }

    get firstWireframeId(): number {
        return this.filtersForm.controls.template.value ? this.filtersForm.controls.template.value[0] : 0;
    }

    saveScrollPos(pos: number) {
        this.scrollPos = pos;
    }

    readScrollPos(): number {
        return this.scrollPos;
    }
}
