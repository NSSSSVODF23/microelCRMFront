import {Component, OnInit, ViewChild} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {MenuItem} from "primeng/api";
import {Menu} from "primeng/menu";
import {ApiService} from 'src/app/services/api.service';
import {v4} from "uuid";
import {
    Address,
    DefaultObserverTargetType,
    ModelItem,
    StepItem,
    Task,
    Wireframe,
    WireframeFieldType,
    WireframeType
} from "../../transport-interfaces";
import {map} from "rxjs";
import {CustomNavigationService} from "../../services/custom-navigation.service";

const defaultStep: StepItem = {
    id: 0, name: 'Название этапа', fields: []
}

@Component({
    selector: 'app-wireframe-constructor-page',
    templateUrl: './wireframe-constructor-page.component.html',
    styleUrls: ['./wireframe-constructor-page.component.scss']
})
export class WireframeConstructorPageComponent implements OnInit {

    @ViewChild('stepsContextMenuElem') stepsContextMenuElem?: Menu;

    activeStepIndex: number = 0;

    stepsArray: MenuItem[] = [{
        label: 'Название этапа', command: () => this.selectStep(0)
    }];
    wireframeFieldsList: any[] = [];
    stepsContextMenu: MenuItem[] = [];
    chooseFieldTypeDialogVisible = false;
    fieldTypeOptions = [{label: 'Логическое значение', value: WireframeFieldType.BOOLEAN}, {
        label: 'Малый текст', value: WireframeFieldType.SMALL_TEXT
    }, {label: 'Текст', value: WireframeFieldType.LARGE_TEXT}, {
        label: 'Целочисленное', value: WireframeFieldType.INTEGER
    }, {label: 'Не целочисленное', value: WireframeFieldType.FLOAT}, {
        label: 'Адрес', value: WireframeFieldType.ADDRESS
    }, {label: 'Логин', value: WireframeFieldType.LOGIN}, {
        label: 'Рекламный источник', value: WireframeFieldType.AD_SOURCE
    }, {label: 'Тип принятия заявки', value: WireframeFieldType.REQUEST_INITIATOR}, {
        label: 'IP Адрес', value: WireframeFieldType.IP
    }, {label: 'Абонентское оборудование', value: WireframeFieldType.EQUIPMENTS}, {
        label: 'Подключаемые услуги', value: WireframeFieldType.CONNECTION_SERVICES
    }, {label: 'Телефонные номера', value: WireframeFieldType.PHONE_ARRAY}]
    createFieldType = WireframeFieldType.SMALL_TEXT;
    editingId?: number;
    constructStage = "FIELDS";
    // constructStage = "STAGES";
    listItemViewOptions: any = [{label: "Простой", value: "SIMPLE"}, {
        label: "Составной", value: "COMPOSITE"
    }, {label: "Подробный", value: "DETAILED"},];
    // stages = [{label: "Начальный", stageId: v4(), orderIndex: 0}]

    responsible$ = this.api.getResponsible().pipe(map(resp => {
        return resp.map((item: any) => {
            if (item.login) {
                return {
                    label: item.login,
                    value: {targetId: item.login.toString(), targetType: DefaultObserverTargetType.EMPLOYEE}
                }
            } else if (item.departmentId) {
                return {
                    label: item.name,
                    value: {targetId: item.departmentId.toString(), targetType: DefaultObserverTargetType.DEPARTMENT}
                }
            } else {
                return {}
            }
        })
    }));

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
    }

    createField(createFieldType: WireframeFieldType) {
        const id = v4();
        const step: StepItem | undefined = this.wireframe.steps.find(s => s.id === this.activeStepIndex)
        if (step) {
            step.fields.push({
                name: 'Имя поля', id, type: createFieldType
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

    createStep() {
        const lastStep = this.stepsArray.length;
        this.stepsArray.push({
            label: 'Название этапа', command: (event: any) => this.openStepContextMenu(lastStep, event.originalEvent)
        })
        this.stepsArray = [...this.stepsArray];
        this.wireframe.steps.push({
            name: 'Название этапа', fields: [], id: lastStep
        })
        this.selectStep(lastStep);
    }

    //swap index fields in array
    // swapFields(currentIndex: number, targetIndex: number) {
    //     //get wireframe by activeStepIndex
    //     const wireframe = this.wireframe.steps[this.activeStepIndex];
    //     //swap fields
    //     wireframe.fields.splice(targetIndex, 0, wireframe.fields.splice(currentIndex, 1));

    selectStep(id: number) {
        this.activeStepIndex = id;
    }

    removeStep(id: number) {
        if (this.activeStepIndex === id) this.selectStep(0);
        this.stepsArray.splice(id, 1)
        this.stepsArray = this.stepsArray.map((s, i) => {
            return {
                label: s.label,
                command: (i === 0 ? (() => this.selectStep(i)) : ((event) => this.openStepContextMenu(i, event.originalEvent)))
            }
        })
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
        this.api.createWireframe(this.wireframe).subscribe(()=>{
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
        this.api.updateWireframe(this.wireframe).subscribe(()=>{
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
            console.log(step.fields, event)
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
        return {taskId: 0, modelWireframe: this.wireframe, listItemFields:[]};
    }

    createStage() {
        this.wireframe.stages = [...this.wireframe.stages ?? [], {
            label: 'Новая стадия',
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

    private viewTestFieldsFromWireframe(wireframe: Wireframe) {
        const phoneData = {'test': '8 (999) 123-45-67', 'test2': '8 (898) 555-35-35'};
        const stringData = 'Принимая во внимание показатели успешности, экономическая повестка сегодняшнего дня выявляет срочную потребность приоретизации разума над эмоциями. Но глубокий уровень погружения предполагает независимые способы реализации укрепления моральных ценностей. Принимая во внимание показатели успешности, перспективное планирование не оставляет шанса для системы обучения кадров, соответствующей насущным потребностям. С другой стороны, консультация с широким активом способствует подготовке и реализации распределения внутренних резервов и ресурсов.';
        const integerData = 23;
        const floatData = 325.56;
        const addressData: Address = {
            city: {
                name: 'Волгодонск',
            },
            district: {
                name: 'В-8',
            },
            street: {
                name: 'К.Маркса',
            },
            houseNum: 44,
            apartmentNum: 46,
            entrance: 2,
            floor: 5
        }
        const booleanData = true;
        const timestampData = "1995-09-01T17:30:00";

        const modelItems: ModelItem[] = [];
        wireframe.steps.forEach((step => {
            step.fields.forEach(field => {
                if (typeof field.orderPosition === 'number') {
                    modelItems.push({
                        name: field.name,
                        id: field.id,
                        wireframeFieldType: field.type,
                        modelItemId: 0,
                        phoneData,
                        stringData,
                        integerData,
                        floatData,
                        addressData,
                        booleanData,
                        timestampData
                    })
                }
            })
        }))
        return modelItems;
    }
}
