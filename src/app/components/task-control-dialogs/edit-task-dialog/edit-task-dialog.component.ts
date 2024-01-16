import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';
import {FormControl, FormGroup} from "@angular/forms";
import {ModelItem, Task} from "../../../types/transport-interfaces";
import {FormToModelItemConverter, Utils} from "../../../util";
import {ApiService} from "../../../services/api.service";
import {CustomValidators} from "../../../custom-validators";

@Component({
    selector: 'app-edit-task-dialog',
    templateUrl: './edit-task-dialog.component.html',
    styleUrls: ['./edit-task-dialog.component.scss']
})
export class EditTaskDialogComponent implements OnInit, OnChanges {

    @Input() task?: Task;
    @Input() visible = false;
    @Output() visibleChange = new EventEmitter<boolean>();

    // Форма для редактирования задачи
    editTaskForm = new FormGroup({});
    // Флаг происходящего изменения задачи
    editBlocked = false;

    constructor(private api: ApiService) {
    }

    setVisible(visible: boolean) {
        this.visible = visible;
        this.visibleChange.emit(visible);
    }

    // Получаем поля текущей задачи из её шаблона
    get taskFields(): ModelItem[] {
        if (!this.visible) return [];
        return this.task?.fields ?? [];
    }

    ngOnInit(): void {
    }

    ngOnChanges(changes: SimpleChanges) {
        const visible = changes['visible'];
        if (visible && visible.currentValue) {
            this.showEditTaskDialog()
        }
    }

    doEditTask() {
        if (!this.task?.modelWireframe) return;
        if (!this.editTaskForm.valid) {
            this.editTaskForm.markAllAsTouched();
            return;
        }
        this.editBlocked = true;
        this.api.editTask(this.task.taskId, FormToModelItemConverter
            .editExisting(this.editTaskForm.getRawValue(), this.task.fields ?? [])).subscribe({
            next: () => {
                this.editBlocked = false;
                this.setVisible(false);
            }, error: () => {
                this.editBlocked = false;
            }
        })
    }

    showEditTaskDialog() {
        // Устанавливаем элементы управления в форму редактирования задачи
        this.editTaskForm = new FormGroup(this.task?.fields ? this.task.fields.reduce((acc, field) => {
            return {
                ...acc,
                [field.modelItemId]: new FormControl(Utils.getValueFromModelItem(field), CustomValidators.taskInput(field.wireframeFieldType, field.variation))
            };
        }, {}) : {});
    }

}
