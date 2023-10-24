import {Component, OnInit} from '@angular/core';
import {BehaviorSubject, combineLatest, debounceTime, map, shareReplay, startWith, Subject, switchMap, tap} from "rxjs";
import {FormControl, FormGroup} from "@angular/forms";
import {ApiService} from "../../services/api.service";
import {DhcpBinding, SwitchWithAddress} from "../../transport-interfaces";
import {ConfirmationService} from "primeng/api";
import {flowInChild} from "../../animations";
import {DynamicValueFactory} from "../../util";
import {CustomValidators} from "../../custom-validators";
import {RealTimeUpdateService} from "../../services/real-time-update.service";

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
        state: new FormControl<number | null>(1),
        macaddr: new FormControl(null),
        login: new FormControl(null),
        ip: new FormControl(null),
        vlan: new FormControl(null),
        buildingId: new FormControl(null),
        commutator: new FormControl<SwitchWithAddress | null>(null, CustomValidators.typeIsSwitchWithAddress),
        port: new FormControl<number| null>(null)
    });

    lastBindingFilterForm$ = this.lastBindingsFilterForm.valueChanges
        .pipe(
            startWith(this.lastBindingsFilterForm.value),
            debounceTime(1000),
            map(filters => {
                this.pageNum = 0;
                return {
                    state: filters.state !== null ? filters.state : undefined, macaddr: filters.macaddr, login: filters.login, ip: filters.ip,
                    vlan: filters.vlan, buildingId: filters.buildingId && filters.buildingId['buildingId'],
                    commutator: filters.commutator && filters.commutator.commutator ? filters.commutator.commutator.id : undefined,
                    port: filters.port
                }
            })
        );

    lastBindingsFilter$ = combineLatest([this.page$, this.lastBindingFilterForm$])
        .pipe(
            map(([page, filter]) => {
                return [this.pageNum, filter.state, filter.macaddr, filter.login, filter.ip, filter.vlan, filter.buildingId, filter.commutator, filter.port];
            })
        );

    ipKeyFilter = /[\d\.]+/;

    lastBindingsPage$ = DynamicValueFactory.ofPage(//todo Автообновление сессий абонентов
        this.lastBindingsFilter$,
        this.api.getLastBindings.bind(this.api),
        'id',
        null,
        this.rt.acpDhcpBindingUpdated(),
        null
    );

    commutatorUplinkQuerySearch = new Subject<string>();
    commutatorUplinks$ = this.commutatorUplinkQuerySearch.pipe(
        debounceTime(1000),
        switchMap(query => this.api.searchCommutators(query)),
        // map(commutators => commutators.filter(com => com.value !== this.editableSwitch?.id)),
        shareReplay(1)
    )
    statusOptions = [
        {
            label: 'В сети', value: 1
        },
        {
            label: 'Не в сети', value: 0
        },
        {
            label: 'Любые', value: null
        }
    ];

    numberMask = /^\d{1,4}$/;

    constructor(private api: ApiService, private rt: RealTimeUpdateService, private confirm: ConfirmationService) {
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
