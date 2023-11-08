import {Component, OnDestroy, OnInit} from '@angular/core';
import {ApiService} from "../../services/api.service";
import {ActivatedRoute} from "@angular/router";
import {
    BillingTotalUserInfo,
    DhcpBinding,
    LoadingState,
    NCLHistoryItem,
    NCLHistoryWrapper,
    UserEvents
} from "../../transport-interfaces";
import {DynamicValueFactory, SubscriptionsHolder} from "../../util";
import {CustomNavigationService} from "../../services/custom-navigation.service";
import {
    BehaviorSubject,
    combineLatest,
    debounceTime,
    filter,
    first,
    map,
    merge,
    shareReplay,
    startWith,
    Subject,
    switchMap,
    tap
} from "rxjs";
import {TaskCreatorService} from "../../services/task-creator.service";
import {ConfirmationService, MenuItem, MessageService} from "primeng/api";
import {Menu} from "primeng/menu";
import {RealTimeUpdateService} from "../../services/real-time-update.service";
import {FormControl, FormGroup, Validators} from "@angular/forms";

@Component({
    templateUrl: './billing-user-page.component.html',
    styleUrls: ['./billing-user-page.component.scss']
})
export class BillingUserPageComponent implements OnInit, OnDestroy {

    userInfo?: BillingTotalUserInfo;
    loadingState = LoadingState.LOADING;
    loadingTimestamp = new Date();

    currentLogin?: string;
    update$ = new Subject<string>();
    subscriptions = new SubscriptionsHolder();
    userInfoHandler = {
        next: (userInfo: BillingTotalUserInfo) => {
            this.userInfo = undefined;
            setTimeout(() => {
                this.userInfo = userInfo;
                this.initControlMenuItems();
                this.loadingTimestamp = new Date();
            })
            this.loadingState = LoadingState.READY;
        },
        error: () => {
            this.userInfo = undefined;
            this.loadingState = LoadingState.ERROR;
        }
    }
    wireframes: any[] = [];


    houseBindingsPage = new BehaviorSubject(0);
    houseBindingsPage$ = this.houseBindingsPage.pipe(
        startWith(0),
        shareReplay(1)
    )
    houseBindingsLoadingState = LoadingState.LOADING;

    changeTaskHistoryPage = new BehaviorSubject(0);
    bindingContextMenuItems = [] as MenuItem[];

    isLoadingLastBindings = true;
    isAuthDialogVisible = false;
    openAuthDialog = new Subject<null>();
    changeLastBindingsPage = new BehaviorSubject(0);
    changeLastBindingsPage$ = this.changeLastBindingsPage.pipe(
        tap(() => this.isLoadingLastBindings = true),
        shareReplay(1)
    )
    openAuthDialog$ = this.openAuthDialog.pipe(
        tap(() => {
            this.isAuthDialogVisible = true
            this.isLoadingLastBindings = true
        }),
    )
    lastBindingsFilterForm = new FormGroup({
        state: new FormControl(true),
        macaddr: new FormControl(null),
        login: new FormControl(null),
        ip: new FormControl(null),
        vlan: new FormControl(null),
        buildingId: new FormControl(null),
    });
    lastBindingsFilter$ = this.lastBindingsFilterForm.valueChanges.pipe(
        startWith(this.lastBindingsFilterForm.value),
        debounceTime(1000),
        tap(() => this.isLoadingLastBindings = true),
        map(filters => {
            return {
                state: filters.state ? 1 : 0, macaddr: filters.macaddr, login: filters.login, ip: filters.ip,
                vlan: filters.vlan, buildingId: filters.buildingId && filters.buildingId['buildingId']
            }
        }),
        shareReplay(1)
    );
    lastBindingsPage$ = combineLatest([
        this.openAuthDialog$,
        this.changeLastBindingsPage$,
        this.lastBindingsFilter$
    ]).pipe(
        switchMap(([_, page, {
            state,
            macaddr,
            vlan,
            login,
            ip,
            buildingId
        }]) => this.api.getLastBindings(page, state, macaddr, login, ip, vlan, buildingId)),
        tap(() => this.isLoadingLastBindings = false),
        shareReplay(1)
    )
    isHistoryDialogVisible = false;
    isNCLHistoryDialogVisible = false
    userEvents?: UserEvents;
    userEventsLoadingState = LoadingState.LOADING;
    billingPaymentTypes$ = this.api.getBillingPaymentTypesList();
    isPaymentDialogVisible = false;
    paymentForm = new FormGroup({
        payType: new FormControl(null, [Validators.required]),
        sum: new FormControl(null, [Validators.required]),
        comment: new FormControl(null, [Validators.required]),
    });
    controlMenuItems: MenuItem[] = [];
    pathChange$ = this.route.params.pipe(tap(params => {
        this.currentLogin = params['login']
    }), map(params => params['login']));

