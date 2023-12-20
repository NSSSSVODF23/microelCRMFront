import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {MenuItem} from "primeng/api";
import {Menu} from "primeng/menu";
import {ApiService} from 'src/app/services/api.service';
import {v4} from "uuid";
import {
    FieldDataBind,
    FieldItem,
    StepItem,
    Task, TaskClassOT,
    TaskStage,
    Wireframe,
    WireframeFieldType,
    WireframeType
} from "../../transport-interfaces";
import {CustomNavigationService} from "../../services/custom-navigation.service";
import {AbstractControl, FormArray, FormControl, FormGroup, Validators} from "@angular/forms";
import {delay, delayWhen, find, map, mergeMap, shareReplay, startWith, switchMap, tap, combineLatest, of} from "rxjs";
import {SubscriptionsHolder} from "../../util";

const defaultStep: StepItem = {
    id: 0, name: 'Название этапа', fields: []
}

type FieldBindType = 'AddressFieldDataBind' | 'AdSourceFieldDataBind' | 'ConnectionTypeFieldDataBind'
    | 'DateFieldDataBind' | 'DateTimeFieldDataBind' | 'DefaultFieldDataBind' | 'InstallersHardAssignFieldDataBind'
    | 'InstallersSimpleAssignFieldDataBind' | 'TextFieldDataBind' | 'FullNameFieldDataBind' | 'PassportDetailsFieldDataBind';

@Component({
    selector: 'app-wireframe-constructor-page',
    templateUrl: './wireframe-constructor-page.component.html',
    styleUrls: ['./wireframe-constructor-page.component.scss']
})
export class WireframeConstructorPageComponent implements OnInit, OnDestroy {

    @ViewChild('stepsContextMenuElem') stepsContextMenuElem?: Menu;

    activeStepIndex: number = 0;

    stepsArray: MenuItem[] = [{
        label: 'Название этапа',
        command: () => this.selectStep(0),

    }];
    wireframeFieldsList: any[] = [];
    stepsContextMenu: MenuItem[] = [];
    chooseFieldTypeDialogVisible = false;
    fieldTypeOptions = this.api.getWireframeFieldTypesList();
    createFieldType = WireframeFieldType.SMALL_TEXT;
    editingId?: number;
    constructStage = "FIELDS";
    // constructStage = "STAGES";
    listItemViewOptions: any = [{label: "Простой", value: "SIMPLE"}, {
        label: "Составной", value: "COMPOSITE"
    }, {label: "Подробный", value: "DETAILED"},];

    // stages = [{label: "Начальный", stageId: v4(), orderIndex: 0}]
    draggedField?: FieldItem;
    stageHoverTarget: number | null = null;

    oldTrackerIntegrationDialogVisible = false;
    oldTrackerTaskClasses$ = this.api.getOldTrackerClasses();
    oldTrackerIntegrationForm = new FormGroup({
        classId: new FormControl<number | null>(null, [Validators.required]),
        initialStageId: new FormControl<number | null>(null, [Validators.required]),
        processingStageId: new FormControl<number | null>(null, [Validators.required]),
        manualCloseStageId: new FormControl<number | null>(null, [Validators.required]),
        autoCloseStageId: new FormControl<number | null>(null, [Validators.required]),
        fieldDataBinds: new FormArray<FormGroup>([]),
    })

    selectedTaskClass$ = combineLatest([this.oldTrackerIntegrationForm.controls.classId.valueChanges, this.oldTrackerTaskClasses$]).pipe(
            tap(console.log),
            map(([classId, classList]:[number, TaskClassOT[]])=>classList?.find(cl=>cl.id === classId) ?? null),
            shareReplay(1)
        );

    selectedClassFields$ = this.selectedTaskClass$.pipe(map(cls=>[{label: "Нет", value: null},...(cls?.fields.map(f=>{return {label: f.name, value: f.id}})??[])]), shareReplay(1));

