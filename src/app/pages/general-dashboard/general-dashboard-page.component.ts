import { Component, OnInit } from '@angular/core';
import {ApiService} from "../../services/api.service";

@Component({
  templateUrl: './general-dashboard-page.component.html',
  styleUrls: ['./general-dashboard-page.component.scss']
})
export class GeneralDashboardPageComponent implements OnInit {

  wireframes$ = this.api.getWireframes();

  constructor(private api: ApiService) { }

  ngOnInit(): void {
  }

}
