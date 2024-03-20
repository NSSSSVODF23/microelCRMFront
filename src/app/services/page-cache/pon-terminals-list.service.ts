import {Injectable} from '@angular/core';
import {ApiService} from "../api.service";
import {RealTimeUpdateService} from "../real-time-update.service";
import {
    BehaviorSubject,
    combineLatest,
    delay,
    distinctUntilChanged, map,
    ReplaySubject, shareReplay, startWith,
    Subject,
    switchMap,
    tap
} from "rxjs";
import {DynamicValueFactory} from "../../util";
import {Ont, Page, SwitchBaseInfo, OltWorker} from "../../types/transport-interfaces";
import {TelnetTerminalsService} from "../telnet-terminals.service";

@Injectable({
    providedIn: 'root'
})
export class PonTerminalsListService {

    tableOffset = 0;
    tableContent?: Page<Ont>;

    tableLazyLoad$ = new Subject<any>();
    previousPageRequest = "";
    tableLazyLoadDistinctChanges$ = this.tableLazyLoad$
        .pipe(
            delay(1),
            distinctUntilChanged((previous, current)=> {
                return this.previousPageRequest === JSON.stringify(current)
            }),
            tap(paging => {
                tap(() => this.tableContentLoading = true)
                this.previousPageRequest = JSON.stringify(paging)
            })
        )
    updateContent$ = new BehaviorSubject(true);
    updateSignal$ = this.rt.receiveNewOntStatusChangeEvents().pipe(startWith(true),map(()=>true))
    tableContentLoading = false;
    oltList$ = this.api.getOltList().pipe(shareReplay(1));
    appendWorker$ = this.rt.receiveNewWorkersInQueue();
    removeWorker$ = this.rt.receiveSpentWorkersInQueue().pipe(delay(150));
    updateOnt$ = this.rt.receiveUpdatedOnt();
    workersQueue: OltWorker[] = [];
    workersQueue$ = this.api.getWorkerQueue();
    isFirstLoad = true;

    filterCache: any;
    sortCache: any;
    globalFilter: string | null = null;

    constructor(private api: ApiService, private rt: RealTimeUpdateService, private telnetService: TelnetTerminalsService) {
        combineLatest([this.tableLazyLoadDistinctChanges$, this.updateContent$.pipe(tap(() => this.tableContentLoading = true)), this.updateSignal$])
            .pipe(
                switchMap(([paging]) => {
                    delete paging.filters['global'];
                    paging.globalFilter = this.globalFilter;
                    this.filterCache = paging.filters;
                    this.sortCache = paging.multiSortMeta;
                    return this.api.getOntTable(paging);
                }),
            ).subscribe(loadedPage => {
            this.tableContent = loadedPage;
            this.tableContentLoading = false;
            this.isFirstLoad = false;
        });
        this.workersQueue$.subscribe(queue => {
            this.workersQueue = queue;
        });
        this.appendWorker$.subscribe(newWorker => {
            this.workersQueue = [...this.workersQueue, newWorker];
        });
        this.updateOnt$.subscribe(updatedOnt => {
            let target = this.tableContent?.content.find(ont => ont.id === updatedOnt.id);
            if (target) {
                target.isOnline = updatedOnt.isOnline;
                target.description = updatedOnt.description;
                target.userLogin = updatedOnt.userLogin;
                target.curRxSignal = updatedOnt.curRxSignal;
                target.curTxSignal = updatedOnt.curTxSignal;
                target.port = updatedOnt.port;
                target.position = updatedOnt.position;
                target.updated = updatedOnt.updated;
                target.uptime = updatedOnt.uptime;
            }
        });
        this.removeWorker$.subscribe( spentWorker =>{
            this.workersQueue = this.workersQueue.filter(worker => worker.id !== spentWorker.id);
            this.workersQueue = [...this.workersQueue];
        });
    }

    openCommutatorWeb(ip: string) {
        window.open(`http://${ip}`, '_blank');
    }

    openTelnetTerminal(name: string, ip: string) {
        this.telnetService.connect(name, ip);
    }
}
