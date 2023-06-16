import {Component, OnInit} from '@angular/core';
import {ApiService} from "../../services/api.service";
import {fade, flow, swipeChild} from "../../animations";
import {FieldItem, ModelItem, Task, TaskCreationBody, Wireframe} from "../../transport-interfaces";
import {ActivatedRoute} from "@angular/router";
import {FormArray, FormControl, FormGroup} from "@angular/forms";
import {FormToModelItemConverter} from "../../util";
import {PersonalityService} from "../../services/personality.service";
import {CustomValidators} from "../../custom-validators";
import {MessageService} from "primeng/api";

enum ControlsType {
    NEXT_ONLY = "NEXT_ONLY", BOTH = "BOTH", PREV_FIN = "PREV_FIN", FIN_ONLY = "FIN_ONLY", NONE = "NONE"
}

@Component({
    templateUrl: './task-creation-page.component.html',
    styleUrls: ['./task-creation-page.component.scss'],
    animations: [fade, flow, swipeChild]
})
export class TaskCreationPageComponent implements OnInit {

    /* Поля связанные с выбором шаблона */
    // Список доступных для выбора шаблонов
    templateOptionsList$ = this.api.getWireframes();
    // Статус выбран ли шаблон?
    isTemplateSelected: boolean = false;
    // Текущий индекс этапа создания задачи
    currentStep = 0;

    // Дочерняя задача
    childId?: number;
    // Родительская задача
    parentId?: number;

    // Находиться ли задача в процессе создания
    isCreatedTask = false;

    // Объект формы для создания задачи
    taskCreationForm: FormArray<FormGroup> = new FormArray([] as FormGroup[]);

    constructor(readonly api: ApiService, readonly route: ActivatedRoute, readonly personality: PersonalityService, readonly toast: MessageService) {
        document.body.classList.add("whited");
    }

    // Выбранный шаблон для создания задачи
    private _selectedTemplate: Wireframe | null = null;

    get selectedTemplate(): Wireframe | null {
        return this._selectedTemplate;
    }

    set selectedTemplate(value: Wireframe | null) {
        this._selectedTemplate = value;
    }

    get currentStepFields(): FieldItem[] {
        if (!this.isTemplateSelected) return [];
        return this.selectedTemplate?.steps[this.currentStep].fields ?? [];
    }

    get currentStepForm(): FormGroup {
        return this.taskCreationForm.at(this.currentStep);
    }

    get isValidCurrentStep(): boolean {
        return this.currentStepForm.valid;
    }

    get taskCreationBody(): TaskCreationBody | null {
        if(!this.selectedTemplate) return null;

        const rawValues = this.taskCreationForm.getRawValue().reduce((acc, curr) => {
            return {...acc, ...curr};
        },{});

        return {
            wireframeId: this.selectedTemplate.wireframeId,
            childId: this.childId,
            parentId: this.parentId,
            fields: FormToModelItemConverter.convert(rawValues, this.selectedTemplate)
        };
    }

    ngOnInit(): void {

        // Подписываемся на изменение параметров страницы
        this.route.queryParams.subscribe(params => {
            const {child, parent} = params;
            if (child)
                this.childId = parseInt(child);
            else if (parent)
                this.parentId = parseInt(parent);
        })

    }

    // Выбор шаблона для создания задачи
    selectTemplateForTask() {
        if (!this.selectedTemplate) return;
        this.isTemplateSelected = true;

        this.taskCreationForm = new FormArray(
            this.selectedTemplate.steps.map(step => {
                 return  new FormGroup(
                    step.fields.reduce(
                        (prev, field) => {
                            return {...prev, [field.id]: new FormControl(null, [CustomValidators.taskInput(field.type, field.variation)])};
                        }, {}
                    )
                )
            })
        )
    }

    // Отчищаем выбранный шаблон и прочие поля
    unselectTemplateForTask() {

        this.selectedTemplate = null;
        this.isTemplateSelected = false;

        // Обнуляем индекс этапа создания задачи
        this.currentStep = 0;
        // Устанавливаем статус выбора шаблона false
        this.isTemplateSelected = false;

    }

    // Изменение этапа создания задачи
    changeCreationStep(shift: number = 0) {
        // Изменяем индекс этапа создания задачи
        this.currentStep += shift;
    }

    // Получение типа сочетания кнопок управления формой
    controlsType() {
        // Если выбран шаблон задачи
        if (this.selectedTemplate) {
            // И текучий этап первый
            if (this.currentStep === 0) {
                // И кол-во этапов создания больше 1
                if (this.selectedTemplate.steps.length > 1) {
                    // То будет отображаться только кнопка вперед
                    return ControlsType.NEXT_ONLY;
                    // Если этап единственный
                } else {
                    // То будет отображаться только завершающая кнопка
                    return ControlsType.FIN_ONLY;
                }
            } else { // Если текущий этап не первый
                // И текущий этап последний
                if (this.selectedTemplate.steps.length - 1 === this.currentStep) {
                    // То будут отображаться кнопки назад и завершающая
                    return ControlsType.PREV_FIN;
                } else {
                    // Иначе будет отображаться кнопки назад и переход на следующий этап
                    return ControlsType.BOTH;
                }
            }
        }
        // Иначе вернем пустое значение
        return ControlsType.NONE;
    }

    // Создание задачи
    createTask() {
        // Если this.taskCreationBody равно null, прерываем создание
        if (!this.taskCreationBody) {
            this.toast.add({severity: 'danger', summary: 'Ошибка', detail: 'Не выбран шаблон для создания задачи'});
            return;
        }
        // Устанавливаем статус создания задачи
        this.isCreatedTask = true;
        // Отправляем запрос на сервер для создания задачи
        this.api.createTask(this.taskCreationBody).subscribe({
            next: () => {
                // Устанавливаем статус создания задачи
                this.isCreatedTask = false;
                // Закрываем окно создания задачи
                window.close();
            },
            error: () => {
                // Устанавливаем статус создания задачи
                this.isCreatedTask = false;
            }
        });
    }
}
