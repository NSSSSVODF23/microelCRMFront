import {Component, Input, OnInit} from '@angular/core';
import {LoadingState, PortInfo, Switch} from "../../../transport-interfaces";
import {ApiService} from "../../../services/api.service";
import {BehaviorSubject, of, retry, switchMap, tap} from "rxjs";

@Component({
    selector: 'app-commutator-view',
    templateUrl: './commutator-view.component.html',
    styleUrls: ['./commutator-view.component.scss']
})
export class CommutatorViewComponent implements OnInit {

    @Input() commutator?: Switch;
    isUpdating = false;

    lastSelectedPortId: number | null = null;
    selectPortChange$ = new BehaviorSubject<PortInfo | null>(null);
    fdbTableLoadingState = LoadingState.LOADING;
    fdbTable$ = this.selectPortChange$.pipe(
        tap(() => this.fdbTableLoadingState = LoadingState.LOADING),
        switchMap(port => {
            if (!port) return of(null);
            return this.api.fdbTableByPort(port.portInfoId);
        }),
        tap({
            next: (result) => {
                this.fdbTableLoadingState = result && result.length > 0 ? LoadingState.READY : LoadingState.EMPTY
            },
            error: (err) => {
                this.fdbTableLoadingState = LoadingState.ERROR
            }
        }),
        retry()
    )
    trackByLog = (index: number, item: any) => item.remoteUpdateLogId;

    constructor(private api: ApiService) {
    }

    get uptime() {
        if (!this.commutator
            || !this.commutator.additionalInfo
            || !this.commutator.additionalInfo.systemInfo
            || !this.commutator.additionalInfo.systemInfo.uptime) return 0;
        return new Date(this.commutator.additionalInfo.systemInfo.lastUpdate).getTime() - (this.commutator.additionalInfo.systemInfo.uptime * 1000);
    }

    ngOnInit(): void {
    }

    portSpeedName(port?: PortInfo): string {
        switch (port?.speed) {
            case 'HALF10':
                return '10H';
            case 'FULL10':
                return '10F';
            case 'HALF100':
                return '100H';
            case 'FULL100':
                return '100F';
            case 'HALF1000':
                return '1000H';
            case 'FULL1000':
                return '1000F';
        }
        return '';
    }

    portStatusStyle(port?: PortInfo): string {
        if (!port) return '';
        switch (port.status) {
            case 'UP':
                return 'bg-green-400';
            case 'DOWN':
                return 'bg-bluegray-100';
            case 'ADMIN_DOWN':
                return 'bg-red-400';
            case 'PREPARE':
                return 'bg-yellow-400';
        }
        return '';
    }

    refresh() {
        if (!this.commutator) return;
        this.isUpdating = true;
        this.api.commutatorRemoteUpdate(this.commutator.id).subscribe({
            next: () => this.isUpdating = false,
            error: () => this.isUpdating = false
        });
    }

    selectPort(port: PortInfo) {
        if (port.portInfoId === this.lastSelectedPortId) {
            this.lastSelectedPortId = null;
            this.selectPortChange$.next(null);
            return;
        }
        this.lastSelectedPortId = port.portInfoId;
        this.selectPortChange$.next(port);
    }

}
