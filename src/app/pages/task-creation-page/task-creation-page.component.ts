import {Component, OnDestroy, OnInit} from '@angular/core';
import {ApiService} from "../../services/api.service";
import {fade, flow, swipeChild} from "../../animations";
import {
    DefaultObservers,
    FieldItem,
    TaskCreationBody, TaskStage,
    TaskTag, TaskTypeDirectory,
    Wireframe
} from "../../types/transport-interfaces";
import {ActivatedRoute} from "@angular/router";
import {FormArray, FormControl, FormGroup} from "@angular/forms";
import {FormToModelItemConverter, SubscriptionsHolder} from "../../util";
import {PersonalityService} from "../../services/personality.service";
import {CustomValidators} from "../../custom-validators";
import {MessageService} from "primeng/api";
import {TaskCreationMode, TaskCreatorService} from "../../services/task-creator.service";
import {filter, fromEvent, Subject, switchMap} from "rxjs";

enum ControlsType {
    NEXT_ONLY = "NEXT_ONLY", BOTH = "BOTH", PREV_FIN = "PREV_FIN", FIN_ONLY = "FIN_ONLY", NONE = "NONE"
}

@Component({
    templateUrl: './task-creation-page.component.html',
    styleUrls: ['./task-creation-page.component.scss'],
    animations: [fade, flow, swipeChild]
})
export class TaskCreationPageComponent implements OnInit, OnDestroy {

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

    openMode: TaskCreationMode = "standard";

    subscriptions = new SubscriptionsHolder();
    defaultValues: any;
    initialObservers: DefaultObservers[] = [];
    initialTags: TaskTag[] = [];
    initialComment?: string;

    types: TaskStage[] = [];
    type?: string;

    directories: TaskTypeDirectory[] = [];
    directory?: number;

    isDuplicateInOldTracker = true;

    currentFieldFocus?: number;

    enterPressed$ = fromEvent(document.body, 'keydown')
        .pipe(
            filter((e:any) => e.key === 'Tab'),
            filter(() => this.controlsType() === ControlsType.NEXT_ONLY || this.controlsType() === ControlsType.BOTH),
            filter(() => this.isValidCurrentStep),
            filter(() => this.currentStepFields.length-1 === this.currentFieldFocus)
        )

    constructor(readonly api: ApiService, readonly route: ActivatedRoute, readonly personality: PersonalityService, readonly toast: MessageService, private taskCreation: TaskCreatorService) {
        document.body.classList.add("whited");
    }

    // Выбранный шаблон для создания задачи
    private _selectedTemplate: Wireframe | null = null;

    get selectedTemplate(): Wireframe | null {
        return this._selectedTemplate;
    }

    set selectedTemplate(wireframe: Wireframe | null) {
        this._selectedTemplate = wireframe;
        if(wireframe?.stages){
            this.types = wireframe.stages.sort((a, b)=>a.orderIndex-b.orderIndex) ?? [];
            this.type = this.types[0].stageId;
            this.directories = this.types[0].directories ? this.types[0].directories : [];
            this.directory = this.directories[0]?.taskTypeDirectoryId;
            this.isDuplicateInOldTracker = (!!this.types[0].oldTrackerBind && this.isUserHasOldTrackerCredentials);
        }else{
            this.types = [];
            this.type = undefined;
            this.directories = [];
            this.directory = undefined;
            this.isDuplicateInOldTracker = false;
        }
    }

    get nextStepName(){
        return this.selectedTemplate?.steps[this.currentStep+1]?.name;
    }

    get prevStepName(){
        return this.selectedTemplate?.steps[this.currentStep-1]?.name;
    }

    changeTaskType(type: string){
        if(!type) this.isDuplicateInOldTracker = false;
        const currentStage = this.types.find(t=>t.stageId===type);
        if(currentStage) {
            this.isDuplicateInOldTracker = (!!currentStage.oldTrackerBind && this.isUserHasOldTrackerCredentials);
            this.directories = currentStage.directories;
            return;
        }
        this.directories = [];
        this.isDuplicateInOldTracker = false;
    }

