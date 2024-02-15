import {Component, Input, OnInit} from '@angular/core';
import {AutoUnsubscribe, OnChangeObservable} from "../../../decorators";
import {
    BehaviorSubject,
    combineLatest,
    debounceTime,
    filter,
    map,
    Observable,
    startWith,
    Subject,
    switchMap,
    tap
} from "rxjs";
import {AcpUserBrief, DhcpBinding, LoadingState, Page} from "../../../types/transport-interfaces";
import {MenuItem, MessageService} from "primeng/api";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {ApiService} from "../../../services/api.service";
import {RealTimeUpdateService} from "../../../services/real-time-update.service";
import {Menu} from "primeng/menu";
import {BlockUiService} from "../../../services/block-ui.service";
import {DhcpBindingFilter, TableFilter} from "../../../types/service-interfaces";

@Component({
    selector: 'app-bindings-table',
    templateUrl: './bindings-table.component.html',
    styleUrls: ['./bindings-table.component.scss']
})
@AutoUnsubscribe()
export class BindingsTableComponent implements OnInit {

    LoadingState = LoadingState;

    @Input() filterId?: any;
    @Input() filterMode?: 'login' | 'building' | 'vlan' | 'building-by-login' | 'commutator';
    @Input() bindingsStatus?: 'online' | 'offline' | null;
    @Input() inline = false;
    @Input() preparedAuthLogin?: string;
    @Input() ping = true;

    @OnChangeObservable('filterId')
    filterId$ = new Subject<any>();
    @OnChangeObservable('filterMode')
    filterMode$ = new Subject<'login' | 'building' | 'vlan' | 'building-by-login' | 'commutator'>();
    @OnChangeObservable('bindingsStatus')
    bindingsStatus$ = new Subject<'online' | 'offline' | undefined | null>();

    filterOptionsChanged$ = combineLatest([this.filterId$.pipe(filter(id => !!id)), this.filterMode$.pipe(filter(mode => !!mode))]).pipe(debounceTime(1));

    bindingsLoadingState = LoadingState.LOADING;
    bindingsTableOffset = 0;

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
    bindingsUpdator$ = new BehaviorSubject(true);

    filterData$ = combineLatest([this.bindingsLazyLoad$, this.bindingsStatus$.pipe(startWith(undefined))])
        .pipe(
            debounceTime(1),
            map(([{first, rows, multiSortMeta}, status]) => {
                return {
                    page: first / rows,
                    filter: {
                        size: rows,
                        status,
                        sort: multiSortMeta
                    } as DhcpBindingFilter
                }
            })
        );

    bindingRTUpdate$ = this.filterOptionsChanged$
        .pipe(
            switchMap(([id, mode]) => {
                return this.rt.acpDhcpBindingUpdated()
                    .pipe(
                        filter((binding) => {
                            if (mode === 'login')
                                return binding.authName === id;
                            if (mode === 'vlan')
                                return binding.vlanid === Number.parseInt(id);
                            return true;
                        }),
                    )
            }),
            startWith(null)
        )

    bindings$ = combineLatest([this.filterOptionsChanged$, this.filterData$, this.bindingsUpdator$, this.bindingRTUpdate$])
        .pipe(
            tap(() => this.bindingsLoadingState = LoadingState.LOADING),
            switchMap(([[id, mode], {page, filter}]) => {
                if (mode === 'login')
                    return this.api.getBindingsByLogin(id, page, filter);
                if (mode === 'vlan')
                    return this.api.getBindingsByVlan(Number.parseInt(id), page, filter);
                if (mode === 'building-by-login')
                    return this.api.getBindingsFromBuildingByLogin(id, page, filter);
                if (mode === 'commutator')
                    return this.api.getBindingsByCommutator(id, page, filter);
                return this.api.getBindingsByBuildingId(Number.parseInt(id), page, filter);
            }),
            tap({
                next: (bindings) => {
                    this.bindingsLoadingState = LoadingState.READY;
                    this.bindingsPings = {};
                    this.bindingsUserBriefs = {};
                    for (const {ipaddr} of bindings.content) {
                        if (ipaddr)
                            this.bindingsPings[ipaddr] = this.pingObserver(ipaddr);
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


    constructor(private api: ApiService, private rt: RealTimeUpdateService,
                private blockService: BlockUiService, private toast: MessageService) {
    }

    ngOnInit(): void {
    }

    selectBinding(event: MouseEvent, binding: DhcpBinding, menuRef: Menu) {
        const {clientX, clientY} = event;

        const menuTarget = document.createElement("div");
        menuTarget.className = "fixed w-1rem h-1rem pointer-events-none";
        menuTarget.style.left = clientX + 'px';
        menuTarget.style.top = clientY + 'px';
        document.body.appendChild(menuTarget);

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
                        login: this.preparedAuthLogin ? this.preparedAuthLogin : '', macaddr: binding.macaddr
                    })
                }
            }
        ]
        menuRef.show(event);
        setTimeout(() => {
            menuRef.target = menuTarget;
            menuRef.alignOverlay();
            document.body.removeChild(menuTarget);
        })
    }

    authUser() {
        const {login, macaddr} = this.authUserForm.value;
        if (!login || !macaddr)
            return;
        this.blockService.wait({message: "Авторизация устройства"});
        this.api.authDhcpBinding(login, macaddr)
            .subscribe(
                {
                    next: () => {
                        this.blockService.unblock();
                        this.userAuthDialogVisible = false;
                    },
                    error: () => this.blockService.unblock()
                }
            )
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

    private pingObserver(ip: string) {
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
