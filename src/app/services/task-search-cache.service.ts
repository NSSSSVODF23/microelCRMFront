import {Injectable} from '@angular/core';
import {FieldItem, FilterModelItem, ModelItem, Page, Task, TaskStatus, Wireframe} from "../transport-interfaces";
import {ApiService} from "./api.service";
import {SubscriptionsHolder, Utils} from "../util";
import {RealTimeUpdateService} from "./real-time-update.service";
import {distinctUntilChanged, filter, map, Observer, of, switchMap} from "rxjs";
import {FormControl, FormGroup} from "@angular/forms";


@Injectable({
    providedIn: 'root'
})
export class TaskSearchCacheService {

    // Текущая страница
    pageNumber: number = 0;

    // Количество задач загружаемых одновременно
    TASK_PAGE_SIZE = 25;

    // Массив загруженных задач
    taskItems: Task[] = [];
    // Общее количество задач в базе данных
    totalTaskItems: number = 0;

    // Массив существующих шаблонов задач
    templatesOptions: Wireframe[] = [];

    // Форма поиска по основным параметрам задач
    filterForm: FormGroup = new FormGroup({
        template: new FormControl([]),
        status: new FormControl(['ACTIVE', 'CLOSE', 'PROCESSING']),
        author: new FormControl(null),
        dateOfCreation: new FormControl(null),
        tags: new FormControl([]),
    })

    // Флаг внутренней инициализации смены страницы для предотвращения зацикливания события
    isPageChanging = false;

    // Форма поиска по полям из шаблона задачи, устанавливается из компонента страницы
    templateFilterForm: FormGroup = new FormGroup<any>({});
    // Массив доступных фильтров полученный из шаблона
    templateFilterFields: FieldItem[] = [];
    // Строка для контекстного поиска
    contextSearchString = '';
    // Состояние загрузки задач
    taskItemsLoading: boolean = true;
    // Массив идентификаторов исключенных из поиска
    exclusionIds: number[] = [];

    constructor(readonly api: ApiService, readonly rt: RealTimeUpdateService) {
        this.rt.taskCreated().subscribe(this.createTask.bind(this))
        this.rt.taskUpdated().subscribe(this.updateTask.bind(this))
        this.rt.taskDeleted().subscribe(this.deleteTask.bind(this))


        this.api.getWireframesNames().subscribe(templates => {
            this.templatesOptions = templates;
            this.filterForm.patchValue({template: templates.map(v => v.wireframeId)});
        });

        // Загрузка полей для фильтрации задач, если выделен 1 шаблон
        this.filterForm.valueChanges.pipe(
            distinctUntilChanged(
                (prev,curr)=>
                    prev.template.length === curr.template.length
            ),
            switchMap(values=> {
                if(values.template.length === 1)
                    return this.api.getWireframe(values.template[0]);
                else
                    return of(null);
            }),
            map(wireframe =>{
                if(!wireframe) return [];
                return  wireframe.steps.reduce<FieldItem[]>((prev, step)=>[...prev, ...step.fields],[])
            })
        ).subscribe(fieldItems=> {
                this.templateFilterForm = new FormGroup(fieldItems.reduce((prev, fieldItem) => {
                    return {...prev, [fieldItem.id]: new FormControl(null)};
                }, {}));
                this.templateFilterFields = fieldItems;
        });

        this.templateFilterForm.valueChanges.subscribe(value => console.log(`Update filter form ${JSON.stringify(value)}`))
    }

    get templateFiltersForRequest() {
        const formValues = this.templateFilterForm.getRawValue();
        return JSON.stringify(this.templateFilterFields.filter(f => formValues[f.id]).map<FilterModelItem>(field => {
            const value = formValues[field.id];
            return {
                id: field.id,
                wireframeFieldType: field.type,
                value
            }
        }));
    }

    // Ссылка на абстрактную функцию установки текущей страницы в Paginator
    private _setPaginatorPage?: (page: number) => void;

    set setPaginatorPage(value: (page: number) => void) {
        this._setPaginatorPage = value;
    }

