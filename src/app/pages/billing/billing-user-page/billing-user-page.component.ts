import {Component, OnDestroy, OnInit} from '@angular/core';
import {ApiService} from "../../../services/api.service";
import {ActivatedRoute} from "@angular/router";
import {
    BillingTotalUserInfo,
    DateRange,
    DhcpBinding,
    DhcpLog,
    DhcpLogsRequest,
    EventType,
    LoadingState,
    NCLHistoryWrapper,
    Ont,
    Page,
    TimeFrame,
    UpdateCarrier,
    UserEvents,
    UserTariff
} from "../../../types/transport-interfaces";
import {DynamicValueFactory, SubscriptionsHolder, Utils} from "../../../util";
import {CustomNavigationService} from "../../../services/custom-navigation.service";
import {
    BehaviorSubject,
    combineLatest,
    debounceTime,
    filter,
    map,
    merge,
    Observable,
    of,
    ReplaySubject,
    shareReplay,
    startWith,
    Subject,
    switchMap,
    tap
} from "rxjs";
import {TaskCreatorService} from "../../../services/task-creator.service";
import {ConfirmationService, MenuItem, MessageService} from "primeng/api";
import {Menu} from "primeng/menu";
import {RealTimeUpdateService} from "../../../services/real-time-update.service";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {OverlayPanel} from "primeng/overlaypanel";
import {BlockUiService} from "../../../services/block-ui.service";
import {AccessFlag} from "../../../types/access-flag";
import {PersonalityService} from "../../../services/personality.service";
import {AutoUnsubscribe} from "../../../decorators";
import {OntManagementService} from "../../../services/pon/ont-management.service";
import {LogItem} from "../../../types/user-types";
import {UserReview} from "../../../types/user-reviews";

@Component({
    templateUrl: './billing-user-page.component.html',
    styleUrls: ['./billing-user-page.component.scss']
})
@AutoUnsubscribe()
export class BillingUserPageComponent implements OnInit, OnDestroy {

    AccessFlag = AccessFlag;

    userInfo?: BillingTotalUserInfo;
    loadingState = LoadingState.LOADING;
    loadingTimestamp = new Date();

    currentLogin?: string;
    currentLogin$ = new ReplaySubject<string>(1);
    update$ = new Subject<string>();
    subscriptions = new SubscriptionsHolder();
    passwordObserver$?: Observable<string>;

    logsFilterForm = new FormGroup({
        page: new FormControl(0),
        plen: new FormControl(20),
        dateRange: new FormControl<DateRange>({timeFrame: TimeFrame.THIS_MONTH}),
    });
    resetLogsFilterPageSub = this.logsFilterForm.controls.dateRange.valueChanges
        .subscribe(() => this.logsFilterForm.controls.page.setValue(0));
    logsFilter$ = this.logsFilterForm.valueChanges.pipe(startWith({
        page: 0,
        plen: 20,
        dateRange: {timeFrame: TimeFrame.THIS_MONTH}
    }), shareReplay(1));
    loadingLogs = true;
    userLogs$: Observable<Page<LogItem>> = combineLatest([this.currentLogin$, this.logsFilter$])
        .pipe(
            debounceTime(100),
            switchMap(([login, filter]) => {
                this.loadingLogs = true;
                return this.api.getUserLogs({
                    login,
                    page: filter.page ?? 0,
                    plen: filter.plen ?? 20,
                    dateRange: filter.dateRange ?? {timeFrame: TimeFrame.THIS_MONTH}
                })
            }),
            tap(() => this.loadingLogs = false),
            shareReplay(1)
        );

