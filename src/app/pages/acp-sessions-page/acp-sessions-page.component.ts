import { Component, OnInit } from '@angular/core';
import {BehaviorSubject, combineLatest, debounceTime, map, shareReplay, startWith, Subject, switchMap, tap} from "rxjs";
import {FormControl, FormGroup} from "@angular/forms";
import {ApiService} from "../../services/api.service";
import {DhcpBinding} from "../../transport-interfaces";
import {ConfirmationService} from "primeng/api";
import {flowInChild} from "../../animations";

@Component({
  templateUrl: './acp-sessions-page.component.html',
  styleUrls: ['./acp-sessions-page.component.scss'],
  animations: [flowInChild]
})
export class AcpSessionsPageComponent implements OnInit {

  constructor(private api: ApiService, private confirm: ConfirmationService ) { }

  ngOnInit(): void {
  }

  isLoadingLastBindings = true;

  openAuthDialog = new Subject<null>();
  changeLastBindingsPage = new BehaviorSubject(0);
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
  lastBindingsFilter$ = this.lastBindingsFilterForm.valueChanges.pipe(
      startWith(this.lastBindingsFilterForm.value),
      debounceTime(1000),
      tap(() => this.isLoadingLastBindings = true),
      map(filters=>{
        return {state: filters.state ? 1 : 0, macaddr: filters.macaddr, login: filters.login, ip: filters.ip,
          vlan: filters.vlan, buildingId: filters.buildingId && filters.buildingId['buildingId']}
      }),
      shareReplay(1)
  );
  lastBindingsPage$ = combineLatest([
    this.changeLastBindingsPage$,
    this.lastBindingsFilter$,
  ]).pipe(
      switchMap(([page, {state, macaddr, vlan, login, ip, buildingId}]) => this.api.getLastBindings(page, state, macaddr, login, ip, vlan, buildingId)),
      tap(() => this.isLoadingLastBindings = false),
      shareReplay(1)
  )

  trackByDhcpBinding(index: number, binding: DhcpBinding) {
    return binding.macaddr + binding.ipaddr + binding.id + binding.onlineStatus + binding.authExpire + binding.authName;
  };
  // Добавить логин

  authConfirm(binding: DhcpBinding) {
    this.confirm.confirm({
      header: 'Подтверждение',
      message: 'Авторизовать ' + binding.macaddr + ' под логином ' +'?',
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
