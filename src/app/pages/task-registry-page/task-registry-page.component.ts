import { Component, OnInit } from '@angular/core';
import {TaskRegistryService} from "../../services/task-registry.service";
import {DynamicTableCellType} from "../../types/transport-interfaces";

@Component({
  templateUrl: './task-registry-page.component.html',
  styleUrls: ['./task-registry-page.component.scss']
})
export class TaskRegistryPage implements OnInit {

  CellType = DynamicTableCellType

  constructor(readonly service: TaskRegistryService) { }

  ngOnInit(): void {
  }

  loadTaskTable(event: any) {
    console.log(event)
  }
}