    appendBindToIntegrationDialogVisible = false;
    selectedDataBind?: ()=>FormGroup;
    dataBindFieldOptions = [
        {
            label: 'Простой текст',
            value: this.simpleTextFieldFormGroup
        },
        {
            label: 'ФИО',
            value: this.fullNameFieldFormGroup
        },
        {
            label: 'Адрес',
            value: this.addressFieldFormGroup
        },
        {
            label: 'Рекламный источник',
            value: this.adSourceFieldFormGroup
        },
        {
            label: 'Тип подключения',
            value: this.connectionTypeFieldFormGroup
        },
        {
            label: 'Дата',
            value: this.dateFieldFormGroup
        },
        {
            label: 'Дата и время',
            value: this.dateTimeFieldFormGroup
        },
        {
            label: 'Паспортные данные',
            value: this.passportFieldFormGroup
        }
    ]
    selectedStageForIntegration?: TaskStage;

    simpleTextFieldFormGroup(){
        return new FormGroup({
            type: new FormControl<FieldBindType>('TextFieldDataBind'),
            fieldDataBindId: new FormControl<null | number>(null),
            fieldItemId: new FormControl<null | string>(null, [Validators.required]),
            textFieldId: new FormControl<null | number>(null, [Validators.required]),
        })
    }

    fullNameFieldFormGroup(){
        return new FormGroup({
            type: new FormControl<FieldBindType>('FullNameFieldDataBind'),
            fieldDataBindId: new FormControl<null | number>(null),
            fieldItemId: new FormControl<null | string>(null, [Validators.required]),
            lastNameFieldId: new FormControl<null | number>(null, [Validators.required]),
            firstNameFieldId: new FormControl<null | number>(null, [Validators.required]),
            patronymicFieldId: new FormControl<null | number>(null, [Validators.required]),
        })
    }

    addressFieldFormGroup(){
        return new FormGroup({
            type: new FormControl<FieldBindType>('AddressFieldDataBind'),
            fieldDataBindId: new FormControl<null | number>(null),
            fieldItemId: new FormControl<null | string>(null, [Validators.required]),
            streetFieldId: new FormControl<null | number>(null, [Validators.required]),
            houseFieldId: new FormControl<null | number>(null),
            apartmentFieldId: new FormControl<null | number>(null),
            entranceFieldId: new FormControl<null | number>(null),
            floorFieldId: new FormControl<null | number>(null),
            backupFieldId: new FormControl<null | number>(null),
        })
    }

    adSourceFieldFormGroup(){
        return new FormGroup({
            type: new FormControl<FieldBindType>('AdSourceFieldDataBind'),
            fieldDataBindId: new FormControl<null | number>(null),
            fieldItemId: new FormControl<null | string>(null, [Validators.required]),
            adSourceFieldId: new FormControl<null | number>(null, [Validators.required]),
        })
    }

    connectionTypeFieldFormGroup(){
        return new FormGroup({
            type: new FormControl<FieldBindType>('ConnectionTypeFieldDataBind'),
            fieldDataBindId: new FormControl<null | number>(null),
            fieldItemId: new FormControl<null | string>(null, [Validators.required]),
            connectionServicesInnerFieldId: new FormControl<null | number>(null, [Validators.required]),
            ctFieldDataBindId: new FormControl<null | number>(null, [Validators.required]),
        })
    }

    dateFieldFormGroup(){
        return new FormGroup({
            type: new FormControl<FieldBindType>('DateFieldDataBind'),
            fieldDataBindId: new FormControl<null | number>(null),
            fieldItemId: new FormControl<null | string>(null, [Validators.required]),
            dateFieldDataBind: new FormControl<null | number>(null, [Validators.required]),
        })
    }

    dateTimeFieldFormGroup(){
        return new FormGroup({
            type: new FormControl<FieldBindType>('DateTimeFieldDataBind'),
            fieldDataBindId: new FormControl<null | number>(null),
            fieldItemId: new FormControl<null | string>(null, [Validators.required]),
            dateTimeFieldDataBind: new FormControl<null | number>(null, [Validators.required]),
        })
    }

    passportFieldFormGroup(){
        return new FormGroup({
            type: new FormControl<FieldBindType>('PassportDetailsFieldDataBind'),
            fieldDataBindId: new FormControl<null | number>(null),
            fieldItemId: new FormControl<null | string>(null, [Validators.required]),
            passportSeriesFieldId: new FormControl<null | number>(null),
            passportNumberFieldId: new FormControl<null | number>(null),
            passportIssuedByFieldId: new FormControl<null | number>(null),
            passportIssuedDateFieldId: new FormControl<null | number>(null),
            registrationAddressFieldId: new FormControl<null | number>(null),
        })
    }

