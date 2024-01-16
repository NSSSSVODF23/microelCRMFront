import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {FormControl} from "@angular/forms";
import {ApiService} from "../../../services/api.service";
import {SubscriptionsHolder} from "../../../util";

@Component({
    selector: 'app-task-scheduling-dialog',
    templateUrl: './task-scheduling-dialog.component.html',
    styleUrls: ['./task-scheduling-dialog.component.scss']
})
export class TaskSchedulingDialogComponent implements OnInit, OnDestroy {

    @Input() visible = false;
    @Output() visibleChange = new EventEmitter<boolean>();
    @Input() schedulingType: 'from' | 'to' = 'from';
    @Input() taskId?: number;

    dateControl = new FormControl(new Date());
    hourControl = new FormControl(0);
    minuteControl = new FormControl(0);

    changingTaskDateTime = false;

    private subscriptions = new SubscriptionsHolder();

    constructor(private api: ApiService) {
    }

    ngOnInit(): void {
        this.subscriptions.addSubscription('dateSchCh', this.dateControl.valueChanges.subscribe(value => {
            if (value) {
                this.hourControl.setValue(value.getHours());
                this.minuteControl.setValue(value.getMinutes());
            }
        }))
        this.subscriptions.addSubscription('hrSchCh', this.hourControl.valueChanges.subscribe(value => {
            if (value) {
                const selectedDate = this.dateControl.value;
                if (selectedDate) {
                    selectedDate.setHours(value);
                    this.dateControl.setValue(selectedDate, {emitEvent: false});
                }
            }
        }))
        this.subscriptions.addSubscription('mnSchCh', this.minuteControl.valueChanges.subscribe(value => {
            if (value) {
                const selectedDate = this.dateControl.value;
                if (selectedDate) {
                    selectedDate.setMinutes(value);
                    this.dateControl.setValue(selectedDate, {emitEvent: false});
                }
            }
        }))
    }

    ngOnDestroy() {
        this.subscriptions.unsubscribeAll();
    }

    setVisible(value: boolean) {
        this.visible = value;
        this.visibleChange.emit(value);
    }

    initValues() {
        const now = new Date();
        const minutes = now.getMinutes();
        if (minutes > 45) {
            now.setHours(now.getHours() + 1, 0, 0, 0);
        } else if (minutes > 30) {
            now.setMinutes(45, 0, 0);
        } else if (minutes > 15) {
            now.setMinutes(30, 0, 0);
        } else if (minutes > 0) {
            now.setMinutes(15, 0, 0);
        }
        this.dateControl.setValue(now);
        this.hourControl.setValue(now.getHours());
        this.minuteControl.setValue(now.getMinutes());
    }

    setDateTimeOfTaskRelevance() {
        if (!this.taskId || this.dateControl.value == null) return;
        this.changingTaskDateTime = true;
        if (this.schedulingType === 'from') this.changeTaskActualFrom(); else if (this.schedulingType === 'to') this.changeTaskActualTo();
    }

    private changeTaskActualFrom() {
        if (!this.taskId || this.dateControl.value == null) return;
        this.api.changeTaskActualFrom(this.taskId, this.dateControl.value).subscribe({
            next: () => {
                this.changingTaskDateTime = false;
                this.setVisible(false);
            }, error: () => {
                this.changingTaskDateTime = false;
            }
        });
    }

    private changeTaskActualTo() {
        if (!this.taskId || this.dateControl.value == null) return;
        this.api.changeTaskActualTo(this.taskId, this.dateControl.value).subscribe({
            next: () => {
                this.changingTaskDateTime = false;
                this.setVisible(false);
            }, error: () => {
                this.changingTaskDateTime = false;
            }
        });
    }
}
