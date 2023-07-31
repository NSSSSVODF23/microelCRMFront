import {Component, OnDestroy, OnInit} from '@angular/core';
import {ApiService} from "../../services/api.service";
import {ActivatedRoute} from "@angular/router";
import {Address, BillingTotalUserInfo, LoadingState} from "../../transport-interfaces";
import {SubscriptionsHolder} from "../../util";
import {CustomNavigationService} from "../../services/custom-navigation.service";
import {tap} from "rxjs";
import {TaskCreatorService} from "../../services/task-creator.service";
import {MessageService} from "primeng/api";

@Component({
    templateUrl: './billing-user-page.component.html',
    styleUrls: ['./billing-user-page.component.scss']
})
export class BillingUserPageComponent implements OnInit, OnDestroy {

    userInfo?: BillingTotalUserInfo;
    loadingState = LoadingState.LOADING;
    loadingTimestamp = new Date();

    currentLogin?: string;

    pathChange$ = this.route.params.pipe(tap(params => this.currentLogin = params['login']));

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

    constructor(private api: ApiService, private route: ActivatedRoute, readonly customNav: CustomNavigationService, readonly taskCreation: TaskCreatorService, readonly toast: MessageService) {
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

    ngOnInit(): void {
        this.subscriptions.addSubscription('pch',
            this.pathChange$.subscribe(this.load.bind(this))
        )
        this.api.getWireframesNames().subscribe(wf => {
            this.wireframes = wf.map(value => ({
                label: value.name,
                command: () => {
                    this.api.convertBillingAddress(this.userInfo?.ibase?.addr).subscribe((address)=>{
                        if (!this.currentLogin) {
                            this.toast.add({severity: 'error', summary: "Ошибка запроса", detail: "Не найден логин для создания задачи"})
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

}
