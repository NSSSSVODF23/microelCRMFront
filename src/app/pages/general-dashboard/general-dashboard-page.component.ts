import { Component, OnInit } from '@angular/core';
import {ApiService} from "../../services/api.service";
import {DashboardPageService} from "../../services/page-cache/dashboard-page.service";
import {
  DashboardItem,
  DirectoryItem,
  TagItem,
  TaskStatusItem,
  TimeFrameItem,
  TypeItem
} from "../../types/task-dashboard";
import {LoadingState} from "../../types/transport-interfaces";

@Component({
  templateUrl: './general-dashboard-page.component.html',
  styleUrls: ['./general-dashboard-page.component.scss']
})
export class GeneralDashboardPageComponent implements OnInit {

  constructor(readonly service: DashboardPageService) { }

  ngOnInit(): void {
  }

  toDashboardItem(value: any): DashboardItem { return value; }
  toStatusItem(value: any): TaskStatusItem { return value; }
  toTypeItem(value: any): TypeItem { return value; }
  toDirectoryItem(value: any): DirectoryItem { return value; }
  toTagItem(value: any): TagItem { return value; }
  toTimeFrameItem(value: any): TimeFrameItem { return value; }

    protected readonly LoadingState = LoadingState;
}