    documentDialogVisible = false;
    documentDialogMode: 'new' | 'edit' = 'new';
    get documentDialogHeader(){
        return this.documentDialogMode === 'new' ? 'Добавление документа' : 'Редактирование документа';
    }
    documentTypesOptions$ = this.api.getDocumentTemplateTypes().pipe(shareReplay(1));
    documentDialogForm = new FormGroup({
        temporalId: new FormControl<string | null>(null),
        documentTemplateId: new FormControl<number | null>(null),
        type: new FormControl<string | null>(null, [Validators.required]),
        name: new FormControl(""),
        loginFieldId: new FormControl<string | null>(null),
        fullNameFieldId: new FormControl<string | null>(null),
        dateOfBirthFieldId: new FormControl<string | null>(null),
        regionOfBirthFieldId: new FormControl<string | null>(null),
        cityOfBirthFieldId: new FormControl<string | null>(null),
        passportDetailsFieldId: new FormControl<string | null>(null),
        addressFieldId: new FormControl<string | null>(null),
        phoneFieldId: new FormControl<string | null>(null),
        passwordFieldId: new FormControl<string | null>(null),
        tariffFieldId: new FormControl<string | null>(null),
    })

    subscriptions = new SubscriptionsHolder();

    constructor(readonly api: ApiService, readonly route: ActivatedRoute, readonly nav: CustomNavigationService) {
    }

    _wireframe: Wireframe = {
        wireframeId: 0,
        created: "",
        deleted: false,
        name: '',
        description: '',
        creator: {login: 'admin'},
        wireframeType: WireframeType.MODEL,
        steps: [defaultStep],
        defaultObservers: [],
        stages: [{label: "Начальный", stageId: v4(), orderIndex: 0}],
        listViewType: 'SIMPLE'
    }

    get wireframe() {
        return this._wireframe;
    }

    set wireframe(value: Wireframe) {
        this._wireframe = value;
        this.wireframeFieldsList = this.fieldsLabelsList();
    }

    ngOnInit(): void {
        this.route.queryParams.subscribe(params => {
            //if it has editing id
            if (params['editingId']) {
                this.editingId = params['editingId'];
                this.api.getWireframe(params['editingId']).subscribe((wireframe: any) => {
                    this.wireframe = wireframe;
                    this.fillingSteps(wireframe.steps);
                    this.wireframe.stages?.sort((a, b) => a.orderIndex - b.orderIndex);
                    this.wireframe = this.wireframe;
                });
            }
        })
        this.subscriptions.addSubscription('docNameUpd', this.documentDialogForm.controls.type.valueChanges
            .pipe(
                switchMap(value => this.documentTypesOptions$.pipe(
                    map(opt=>opt.find(o=>o.value === value)?.label ?? ""))
                )
            ).subscribe(label=>this.documentDialogForm.controls.name.setValue(label))
        )
    }

    ngOnDestroy(): void{
        this.subscriptions.unsubscribeAll();
    }

    createDocumentTemplate(){
        if(this.documentDialogForm.valid) {
            if (!this.wireframe.documentTemplates) this.wireframe.documentTemplates = [];
            this.wireframe.documentTemplates.push(this.documentDialogForm.value);
            this.wireframe.documentTemplates = [...this.wireframe.documentTemplates];
            this.documentDialogVisible = false;
        }
    }

    editDocumentTemplate(){
        if(this.documentDialogForm.valid && this.wireframe.documentTemplates) {
            const templateIndex = this.wireframe.documentTemplates.findIndex(item=>item.temporalId === this.documentDialogForm.value.temporalId);
            if(templateIndex>-1){
                this.wireframe.documentTemplates[templateIndex] = this.documentDialogForm.value;
                this.wireframe.documentTemplates = [...this.wireframe.documentTemplates];
            }
            this.documentDialogVisible = false;
        }
    }

    deleteDocumentTemplate(index:number){
        this.wireframe.documentTemplates?.splice(index,1);
    }

