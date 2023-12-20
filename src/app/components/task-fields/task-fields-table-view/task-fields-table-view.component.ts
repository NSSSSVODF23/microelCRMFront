import {Component, Input, OnInit} from '@angular/core';
import {ModelItem, Task} from "../../../transport-interfaces";

@Component({
  selector: 'app-task-fields-table-view',
  templateUrl: './task-fields-table-view.component.html',
  styleUrls: ['./task-fields-table-view.component.scss']
})
export class TaskFieldsTableViewComponent implements OnInit {

  @Input() task?: Task;
  @Input() isTaskBody: boolean = true;

  get taskFields(): {inline: ModelItem[], block: ModelItem[]} {
    const blocks = ['LARGE_TEXT', 'COUNTING_LIVES'];
    const listDisplayTypes = ['LIST_ONLY', 'LIST_AND_TELEGRAM', null, undefined];
    if(this.isTaskBody){
      return {
        inline: this.task?.fields?.filter(f=>!blocks.includes(f.wireframeFieldType)) ?? [],
        block: this.task?.fields?.filter(f=>blocks.includes(f.wireframeFieldType)) ?? []
      }
    }
    return {
      inline: this.task?.fields?.filter(f=>listDisplayTypes.includes(f.displayType)).filter(f=>!blocks.includes(f.wireframeFieldType)) ?? [],
      block: this.task?.fields?.filter(f=>listDisplayTypes.includes(f.displayType)).filter(f=>blocks.includes(f.wireframeFieldType)) ?? []
    }
  }

  trackByField(index: number, field: ModelItem) {
    if (!field) return "";
    return field.id + field.name + field.textRepresentation;
  };

  constructor() { }

  ngOnInit(): void {
  }

}
