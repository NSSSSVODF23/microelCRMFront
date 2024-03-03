import {AfterViewInit, Component, OnInit, ViewChild} from '@angular/core';
import {ApiService} from "../../../../services/api.service";
import {DynamicValueFactory} from "../../../../util";
import {
    of,
    combineLatest,
    startWith,
    Subject,
    fromEvent,
    Observable,
    reduce,
    count,
    tap,
    pairwise,
    switchMap, map, filter, shareReplay, debounceTime, ReplaySubject
} from "rxjs";
import {RealTimeUpdateService} from "../../../../services/real-time-update.service";
import {FormControl, FormGroup} from "@angular/forms";
import {LoadingState} from "../../../../types/transport-interfaces";
import {FromEvent} from "../../../../decorators";
import {Button} from "primeng/button";

@Component({
    templateUrl: './contracts-inspection-page.component.html',
    styleUrls: ['./contracts-inspection-page.component.scss']
})
export class ContractsInspectionPageComponent implements OnInit {

    LoadingState = LoadingState;

    pageControl = new FormControl<number>(0);
    filterControls = new FormGroup({searchQuery: new FormControl<string>("")});

    @FromEvent("searchInput", "keydown")
    searchInputKeyDown$ = new ReplaySubject<KeyboardEvent>(1);
    @FromEvent("searchButton", "click")
    clickSearchButton$ = new ReplaySubject<Event>(1);
    @FromEvent("clearButton", "click")
    clickClearButton$ = new ReplaySubject<Event>(1);

    enterDown$ = this.searchInputKeyDown$.pipe(filter(e => e.key === "Enter"), startWith(null));
    search$ = this.clickSearchButton$.pipe(startWith(null));
    cleared$ = this.clickClearButton$.pipe(tap(this.clearFilters.bind(this)), startWith(null));

    filterValue$ = this.filterControls.valueChanges.pipe(shareReplay(1));

    doSearch$ = combineLatest([this.enterDown$, this.search$, this.cleared$]).pipe(
        tap(() => this.pageControl.setValue(0)),
        map(() => this.filterControls.value)
    );

    controlsChange$ = combineLatest([this.pageControl.valueChanges.pipe(startWith(0)), this.doSearch$]).pipe(debounceTime(100));

    workLogs$ = DynamicValueFactory.ofPageAltAll(this.controlsChange$, this.api.getWorkLogsUnconfirmedContracts.bind(this.api), [this.rt.updatingMarkedContracts()]);

    constructor(private api: ApiService, private rt: RealTimeUpdateService) {
    }

    ngOnInit(): void {
    }

    private clearFilters(){
        this.filterControls.reset({
            searchQuery: ""
        })
    }
}
