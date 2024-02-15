import {Component, ElementRef, EventEmitter, OnDestroy, OnInit, Output} from '@angular/core';
import {ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR} from "@angular/forms";
import {TaskTag} from "../../../types/transport-interfaces";
import {BehaviorSubject, combineLatest, distinctUntilChanged, map, shareReplay, startWith, tap} from "rxjs";
import {ApiService} from "../../../services/api.service";
import {OverlayPanel} from "primeng/overlaypanel";

@Component({
    selector: 'app-task-tag-inline-selector',
    templateUrl: './task-tag-inline-selector.component.html',
    styleUrls: ['./task-tag-inline-selector.component.scss'],
    providers: [{
        provide: NG_VALUE_ACCESSOR, multi: true, useExisting: TaskTagInlineSelectorComponent
    }]
})
export class TaskTagInlineSelectorComponent implements OnInit, OnDestroy, ControlValueAccessor {

    isEdit = false;
    isDisabled = false;
    isWrapperHovered = false;

    tags: TaskTag[] = [];

    selectedTagsSubject = new BehaviorSubject(this.tags);

    alreadySelected$ = this.selectedTagsSubject.asObservable();

    loadedTags$ = combineLatest([this.api.getTaskTags(null, false), this.alreadySelected$]).pipe(map(([tags, alreadySelected]) => {
        return tags.filter(t => !alreadySelected.find(a => a.taskTagId === t.taskTagId)).map(t => ({label: t.name, value:t}));
    }))

    initialTags = [] as TaskTag[];

    @Output() onShow = new EventEmitter();
    @Output() onHide = new EventEmitter();

    constructor(private api: ApiService, readonly element: ElementRef) {
    }

    onChange = (value: TaskTag[]) => {
    }

    onTouched = () => {
    }

    ngOnInit(): void {
    }

    ngOnDestroy(): void {
    }

    registerOnChange(fn: any): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: any): void {
        this.onTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        this.isDisabled = isDisabled;
    }

    writeValue(obj: any): void {
        if (!obj) {
            this.tags = [];
            this.selectedTagsSubject.next(this.tags);
            return;
        }
        this.tags = obj
        this.selectedTagsSubject.next(this.tags);
    }

    appendTag(tag: TaskTag) {
        if(!tag) return;
        this.tags.push(tag);
        this.selectedTagsSubject.next(this.tags);
    }

    removeTag(tag: TaskTag) {
        this.tags.splice(this.tags.indexOf(tag), 1);
        this.selectedTagsSubject.next(this.tags);
    }

    initializeTags(){
        this.initialTags = [...this.tags];
    }

    isHasChanges(){
        if(this.tags.length !== this.initialTags.length) return true;
        if(this.tags.some(t=>this.initialTags.every(it=>it.taskTagId !== t.taskTagId))) return true;
        if(this.initialTags.some(it=>this.tags.every(t=>it.taskTagId !== t.taskTagId))) return true;
        return false;
    }

    changeTags(){
        this.isEdit=false;
        this.onHide.emit();
        if(!this.isHasChanges()) return;
        this.onChange(this.tags)
    }

    editTags(event: MouseEvent, appendTagPanel: OverlayPanel, nativeElement: HTMLElement) {
        event.stopPropagation();
        this.isEdit = true;
        this.initializeTags();
        appendTagPanel.toggle(event, nativeElement)
        this.onShow.emit();
    }
}
