import {Component, OnInit} from '@angular/core';
import {AutoUnsubscribe, RouteParam} from "../../../../decorators";
import {BehaviorSubject, combineLatest, map, Observable, startWith, Subject, switchMap, tap} from "rxjs";
import {ApiService} from "../../../../services/api.service";
import {ActivatedRoute} from "@angular/router";
import {AcpUserBrief, DhcpBinding, LoadingState, Page} from "../../../../types/transport-interfaces";
import {RealTimeUpdateService} from "../../../../services/real-time-update.service";
import {MenuItem, MessageService, SortMeta} from "primeng/api";
import {Menu} from "primeng/menu";
import {BlockUiService} from "../../../../services/block-ui.service";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {TelnetTerminalsService} from "../../../../services/telnet-terminals.service";

type TableFilter = {first: number, rows: number, multiSortMeta: {field: string, order: number}[]}

@Component({
    templateUrl: './topology-house-page.component.html',
    styleUrls: ['./topology-house-page.component.scss']
})
@AutoUnsubscribe()
export class TopologyHousePage implements OnInit {

    LoadingState = LoadingState;

    houseLoadingState = LoadingState.LOADING;
    commutatorLoadingState = LoadingState.LOADING;
    bindingsLoadingState = LoadingState.LOADING;
    bindingsTableOffset = 0;

    commutatorsPings: { [key: string]: Observable<any> } = {};
    bindingsPings: { [key: string]: Observable<any> } = {};
    bindingsUserBriefs: { [key: string]: AcpUserBrief } = {};
    bindingContextOptions: MenuItem[] = [];
    userAuthDialogVisible = false;
    selectBindingForAuth: DhcpBinding | null = null;
    authUserForm = new FormGroup({
        login: new FormControl('', [Validators.required]),
        macaddr: new FormControl('', [Validators.required])
    })

    bindingsLazyLoad$ = new Subject<TableFilter>();
    bindingsUpdate$ = new BehaviorSubject(true);
    //event.first = First row offset
    //event.rows = Number of rows per page
    //event.sortField = Field name to sort in single sort mode
    //event.sortOrder = Sort order as number, 1 for asc and -1 for dec in single sort mode
    //multiSortMeta: An array of SortMeta objects used in multiple columns sorting. Each SortMeta has field and order properties.
    //filters: Filters object having field as key and filter value, filter matchMode as value
    //globalFilter: Value of the global filter if available
    filterData$ = this.bindingsLazyLoad$
        .pipe(
            map(({first, rows, multiSortMeta}) => {
                return{
                    page: first / rows,
                    filter: {
                        size: rows,
                        status: 'online',
                        sort: multiSortMeta
                    }
                }
            })
        );

    @RouteParam('id')
    buildId$!: Observable<string>


    building$ = this.buildId$
        .pipe(
            tap(() => this.houseLoadingState = LoadingState.LOADING),
            switchMap(id => this.api.getBuilding(Number.parseInt(id))),
            tap({
                next: () => this.houseLoadingState = LoadingState.READY,
                error: () => this.houseLoadingState = LoadingState.ERROR
            })
        )

    commutators$ = this.buildId$
        .pipe(
            tap(() => this.commutatorLoadingState = LoadingState.LOADING),
            switchMap(id => this.api.getCommutatorsByBuildingId(Number.parseInt(id))),
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

    bindings$ = combineLatest([this.buildId$, this.filterData$, this.bindingsUpdate$])
        .pipe(
            tap(() => this.bindingsLoadingState = LoadingState.LOADING),
            switchMap(([id, {page, filter}]) => this.api.getBindingsByBuildingId(Number.parseInt(id), page, filter)),
            tap({
                next: (bindings) => {
                    this.bindingsLoadingState = LoadingState.READY;
                    this.bindingsPings = {};
                    this.bindingsUserBriefs = {};
                    for (const {ipaddr} of bindings.content) {
                        if (ipaddr)
                            this.bindingsPings[ipaddr] = this.ping(ipaddr);
                    }
                    this.api.getBulkUserBriefInfo(bindings.content.filter(b => b.authName).map(b => b.authName))
                        .subscribe(
                            (userBriefs: { [key: string]: AcpUserBrief }) => this.bindingsUserBriefs = userBriefs
                        )
                },
                error: () => this.bindingsLoadingState = LoadingState.ERROR
            })
        )

    bindingsPage: Page<DhcpBinding> | null = null;
    bindingsPageSub = this.bindings$.subscribe(bindings => this.bindingsPage = bindings);

    constructor(private api: ApiService, private rt: RealTimeUpdateService, private route: ActivatedRoute,
                private toast: MessageService, private blockService: BlockUiService, private telnetService: TelnetTerminalsService) {
    }

    ngOnInit(): void {
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

    selectBinding(event: MouseEvent, binding: DhcpBinding, menuRef: Menu, menuTarget: HTMLDivElement) {
        const {clientX, clientY} = event;
        menuTarget.style.left = clientX + 'px';
        menuTarget.style.top = clientY + 'px';
        this.bindingContextOptions = [
            {
                icon: 'mdi-web',
                label: 'Удаленка',
                disabled: !binding.ipaddr,
                command: () => {
                    this.openWeb(binding.ipaddr)
                }
            },
            {
                icon: 'mdi-password',
                label: 'Авторизовать',
                command: () => {
                    this.selectBindingForAuth = binding;
                    this.userAuthDialogVisible = true;
                    this.authUserForm.reset({
                        login: '', macaddr: binding.macaddr
                    })
                }
            }
        ]
        menuRef.show(event);
        setTimeout(()=>{
            menuRef.target = menuTarget;
            menuRef.alignOverlay();
        })
    }

    openWeb(ip: string) {
        this.blockService.wait({message: "Проверка наличия удаленного доступа"})
        this.api.checkRemoteControl(ip).subscribe(
            {
                next: (ra) => {
                    this.blockService.unblock();
                    if (ra.hasAccess && ra.webPort) {
                        window.open(`http://${ip}:${ra.webPort}`, '_blank');
                    } else {
                        this.toast.add({
                            detail: 'Нет удаленного доступа',
                            severity: 'dark',
                            key: 'darktoast',
                            icon: 'mdi-web',
                            closable: false
                        });
                    }
                },
                error: () => {
                    this.blockService.unblock();
                }
            }
        )
    }

    authUser() {
        const {login, macaddr} = this.authUserForm.value;
        if(!login || !macaddr)
            return;
        this.blockService.wait({message: "Авторизация устройства"});
        this.api.authDhcpBinding(login, macaddr)
            .subscribe(
                {
                    next:()=> {
                        this.blockService.unblock();
                        this.userAuthDialogVisible = false;
                    },
                    error:()=>this.blockService.unblock()
                }
            )
    }

    openCommutatorWeb(ip: string) {
        window.open(`http://${ip}`, '_blank');
    }

    openTelnetTerminal(name: string, ip: string) {
        this.telnetService.connect(name, ip);
    }
}