    userInfoHandler = {
        next: (userInfo: BillingTotalUserInfo) => {
            this.userInfo = undefined;
            setTimeout(() => {
                this.userInfo = userInfo;
                if (this.currentLogin) {
                    this.passwordObserver$ = this.api.getBillingUserPassword(this.currentLogin);
                }
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
    isBalanceDialogVisible = false;
    isBalanceResetDialogVisible = false;
    isPaymentDialogVisible = false;
    balanceResetCommentControl = new FormControl<string>('', [Validators.required]);
    paymentModeOptions = [
        {label: 'Наличные', value: 1, icon: 'mdi-money'},
        {label: 'Карта', value: 25, icon: 'mdi-credit_card'},
    ];
    isRecalculationDialogVisible = false;
    recalculationModeOptions = [
        {label: 'В днях', value: 'DAYS', icon: 'mdi-today'},
        {label: 'В рублях', value: 'MONEY', icon: 'mdi-money'},
    ]
    recalculationForm = new FormGroup({
        mode: new FormControl('DAYS', [Validators.required]),
        count: new FormControl(null, [Validators.required]),
        comment: new FormControl(null, [Validators.required]),
    });
    balanceForm = new FormGroup({
        payType: new FormControl(null, [Validators.required]),
        sum: new FormControl(null, [Validators.required]),
        comment: new FormControl(null, [Validators.required]),
    });
    paymentForm = new FormGroup({
        paymentType: new FormControl(1, [Validators.required]),
        sum: new FormControl(null, [Validators.required]),
        comment: new FormControl(null, [Validators.required]),
    });
    paymentWarning$ = this.paymentForm.controls.paymentType.valueChanges
        .pipe(
            startWith(
                this.paymentForm.controls.paymentType.value
            ),
            map((paymentType) => {
                switch (paymentType) {
                    case  1:
                        return {
                            bgColor: 'bg-primary',
                            label: 'Наличные',
                            icon:'mds-payments',
                        };
                    case  25:
                        return {
                            bgColor: 'bg-red-500',
                            label: 'Карта',
                            icon:'mdi-credit_card',
                        };
                }
                return  null;
            })
        );
    controlMenuItems: MenuItem[] = [];
    pathChange$ = this.route.params.pipe(tap(params => {
        this.currentLogin = params['login']
        this.currentLogin$.next(params['login'])
    }), map(params => params['login']));

    tasks$ = DynamicValueFactory.ofPage(
        combineLatest([this.pathChange$, this.changeTaskHistoryPage]),
        this.api.getTasksByLogin.bind(this.api),
        'taskId',
        this.rt.taskCreated().pipe(filter(task => task?.fields?.some(field => field.stringData === this.currentLogin) ?? false)),
        this.rt.taskUpdated(),
        this.rt.taskDeleted(),
    );

    login$ = merge(this.pathChange$, this.update$);

    userReviews = [] as UserReview[];
    userReviewsLoadSub = this.login$
        .pipe(switchMap(login => this.api.getUserReviewsByLogin(login)))
        .subscribe(this.userReviewsHandler.bind(this));

    userReviewsUpdateSub = this.rt.receiveUserReviewUpdate()
        .subscribe(this.userReviewsHandler.bind(this));

    activeBinding$ = this.login$.pipe(switchMap(login => this.api.getActiveBindingByLogin(login)));
    activeBuildingId$ = this.activeBinding$
        .pipe(
            switchMap(binding => {
                if (binding?.vlanid) {
                    return this.api.getBuildingIdByVlan(binding?.vlanid);
                } else {
                    return of(null);
                }
            })
        );
    loadUser$ = this.login$.pipe(switchMap(login => this.api.getBillingUserInfo(login)))
    updateUser$ = this.login$.pipe(switchMap(login => this.rt.billingUserUpdated(login)));

    isLoginEnable = true;
    isLoginEnableSub = merge(this.loadUser$, this.updateUser$).pipe(switchMap(user => this.api.isLoginEnable(user.uname)))
        .subscribe(isEnable => this.isLoginEnable = isEnable);

    loadUserSub = this.loadUser$.subscribe(this.userInfoHandler);
    updateUserSub = this.updateUser$.subscribe(this.userInfoHandler);
    // dhcpBindings$ = DynamicValueFactory.of(this.dhcpBindingsLoad$, 'id', null, this.rt.acpDhcpBindingUpdated());
    hardwareEmptyMessage$ = this.activeBinding$.pipe(
        map(binding => {
            if (!binding) {
                return 'Нет абонентского оборудования';
            } else if (!binding.isAuth) {
                return 'Нет авторизованного оборудования';
            } else {
                return null;
            }
        }),
    );

    // dhcpBindingsLoad$ = this.login$.pipe(
    //     switchMap(login => this.api.getDhcpBindingsByLogin(login)),
    //     shareReplay(1)
    // );
    // )
    nclHistory$ = new BehaviorSubject<NCLHistoryWrapper | null>(null);
    // activeClientHardware$ = this.dhcpBindings$.pipe(
    //     map(bindings => bindings.value.find(b=>b.isAuth)),
    // )
    // firstVlanOfBindings$ = this.dhcpBindingsLoad$.pipe(
    //     filter(bindings => bindings && bindings.length > 0),
    //     map(binds => {
    //         const authBind = binds.find(bind => bind.isAuth);
    //         if (authBind) {
    //             return authBind.vlanid;
    //         } else {
    //             return binds[0].vlanid;
    //         }
    //     }),
    //     tap(vlan => this.lastBindingVlan = vlan),
    //     shareReplay(1)
    // )
    // changeHouseVlanPage$ = combineLatest([this.firstVlanOfBindings$, this.houseBindingsPage$]).pipe(shareReplay(1));

    // updateHousePage$ = this.rt.acpDhcpBindingHousePageUpdateSignal().pipe(
    //     switchMap((resp) => this.changeHouseVlanPage$.pipe(first(), filter(([vlan, page]) => vlan === resp.vlan))),
    // )
    // dhcpBindingsByVlan$$ = DynamicValueFactory.ofPage(
    //     merge(this.changeHouseVlanPage$, this.updateHousePage$),
    //     (vlan, page) => this.api.getDhcpBindingsByVlan(page, vlan, this.currentLogin),
    //     'id',
    //     null,
    //     this.rt.acpDhcpBindingUpdated(),
    //     null
    // )
    // isCommutatorRefreshing = false;
    // lastBindingVlan: null | number = null;
    // commutatorsByVlan$ = DynamicValueFactory.ofWithFilter(
    //     this.firstVlanOfBindings$.pipe(
    //         filter(vlan => vlan != undefined && vlan > 0 && vlan < 4097),
    //         map(vlan => [vlan]),
    //     ),
    //     (vlan) => this.api.getCommutatorsByVlan(vlan),
    //     'id',
    //     this.rt.acpCommutatorCreated(),
    //     this.rt.acpCommutatorUpdated(),
    //     this.rt.acpCommutatorDeleted()
    nclHistoryLoadingState = LoadingState.LOADING;
    nclHistoryViewStyle$ = this.nclHistory$.pipe(
        map(history => {
            if (history) {
                try {
                    const length = Object.entries(history.nclItems).length;
                    if (length === 0) {
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
    dhcpLogs = [] as DhcpLog[];
    dhcpLogsGroupedList: MenuItem[] = [];
    dhcpLogsPageNum = 0;
    dhcpLogsLoadingState = LoadingState.READY;
    dhcpLogsIsLastPage = false;
    dhcpLogsUpdateSub = this.login$.subscribe(login => {
        this.dhcpLogsPageNum = 0;
        this.dhcpLogsIsLastPage = false;
        this.logsLoad(login);
    })
    tariffList: UserTariff[] = [];
    selectedTariff?: number;
    serviceList: UserTariff[] = [];
    selectedServices: number[] = [];

    isUserEditDialogVisible = false;
    userEditForm = new FormGroup({
        address: new FormControl<string>("", [Validators.required]),
        fullName: new FormControl<string>("", [Validators.required]),
        phone: new FormControl<string>("", [Validators.required]),
        comment: new FormControl<string>(""),
    });

    updateOnt$ = this.login$
        .pipe(
            switchMap(login => {
                return merge(
                    this.rt.receiveUpdatedOnt().pipe(filter(ont => ont.userLogin === login)),
                    this.rt.receiveNewOntStatusChangeEvents().pipe(
                        map(events => {
                            let foundEvent = events.find(event => event.terminal.userLogin === login);
                            if (!!foundEvent) {
                                return foundEvent.terminal;
                            }
                            return null;
                        }),
                        filter(ont => !!ont),
                    )
                )
            })
        );
    ontNotFound = false;
    ont$ = this.login$
        .pipe(
            switchMap(login => merge(this.api.getOntByLogin(login), this.updateOnt$)),
            tap(onu => this.ontNotFound = !onu)
        );
    logsLoadHandler = {
        next: (logs: DhcpLogsRequest) => {
            this.dhcpLogsLoadingState = LoadingState.READY;
            if (this.dhcpLogsPageNum === 0) {
                this.dhcpLogs = [...logs.logs];
            } else {
                this.dhcpLogs = [...this.dhcpLogs, ...logs.logs];
            }
            this.dhcpLogsIsLastPage = logs.isLast;
            this.dhcpLogsGroupedList = this.dhcpLogs.reduce((previousValue, currentValue) => {
                const date = new Date(currentValue.startDatetime).toLocaleDateString();
                const groupItem = previousValue.find(value => value.label === date);
                if (!groupItem) {
                    previousValue.push({
                        label: date, state: {date: currentValue.startDatetime}, items: [{
                            state: {
                                startTime: currentValue.startDatetime,
                                endTime: currentValue.endDatetime,
                                color: this.logColor(currentValue.type),
                                description: currentValue.description,
                                numbers: currentValue.numberRepetitions,
                                macAddresses: currentValue.macAddresses,
                            }
                        }]
                    })
                } else {
                    groupItem.items?.push({
                        state: {
                            startTime: currentValue.startDatetime,
                            endTime: currentValue.endDatetime,
                            color: this.logColor(currentValue.type),
                            description: currentValue.description,
                            numbers: currentValue.numberRepetitions,
                            macAddresses: currentValue.macAddresses,
                        }
                    })
                }
                return previousValue;
            }, [] as MenuItem[]);
            this.dhcpLogsPageNum++;
        },
        error: () => {
            this.dhcpLogsLoadingState = LoadingState.ERROR;
            this.dhcpLogs = [];
            this.dhcpLogsGroupedList = [];
            this.dhcpLogsIsLastPage = false;
        },
        complete: () =>  {
            console.log('Complete')
        }
    }

    constructor(private api: ApiService, private rt: RealTimeUpdateService,
                private route: ActivatedRoute, readonly customNav: CustomNavigationService,
                readonly taskCreation: TaskCreatorService, readonly toast: MessageService,
                private confirm: ConfirmationService, private blockUiService: BlockUiService,
                readonly personality: PersonalityService, readonly ontMgmt: OntManagementService) {
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

    get paymentTypeName() {
        switch (this.paymentForm.value.paymentType) {
            case 1:
                return "наличных";
            case 25:
                return "карты";
        }
        return null;
    }

    get recalculationModeName() {
        switch (this.recalculationForm.value.mode) {
            case 'DAYS':
                return "в днях";
            case 'MONEY':
                return "в рублях";
        }
        return null;
    }

    toLogItem(value: any): LogItem {
        return value
    }

    toUserReview(value: any): UserReview {
        return value
    }

    changeLogsPage(event: any) {
        const {first, rows} = event;
        this.logsFilterForm.controls.page.setValue(first / rows);
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
                command: () => this.openBalanceDialog()
            },
            {
                label: 'Обнулить баланс',
                icon: 'mdi-exposure_zero',
                command: () => this.openBalanceResetDialog()
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
                this.block("Включение отложенного платежа");
                this.api.setDeferredPayment(this.currentLogin)
                    .subscribe({
                        next: () => this.unblock(),
                        error: () => this.unblock()
                    });
            }
        });
    }

    userReviewsHandler(value: UserReview[] | UpdateCarrier<UserReview>) {
        if (Array.isArray(value)) {
            this.userReviews = value;
        } else if (value.data.userLogin === this.currentLogin) {
            switch (value.type) {
                case EventType.CREATE: {
                    this.userReviews.unshift(value.data);
                }
            }
        }
    }

    trackByDhcpBinding(index: number, item: DhcpBinding) {
        return item.vlanid + item.ipaddr + item.state + item.id + item.isAuth + item.authName + item.authExpire + item.lastConnectionLocation?.checkedAt;
    };

    // load() {
    //     if (this.currentLogin) {
    //         this.subscriptions.unsubscribe('userUpd');
    //         this.api.getBillingUserInfo(this.currentLogin).subscribe(this.userInfoHandler);
    //         this.dhcpLogsPageNum = 0;
    //         this.dhcpLogsIsLastPage = false;
    //         this.logsLoad(this.currentLogin);
    //         this.subscriptions.addSubscription('userUpd', this.rt.billingUserUpdated(this.currentLogin).subscribe(this.userInfoHandler));
    //     } else {
    //         this.loadingState = LoadingState.ERROR;
    //     }
    // }

    ngOnInit(): void {
        // this.subscriptions.addSubscription('pch',
        //     this.loadUser$.subscribe(this.load.bind(this))
        // )
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
                            address,
                            phone: null,
                            description: null
                        })
                    })
                },
            }));
        });
    }

    logsLoad(login?: string) {
        if (!this.dhcpLogsIsLastPage && login && this.dhcpLogsLoadingState === LoadingState.READY && this.logsLoadHandler) {
            this.dhcpLogsLoadingState = LoadingState.LOADING;
            this.api.getDhcpLogsByLogin(login, this.dhcpLogsPageNum).subscribe(this.logsLoadHandler);
            // this.api.getDhcpLogsByLogin(login, this.dhcpLogsPageNum).subscribe({
            //     next: (value) => {
            //         console.log(value);
            //     },
            //     error: (error) => {
            //         console.log(error);
            //     }
            // });
        }
    }

    copyMacAddress(event: any) {
        if (event.value) {
            Utils.copyToClipboard(event.value.state.macAddresses, this.toast, 'MAC адреса скопированы', 'Не удалось скопировать MAC адреса');
        }
    }

    isToday(date: string) {
        return new Date(date).toDateString() === new Date().toDateString();
    }

    logColor(logType: "SIMPLE_ONLINE" | "SIMPLE_OFFLINE" | "REPEATED" | "EMPTY" | "USER_AUTH" | "USER_AUTH_FAIL") {
        switch (logType) {
            case "SIMPLE_ONLINE":
                return "#16e116";
            case "SIMPLE_OFFLINE":
                return "#db21ec";
            case "REPEATED":
                return "#e81f1f";
            case "EMPTY":
                return "#838383";
            case "USER_AUTH":
                return "#16d0e1";
            case "USER_AUTH_FAIL":
                return "#2132ec";
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
                label: 'Авторизовать (текущий логин)',
                command: () => this.authCurrentLogin(binding.macaddr),
                disabled: binding.isAuth && binding.authName === this.currentLogin
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

    openBalanceDialog() {
        this.isBalanceDialogVisible = true;
    }

    openBalanceResetDialog() {
        this.isBalanceResetDialogVisible = true;
    }

    openPaymentDialog() {
        this.paymentForm.reset({
            paymentType: 1
        })
        this.isPaymentDialogVisible = true;
    }

    openRecalculationDialog() {
        this.recalculationForm.reset({
            mode: 'DAYS'
        })
        this.isRecalculationDialogVisible = true;
    }

    openEditUserDialog() {
        if (!this.userInfo) return;
        this.userEditForm.reset({
            address: this.userInfo.ibase.addr,
            fullName: this.userInfo.ibase.fio,
            phone: this.userInfo.ibase.phone,
            comment: this.userInfo.ibase.coment,
        })
        this.isUserEditDialogVisible = true;
    }

    sendBalance() {
        if (!this.currentLogin) return;
        this.confirm.confirm({
            header: 'Подтверждение изменения баланса логина ' + this.currentLogin,
            message: 'Изменить баланс логина ' + this.currentLogin + ' на ' + this.balanceForm.value.sum + ' рублей?',
            accept: () => {
                if (!this.currentLogin) return;
                this.block('Изменяется баланс');
                this.api.updateBalance(this.currentLogin, this.balanceForm.value).subscribe({
                    next: () => {
                        this.unblock()
                        this.isBalanceDialogVisible = false;
                        this.balanceForm.reset();
                    },
                    error: () => {
                        this.unblock()
                    }
                });
            }
        })
    }

    sendBalanceReset() {
        if (!this.currentLogin) return;
        this.confirm.confirm({
            header: 'Подтверждение обнуления баланса логина ' + this.currentLogin,
            message: 'Обнулить баланс логина ' + this.currentLogin + '?',
            accept: () => {
                if (!this.currentLogin || !this.balanceResetCommentControl.value) return;
                this.block('Обнуление баланса');
                this.api.balanceReset(this.currentLogin, this.balanceResetCommentControl.value).subscribe({
                    next: () => {
                        this.unblock()
                        this.isBalanceResetDialogVisible = false;
                        this.balanceResetCommentControl.reset('');
                    },
                    error: () => {
                        this.unblock()
                    }
                });
            }
        })
    }

    enableLogin() {
        if (!this.currentLogin) return;
        this.confirm.confirm({
            header: 'Подтверждение включения логина ' + this.currentLogin,
            message: 'Включить логин ' + this.currentLogin + '?',
            accept: () => {
                if (!this.currentLogin) return;
                this.block('Включение логина');
                this.api.enableLogin(this.currentLogin).subscribe({
                    next: () => {
                        this.unblock()
                    },
                    error: () => {
                        this.unblock()
                    }
                });
            }
        })
    }

    sendPayment() {
        if (!this.currentLogin) return;
        this.confirm.confirm({
            header: 'Подтверждение оплаты на логин ' + this.currentLogin,
            message: 'Провести оплату с помощью ' + this.paymentTypeName + ' на ' + this.paymentForm.value.sum + ' рублей, на логин ' + this.currentLogin + '?',
            accept: () => {
                if (!this.currentLogin) return;
                this.block('Производится оплата');
                this.api.makePayment(this.currentLogin, this.paymentForm.value).subscribe({
                    next: () => {
                        this.unblock()
                        this.isPaymentDialogVisible = false;
                        this.paymentForm.reset({paymentType: 1});
                    },
                    error: () => {
                        this.unblock()
                    }
                });
            }
        })
    }

    sendRecalculation() {
        if (!this.currentLogin) return;
        this.confirm.confirm({
            header: 'Подтверждение перерасчета ' + this.currentLogin,
            message: 'Произвести перерасчет ' + this.recalculationModeName + '. Кол-во: ' + this.recalculationForm.value.count + ', на логин ' + this.currentLogin + '?',
            accept: () => {
                if (!this.currentLogin) return;
                this.block('Производится перерасчет');
                this.api.makeRecalculation(this.currentLogin, this.recalculationForm.value).subscribe({
                    next: () => {
                        this.unblock()
                        this.isRecalculationDialogVisible = false;
                        this.recalculationForm.reset({mode: 'DAYS'});
                    },
                    error: () => {
                        this.unblock()
                    }
                });
            }
        })
    }

    confirmUserEdit() {
        if (!this.currentLogin) return;
        this.confirm.confirm({
            header: 'Подтверждение редактирования данных логина ' + this.currentLogin,
            message: 'Изменить данные логина ' + this.currentLogin + '?',
            accept: () => {
                if (!this.currentLogin) return;
                this.block('Редактирование логина');
                this.api.editUser(this.currentLogin, this.userEditForm.value).subscribe({
                    next: () => {
                        this.unblock()
                        this.isUserEditDialogVisible = false;
                    },
                    error: () => {
                        this.unblock()
                    }
                });
            }
        })
    }

    // refreshCommutators() {
    //     if (this.lastBindingVlan)
    //         this.api.commutatorRemoteUpdateByVlan(this.lastBindingVlan).pipe(
    //             tap(() => this.isCommutatorRefreshing = true)
    //         ).subscribe({
    //             next: () => this.isCommutatorRefreshing = false,
    //             error: () => this.isCommutatorRefreshing = false
    //         })
    // }

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

    getTariffList(event: any, panel: OverlayPanel) {
        if (this.currentLogin) {
            panel.toggle(event);
            this.api.getBillingUserTariffs(this.currentLogin).subscribe((tariffs) => {
                this.tariffList = tariffs;
                tariffs.filter(tariff => this.mainTariff?.service === tariff.name).forEach(s => s.disabled = true);
            })
        }
    }

    getServiceList(event: any, panel: OverlayPanel) {
        if (this.currentLogin) {
            panel.toggle(event);
            this.api.getBillingUserServices(this.currentLogin).subscribe((services) => {
                this.serviceList = services;
                services.filter(service => this.services.some(s => s.service === service.name)).forEach(s => s.disabled = true);
            })
        }
    }

    appendService(event: any) {
        if (this.currentLogin)
            this.confirm.confirm({
                header: 'Добавление сервиса',
                message: 'Добавить сервис ' + event.option.name + ' абоненту?',
                accept: () => {
                    if (this.currentLogin) {
                        this.block('Добавление сервиса')
                        this.api.appendServiceToBillingUser(event.value, this.currentLogin).subscribe({
                            next: () => {
                                this.unblock()
                            },
                            error: () => {
                                this.unblock()
                            }
                        });
                    }
                }
            })
    }

    removeService(name: string) {
        if (this.currentLogin)
            this.confirm.confirm({
                header: 'Отключение сервиса',
                message: 'Отключить сервис ' + name + '?',
                accept: () => {
                    if (this.currentLogin) {
                        this.block('Отключение сервиса')
                        this.api.removeServiceFromBillingUser(name, this.currentLogin).subscribe({
                            next: () => {
                                this.unblock()
                            },
                            error: () => {
                                this.unblock()
                            }
                        });
                    }
                }
            })
    }

    changeTariff(event: any) {
        if (this.currentLogin)
            this.confirm.confirm({
                header: 'Изменение тарифа',
                message: 'Изменить тариф абонента на ' + event.option.name + '?',
                accept: () => {
                    if (this.currentLogin) {
                        this.block('Изменение тарифа')
                        this.api.changeTariffInBillingUser(event.value, this.currentLogin).subscribe({
                            next: () => {
                                this.unblock();
                            },
                            error: () => {
                                this.unblock();
                            }
                        });
                    }
                }
            })
    }

    ontStatusName(ont: Ont) {
        return ont.isOnline ? 'В сети' : 'Не в сети';
    }

    ontStatusClass(ont: Ont) {
        return ont.isOnline ? 'text-green-500' : 'text-red-600';
    }

    signalColor(ont: Ont) {
        if (ont.curRxSignal > -25.5) return 'text-green-500';
        if (ont.curRxSignal > -28.5) return 'text-orange-400';
        return 'text-red-600';
    }

    private block(message: string = '') {
        this.blockUiService.wait({message});
    }

    private unblock() {
        this.blockUiService.unblock();
    }
}
