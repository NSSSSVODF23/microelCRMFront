import {Component, Input, OnInit} from '@angular/core';
import {ApiService} from "../../../services/api.service";
import {RealTimeUpdateService} from "../../../services/real-time-update.service";
import {BehaviorSubject, debounceTime, delay, filter, map, merge, Observable, of, share} from "rxjs";
import {PingMonitoring} from "../../../transport-interfaces";
import "chartjs-adapter-moment";
import {MessageService} from "primeng/api";

@Component({
    selector: 'app-ip-view',
    templateUrl: './ip-view.component.html',
    styleUrls: ['./ip-view.component.scss']
})
export class IpViewComponent implements OnInit {

    ping$: Observable<PingMonitoring | null> = of(null);
    remoteAccess$: Observable<any | null> = of(null);
    data = {"datasets": [{"label": "Ping", "data": [{"x": "2021-11-06 23:39:30", "y": 999.0}]}]}
    additionalInformationVisible = false;
    chartOptions = {
        elements: {
            line: {
                tension: .2,
                borderWidth: 1
            },
            point: {
                radius: 0
            }
        },
        scales: {
            x: {
                type: 'time',
                ticks: {display: false},
                display: false,
                suggestedMax: 10,
                grid: {
                    display: false
                }
            },
            y: {
                display: false,
                grid: {
                    display: false
                }
            }
        },
        animation: false,
        plugins: {legend: {display: false}, tooltip: {enabled: false}},
    };
    chartVisibleChange$ = new BehaviorSubject(false);
    chartVisible$ = this.chartVisibleChange$.pipe(
        debounceTime(200)
    );
    breath$ = this.breathInit();

    constructor(private api: ApiService, private rt: RealTimeUpdateService, private toast: MessageService) {
    }

    _ip?: string;

    get ip(): string {
        return this._ip ?? "___.___.___.___";
    }

    @Input() set ip(value: string) {
        this._ip = value;
        this.ping$ = this.rt.pingMonitoring(value);
        this.remoteAccess$ = this.api.checkRemoteControl(value)
        this.breath$ = this.breathInit();
    }

    breathInit() {
        return merge(
            this.ping$.pipe(map((ping) => {
                if(!ping) return 'hsl(0 0% 50%)';
                if(ping.reachablePercentage === 0) return 'hsl(0 0% 50%)';
                const offset = Math.min(100, ((100-ping.reachablePercentage)**2));
                return `hsl(0 ${offset}% 60%)`
            })),
            this.ping$.pipe(delay(500), map(() => 'hsl(0 0% 50%)'))
        ).pipe(share())
    }

    ngOnInit(): void {
    }

    copyMessage(ip: string) {
        navigator.clipboard.writeText(ip).then(
            () => {
                this.toast.add({detail: 'IP адрес скопирован', severity: 'dark', key: 'darktoast', icon: 'mdi-copy', closable: false});
            }
        );
    }

    openWeb(ip: string) {
        this.api.checkRemoteControl(ip).subscribe(
            {
                next: (ra) => {
                    if(ra.hasAccess && ra.webPort){
                        window.open(`http://${ip}:${ra.webPort}`, '_blank');
                    }else {
                        this.toast.add({detail: 'Нет удаленного доступа', severity: 'dark', key: 'darktoast', icon: 'mdi-web', closable: false});
                    }
                }
            }
        )
    }
}
