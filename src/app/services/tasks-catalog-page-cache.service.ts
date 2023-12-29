import {Injectable} from '@angular/core';
import {ApiService} from "./api.service";
import {RealTimeUpdateService} from "./real-time-update.service";
import {FormControl} from "@angular/forms";
import {BehaviorSubject, combineLatest, merge, shareReplay, startWith, switchMap} from "rxjs";

@Injectable({
    providedIn: 'root'
})
export class TasksCatalogPageCacheService {

    searchPhraseControl = new FormControl('');
    searchPhrase$ = this.searchPhraseControl.valueChanges.pipe(startWith(''));

    statusSubject = new BehaviorSubject('active');
    classSubject = new BehaviorSubject<number | null>(null);
    typeSubject = new BehaviorSubject<number | null>(null);
    tagSubject = new BehaviorSubject<number | null>(null);

    status$ = this.statusSubject.asObservable();
    class$ = this.classSubject.asObservable();
    type$ = this.typeSubject.asObservable();
    tag$ = this.tagSubject.asObservable();

    filters$ = combineLatest([this.searchPhrase$]).pipe(shareReplay(1));

    tasksUpdated$ = merge(this.rt.taskCreated(), this.rt.taskUpdated(), this.rt.taskDeleted()).pipe(startWith(null));

    updateCounter$ = this.tasksUpdated$.pipe(switchMap(()=>this.filters$));

    activeStatusCounter$ = this.updateCounter$
        .pipe(switchMap(([searchPhrase]) => this.api.getCountTasks(["ACTIVE"],null,null,null,{searchPhrase})), shareReplay(1))
    processingStatusCounter$ = this.updateCounter$
        .pipe(switchMap(([searchPhrase]) => this.api.getCountTasks(["PROCESSING"],null,null,null,{searchPhrase})), shareReplay(1))
    closedStatusCounter$ = this.updateCounter$
        .pipe(switchMap(([searchPhrase]) => this.api.getCountTasks(["CLOSE"],null,null,null,{searchPhrase})), shareReplay(1))

    updateWireframes$ = merge(this.rt.wireframeCreated(), this.rt.wireframeUpdated(), this.rt.wireframeDeleted()).pipe(startWith(null));

    wireframes$ = this.updateWireframes$.pipe(switchMap(()=>this.api.getWireframes()), shareReplay(1));

    constructor(private api: ApiService, private rt: RealTimeUpdateService) {
    }

    updatePath(status: string, cls: number | null, type: number | null, tag: number | null) {
      this.statusSubject.next(status);
      this.classSubject.next(cls);
      this.typeSubject.next(type);
      this.tagSubject.next(tag);
    }
}
