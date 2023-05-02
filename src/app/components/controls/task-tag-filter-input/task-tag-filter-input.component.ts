import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {TaskTag} from "../../../transport-interfaces";
import {ApiService} from "../../../services/api.service";
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from "@angular/forms";

@Component({
    selector: 'app-task-tag-filter-input',
    templateUrl: './task-tag-filter-input.component.html',
    styleUrls: ['./task-tag-filter-input.component.scss'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            multi:true,
            useExisting: TaskTagFilterInputComponent
        }
    ]
})
export class TaskTagFilterInputComponent implements OnInit, ControlValueAccessor {
    availableTags: TaskTag[] = [];
    @Input() selectedTags: TaskTag[] = [];
    @Output() selectedTagsChange = new EventEmitter<TaskTag[]>();

    constructor(readonly api: ApiService) {
    }

    onChange: (tags: TaskTag[]) => void = () => {
    };

    onTouched: () => void = () => {}

    ngOnInit(): void {
        this.api.getTaskTags(true).subscribe(tags => {
            this.availableTags = tags;
        })
    }

    registerOnChange(fn: (tags: TaskTag[]) => void): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: any): void {
        this.onTouched = fn;
    }

    writeValue(obj: any): void {
        this.selectedTags = obj;
    }

}
