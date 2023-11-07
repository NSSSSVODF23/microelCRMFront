import {Component, OnDestroy, OnInit} from '@angular/core';
import {TaskTag} from "../../../transport-interfaces";
import {ApiService} from "../../../services/api.service";
import {ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR} from "@angular/forms";
import {SubscriptionsHolder} from "../../../util";
import {map} from "rxjs";

@Component({
    selector: 'app-task-tag-filter-input',
    templateUrl: './task-tag-filter-input.component.html',
    styleUrls: ['./task-tag-filter-input.component.scss'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            multi: true,
            useExisting: TaskTagFilterInputComponent
        }
    ]
})
export class TaskTagFilterInputComponent implements OnInit, OnDestroy, ControlValueAccessor {
    availableTags: TaskTag[] = [];

    control = new FormControl<number[] | null>(null);
    subscription = new SubscriptionsHolder();

    constructor(readonly api: ApiService) {
    }

    get selectedTags(): TaskTag[] {
        return this.availableTags.filter(tag => this.control.value?.includes(tag.taskTagId));
    }

    onChange: (tags: number[] | null) => void = () => {
    };

    onTouched: () => void = () => {
    }

    trackByTaskTag(index: number, tag: TaskTag): number {
        return tag.taskTagId;
    };

    setDisabledState(isDisabled: boolean) {
        if (isDisabled) {
            this.control.disable({ emitEvent: false });
        } else {
            this.control.enable({ emitEvent: false });
        }
    }

    ngOnInit(): void {
        this.api.getTaskTags(null,true).subscribe(tags => {
            this.availableTags = tags;
        })
        this.subscription.addSubscription('change', this.control.valueChanges
            .pipe(map(value => value ?? []))
            .subscribe(value => {
                this.onChange(value);
            }))
    }

    ngOnDestroy() {
        this.subscription.unsubscribeAll();
    }

    registerOnChange(fn: (tags: number[] | null) => void): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: any): void {
        this.onTouched = fn;
    }

    writeValue(obj: number[] | null): void {
        if (!obj) {
            this.control.setValue(null);
            return;
        }
        this.control.setValue(obj);
    }

}
