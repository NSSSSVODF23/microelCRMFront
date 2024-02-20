import {Injectable} from '@angular/core';
import {FormControl} from "@angular/forms";
import {DynamicTableCell, Page, TaskStatus} from "../types/transport-interfaces";
import {ApiService} from "./api.service";
import {combineLatest, shareReplay, startWith, Subject, switchMap} from "rxjs";

type DropdownOption = { label: string, value: any };

@Injectable({
    providedIn: 'root'
})
export class TaskRegistryService {

    taskStatusSelector = new FormControl<TaskStatus>(TaskStatus.ACTIVE);
    taskStatusOptions: DropdownOption[] = [
        {label: 'Активные', value: TaskStatus.ACTIVE},
        {label: 'Закрытые', value: TaskStatus.CLOSE},
        {label: 'В работе', value: TaskStatus.PROCESSING},
    ];

    taskClassSelector = new FormControl<number | null>(null);
    taskClassOptions: DropdownOption[] = [];

    taskStatus$ = this.taskStatusSelector.valueChanges.pipe(startWith(TaskStatus.ACTIVE));
    taskClass$ = this.taskClassSelector.valueChanges;

    tabelColumns$ = combineLatest([this.taskStatus$, this.taskClass$])
        .pipe(
            switchMap(([taskStatus, taskClass]) => this.api.getTaskRegistryTableHeaders(taskStatus!, taskClass!)),
            shareReplay(1)
        );

    tableOffset = 0;

    tableLazyLoad$ = new Subject<any>();

    tableContent?: Page<{ [key: string]: DynamicTableCell }>;


    constructor(private api: ApiService) {
        this.api.getWireframes().subscribe(wireframes => {
            this.taskClassOptions = wireframes.map(wf => ({label: wf.name, value: wf.wireframeId}));
            this.taskClassSelector.setValue(this.taskClassOptions[0].value);
        });
        combineLatest([this.taskStatus$, this.taskClass$, this.tableLazyLoad$])
            .pipe(
                switchMap(([taskStatus, taskClass, paging]) => this.api.getTaskRegistryTableContent(taskStatus!, taskClass!, paging)),
            ).subscribe(loadedPage => this.tableContent = loadedPage)
    }
}
