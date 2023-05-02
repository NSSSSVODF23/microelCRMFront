import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {Page, Task, TaskTag} from "../../../transport-interfaces";
import {ApiService} from "../../../services/api.service";
import {map, tap} from "rxjs";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {CustomValidators} from "../../../custom-validators";
import {require} from "ace-builds";
import {Utils} from "../../../util";
import {ConfirmationService} from "primeng/api";

@Component({
    selector: 'app-task-selecting-dialog',
    templateUrl: './task-selecting-dialog.component.html',
    styleUrls: ['./task-selecting-dialog.component.scss']
})
export class TaskSelectingDialogComponent implements OnInit {

    @Input() excludedTasks: number[] = [];
    @Input() header: string = "";
    @Input() onlyMy = false;
    @Output() onSelected = new EventEmitter<number>();
    @Output() onMultiplySelected = new EventEmitter<number[]>();
    isShow = false;
    linkingMode: 'single' | 'multiply' = "single";
    selectedChildTask: number[] = [];
    pageOfTasks?: Page<Task>;
    currentPage = 0;
    TASK_PAGE_SIZE = 25;
    loading = true;
    linkingInProgress = false;
    lastAppliedMainFilter = {};
    employees$ = this.api.getEmployees(undefined, true, false);
    dialogContentStyle = {
        padding: '0 1rem 0 1rem',
        display: 'grid',
        grid: '1fr min-content/ 1fr max-content',
        gridTemplateAreas: "'list filter''paginator paginator'",
        columnGap: '1rem',
    }
    mainFilterForm = new FormGroup({
        globalContext: new FormControl(""),
        template: new FormControl([] as number[], [CustomValidators.notEmpty]),
        status: new FormControl(['ACTIVE', 'PROCESSING', 'CLOSE'], [CustomValidators.notEmpty]),
        author: new FormControl(""),
        dateOfCreation: new FormControl([]),
        tags: new FormControl([] as number[]),
    })
    templates$ = this.api.getWireframesNames().pipe(tap((wireframes) => {
        this.mainFilterForm.patchValue({template: wireframes.map(w => w.wireframeId)})
        this.api.getPageOfTasks(0, this.TASK_PAGE_SIZE, {exclusionIds: this.excludedTasks, onlyMy: this.onlyMy}, []).subscribe(this.loadHandler())
    }));
    mainFilters = {} as any;


    constructor(readonly api: ApiService, readonly confirm: ConfirmationService) {
    }

    get mainFilterChanged() {
        return JSON.stringify(this.lastAppliedMainFilter) !== JSON.stringify(this.mainFilters);
    }

    ngOnInit(): void {
        this.mainFilterForm.valueChanges.pipe(
            map((values) => {
                return Object.entries(values)
                    .filter(([key, value]) => !CustomValidators.isValueEmpty(value))
                    .map(([key, value]: any) => {
                        switch (key) {
                            case 'dateOfCreation':
                                return {
                                    [key]: Utils.dateArrayToStringRange(value)
                                }
                            case 'tags':
                                return {
                                    [key]: value.map((tag: TaskTag) => tag.taskTagId)
                                }
                            default:
                                return {
                                    [key]: value
                                }
                        }
                    }).reduce((acc, curr) => ({...acc, ...curr}), {})
            })
        ).subscribe(filters => {
            this.mainFilters = filters
            this.mainFilters.exclusionIds = this.excludedTasks;
        });
    }

    open(mode: 'single' | 'multiply') {
        this.isShow = true;
        this.linkingMode = mode;
        this.loading = true;
    }

    onParentTaskLink() {

    }

    onChildTaskLink() {

    }

    changePage(event: any) {
        this.loading = true;
        this.api.getPageOfTasks(event.page, this.TASK_PAGE_SIZE, {...this.mainFilters, onlyMy: this.onlyMy}, []).subscribe(this.loadHandler())
    }

    applyFilter() {
        this.loading = true;
        this.api.getPageOfTasks(0, this.TASK_PAGE_SIZE, {...this.mainFilters, onlyMy: this.onlyMy}, []).subscribe(this.loadHandler())
    }

    loadHandler() {
        return {
            next: (page: Page<Task>) => {
                this.pageOfTasks = page;
                this.loading = false;
                this.lastAppliedMainFilter = this.mainFilters;
            },
            error: () => {
                this.loading = false;
            }
        }
    }

    selectParent(taskId: number) {
        this.onSelected.emit(taskId);
        this.linkingInProgress = false;
        this.selectedChildTask = [];
        this.isShow = false;
    }

    selectChild() {
        this.onMultiplySelected.emit(this.selectedChildTask);
        this.linkingInProgress = false;
        this.selectedChildTask = [];
        this.isShow = false;
    }

    closeHandler() {
        this.mainFilterForm.setValue({
            template: [],
            status: ['ACTIVE', 'PROCESSING', 'CLOSE'],
            dateOfCreation: [],
            tags: [],
            author: "",
            globalContext: ""
        })
        this.pageOfTasks = undefined;
    }
}
