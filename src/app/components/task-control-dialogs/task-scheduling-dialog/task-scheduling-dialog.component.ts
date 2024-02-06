import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {FormControl} from "@angular/forms";
import {ApiService} from "../../../services/api.service";
import {AutoUnsubscribe} from "../../../decorators";
import {startWith, tap} from "rxjs";

@Component({
    selector: 'app-task-scheduling-dialog',
    templateUrl: './task-scheduling-dialog.component.html',
    styleUrls: ['./task-scheduling-dialog.component.scss']
})
@AutoUnsubscribe()
export class TaskSchedulingDialogComponent implements OnInit {

    @Input() visible = false;
    @Output() visibleChange = new EventEmitter<boolean>();
    @Input() schedulingType: 'from' | 'to' = 'from';
    @Input() taskId?: number;

    dateControl = new FormControl(new Date());
    dateTimeControl = new FormControl(new Date());

    dateTimeUpdateSub = this.dateControl.valueChanges.pipe(startWith(new Date()),tap(date => {
        if (date?.getHours() === 0) {
            date?.setHours(8, 0, 0, 0)
        }else{
            const extraMinutes = (date?.getMinutes() || 0) % 10;
            let currentHours = date?.getHours() || 0;
            let currentMinutes = (date?.getMinutes() || 0);
            if(extraMinutes > 0){
                currentMinutes += 10 - extraMinutes;
            }
            date?.setHours(currentHours+1, currentMinutes, 0, 0)
        }

    })).subscribe(date => this.dateTimeControl.setValue(date))

    changingTaskDateTime = false;


    constructor(private api: ApiService) {
    }

    get title() {
        return this.schedulingType === 'from' ? 'Запланировать задачу' : 'Установить срок завершения';
    }

    get buttonLabel(){
        return this.schedulingType === 'from' ? 'Запланировать c ' : 'Установить срок до ';
    }

    ngOnInit(): void {
    }

    setVisible(value: boolean) {
        this.visible = value;
        this.visibleChange.emit(value);
    }

    setDateTimeOfTaskRelevance() {
        if (!this.taskId || this.dateControl.value == null) return;
        this.changingTaskDateTime = true;
        if (this.schedulingType === 'from') this.changeTaskActualFrom(); else if (this.schedulingType === 'to') this.changeTaskActualTo();
    }

    resetDate() {
        this.dateControl.reset(new Date());
    }

    private changeTaskActualFrom() {
        if (!this.taskId || this.dateTimeControl.value == null) return;
        this.api.changeTaskActualFrom(this.taskId, this.dateTimeControl.value).subscribe({
            next: () => {
                this.changingTaskDateTime = false;
                this.setVisible(false);
            }, error: () => {
                this.changingTaskDateTime = false;
            }
        });
    }

    private changeTaskActualTo() {
        if (!this.taskId || this.dateTimeControl.value == null) return;
        this.api.changeTaskActualTo(this.taskId, this.dateTimeControl.value).subscribe({
            next: () => {
                this.changingTaskDateTime = false;
                this.setVisible(false);
            }, error: () => {
                this.changingTaskDateTime = false;
            }
        });
    }
}
