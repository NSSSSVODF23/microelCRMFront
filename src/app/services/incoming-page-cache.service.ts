import {Injectable} from '@angular/core';
import {FieldItem, LoadingState, Page, Task, TaskTag} from "../transport-interfaces";
import {ApiService} from "./api.service";
import {RealTimeUpdateService} from "./real-time-update.service";
import {
    combineLatest,
    debounceTime,
    distinctUntilChanged,
    first,
    flatMap,
    map, mergeMap,
    Observer, of,
    shareReplay,
    startWith,
    switchMap, tap
} from "rxjs";
import {FormControl, FormGroup} from "@angular/forms";
import {DynamicContent, DynamicValueFactory, Storage} from "../util";


@Injectable({
    providedIn: 'root'
})
export class IncomingPageCacheService {

    filtersForm =  new FormGroup({
        limit: new FormControl(15),
        template: new FormControl(Storage.loadOrDefault('incomListPageTempFilter', [])),
        stage: new FormControl(null),
        tags: new FormControl([]),
    })
    controlForm = new FormGroup({
        page: new FormControl(0),
        filters: this.filtersForm,
    });

    filters$ = this.controlForm.valueChanges.pipe(startWith(this.controlForm.value),map(form=>Object.values(form)), shareReplay(1));

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
    tagsLoaderIncoming$ = this.filtersForm.controls.template.valueChanges.pipe(
        startWith(this.filtersForm.controls.template.value),
        mergeMap((templates)=>templates ? this.api.getCountIncomingTasksByWireframeIdByTags(templates).pipe(
            switchMap(tasksCount=>this.api.getTaskTags(null, true).pipe(map(tags=>{
                return tags.map(tag=>{
                    const count = tasksCount[tag.taskTagId];
                    tag.tasksCount = count ? count : 0;
                    return tag;
                })
            }))),
        ) : of([]))
    )
    tagsLoader$ = this.filtersForm.controls.template.valueChanges.pipe(
        startWith(this.filtersForm.controls.template.value),
        mergeMap((templates)=>templates ? this.api.getCountTasksByWireframeIdByTags(templates).pipe(
            switchMap(tasksCount=>this.api.getTaskTags(null, true).pipe(map(tags=>{
                return tags.map(tag=>{
                    const count = tasksCount[tag.taskTagId];
                    tag.tasksCount = count ? count : 0;
                    return tag;
                })
            }))),
        ) : of([]))
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
        }),
        shareReplay(1));
    taskPage$ = DynamicValueFactory.ofPage(this.filters$, this.api.getIncomingTasks.bind(this.api), 'taskId', this.rt.taskCreated(), this.rt.taskUpdated(), this.rt.taskDeleted()).pipe(shareReplay(1))

    constructor(private api: ApiService, private rt: RealTimeUpdateService) {
        this.filters$.subscribe(console.log)
    }

    get isSelectOneTemplate(): boolean {
        return this.filtersForm.controls.template.value?.length === 1;
    }

    get firstWireframeId(): number {
        return this.filtersForm.controls.template.value ? this.filtersForm.controls.template.value[0] : 0;
    }
}
