import {Injectable} from '@angular/core';
import {ApiService} from "../api.service";
import {RealTimeUpdateService} from "../real-time-update.service";
import {
    BehaviorSubject,
    combineLatest,
    delay,
    distinctUntilChanged,
    ReplaySubject,
    Subject,
    switchMap,
    tap
} from "rxjs";
import {DynamicValueFactory} from "../../util";
import {Page, SwitchBaseInfo} from "../../types/transport-interfaces";
import {TelnetTerminalsService} from "../telnet-terminals.service";

@Injectable({
    providedIn: 'root'
})
export class CommutatorListService {

    tableOffset = 0;
    tableContent?: Page<SwitchBaseInfo>;

    tableLazyLoad$ = new Subject<any>();
    previousPageRequest = "";
    tableLazyLoadDistinctChanges$ = this.tableLazyLoad$
        .pipe(
            delay(1),
            distinctUntilChanged((previous, current)=> {
                return this.previousPageRequest === JSON.stringify(current)
            }),
            tap(paging => this.previousPageRequest = JSON.stringify(paging))
        )
    updateContent$ = new BehaviorSubject(true);
    tableContentLoading = false;

    constructor(private api: ApiService, private rt: RealTimeUpdateService, private telnetService: TelnetTerminalsService) {
        combineLatest([this.tableLazyLoadDistinctChanges$, this.updateContent$])
            .pipe(
                tap(() => this.tableContentLoading = true),
                switchMap(([paging]) => {
                    delete paging.filters['global'];
                    return this.api.getCommutatorsTable(paging);
                }),
            ).subscribe(loadedPage => {
            this.tableContent = loadedPage;
            this.tableContentLoading = false;
        })
    }

    openCommutatorWeb(ip: string) {
        window.open(`http://${ip}`, '_blank');
    }

    openTelnetTerminal(name: string, ip: string) {
        this.telnetService.connect(name, ip);
    }
}
