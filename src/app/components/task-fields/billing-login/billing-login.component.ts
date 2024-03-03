import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {AutoUnsubscribe, FromEvent, OnChangeObservable} from "../../../decorators";
import {debounceTime, filter, map, merge, ReplaySubject, shareReplay, switchMap, tap} from "rxjs";
import {ApiService} from "../../../services/api.service";
import {OverlayPanel} from "primeng/overlaypanel";

@Component({
  selector: 'app-billing-login',
  templateUrl: './billing-login.component.html',
  styleUrls: ['./billing-login.component.scss']
})
@AutoUnsubscribe()
export class BillingLoginComponent implements OnInit {

  @Input() loginData?:string;
  @Input() popup = false;
  @OnChangeObservable('loginData') loginChange$ = new ReplaySubject<string>(1);
  @OnChangeObservable('popup') popupChange$ = new ReplaySubject<boolean>(1);

  mouseEnter$ = new ReplaySubject<MouseEvent>(1);
  mouseLeave$ = new ReplaySubject<MouseEvent>(1);

  @ViewChild('popupPanel') popupPanel?: OverlayPanel;

  isNotFound = false;

  popupVisibleSub = merge(
      this.mouseEnter$,
      merge(
          this.mouseEnter$,
          this.mouseLeave$.pipe(map(() => null))
      ).pipe(debounceTime(500), filter(isShow => !isShow))
  ).subscribe((showEvent: MouseEvent | null) => {
      if (showEvent) {
          this.popupPanel?.show(showEvent);
      } else {
          this.popupPanel?.hide();
      }
  })

  loginColor$ = this.loginChange$
      .pipe(
          switchMap(login => this.api.getActiveBindingByLogin(login)),
          map(binding => {
            if(binding === null) return 'text-gray-400';
            if(binding.onlineStatus === 'ONLINE') return 'text-green-400';
              return 'text-red-400';
          })
      )

    loginBinding$ = this.loginChange$
        .pipe(
            switchMap(login => this.api.getActiveBindingByLogin(login)),
            map(binding=>{
                if(binding === null) {
                    this.isNotFound = true;
                    return null;
                }
                return {
                    name: binding.dhcpHostname,
                    ip: binding.ipaddr,
                    mac: binding.macaddr,
                    statusName: binding.onlineStatus === 'ONLINE' ? 'В сети' : 'Не в сети',
                    statusColor: binding.onlineStatus === 'ONLINE' ? 'text-green-400' : 'text-red-400',
                    elapsedTime: new Date(binding.leaseStart)
                }
            }),
            shareReplay(1)
        )

  constructor(private api: ApiService) { }

  ngOnInit(): void {
  }

}
