import {Component, Input, OnInit} from '@angular/core';
import {AutoUnsubscribe, OnChangeObservable} from "../../../decorators";
import {map, ReplaySubject, switchMap} from "rxjs";
import {ApiService} from "../../../services/api.service";

@Component({
  selector: 'app-billing-login',
  templateUrl: './billing-login.component.html',
  styleUrls: ['./billing-login.component.scss']
})
@AutoUnsubscribe()
export class BillingLoginComponent implements OnInit {

  @Input() loginData?:string;
  @OnChangeObservable('loginData') loginChange$ = new ReplaySubject<string>(1);

  loginColor$ = this.loginChange$
      .pipe(
          switchMap(login => this.api.getActiveBindingByLogin(login)),
          map(binding => {
            if(binding === null) return 'text-gray-400';
            if(binding.onlineStatus === 'ONLINE') return 'text-green-400';
              return 'text-red-400';
          })
      )

  constructor(private api: ApiService) { }

  ngOnInit(): void {
  }

}