    createField(createFieldType: WireframeFieldType) {
        const id = v4();
        const step: StepItem | undefined = this.wireframe.steps.find(s => s.id === this.activeStepIndex)
        if (step) {
            step.fields.push({
                name: 'Имя поля', id, type: createFieldType, variation: 'MANDATORY', displayType: 'LIST_AND_TELEGRAM'
            })
        } else {
            console.error("Этап для добавления поля не найден")
        }
    }

    deleteField(id: string) {
        const step: StepItem | undefined = this.wireframe.steps.find(s => s.id === this.activeStepIndex)
        if (step) {
            step.fields = step.fields.filter(f => f.id !== id);
        }
    }
    //swap index fields in array
    // swapFields(currentIndex: number, targetIndex: number) {
    //     //get wireframe by activeStepIndex
    //     const wireframe = this.wireframe.steps[this.activeStepIndex];
    //     //swap fields

    //     wireframe.fields.splice(targetIndex, 0, wireframe.fields.splice(currentIndex, 1));

    createStep() {
        const lastStep = this.stepsArray.length;
        this.stepsArray.push({
            label: 'Название этапа', command: (event: any) => this.openStepContextMenu(lastStep, event.originalEvent)
        })
        this.wireframe.steps.push({
            name: 'Название этапа', fields: [], id: lastStep
        })
        this.selectStep(lastStep);
    }

    selectStep(id: number) {
        this.activeStepIndex = id;
    }

    removeStep(id: number) {
        if (this.activeStepIndex >= id) this.selectStep(this.activeStepIndex-1);
        this.stepsArray.splice(id, 1)
        // this.stepsArray = this.stepsArray.map((s, i) => {
        //     return {
        //         label: s.label,
        //         command: (i === 0 ? (() => this.selectStep(i)) : ((event) => this.openStepContextMenu(i, event.originalEvent)))
        //     }
        // })
        this.wireframe.steps.splice(id, 1)
        this.wireframe.steps = this.wireframe.steps.map((s, i) => {
            s.id = i;
            return s;
        })
    }

    openStepContextMenu(id: number, event: any) {
        this.stepsContextMenu = [{label: 'Выбрать', command: this.selectStep.bind(this, id)}, {
            label: 'Удалить', command: this.removeStep.bind(this, id)
        },]
        if (this.stepsContextMenuElem) this.stepsContextMenuElem.toggle(event);
    }

    stepsPanelCaptionUpdate($event: any) {
        this.stepsArray[this.activeStepIndex].label = $event;
        this.stepsArray = [...this.stepsArray];
    }

    fillingEmptyStepName() {
        if (this.wireframe.steps[this.activeStepIndex] && this.wireframe.steps[this.activeStepIndex].name === '') {
            // Then set default step name
            this.wireframe.steps[this.activeStepIndex].name = "Название этапа";
            this.stepsArray[this.activeStepIndex].label = "Название этапа";
            this.stepsArray = [...this.stepsArray];
        }
    }

    createWireframe() {
        this.api.createWireframe(this.wireframe).subscribe(() => {
            this.nav.backOrDefault(["/"])
        });
    }

    fillingSteps(stepsArray: StepItem[]) {
        this.stepsArray = stepsArray.map((step, i) => {
            return {
                label: step.name,
                command: (i === 0 ? (() => this.selectStep(step.id)) : ((event) => this.openStepContextMenu(step.id, event.originalEvent))),
            }
        });
    }

    updateWireframe() {
        this.api.updateWireframe(this.wireframe.wireframeId, this.wireframe).subscribe(() => {
            this.nav.backOrDefault(["/"])
        });
    }

    fieldsLabelsList() {
        const fields: any = [];
        this.wireframe.steps.forEach(step => {
            step.fields.forEach(field => {
                fields.push({
                    label: field.name,
                    id: field.id,
                    listViewIndex: field.listViewIndex,
                    orderPosition: field.orderPosition
                })
            })
        })
        fields.sort((a: any, b: any) => a.orderPosition - b.orderPosition);
        return fields;
    }

    selectFieldToView(event: { id: string, index: number }) {
        this._wireframe.steps.forEach((step) => {
            step.fields.forEach(field => {
                if (field.id === event.id) {
                    field.listViewIndex = event.index;
                } else if (field.listViewIndex === event.index) {
                    field.listViewIndex = undefined;
                }
            });
        })
    }

