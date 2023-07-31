import {Component, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR} from "@angular/forms";
import {TaskTag} from "../../../transport-interfaces";
import {ApiService} from "../../../services/api.service";
import {AutoComplete} from "primeng/autocomplete";
import {Subscription} from "rxjs";

@Component({
    selector: 'app-task-tag-selector',
    templateUrl: './task-tag-selector.component.html',
    styleUrls: ['./task-tag-selector.component.scss'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            multi: true,
            useExisting: TaskTagSelectorComponent
        }
    ]
})
export class TaskTagSelectorComponent implements OnInit, OnDestroy, ControlValueAccessor {

    private _autoAccept = false;

    control = new FormControl<TaskTag[]>([]);

    suggestions: TaskTag[] = [];

    focused = false;

    extraPreviewVisible = false;

    previousVariableValue: string = '';

    @Input() set autoAccept(autoAccept: boolean) {
        this._autoAccept = autoAccept;
        if(autoAccept){
            this.changeSubscription?.unsubscribe()
            this.changeSubscription = this.control.valueChanges.subscribe(value => {
                this.onChange(value);
            })
        }
    }

    get autoAccept(): boolean {
        return this._autoAccept;
    }

    @ViewChild('inputEl') inputEl?: AutoComplete;

    changeSubscription?: Subscription;

    constructor(private api: ApiService) {
    }

    search(event: any) {
        this.api.getTaskTagsBySearch(event.query).subscribe(tags => {
            this.suggestions = tags.filter(t => !this.control.value?.some(ct => t.taskTagId === ct.taskTagId));
        })
    }

    onChange = (value: any) => {
    }

    onTouched = () => {
    }

    trackByTaskTag(index: number, tag: TaskTag) {
        return tag.taskTagId + tag.name + tag.color;
    };

    registerOnChange(fn: any): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: any): void {
        this.onTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        if (isDisabled) {
            this.control.disable({emitEvent: false});
            this.focused = false;
        } else {
            this.control.enable({emitEvent: false});
        }
    }

    writeValue(value: any): void {
        // if(JSON.stringify(value) !== JSON.stringify(this.control.value))
            this.control.setValue(value);
        this.previousVariableValue = JSON.stringify(value);
    }

    ngOnInit(): void {
    }

    ngOnDestroy(): void {
        this.changeSubscription?.unsubscribe();
    }

    accept() {
        if(JSON.stringify(this.control.value) !== this.previousVariableValue)
            this.onChange(this.control.value);
        this.focused = false;
    }

    focusing() {
        if(this.control.disabled) return;
        this.previousVariableValue = JSON.stringify(this.control.value)
        this.focused = true;
        this.onTouched();
        setTimeout(() => {
            this.inputEl?.multiInputEL?.nativeElement.focus();
        })
    }
}
