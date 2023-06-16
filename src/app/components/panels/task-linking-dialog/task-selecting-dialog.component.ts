import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {LoadingState, Page, Task, TaskStatus, TaskTag} from "../../../transport-interfaces";
import {ApiService} from "../../../services/api.service";
import {debounceTime, distinctUntilChanged, map, tap} from "rxjs";
import {FormControl, FormGroup} from "@angular/forms";
import {CustomValidators} from "../../../custom-validators";
import {SubscriptionsHolder, Utils} from "../../../util";
import {ConfirmationService} from "primeng/api";

@Component({
    selector: 'app-task-selecting-dialog',
    templateUrl: './task-selecting-dialog.component.html',
    styleUrls: ['./task-selecting-dialog.component.scss']
})
export class TaskSelectingDialogComponent implements OnInit, OnDestroy {

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
    loadingState: LoadingState = LoadingState.LOADING;
    linkingInProgress = false;
    lastAppliedMainFilter = {};
    dialogContentStyle = {
        padding: '0 1rem 0 1rem',
        display: 'grid',
        grid: '1fr min-content/ 1fr max-content',
        gridTemplateAreas: "'list filter''paginator paginator'",
        columnGap: '1rem',
    }
    mainFilterForm = new FormGroup({
        searchPhrase: new FormControl<string|null>(null),
        template: new FormControl<number[]|null>([], [CustomValidators.notEmpty]),
        status: new FormControl<TaskStatus[]>([TaskStatus.ACTIVE, TaskStatus.PROCESSING, TaskStatus.CLOSE], [CustomValidators.notEmpty]),
        author: new FormControl<string|null>(null),
        dateOfCreation: new FormControl<string[]|null>(null),
        tags: new FormControl<number[]>([]),
    })
    subscriptions = new SubscriptionsHolder();


    constructor(readonly api: ApiService, readonly confirm: ConfirmationService) {
    }

    ngOnInit(): void {
        const filters$ = this.mainFilterForm.valueChanges.pipe(
            debounceTime(1000),
            distinctUntilChanged(),
        );

        this.subscriptions.addSubscription("filter", filters$.subscribe(filters => {
            this.loadingState = LoadingState.LOADING;
            this.mainFilterForm.disable({emitEvent: false});
            this.api.getPageOfTasks(0, {...filters, exclusionIds: this.excludedTasks, onlyMy: this.onlyMy}).subscribe(this.loadHandler())
        }));
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribeAll();
    }

    open(mode: 'single' | 'multiply') {
        this.isShow = true;
        this.linkingMode = mode;

    }

    changePage(event: any) {
        this.loadingState = LoadingState.LOADING;
        this.mainFilterForm.disable({emitEvent: false});
        this.api.getPageOfTasks(event.page, {...this.mainFilterForm.getRawValue(), exclusionIds: this.excludedTasks, onlyMy: this.onlyMy}).subscribe(this.loadHandler())
    }

    loadHandler() {
        return {
            next: (page: Page<Task>) => {
                this.pageOfTasks = page;
                if(page.totalElements>0){
                    this.loadingState = LoadingState.READY;
                }else{
                    this.loadingState = LoadingState.EMPTY;
                }
                this.mainFilterForm.enable({emitEvent: false});
            },
            error: () => {
                this.loadingState = LoadingState.ERROR;
                this.mainFilterForm.enable({emitEvent: false});
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
            status: [TaskStatus.ACTIVE, TaskStatus.PROCESSING, TaskStatus.CLOSE],
            dateOfCreation: [],
            tags: [],
            author: "",
            searchPhrase: ""
        })
        this.pageOfTasks = undefined;
    }
}