    reorderFields() {
        this.wireframeFieldsList.forEach((orderedField, i) => {
            this.wireframe.steps.forEach((step) => {
                step.fields.forEach(field => {
                    if (field.id === orderedField.id) field.orderPosition = i;
                })
            })
        })
    }

    changeStagesSettingsStep() {
        this.constructStage = 'STAGES';
        this.wireframe = this.wireframe;
        this.reorderFields();
    }

    changeViewSettingsStep() {
        this.constructStage = 'VIEW';
        // this.wireframe = this.wireframe;
        // this.reorderFields();
    }

    taskItemForView(): Task {
        return {taskId: 0, modelWireframe: this.wireframe, listItemFields: [], allEmployeesObservers: []};
    }

    createStage() {
        this.wireframe.stages = [...this.wireframe.stages ?? [], {
            label: 'Название типа задачи',
            stageId: v4(),
            orderIndex: this.wireframe.stages?.length ?? 0
        }]
    }

    removeStage(id: string) {
        this.wireframe.stages = this.wireframe.stages?.filter((stage) => stage.stageId !== id).map((stage, i) => {
            stage.orderIndex = i;
            return stage
        });
    }

    mouseDown(event: MouseEvent) {
        event.stopPropagation();
    }

    reorderStages() {
        this.wireframe.stages = this.wireframe.stages?.map((stage, i) => {
            stage.orderIndex = i;
            return stage;
        });
    }
    trackByStep = (index: number, step: MenuItem) => (index + (step.label ?? ''));

    dragStart(event: any, field: FieldItem) {
        this.draggedField = field
    }

    drag(event: any, field: FieldItem) {
    }

    dragEnd(event: any, field: FieldItem) {
        this.draggedField = undefined;
    }

    drop(event: any, targetIndex: number, pos: 'up' | 'down') {
        const target: HTMLDivElement = event.target;
        target.classList.remove('border-top-2', 'border-bottom-2', 'border-primary');
        // Move dragged field to target index
        if (this.draggedField) {
            const fields = this.wireframe.steps[this.activeStepIndex].fields;
            const targetFieldIndex = fields.findIndex(f => f === this.draggedField);
            if (targetFieldIndex < targetIndex && pos === 'up') {
                targetIndex--;
            } else if (targetFieldIndex > targetIndex && pos === 'down') {
                targetIndex++;
            }
            fields.splice(targetFieldIndex, 1);
            fields.splice(targetIndex, 0, this.draggedField);
        }
    }

    dragEnter(event: any, targetIndex: number, pos: 'top' | 'bottom') {
        const target: HTMLDivElement = event.target;
        target.classList.add('border-' + pos + '-2', 'border-primary');
    }

    dragLeave(event: any, targetIndex: number, pos: 'top' | 'bottom') {
        const target: HTMLDivElement = event.target;
        target.classList.remove('border-' + pos + '-2', 'border-primary');
    }

    dropToStage(event: any, stageIndex: number) {
        this.stageHoverTarget = null;
        if(stageIndex !== this.activeStepIndex){
            const sourceStep: StepItem | undefined = this.wireframe.steps.find(s => s.id === this.activeStepIndex)
            const targetStep: StepItem | undefined = this.wireframe.steps.find(s => s.id === stageIndex)

            if (sourceStep && targetStep && this.draggedField) {
                sourceStep.fields.splice(sourceStep.fields.findIndex(f=>f===this.draggedField),1);
                targetStep.fields.unshift(this.draggedField);
                this.draggedField = undefined;
            }
        }
    }

    dragEnterStage(event: any, stageIndex: number) {
        if(stageIndex !== this.activeStepIndex)
            this.stageHoverTarget = stageIndex;
    }

    dragLeaveStage(event: any, stageIndex: number) {
        this.stageHoverTarget = null;
    }

