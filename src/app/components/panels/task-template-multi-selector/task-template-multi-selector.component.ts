import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {Wireframe, WireframeTaskCounter} from "../../../transport-interfaces";
import {ApiService} from "../../../services/api.service";
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from "@angular/forms";
import {delay, filter, first, from, lastValueFrom, map, mergeMap} from "rxjs";
import {RealTimeUpdateService} from "../../../services/real-time-update.service";
import {PersonalityService} from "../../../services/personality.service";
import {SubscriptionsHolder} from "../../../util";
import {log} from "util";

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
export class TaskTemplateMultiSelectorComponent implements OnInit, OnDestroy, ControlValueAccessor {

    templates: Wireframe[] = [];
    deletedTemplates: Wireframe[] = [];
    selected: number[] = [];
    @Input() countersType: "incoming" | "all" | "none" = "incoming";
    @Input() inline = false;
    status: "loading" | "ready" | "error" | "empty" = "loading";
    uniTargetMode = false;
    uniTargetId = 0;
    disabled = false;
    closed = true;
    subscriptions: SubscriptionsHolder = new SubscriptionsHolder();

    constructor(readonly api: ApiService, private rt: RealTimeUpdateService, private personality: PersonalityService) {
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
        return item.wireframeId + (item.countTask ?? '').toString();
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
                        ).subscribe(counter => {
                            const wireframe = this.templates.find(t=>t.wireframeId === counter.id);
                            if (wireframe) wireframe.countTask = counter.num;
                        })
                    this.status = "ready";
                }
            },
            error: () => {
                this.status = "error";
            }
        })

        if(this.countersType === "incoming"){
            this.personality.userData.pipe(first()).subscribe(user=>{
                this.subscriptions.addSubscription('countUpdater', this.rt.incomingTaskCountChange(user.login).pipe(filter(()=>this.countersType === "incoming")).subscribe(this.counterUpdateHandler.bind(this)))
            })
        }else if(this.countersType === "all"){
            this.subscriptions.addSubscription('countUpdater', this.rt.taskCountChange().pipe(filter(()=>this.countersType === "all")).subscribe(this.counterUpdateHandler.bind(this)))
        }
    }

    counterUpdateHandler(counter: WireframeTaskCounter){
        const wireframe = this.templates.find(t=>t.wireframeId === counter.id);
        if (wireframe) wireframe.countTask = counter.num;
    }

    ngOnDestroy() {
        this.subscriptions.unsubscribeAll();
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

    selectAll() {
        this.selected = this.templates.map(i => i.wireframeId);
        this.onChange(this.selected);
    }

    toggleExpand() {
        this.closed = !this.closed;
    }
}