    tasks$ = DynamicValueFactory.ofPage(
        combineLatest([this.pathChange$, this.changeTaskHistoryPage]),
        this.api.getTasksByLogin.bind(this.api),
        'taskId',
        this.rt.taskCreated().pipe(filter(task => task?.fields?.some(field => field.stringData === this.currentLogin) ?? false)),
        this.rt.taskUpdated(),
        this.rt.taskDeleted(),
    );
    loadUser$ = merge(this.pathChange$, this.update$);
    dhcpBindingsLoad$ = this.loadUser$.pipe(
        switchMap(login => this.api.getDhcpBindingsByLogin(login)),
        shareReplay(1)
    );
    dhcpBindings$ = DynamicValueFactory.of(this.dhcpBindingsLoad$, 'id', null, this.rt.acpDhcpBindingUpdated());
    hardwareEmptyMessage$ = this.dhcpBindings$.pipe(
        map(bindings => {
            if(bindings.value.length === 0){
                return 'Нет абонентского оборудования';
            }else if(bindings.value.every(b=>!b.isAuth)){
                return 'Нет авторизованного оборудования';
            }else{
                return null;
            }
        }),
    );
    activeClientHardware$ = this.dhcpBindings$.pipe(
        map(bindings => bindings.value.find(b=>b.isAuth)),
    )
    firstVlanOfBindings$ = this.dhcpBindingsLoad$.pipe(
        filter(bindings => bindings && bindings.length > 0),
        map(binds => {
            const authBind = binds.find(bind => bind.isAuth);
            if (authBind) {
                return authBind.vlanid;
            } else {
                return binds[0].vlanid;
            }
        }),
        tap(vlan => this.lastBindingVlan = vlan),
        shareReplay(1)
    )
    changeHouseVlanPage$ = combineLatest([this.firstVlanOfBindings$, this.houseBindingsPage$]).pipe(shareReplay(1));

    updateHousePage$ = this.rt.acpDhcpBindingHousePageUpdateSignal().pipe(
        switchMap((resp) => this.changeHouseVlanPage$.pipe(first(), filter(([vlan, page]) => vlan === resp.vlan))),
    )
    dhcpBindingsByVlan$$ = DynamicValueFactory.ofPage(
        merge(this.changeHouseVlanPage$, this.updateHousePage$),
        (vlan, page) => this.api.getDhcpBindingsByVlan(page, vlan, this.currentLogin),
        'id',
        null,
        this.rt.acpDhcpBindingUpdated(),
        null
    )
    isCommutatorRefreshing = false;
    lastBindingVlan: null | number = null;
    commutatorsByVlan$ = DynamicValueFactory.ofWithFilter(
        this.firstVlanOfBindings$.pipe(
            filter(vlan => vlan != undefined && vlan > 0 && vlan < 4097),
            map(vlan => [vlan]),
        ),
        (vlan) => this.api.getCommutatorsByVlan(vlan),
        'id',
        this.rt.acpCommutatorCreated(),
        this.rt.acpCommutatorUpdated(),
        this.rt.acpCommutatorDeleted()
    )
    nclHistory$ = new BehaviorSubject<NCLHistoryWrapper|null>(null);
    nclHistoryLoadingState = LoadingState.LOADING;
    nclHistoryViewStyle$ = this.nclHistory$.pipe(
        map(history => {
            if(history){
                try {
                    const length = Object.entries(history.nclItems).length;
                    if(length === 0){
                        return {
                            display: 'grid',
                            alignItems: 'center',
                        };
                    }
                    return {
                        display: 'grid',
                        grid: `repeat(${length}, 1.5rem)/max-content repeat(100,1fr)`,
                        alignItems: 'center',
                    }
                } catch (e) {
                    return {
                        display: 'grid',
                        alignItems: 'center',
                    };
                }
            }
            return {
                display: 'grid',
                alignItems: 'center',
            };
        })
    )