    openOldTrackerStageBind(stage: TaskStage) {
        this.oldTrackerIntegrationDialogVisible = true;
        this.selectedStageForIntegration = stage;

        setTimeout(()=> {
            this.oldTrackerIntegrationForm.patchValue({
                classId: stage.oldTrackerBind?.classId ?? null,
                initialStageId: stage.oldTrackerBind?.initialStageId ?? null,
                processingStageId: stage.oldTrackerBind?.processingStageId ?? null,
                manualCloseStageId: stage.oldTrackerBind?.manualCloseStageId ?? null,
                autoCloseStageId: stage.oldTrackerBind?.autoCloseStageId ?? null
            })
            this.oldTrackerIntegrationForm.controls.fieldDataBinds.clear();
            stage.oldTrackerBind?.fieldDataBinds.forEach((bind:any) => this.oldTrackerIntegrationForm.controls.fieldDataBinds.push(new FormGroup<any>({
                type: new FormControl(bind.type),
                fieldDataBindId: new FormControl(bind.fieldDataBindId),
                fieldItemId: new FormControl(bind.fieldItemId),
                streetFieldId: new FormControl(bind.streetFieldId),
                houseFieldId: new FormControl(bind.houseFieldId),
                apartmentFieldId: new FormControl(bind.apartmentFieldId),
                entranceFieldId: new FormControl(bind.entranceFieldId),
                floorFieldId: new FormControl(bind.floorFieldId),
                adSourceFieldId: new FormControl(bind.adSourceFieldId),
                connectionServicesInnerFieldId: new FormControl(bind.connectionServicesInnerFieldId),
                ctFieldDataBind: new FormControl(bind.ctFieldDataBind),
                dateFieldDataBind: new FormControl(bind.dateFieldDataBind),
                dateTimeFieldDataBind: new FormControl(bind.dateTimeFieldDataBind),
                defaultFieldId: new FormControl(bind.defaultFieldId),
                hardAssignTimeFieldId: new FormControl(bind.hardAssignTimeFieldId),
                hardAssignNamesFieldId: new FormControl(bind.hardAssignNamesFieldId),
                simpleAssignFieldId: new FormControl(bind.simpleAssignFieldId),
                textFieldId: new FormControl(bind.textFieldId),
                lastNameFieldId: new FormControl(bind.lastNameFieldId),
                firstNameFieldId: new FormControl(bind.firstNameFieldId),
                patronymicFieldId: new FormControl(bind.patronymicFieldId),
                backupFieldId: new FormControl(bind.backupFieldId),
                passportSeriesFieldId: new FormControl(bind.passportSeriesFieldId),
                passportNumberFieldId: new FormControl(bind.passportNumberFieldId),
                passportIssuedByFieldId: new FormControl(bind.passportIssuedByFieldId),
                passportIssuedDateFieldId: new FormControl(bind.passportIssuedDateFieldId),
                registrationAddressFieldId: new FormControl(bind.registrationAddressFieldId),
            })))
        }, 100)
    }

    appendBindToIntegration() {
        if(this.selectedDataBind) {
            this.oldTrackerIntegrationForm.controls.fieldDataBinds.push(this.selectedDataBind())
            this.appendBindToIntegrationDialogVisible = false;
        }
    }

    openAppendBindToIntegrationDialog() {
        this.appendBindToIntegrationDialogVisible = true;
    }

    saveOldTrackerIntegration() {
        if(this.selectedStageForIntegration) {
            console.log(this.oldTrackerIntegrationForm.value);
            this.selectedStageForIntegration.oldTrackerBind = this.oldTrackerIntegrationForm.value;
        }
    }

    removeBind(fGroup: FormGroup) {
        this.oldTrackerIntegrationForm.controls.fieldDataBinds.removeAt(this.oldTrackerIntegrationForm.controls.fieldDataBinds.controls.indexOf(fGroup));
    }

    openAppendDocumentDialog() {
        this.clearDocumentDialogForm();
        this.documentDialogVisible=true;
        this.documentDialogMode='new';
    }

    openEditDocumentDialog(item:any){
        console.log(item);
        this.clearDocumentDialogForm();
        this.documentDialogVisible=true;
        this.documentDialogMode='edit';
        this.documentDialogForm.patchValue(item)
    }

    clearDocumentDialogForm(){
        this.documentDialogForm.reset({
            temporalId: v4(),
            documentTemplateId: null,
            name: "",
            type: null,
            addressFieldId: null,
            regionOfBirthFieldId: null,
            cityOfBirthFieldId: null,
            dateOfBirthFieldId: null,
            fullNameFieldId: null,
            loginFieldId: null,
            passportDetailsFieldId: null,
            passwordFieldId: null,
            phoneFieldId: null,
            tariffFieldId: null
        })
    }
}
