import {Component, Input, OnInit} from '@angular/core';

@Component({
  selector: 'app-billing-login',
  templateUrl: './billing-login.component.html',
  styleUrls: ['./billing-login.component.scss']
})
export class BillingLoginComponent implements OnInit {

  @Input() loginData?:string;

  constructor() { }

  ngOnInit(): void {
  }

}
