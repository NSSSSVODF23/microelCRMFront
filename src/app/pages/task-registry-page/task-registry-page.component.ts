import {Component, OnInit} from '@angular/core';
import {TaskRegistryService} from "../../services/task-registry.service";
import {DynamicTableCell, DynamicTableCellType} from "../../types/transport-interfaces";

@Component({
    templateUrl: './task-registry-page.component.html',
    styleUrls: ['./task-registry-page.component.scss']
})
export class TaskRegistryPage implements OnInit {

    CellType = DynamicTableCellType

    constructor(readonly service: TaskRegistryService) {
    }

    ngOnInit(): void {
    }

    isNotLargeText(value: {[key:string]:DynamicTableCell}){
      return !Object.keys(value).includes("largeText");
    }
}
