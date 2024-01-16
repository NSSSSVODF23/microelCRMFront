import {Injectable} from '@angular/core';
import {ApiService} from "./api.service";
import {RealTimeUpdateService} from "./real-time-update.service";
import {FormControl} from "@angular/forms";
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
    of,
    shareReplay,
    startWith,
    switchMap,
    tap
} from "rxjs";
import {
    DateRange,
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
import {TaskFilterOptions} from "../types/service-interfaces";

export type PageType = 'dir' | 'close-time' | 'actual-time' | 'term-time';

type TaskPathOptions = [status: string, cls: number | null, type: string | null, pageType: PageType | null, dir: number | null,
    tag: number | null, closeTime: TimeFrame | null, actualTime: TimeFrame | null, termTime: TimeFrame | null, scheduling: SchedulingType | null];

@Injectable({
    providedIn: 'root'
})
export class TasksCatalogPageCacheService {

    searchPhraseControl = new FormControl('');
    searchPhrase$ = this.searchPhraseControl.valueChanges.pipe(debounceTime(1200), startWith(''));

    statusSubject = new BehaviorSubject('active');
    classSubject = new BehaviorSubject<number | null>(null);
    typeSubject = new BehaviorSubject<string | null>(null);
    pageTypeSubject = new BehaviorSubject<PageType | null>(null);
    schedulingSubject = new BehaviorSubject<SchedulingType | null>(null);
    directorySubject = new BehaviorSubject<number | null>(null);
    tagSubject = new BehaviorSubject<number | null>(null);
    closeTimeSubject = new BehaviorSubject<TimeFrame | null>(null);
    actualTimeSubject = new BehaviorSubject<TimeFrame | null>(null);
    termTimeSubject = new BehaviorSubject<TimeFrame | null>(null);

    status$ = this.statusSubject.asObservable();
    class$ = this.classSubject.asObservable();
    type$ = this.typeSubject.asObservable();
    pageType$ = this.pageTypeSubject.asObservable();
    scheduling$ = this.schedulingSubject.asObservable();
    directory$ = this.directorySubject.asObservable();
    tag$ = this.tagSubject.asObservable();
    closeTime$ = this.closeTimeSubject.asObservable();
    actualTime$ = this.actualTimeSubject.asObservable();
    termTime$ = this.termTimeSubject.asObservable();

    pageControl = new FormControl(0);
    taskLoadingState = LoadingState.READY;
    lastRoute$ = combineLatest([this.status$, this.class$, this.type$, this.pageType$,
        this.directory$, this.tag$, this.closeTime$, this.actualTime$, this.termTime$, this.scheduling$])
        .pipe(
            debounceTime(1),
            distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
            tap(() => {
                this.pageControl.setValue(0);
                this.taskLoadingState = LoadingState.LOADING;
            }),
            shareReplay(1)
        );
    page$ = this.pageControl.valueChanges.pipe(startWith(0), distinctUntilChanged(), tap(() => {
        window.scrollTo({top: 0});
        this.taskLoadingState = LoadingState.LOADING;
    }));

    // filters$ = combineLatest([this.searchPhrase$]).pipe(tap(()=>this.taskLoadingState = LoadingState.LOADING), shareReplay(1));
    tasksMoved$ = this.rt.taskMoved().pipe(startWith(null));

    // updateCounter$ = this.tasksMoved$.pipe(switchMap(()=>this.filters$));

    taskCountersMap = new Map<string, Observable<string>>();
    tagsMap = new Map<string, Observable<TagListItem[]>>();

    updateWireframes$ = merge(this.rt.wireframeCreated(), this.rt.wireframeUpdated(), this.rt.wireframeDeleted()).pipe(startWith(null));

    wireframes$ = this.updateWireframes$.pipe(switchMap(() => this.api.getWireframes()), shareReplay(1));
    tasks$ = combineLatest([this.page$, this.tasksMoved$, this.lastRoute$]).pipe(
        switchMap(([page, moved, [status, cls, type, pageType, dir, tag, closeTime, actualTime, termTime, schedulingType]]) => {
            return this.api.getPageOfTasks(page ?? 0, {
                status: [status.toUpperCase()],
                template: cls ? [cls] : null,
                stage: type,
                directory: dir,
                tags: tag ? [tag] : null,
                dateOfClose: closeTime ? {timeFrame: closeTime} : null,
                actualFrom: actualTime ? {timeFrame: actualTime} : null,
                actualTo: termTime ? {timeFrame: termTime} : null,
                schedulingType: schedulingType ? schedulingType : SchedulingType.EXCEPT_PLANNED
            })
        }),
        tap({
            next: (page) => page.totalElements === 0 ? this.taskLoadingState = LoadingState.EMPTY : this.taskLoadingState = LoadingState.READY,
            error: () => this.taskLoadingState = LoadingState.ERROR,
        }),
        shareReplay(1)
    );
    highlightCatalogs?: number[];
    blockVisible = false;
    beforeTemporaryMap = [
        {id: TimeFrame.TODAY, name: 'Сегодня'},
        {id: TimeFrame.YESTERDAY, name: 'Вчера'},
        {id: TimeFrame.THIS_WEEK, name: 'Эта неделя'},
        {id: TimeFrame.LAST_WEEK, name: 'Прошлая неделя'},
        {id: TimeFrame.THIS_MONTH, name: 'Этот месяц'},
        {id: TimeFrame.LAST_MONTH, name: 'Прошлый месяц'},
    ]
    afterTemporaryMap = [
        {id: TimeFrame.TODAY, name: 'Сегодня'},
        {id: TimeFrame.TOMORROW, name: 'Завтра'},
        {id: TimeFrame.THIS_WEEK, name: 'Эта неделя'},
        {id: TimeFrame.NEXT_WEEK, name: 'Следующая неделя'},
        {id: TimeFrame.THIS_MONTH, name: 'Этот месяц'},
        {id: TimeFrame.NEXT_MONTH, name: 'Следующий месяц'},
    ]
    breadCrumbsModel$ = combineLatest([this.wireframes$, this.lastRoute$])
        .pipe(
            mergeMap(([wireframes, route]) => {
                const [status, cls, type, pageType, dir, tag, closeTime, actualTime, termTime, schedulingType] = route;
                if (tag) {
                    return this.api.getTaskTag(tag).pipe(map(tagInfo => ({wireframes, route, tagInfo})))
                }
                return of({wireframes, route, tagInfo:null});
            }),
            map(({wireframes, route, tagInfo}) => {
                const BREADCRUMBS = [] as MenuItem[];
                const [status, cls, type, pageType, dir, tag, closeTime, actualTime, termTime, schedulingType] = route;
                if (schedulingType === SchedulingType.PLANNED) {
                    BREADCRUMBS.push({
                        label: 'Запланированные',
                        routerLink: TasksCatalogPageCacheService.convertToPath([status, null, null, null, null, null, null, null, null, SchedulingType.PLANNED], true)
                    })
                } else if (schedulingType === SchedulingType.DEADLINE) {
                    BREADCRUMBS.push({
                        label: 'Сроки',
                        routerLink: TasksCatalogPageCacheService.convertToPath([status, null, null, null, null, null, null, null, null, SchedulingType.DEADLINE], true)
                    })
                } else if (status) {
                    let statusName = "";
                    switch (status) {
                        case 'active':
                            statusName = 'Активные';
                            break;
                        case 'processing':
                            statusName = 'У монтажников';
                            break;
                        case 'close':
                            statusName = 'Закрытые';
                            break;
                    }
                    BREADCRUMBS.push({
                        label: statusName,
                        routerLink: TasksCatalogPageCacheService.convertToPath([status, null, null, null, null, null, null, null, null, schedulingType], true)
                    });
                }
                if (cls) {
                    const WIREFRAME = wireframes.find(w => w.wireframeId === cls);
                    BREADCRUMBS.push({
                        label: WIREFRAME?.name,
                        routerLink: TasksCatalogPageCacheService.convertToPath([status, cls, null, null, null, null, null, null, null, schedulingType], true)
                    })
                    if (type && WIREFRAME) {
                        const TYPE = WIREFRAME.stages?.find(s => s.stageId === type);
                        BREADCRUMBS.push({
                            label: TYPE?.label,
                            routerLink: TasksCatalogPageCacheService.convertToPath([status, cls, type, null, null, null, null, null, null, schedulingType], true)
                        })
                        if (dir && TYPE) {
                            const DIRECTORY = TYPE.directories?.find(d => d.taskTypeDirectoryId === dir);
                            BREADCRUMBS.push({
                                label: DIRECTORY?.name,
                                routerLink: TasksCatalogPageCacheService.convertToPath([status, cls, type, pageType, dir, null, null, null, null, schedulingType], true)
                            })
                            if (tagInfo) {
                                BREADCRUMBS.push({
                                    label: "#"+tagInfo.name,
                                    routerLink: TasksCatalogPageCacheService.convertToPath([status, cls, type, pageType, dir, tag, null, null, null, schedulingType], true)
                                })
                            }
                        }
                        if (closeTime) {
                            BREADCRUMBS.push({
                                label: this.beforeTemporaryMap.find(t => t.id === closeTime)?.name,
                                routerLink: TasksCatalogPageCacheService.convertToPath([status, cls, type, pageType, null, null, closeTime, null, null, schedulingType], true)
                            })
                            if (tagInfo) {
                                BREADCRUMBS.push({
                                    label: "#"+tagInfo.name,
                                    routerLink: TasksCatalogPageCacheService.convertToPath([status, cls, type, pageType, null, tag, closeTime, null, null, schedulingType], true)
                                })
                            }
                        }
                        if (actualTime) {
                            BREADCRUMBS.push({
                                label: this.afterTemporaryMap.find(t => t.id === actualTime)?.name,
                                routerLink: TasksCatalogPageCacheService.convertToPath([status, cls, type, pageType, null, null, null, actualTime, null, schedulingType], true)
                            })
                            if (tagInfo) {
                                BREADCRUMBS.push({
                                    label: "#"+tagInfo.name,
                                    routerLink: TasksCatalogPageCacheService.convertToPath([status, cls, type, pageType, null, tag, null, actualTime, null, schedulingType], true)
                                })
                            }
                        }
                        if (termTime) {
                            BREADCRUMBS.push({
                                label: this.afterTemporaryMap.find(t => t.id === termTime)?.name,
                                routerLink: TasksCatalogPageCacheService.convertToPath([status, cls, type, pageType, null, null, null, null, termTime, schedulingType], true)
                            })
                            if (tagInfo) {
                                BREADCRUMBS.push({
                                    label: "#"+tagInfo.name,
                                    routerLink: TasksCatalogPageCacheService.convertToPath([status, cls, type, pageType, null, tag, null, null, termTime, schedulingType], true)
                                })
                            }
                        }

                    }
                }

                return BREADCRUMBS;
            }));
    rootExpandMap: { [key: string]: boolean } = {
        active: false,
        processing: false,
        close: false,
        scheduled: false,
        term: false
    }

    private movingTask?: Task;

    constructor(private api: ApiService, private rt: RealTimeUpdateService) {
        fromEvent(window, 'dragend').subscribe((event) => {
            this.highlightCatalogs = undefined;
        });
    }

    static convertToPath(options: TaskPathOptions, forCatalogRoute = false) {
        const [status, cls, type, pageType, dir, tag, closeTime, actualTime, termTime, scheduling] = options;
        const PATH = [];
        if (forCatalogRoute) {
            if (scheduling && scheduling !== SchedulingType.EXCEPT_PLANNED) {
                if (scheduling === SchedulingType.PLANNED)
                    PATH.push('scheduled')
                else if (scheduling === SchedulingType.DEADLINE)
                    PATH.push('term')
            }
        } else {
            if (scheduling) {
                PATH.push(scheduling)
            } else {
                PATH.push(SchedulingType.UNSCHEDULED)
            }
        }
        if (status) PATH.push(status)
        if (cls) PATH.push(cls.toString())
        if (type) PATH.push(type)
        if (pageType) PATH.push(pageType)
        switch (pageType) {
            case 'dir':
                if (dir) PATH.push(dir.toString())
                if (tag) PATH.push(tag.toString())
                break;
            case 'close-time':
                if (closeTime) PATH.push(closeTime)
                if (tag) PATH.push(tag.toString())
                break;
            case 'actual-time':
                if (actualTime) PATH.push(actualTime)
                if (tag) PATH.push(tag.toString())
                break;
            case 'term-time':
                if (termTime) PATH.push(termTime)
                if (tag) PATH.push(tag.toString())
                break;
        }
        return PATH;
    }

    getTasksCounter(pageType: PageType | null, filter: TaskFilterOptions) {
        const {status, cls, type, directory, tag, schedulingType, dateOfClose, actualFrom, actualTo} = filter;
        const key = '' + status + cls + type + directory + tag + schedulingType + JSON.stringify(dateOfClose) + JSON.stringify(actualFrom) + JSON.stringify(actualTo) + pageType;
        if (this.taskCountersMap.has(key))
            return this.taskCountersMap.get(key);
        const observable = merge(
            this.rt.updateTaskCount(status??'', cls, type, pageType, directory, tag, dateOfClose, actualFrom, actualTo, schedulingType),
            this.api.getCountTasks(TasksCatalogPageCacheService.filterOptionsToCondition(filter))
        ).pipe(map(c => c.toString()), shareReplay(1));

        this.taskCountersMap.set(key, observable);
        return observable;
    }

    static filterOptionsToCondition(filterOptions: TaskFilterOptions){
        const CONDITION = {} as TaskFiltrationConditions;
        const {status, cls, type, directory, dateOfClose, actualFrom, actualTo, schedulingType} = filterOptions;
        if(status)
            CONDITION.status = [status];
        if(cls)
            CONDITION.template = [cls];
        if(type)
            CONDITION.stage = type;
        if(directory)
            CONDITION.directory = directory;
        if(dateOfClose)
            CONDITION.dateOfClose = dateOfClose;
        if(actualFrom)
            CONDITION.actualFrom = actualFrom;
        if(actualTo)
            CONDITION.actualTo = actualTo;
        if(schedulingType)
            CONDITION.schedulingType = schedulingType;
        return CONDITION;
    }

    getTagsFromCatalog(filter: TaskFilterOptions) {
        const {status, cls, type, directory, dateOfClose, actualFrom, actualTo, schedulingType} = filter;
        const key = status??'' + cls + type + directory + dateOfClose + actualFrom + actualTo + schedulingType;
        if (this.tagsMap.has(key))
            return this.tagsMap.get(key);
        const observable = this.tasksMoved$.pipe(
            switchMap(() => this.api.getTagsListFromCatalog(TasksCatalogPageCacheService.filterOptionsToCondition(filter))),
            shareReplay(1)
        );
        this.tagsMap.set(key, observable);
        return observable;
    }

    updatePath(params: Params, data: Data) {
        this.statusSubject.next(params['status'] ?? 'active');
        this.classSubject.next(params['class'] ? parseInt(params['class']) : null);
        this.typeSubject.next(params['type'] ?? null);
        this.pageTypeSubject.next(data['pageType'] ?? null);
        this.schedulingSubject.next(data['scheduled'] ?? null);
        this.directorySubject.next(params['directory'] ? parseInt(params['directory']) : null);
        this.tagSubject.next(params['tag'] ? parseInt(params['tag']) : null);
        this.closeTimeSubject.next(params['closeTime'] ?? null);
        this.actualTimeSubject.next(params['actualTime'] ?? null);
        this.termTimeSubject.next(params['termTime'] ?? null);
    }

    taskMovingStart(task: Task) {
        this.movingTask = task;
        lastValueFrom(this.wireframes$.pipe(first())).then(
            wireframes => {
                const wireframe = wireframes.find(w => w.wireframeId === task.modelWireframe?.wireframeId);
                if (!wireframe) {
                    this.highlightCatalogs = undefined;
                    return;
                }
                const stage = wireframe.stages?.find(s => s.stageId === task.currentStage?.stageId);
                if (!stage) {
                    this.highlightCatalogs = undefined;
                    return;
                }
                const currentDirectory = task.currentDirectory?.taskTypeDirectoryId;
                this.highlightCatalogs = stage.directories.filter(d => d.taskTypeDirectoryId !== currentDirectory).map(d => d.taskTypeDirectoryId);
            },
        )
    }

    moveToDirectory(directory: TaskTypeDirectory) {
        if (this.movingTask
            && this.movingTask.taskId
            && this.movingTask.currentDirectory?.taskTypeDirectoryId !== directory.taskTypeDirectoryId) {
            this.blockVisible = true;
            this.api.moveTaskToDirectory([this.movingTask.taskId], directory.taskTypeDirectoryId).subscribe(
                {
                    next: () => this.blockVisible = false,
                    error: () => this.blockVisible = false,
                }
            );
        }
    }

    catalogHighlight(taskTypeDirectoryId: number) {
        return this.highlightCatalogs?.includes(taskTypeDirectoryId) ? {
            'z-index': '999 !important',
            backgroundColor: 'white'
        } : null;
    }

    unExpandOtherCatalog(catalog: string) {
        for (const catalogKey in this.rootExpandMap) {
            this.rootExpandMap[catalogKey] = catalog === catalogKey;
        }
    }
}