    constructor(private api: ApiService, private rt: RealTimeUpdateService, private route: ActivatedRoute, readonly customNav: CustomNavigationService,
                readonly taskCreation: TaskCreatorService, readonly toast: MessageService, private confirm: ConfirmationService) {
    }

    get isEndTariffDateAfter() {
        return this.userInfo?.newTarif?.edate && new Date(this.userInfo?.newTarif?.edate).getTime() > new Date().getTime();
    };

    get isOnline() {
        return this.userInfo?.newTarif?.online === 1;
    };

    get hasCredit() {
        return this.userInfo?.ibase?.credit && this.userInfo.ibase.credit > 0;
    };

    get mainTariff() {
        if (this.userInfo?.oldTarif[0]) {
            return this.userInfo?.oldTarif[0]
        } else {
            return null;
        }
    }

    get services() {
        if (this.userInfo?.oldTarif && this.userInfo?.oldTarif.length > 0) {
            return this.userInfo?.oldTarif.slice(1);
        }
        return [];
    }

    get totalCost() {
        if (this.userInfo?.oldTarif && this.userInfo?.oldTarif.length > 0) {
            return this.userInfo.oldTarif.reduce((prev, curr) => {
                return prev + curr.price;
            }, 0)
        }
        return 0;
    }

    get creditAmount() {
        return this.userInfo?.ibase?.credit ?? 0;
    }

    get moneyAmount() {
        return this.userInfo?.ibase?.money ?? 0;
    }

    initControlMenuItems() {

        this.controlMenuItems = [
            {
                label: 'История операций',
                icon: 'mdi-event_note',
                command: () => this.openHistoryDialog()
            },
            {
                label: 'Включить отложенный',
                icon: 'mdi-more_time',
                disabled: !this.userInfo?.newTarif?.isPossibleEnableDeferredPayment,
                styleClass: 'warning-menu-button',
                command: () => this.confirmEnableDeferredPayment()
            },
            {
                label: 'Менеджер баланса',
                icon: 'mdi-account_balance',
                command: () => this.openPaymentDialog()
            },
            {
                label: this.userInfo?.newTarif?.isServiceSuspended ? 'Возобновить обслуживание' : 'Приостановить обслуживание',
                icon: this.userInfo?.newTarif?.isServiceSuspended ? 'mdi-play_arrow' : 'mdi-pause',
                styleClass: !this.userInfo?.newTarif?.isServiceSuspended ? 'danger-menu-button' : 'success-menu-button',
                command: () => this.confirmSuspendService()
            }
        ];
    }

    confirmSuspendService() {
        if (!this.userInfo?.newTarif) return;
        if (this.userInfo?.newTarif?.isServiceSuspended) {
            this.confirm.confirm({
                header: 'Подтверждение',
                message: 'Возобновить обслуживание пользователя?',
                accept: () => this.currentLogin && this.api.startUserService(this.currentLogin).subscribe()
            });
        } else {
            this.confirm.confirm({
                header: 'Подтверждение',
                message: 'Приостановить обслуживание пользователя?',
                accept: () => this.currentLogin && this.api.stopUserService(this.currentLogin).subscribe()
            });
        }

    }

    confirmEnableDeferredPayment() {
        this.confirm.confirm({
            header: 'Подтверждение',
            message: 'Включить отложенный платеж?',
            accept: () => {
                if (!this.currentLogin) return;
                this.api.setDeferredPayment(this.currentLogin).subscribe();
            }
        });
    }

    trackByDhcpBinding(index: number, item: DhcpBinding) {
        return item.vlanid + item.ipaddr + item.state + item.id + item.isAuth + item.authName + item.authExpire + item.lastConnectionLocation?.checkedAt;
    };

    ngOnInit(): void {
        this.rt.acpDhcpBindingUpdated().subscribe()
        this.subscriptions.addSubscription('pch',
            this.loadUser$.subscribe(this.load.bind(this))
        )
        this.api.getWireframesNames().subscribe(wf => {
            this.wireframes = wf.map(value => ({
                label: value.name,
                command: () => {
                    this.api.convertBillingAddress(this.userInfo?.ibase?.addr).subscribe((address) => {
                        if (!this.currentLogin) {
                            this.toast.add({
                                severity: 'error',
                                summary: "Ошибка запроса",
                                detail: "Не найден логин для создания задачи"
                            })
                            return;
                        }
                        this.taskCreation.wireframe(value.wireframeId, {
                            login: this.currentLogin,
                            address
                        })
                    })
                },
            }));
        });
    }

