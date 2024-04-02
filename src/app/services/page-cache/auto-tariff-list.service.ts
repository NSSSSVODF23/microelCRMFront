import {Injectable} from '@angular/core';
import {AutoTariff, OltWorker, Ont, Page} from "../../types/transport-interfaces";
import {
  BehaviorSubject,
  combineLatest,
  delay,
  distinctUntilChanged,
  map,
  shareReplay,
  startWith,
  Subject, switchMap,
  tap
} from "rxjs";
import {RealTimeUpdateService} from "../real-time-update.service";
import {ApiService} from "../api.service";

@Injectable({
    providedIn: 'root'
})
export class AutoTariffListService {

    tableOffset = 0;
    tableContent?: Page<AutoTariff>;

    tableLazyLoad$ = new Subject<any>();
    previousPageRequest = "";
    updateContent$ = new BehaviorSubject(true);
    updateSignal$ = this.rt.receiveUpdateAutoTariff().pipe(startWith(true), map(() => true))
    tableContentLoading = false;
    tableLazyLoadDistinctChanges$ = this.tableLazyLoad$
        .pipe(
            delay(1),
            distinctUntilChanged((previous, current) => {
                return this.previousPageRequest === JSON.stringify(current)
            }),
            tap(paging => {
                tap(() => this.tableContentLoading = true)
                this.previousPageRequest = JSON.stringify(paging)
            })
        )
    isFirstLoad = true;

    filterCache: any;
    sortCache: any;
    globalFilter: string | null = null;

    constructor(private api: ApiService, private rt: RealTimeUpdateService) {
      combineLatest([
          this.tableLazyLoadDistinctChanges$.pipe(tap(() => this.tableContentLoading = true)),
          this.updateContent$.pipe(tap(() => this.tableContentLoading = true)),
          this.updateSignal$
      ]).pipe(
              switchMap(([paging]) => {
                delete paging.filters['global'];
                paging.globalFilter = this.globalFilter;
                this.filterCache = paging.filters;
                this.sortCache = paging.multiSortMeta;
                return this.api.getAutoTariffList(paging);
              }),
          ).subscribe(loadedPage => {
        this.tableContent = loadedPage;
        this.tableContentLoading = false;
        this.isFirstLoad = false;
      });
    }
}