    // Осуществляет контекстный поиск по всем полям типа строка в задачах
    contextSearch() {
        setTimeout(() => {
            this.loadPageOfTasks(0);
        })
    }

    gettingFieldIdByIndex(wireframe: Wireframe | undefined, index: number): null | string {
        if (!wireframe) return null;
        for (let step of wireframe.steps) {
            let fieldItem = step.fields.find(field => field.listViewIndex === index);
            if (fieldItem) return fieldItem.id;
        }
        return null;
    }

    gettingFieldValueById(task?: Task, id?: string | null): ModelItem | undefined {
        if (!id || !task) return undefined;
        for (let field of task.fields ?? []) {
            if (field.id === id) return field;
        }
        return undefined;
    }

    // Загружает первую страницу списка задач с примененными фильтрами
    filtersApply() {
        this.loadPageOfTasks(0);
    }

    // Загружает определенную страницу списка задач с примененными фильтрами (для paginator)
    pageChange(event: any) {
        if (this.isPageChanging) return;
        this.pageNumber = event.page;
        this.loadPageOfTasks(event.page);
    }

    // Если это первая загрузка, то загружает первую страницу, если нет загружает последнюю открытую страницу
    loadPage() {
        this.loadPageOfTasks(this.pageNumber);
    }

    // Конвертирует значения кэша в формат для отправки в сервер
    private convertCacheToRequest(values: any) {
        const request: any = {};
        if (this.contextSearchString) request.globalContext = this.contextSearchString;
        if (values.status && values.status.length > 0) request.status = values.status;
        if (values.template && values.template.length > 0) request.template = values.template;
        if (values.author) request.author = values.author;
        if (values.dateOfCreation) request.dateOfCreation = Utils.dateArrayToStringRange(values.dateOfCreation);
        if (values.tags && values.tags.length > 0) request.tags = values.tags.map((tag: any) => tag.taskTagId);
        return request;
    }

    // Добавление задачи в реальном времени
    private createTask(task: Task) {
        // Ищем задачу в массиве taskItems
        let index = this.taskItems.findIndex(t => t.taskId === task.taskId);

        // Если задача не найдена, добавляем её
        if (index < 0 && this.pageNumber === 0) {
            this.taskItems.splice(0, 1, task);
            this.totalTaskItems++;
        }
    }

    // Обновление задачи в реальном времени
    private updateTask(task: Task) {
        // Ищем задачу в массиве taskItems
        let index = this.taskItems.findIndex(t => t.taskId === task.taskId);
        // Если задача найдена, обновляем его
        if (index >= 0) {
            this.taskItems[index] = task;
        }
    }

    // Удаление задачи в реальном времени
    private deleteTask(task: Task) {
        // Ищем задачу в массиве taskItems
        let index = this.taskItems.findIndex(t => t.taskId === task.taskId);
        // Если задача найдена, удаляем её
        if (index >= 0) {
            this.taskItems.splice(index, 1);
        }
    }

    // Метод проверяет наличие ссылки на анонимный метод изменения страницы в Paginator
    private changePage(page: number) {
        this.isPageChanging = true;
        if (this._setPaginatorPage) this._setPaginatorPage(page);
        this.isPageChanging = false;
    }

    // Загружает определенное количество задач из базы данных с определенными фильтрами
    private loadPageOfTasks(page: number): void {

        // Обнуляем страницу paginator если надо
        if (page === 0) this.changePage(0);

        // Устанавливаем статус загрузки задач
        this.taskItemsLoading = true;

        // Запрашиваем данные по задачам из базы данных
        this.api.getPageOfTasks(page, this.TASK_PAGE_SIZE,
            this.convertCacheToRequest(this.filterForm.getRawValue()),
            this.templateFiltersForRequest
        ).subscribe(this.observerHandlers());
    }

    // Возвращает объект с обработчиками загрузки очередной страницы задач
    private observerHandlers(): Partial<Observer<Page<Task>>> {
        return {
            next: (value) => {
                this.totalTaskItems = value.totalElements;
                this.taskItems = value.content;
                this.changePage(this.pageNumber);
            },
            error: () => this.taskItemsLoading = false,
            complete: () => this.taskItemsLoading = false
        }
    }
}
