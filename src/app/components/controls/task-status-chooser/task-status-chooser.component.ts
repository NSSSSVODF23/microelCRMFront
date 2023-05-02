import { Component, OnInit } from '@angular/core';
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from "@angular/forms";

@Component({
  selector: 'app-task-status-chooser',
  templateUrl: './task-status-chooser.component.html',
  styleUrls: ['./task-status-chooser.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: TaskStatusChooserComponent
    }
  ]
})
export class TaskStatusChooserComponent implements OnInit, ControlValueAccessor {
  statuses: string[] = [];

  onChange: (value: string[]) => void = () => {}
  onTouched: () => void = () => {}

  constructor() { }

  ngOnInit(): void {
  }

  onChangeStatus() {
    setTimeout((): void => {
      this.onChange(this.statuses);
    });
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  writeValue(obj: string[]): void {
    this.statuses = obj;
  }

}
