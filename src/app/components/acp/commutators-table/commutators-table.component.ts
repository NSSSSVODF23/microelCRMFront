import {Component, Input, OnInit} from '@angular/core';
import {filter, map, merge, Observable, ReplaySubject, startWith, Subject, switchMap, tap} from "rxjs";
import {AcpCommutator, LoadingState, Switch} from 'src/app/types/transport-interfaces';
import {AutoUnsubscribe, OnChangeObservable} from "../../../decorators";
import {ApiService} from "../../../services/api.service";
import {RealTimeUpdateService} from "../../../services/real-time-update.service";
import {TelnetTerminalsService} from "../../../services/telnet-terminals.service";

@Component({
    selector: 'app-commutators-table',
    templateUrl: './commutators-table.component.html',
    styleUrls: ['./commutators-table.component.scss']
})
@AutoUnsubscribe()
export class CommutatorsTableComponent implements OnInit {

    LoadingState = LoadingState;

    @Input() buildId?: any;
    @Input() inline = false;

    @OnChangeObservable('buildId')
    buildId$ = new ReplaySubject<number>(1);

    commutatorLoadingState = LoadingState.LOADING;
    commutatorsPings: { [key: string]: Observable<any> } = {};

    commutatorsInitiators$ = merge(this.rt.acpCommutatorCreated(), this.rt.acpCommutatorUpdated(), this.rt.acpCommutatorDeleted())
        .pipe(
            filter(sw=>sw.buildId === this.buildId),
            startWith(null)
        )

    commutatorsLoader$ = this.buildId$
        .pipe(
            filter(id => !!id),
            tap(() => this.commutatorLoadingState = LoadingState.LOADING),
            switchMap(id => this.api.getCommutatorsByBuildingId(id)),
            tap({
                next: (commutators) => {
                    this.commutatorLoadingState = LoadingState.READY;
                    this.commutatorsPings = {};
                    for (const {ip} of commutators) {
                        this.commutatorsPings[ip] = this.ping(ip);
                    }
                },
                error: () => this.commutatorLoadingState = LoadingState.ERROR
            })
        )

    commutators$ = this.commutatorsInitiators$.pipe(switchMap(() => this.commutatorsLoader$))

    commutatorViewVisible = false;
    commutatorViewHeader = '';
    commutatorForView?: Switch;
    updateCommutatorSub = this.rt.acpCommutatorUpdated().subscribe(updatedCommutator=>{
        if(this.commutatorForView?.id === updatedCommutator.id){
            this.commutatorForView = updatedCommutator;
        }
    })

    constructor(private api: ApiService, private rt: RealTimeUpdateService, private telnetService: TelnetTerminalsService) {
    }

    ngOnInit(): void {
    }

    openCommutatorWeb(ip: string) {
        window.open(`http://${ip}`, '_blank');
    }

    openTelnetTerminal(name: string, ip: string) {
        this.telnetService.connect(name, ip);
    }

    openCommutatorView(commutator: any) {
        this.commutatorViewHeader = commutator.name  + '・' + commutator.ip;
        this.api.getCommutator(commutator.id).subscribe(
            (commutator) => {
                this.commutatorForView = commutator.commutator;
                this.commutatorViewVisible = true;
            }
        )
    }

    private ping(ip: string) {
        return this.rt.pingMonitoring(ip)
            .pipe(
                map(ping => {
                    const loss = 100 - ping.reachablePercentage;
                    return {
                        online: ping.isReachable,
                        latency: ping.delayAvg,
                        loss,
                        styleClass: loss > 0 ? 'text-red-400' : 'text-green-400'
                    }
                })
            );
    }
}