    get isUserHasOldTrackerCredentials(){
        const credentials = this.personality.me?.oldTrackerCredentials;
        return (!!credentials && !!credentials.username && !!credentials.password);
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
            fields: FormToModelItemConverter.convert(rawValues, this.selectedTemplate),
            initialComment: this.initialComment,
            tags: this.initialTags,
            observers: this.initialObservers,
            type: this.type,
            directory: this.directory,
            isDuplicateInOldTracker: this.isDuplicateInOldTracker,
        };
    }

    ngOnInit(): void {
        this.subscriptions.addSubscription('nextStep', this.enterPressed$.subscribe(()=>this.changeCreationStep(1)));
        window.addEventListener('message', (event) => {
            const data = event.data;
            this.openMode = data.mode;
            switch (data.mode) {
                case "standard":
                    break;
                case "parent":
                    this.parentId = data.dependencyIdentifier;
                    break;
                case "child":
                    this.childId = data.dependencyIdentifier;
                    break;
                case "billing":
                    if(data.wireframeId) {
                        this.defaultValues = data.billingInfo;
                        this.api.getWireframe(data.wireframeId).subscribe(this.openBillingCreationWindowHandle)
                    }else {
                        window.close()
                    }
                    break;
                }
        }, false);
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribeAll();
    }

    openBillingCreationWindowHandle = {
        next: (wireframe: Wireframe) => {
            this.selectedTemplate = wireframe;
            this.selectTemplateForTask();
        },
        error: () => {
            window.close()
        }
    }

    // Выбор шаблона для создания задачи
    selectTemplateForTask() {
        if (!this.selectedTemplate) return;
        this.isTemplateSelected = true;

        this.initialObservers = this.selectedTemplate.defaultObservers ?? [];

        this.taskCreationForm = new FormArray(
            this.selectedTemplate.steps.map(step => {
                return new FormGroup(
                step.fields.reduce(
                    (prev, field) => {
                        let defaultValue = null;
                        if(this.defaultValues){
                            switch (field.name.toLowerCase()) {
                                case "логин": defaultValue = this.defaultValues.login; break;
                                case "адрес": defaultValue = this.defaultValues.address; break;
                            }
                        }
                        return {...prev, [field.id]: new FormControl(defaultValue, CustomValidators.taskInput(field.type, field.variation))};
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
        if(!this.isValidCurrentStep && shift > 0) {
            this.currentStepForm.markAllAsTouched();
            return;
        }
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

    get isCurrentTypeHasBind(){
        if(!this.type) return false;
        const currentStage = this.types.find(t=>t.stageId===this.type);
        if(currentStage) {
            return !!currentStage.oldTrackerBind;
        }
        return false;
    };

    // Создание задачи
    createTask() {
        // Если this.taskCreationBody равно null, прерываем создание
        if (!this.taskCreationBody) {
            this.toast.add({severity: 'danger', summary: 'Ошибка', detail: 'Не выбран шаблон для создания задачи'});
            return;
        }
        if(!this.taskCreationForm.valid){
            this.taskCreationForm.markAllAsTouched();
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

    createTaskAndClose() {
        // Если this.taskCreationBody равно null, прерываем создание
        if (!this.taskCreationBody) {
            this.toast.add({severity: 'danger', summary: 'Ошибка', detail: 'Не выбран шаблон для создания задачи'});
            return;
        }
        if(!this.taskCreationForm.valid){
            this.taskCreationForm.markAllAsTouched();
            return;
        }
        // Устанавливаем статус создания задачи
        this.isCreatedTask = true;
        // Отправляем запрос на сервер для создания задачи
        this.api.createTask(this.taskCreationBody).pipe(switchMap((task)=>this.api.closeTask(task.taskId))).subscribe({
            next: (task) => {
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
