import {Component, Input, OnInit} from '@angular/core';
import {Wireframe} from "../../../transport-interfaces";
import {ApiService} from "../../../services/api.service";
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from "@angular/forms";
import {from, map, mergeMap} from "rxjs";

@Component({
    selector: 'app-task-template-multi-selector',
    templateUrl: './task-template-multi-selector.component.html',
    styleUrls: ['./task-template-multi-selector.component.scss'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: TaskTemplateMultiSelectorComponent,
            multi: true
        }
    ]
})
export class TaskTemplateMultiSelectorComponent implements OnInit, ControlValueAccessor {

    templates: Wireframe[] = [];
    deletedTemplates: Wireframe[] = [];
    selected: number[] = [];
    @Input() countersType: "incoming" | "all" | "none" = "incoming";
    @Input() inline = false;
    counters: { id: number, num: number }[] = [];
    status: "loading" | "ready" | "error" | "empty" = "loading";
    uniTargetMode = false;
    uniTargetId = 0;
    disabled = false;
    closed = true;

    constructor(readonly api: ApiService) {
    }

    isUntarget(id: number) {
        return this.uniTargetMode && this.uniTargetId !== id;
    }

    setDisabledState(isDisabled: boolean) {
        this.disabled = isDisabled;
    }

    uniselect(id: number) {
        this.selected = [id];
        this.onChange(this.selected);
    }

    select(id: number) {
        this.selected.push(id);
        this.onChange(this.selected);
    }

    unselect(id: number) {
        if (this.selected.length > 1) {
            this.selected = this.selected.filter(i => i !== id);
            this.onChange(this.selected);
        }
    }

    isSelect(id: number) {
        return this.selected.includes(id);
    }

    onChange = (value: number[]) => {
    }

    onTouched = () => {
    }

    templateTrack(index: number, item: Wireframe) {
        return item.wireframeId;
    };

    ngOnInit(): void {
        this.status = "loading";
        this.api.getWireframes(true).subscribe({
            next: wireframes => {
                this.templates = wireframes.filter(w => !w.deleted);
                this.deletedTemplates = wireframes.filter(w => w.deleted);
                if (this.templates.length === 0) {
                    this.status = "empty";
                } else {
                    if (this.selected.length === 0) {
                        this.selected = [this.templates[0].wireframeId];
                        this.onChange(this.selected);
                    }
                    this.counters = [];
                    if (this.countersType !== "none")
                        from(this.templates).pipe(
                            mergeMap(wireframe => {
                                if (this.countersType === "incoming")
                                    return this.api.getCountIncomingTasksByWireframeId(wireframe.wireframeId).pipe(map(num => ({
                                        id: wireframe.wireframeId,
                                        num
                                    })))
                                else
                                    return this.api.getCountAllTasksByWireframeId(wireframe.wireframeId).pipe(map(num => ({
                                        id: wireframe.wireframeId,
                                        num
                                    })))
                            })
                        ).subscribe(counter => this.counters.push(counter))
                    this.status = "ready";
                }
            },
            error: () => {
                this.status = "error";
            }
        })
    }

    registerOnChange(fn: any): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: any): void {
        this.onTouched = fn;
    }

    writeValue(obj: any): void {
        this.selected = obj;
    }

    toggle(id: number) {
        if (this.isSelect(id)) {
            this.unselect(id);
        } else {
            this.select(id);
        }
    }

    getCount(id: number) {
        return this.counters.find(i => i.id === id)?.num || 0;
    }

    selectAll() {
        this.selected = this.templates.map(i => i.wireframeId);
        this.onChange(this.selected);
    }

    toggleExpand() {
        this.closed = !this.closed;
    }
}
