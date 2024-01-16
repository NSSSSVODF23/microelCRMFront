import {Component, Input, OnInit} from '@angular/core';
import {ModelItem, Task} from "../../../types/transport-interfaces";
import {Utils} from "../../../util";
import {MessageService} from "primeng/api";

@Component({
  selector: 'app-task-fields-table-view',
  templateUrl: './task-fields-table-view.component.html',
  styleUrls: ['./task-fields-table-view.component.scss']
})
export class TaskFieldsTableViewComponent implements OnInit {

  @Input() task?: Task;
  @Input() isTaskBody: boolean = true;

  get taskFields(): {inline: ModelItem[], block: ModelItem[]} {
    const {fields, modelWireframe} = this.task ?? {};
    if(!fields || !modelWireframe) return {inline: [], block: []};
    const blocks = ['LARGE_TEXT', 'COUNTING_LIVES'];
    const listDisplayTypes = ['LIST_ONLY', 'LIST_AND_TELEGRAM', null, undefined];
    if(this.isTaskBody){
      return {
        inline: fields.filter(f=>!blocks.includes(f.wireframeFieldType)) ?? [],
        block: fields.filter(f=>blocks.includes(f.wireframeFieldType)) ?? []
      }
    }
    return {
      inline: fields.filter(f=>listDisplayTypes.includes(this.getDisplayType(f.id))).filter(f=>!blocks.includes(f.wireframeFieldType)) ?? [],
      block: fields.filter(f=>listDisplayTypes.includes(this.getDisplayType(f.id))).filter(f=>blocks.includes(f.wireframeFieldType)) ?? []
    }
  }

  getDisplayType(fieldId: string) {
    return this.task?.modelWireframe?.allFields?.find(fieldItem=>fieldItem.id === fieldId)?.displayType ?? null;
  }

  trackByField(index: number, field: ModelItem) {
    if (!field) return "";
    return field.id + field.name + field.textRepresentation;
  };

  constructor(private toast: MessageService) { }

  ngOnInit(): void {
  }

  copyField(field: ModelItem) {
    Utils.copyToClipboard(field.textRepresentation ?? '', this.toast, 'Скопировано в буфер обмена', 'Не удалось скопировать '+field.name)
  }
}