    load() {
        if (this.currentLogin) {
            this.subscriptions.unsubscribe('userUpd');
            this.api.getBillingUserInfo(this.currentLogin).subscribe(this.userInfoHandler);
            this.subscriptions.addSubscription('userUpd', this.rt.billingUserUpdated(this.currentLogin).subscribe(this.userInfoHandler));
        } else {
            this.loadingState = LoadingState.ERROR;
        }
    }

    ngOnDestroy() {
        this.subscriptions.unsubscribeAll();
    }

    checkRemoteControl(ipaddr: any) {
        this.api.checkRemoteControl(ipaddr).subscribe({
            next: (res) => {
            },
            error: (err) => {
                console.log("Error ", err);
            }
        })
    }

    openBindingContextMenu(event: MouseEvent, binding: DhcpBinding, menu: Menu) {
        this.bindingContextMenuItems = [
            {
                label: 'Авторизовать (текущий логин)', command: () => this.authCurrentLogin(binding.macaddr), disabled: binding.isAuth && binding.authName === this.currentLogin
            },
            {
                label: 'История подключений', command: () => this.openNCLHistoryDialog(binding),
            }
        ]
        menu.toggle(event);
    }

    authCurrentLogin(macaddr: string) {
        if (!this.currentLogin) {
            this.toast.add({
                severity: 'error',
                summary: "Ошибка запроса",
                detail: "Не найден логин для авторизации"
            })
            return;
        }
        this.api.authDhcpBinding(this.currentLogin, macaddr).subscribe(() => {
            this.toast.add({
                detail: 'Логин успешно авторизован',
                severity: 'dark',
                key: 'darktoast',
                icon: 'mdi-verified',
                closable: false
            })
            if (this.currentLogin)
                this.update$.next(this.currentLogin)
        });
    }

    authConfirm(binding: DhcpBinding) {
        this.confirm.confirm({
            header: 'Подтверждение',
            message: 'Авторизовать ' + binding.macaddr + ' под логином ' + this.currentLogin + '?',
            accept: () => {
                this.authCurrentLogin(binding.macaddr);
            }
        })
    }

    getHistory() {
        if (!this.currentLogin) return;
        this.userEvents = undefined;
        this.userEventsLoadingState = LoadingState.LOADING;
        this.api.getBillingUserEvents(this.currentLogin).subscribe({
            next: events => {
                this.userEvents = events;
                this.userEventsLoadingState = LoadingState.READY;
            },
            error: err => {
                this.userEventsLoadingState = LoadingState.ERROR;
            }
        })
    }

    closeHistoryDialog() {
        this.userEvents = undefined;
        this.userEventsLoadingState = LoadingState.LOADING;
    }

    openHistoryDialog() {
        this.isHistoryDialogVisible = true;
    }

    openPaymentDialog() {
        this.isPaymentDialogVisible = true;
    }

    sendPayment() {
        if (!this.currentLogin) return;
        this.api.makePayment(this.currentLogin, this.paymentForm.value).subscribe();
    }

    refreshCommutators() {
        if (this.lastBindingVlan)
            this.api.commutatorRemoteUpdateByVlan(this.lastBindingVlan).pipe(
                tap(() => this.isCommutatorRefreshing = true)
            ).subscribe({
                next: () => this.isCommutatorRefreshing = false,
                error: () => this.isCommutatorRefreshing = false
            })
    }

    openNCLHistoryDialog(binding: DhcpBinding) {
        this.isNCLHistoryDialogVisible = true;
        this.nclHistoryLoadingState = LoadingState.LOADING;
        this.api.getNetworkConnectionLocationHistory(binding.id).subscribe(
            {
                next: (history) => {
                    this.nclHistory$.next(history);
                    this.nclHistoryLoadingState = Object.entries(history.nclItems).length ? LoadingState.READY : LoadingState.EMPTY
                },
                error: () => this.nclHistoryLoadingState = LoadingState.ERROR
            }
        );
    }
}
