import {Component, OnDestroy, OnInit} from '@angular/core';
import {ApiService} from "../../services/api.service";
import {ActivatedRoute} from "@angular/router";
import {BillingTotalUserInfo, DhcpBinding, LoadingState} from "../../transport-interfaces";
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
    Subject,
    switchMap,
    tap
} from "rxjs";
import {TaskCreatorService} from "../../services/task-creator.service";
import {MenuItem, MessageService} from "primeng/api";
import {Menu} from "primeng/menu";
import {RealTimeUpdateService} from "../../services/real-time-update.service";

@Component({
    templateUrl: './billing-user-page.component.html',
    styleUrls: ['./billing-user-page.component.scss']
})
export class BillingUserPageComponent implements OnInit, OnDestroy {

    userInfo?: BillingTotalUserInfo;
    loadingState = LoadingState.LOADING;
    loadingTimestamp = new Date();

    currentLogin?: string;

    pathChange$ = this.route.params.pipe(tap(params => this.currentLogin = params['login']), map(params => params['login']));
    update$ = new Subject<string>();
    loadUser$ = merge(this.pathChange$, this.update$);

    subscriptions = new SubscriptionsHolder();

    userInfoHandler = {
        next: (userInfo: BillingTotalUserInfo) => {
            this.userInfo = undefined;
            setTimeout(() => {
                this.userInfo = userInfo;
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

    dhcpBindingsLoad$ = this.loadUser$.pipe(
        switchMap(login => this.api.getDhcpBindingsByLogin(login)),
        shareReplay(1)
    );

    dhcpBindings$ = DynamicValueFactory.of(this.dhcpBindingsLoad$, 'id', this.rt.acpDhcpBindingUpdated(), this.rt.acpDhcpBindingUpdated());

    firstVlanOfBindings$ = this.dhcpBindingsLoad$.pipe(
        map(binds => binds[0].vlanid),
        shareReplay(1)
    )

    houseBindingsPage = new BehaviorSubject(0);
    houseBindingsPage$ = this.houseBindingsPage.pipe(
        shareReplay(1)
    )
    houseBindingsLoadingState = LoadingState.LOADING;
    changeHouseVlan$ = this.firstVlanOfBindings$.pipe(
        switchMap(vlan => this.houseBindingsPage$.pipe(first(), map(page => ({vlan, page}))))
    )
    changeHousePage$ = this.houseBindingsPage$.pipe(
        switchMap(page => this.firstVlanOfBindings$.pipe(first(), map(vlan => ({vlan, page}))))
    )
    changeHouseVlanPage$ = merge(this.changeHouseVlan$, this.changeHousePage$).pipe(shareReplay(1));
    updateHousePage$ = this.rt.acpDhcpBindingHousePageUpdateSignal().pipe(
        switchMap(({vlan}) => this.changeHouseVlanPage$.pipe(first(), filter(page => page.vlan === vlan))),
    )
    dhcpBindingsByVlan$ = merge(this.changeHouseVlanPage$, this.updateHousePage$).pipe(
        debounceTime(100),
        tap(() => this.houseBindingsLoadingState = LoadingState.LOADING),
        switchMap(({vlan, page}) => this.api.getDhcpBindingsByVlan(page, vlan, this.currentLogin)),
        tap({
            next: (page) => this.houseBindingsLoadingState = page.empty ? LoadingState.EMPTY : LoadingState.READY,
            error: () => this.houseBindingsLoadingState = LoadingState.ERROR
        }),
        shareReplay(1)
    );
    changeTaskHistoryPage = new BehaviorSubject(0);
    bindingContextMenuItems = [] as MenuItem[];
    tasks$ = DynamicValueFactory.ofPage(
        combineLatest([this.pathChange$, this.changeTaskHistoryPage]),
        this.api.getTasksByLogin.bind(this.api),
        'taskId',
        this.rt.taskCreated().pipe(filter(task=>task?.fields?.some(field=>field.stringData === this.currentLogin) ?? false)),
        this.rt.taskUpdated(),
        this.rt.taskDeleted(),
    );

    constructor(private api: ApiService, private rt: RealTimeUpdateService, private route: ActivatedRoute, readonly customNav: CustomNavigationService,
                readonly taskCreation: TaskCreatorService, readonly toast: MessageService) {
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

    trackByDhcpBinding(index: number, item: DhcpBinding) {
        return item.vlanid + item.ipaddr + item.state + item.id + item.isAuth + item.authName + item.authExpire;
    };

    ngOnInit(): void {
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
            this.api.getBillingUserInfo(this.currentLogin).subscribe(this.userInfoHandler);
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
        event.preventDefault();
        event.stopPropagation();
        this.bindingContextMenuItems = [
            {
                label: 'Авторизовать (текущий логин)', command: () => {
                    if (!this.currentLogin) return;
                    this.api.authDhcpBinding(this.currentLogin, binding.macaddr).subscribe();
                }
            }
        ]
        menu.show(event);
    }
}
