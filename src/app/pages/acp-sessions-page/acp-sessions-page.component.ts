import {Component, OnInit} from '@angular/core';
import {
    BehaviorSubject,
    combineLatest,
    debounceTime,
    delay,
    map,
    shareReplay,
    startWith,
    Subject,
    switchMap,
    tap
} from "rxjs";
import {FormControl, FormGroup} from "@angular/forms";
import {ApiService} from "../../services/api.service";
import {DhcpBinding} from "../../transport-interfaces";
import {ConfirmationService} from "primeng/api";
import {flowInChild} from "../../animations";
import {DynamicValueFactory} from "../../util";

@Component({
    templateUrl: './acp-sessions-page.component.html',
    styleUrls: ['./acp-sessions-page.component.scss'],
    animations: [flowInChild]
})
export class AcpSessionsPageComponent implements OnInit {

    pageNum = 0;
    isLoadingLastBindings = true;
    openAuthDialog = new Subject<null>();
    changeLastBindingsPage = new BehaviorSubject(0);
    page$ = this.changeLastBindingsPage.pipe(tap((page) => this.pageNum = page));
    changeLastBindingsPage$ = this.changeLastBindingsPage.pipe(
        tap(() => this.isLoadingLastBindings = true),
        shareReplay(1)
    )
    lastBindingsFilterForm = new FormGroup({
        state: new FormControl(true),
        macaddr: new FormControl(null),
        login: new FormControl(null),
        ip: new FormControl(null),
        vlan: new FormControl(null),
        buildingId: new FormControl(null),
    });

    lastBindingFilterForm$ = this.lastBindingsFilterForm.valueChanges
        .pipe(
            startWith(this.lastBindingsFilterForm.value),
            debounceTime(1000),
            map(filters => {
                this.pageNum = 0;
                return {
                    state: filters.state ? 1 : 0, macaddr: filters.macaddr, login: filters.login, ip: filters.ip,
                    vlan: filters.vlan, buildingId: filters.buildingId && filters.buildingId['buildingId']
                }
            })
        );

    lastBindingsFilter$ = combineLatest([this.page$, this.lastBindingFilterForm$])
        .pipe(
            map(([page,filter]) => {
                return [this.pageNum, filter.state, filter.macaddr, filter.login, filter.ip, filter.vlan, filter.buildingId];
            })
        );

    ipKeyFilter = /[\d\.]+/;

    lastBindingsPage$ = DynamicValueFactory.ofPage(//todo Автообновление сессий абонентов
        this.lastBindingsFilter$,
        this.api.getLastBindings.bind(this.api),
        'id',
        null,
        null,
        null
    );

    constructor(private api: ApiService, private confirm: ConfirmationService) {
    }

    ngOnInit(): void {
    }

    trackByDhcpBinding(index: number, binding: DhcpBinding) {
        return binding.macaddr + binding.ipaddr + binding.id + binding.onlineStatus + binding.authExpire + binding.authName;
    };

    // Добавить логин

    authConfirm(binding: DhcpBinding) {
        this.confirm.confirm({
            header: 'Подтверждение',
            message: 'Авторизовать ' + binding.macaddr + ' под логином ' + '?',
            accept: () => {
                this.authCurrentLogin(binding.macaddr);
            }
        })
    }

    authCurrentLogin(macaddr: string) {
        //   if (!this.currentLogin) {
        //     this.toast.add({
        //       severity: 'error',
        //       summary: "Ошибка запроса",
        //       detail: "Не найден логин для авторизации"
        //     })
        //     return;
        //   }
        //   this.api.authDhcpBinding(this.currentLogin, macaddr).subscribe(()=>{
        //     this.toast.add({
        //       detail: 'Логин успешно авторизован', severity: 'dark', key: 'darktoast', icon: 'mdi-verified', closable: false
        //     })
        //   });
    }
}
