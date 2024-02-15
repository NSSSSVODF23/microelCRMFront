import {Component, OnInit} from '@angular/core';
import {AutoUnsubscribe, RouteParam} from "../../../../decorators";
import {
    BehaviorSubject,
    combineLatest,
    map,
    Observable,
    ReplaySubject,
    shareReplay,
    startWith,
    Subject,
    switchMap,
    tap
} from "rxjs";
import {ApiService} from "../../../../services/api.service";
import {ActivatedRoute} from "@angular/router";
import {AcpUserBrief, DhcpBinding, LoadingState, Page} from "../../../../types/transport-interfaces";
import {RealTimeUpdateService} from "../../../../services/real-time-update.service";
import {MenuItem, MessageService, SortMeta} from "primeng/api";
import {Menu} from "primeng/menu";
import {BlockUiService} from "../../../../services/block-ui.service";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {TelnetTerminalsService} from "../../../../services/telnet-terminals.service";


@Component({
    templateUrl: './topology-house-page.component.html',
    styleUrls: ['./topology-house-page.component.scss']
})
@AutoUnsubscribe()
export class TopologyHousePage implements OnInit {

    LoadingState = LoadingState;

    houseLoadingState = LoadingState.LOADING;


    @RouteParam('id')
    buildIdParam$ = new ReplaySubject<string>(1);

    buildId$ = this.buildIdParam$.pipe(map(id => Number.parseInt(id)));

    building$ = this.buildId$
        .pipe(
            tap(() => this.houseLoadingState = LoadingState.LOADING),
            switchMap(id => this.api.getBuilding(id)),
            tap({
                next: () => this.houseLoadingState = LoadingState.READY,
                error: () => this.houseLoadingState = LoadingState.ERROR
            }),
            shareReplay(1)
        )

    files$ = this.building$
        .pipe(
            map(building=> building.fullName),
            switchMap(name => this.api.getFilesSuggestions(name))
        )



    constructor(private api: ApiService, private route: ActivatedRoute) {
    }

    ngOnInit(): void {
    }

}
