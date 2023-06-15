import {Injectable} from '@angular/core';
import {FieldItem, LoadingState, Page, Task, Wireframe} from "../transport-interfaces";
import {ApiService} from "./api.service";
import {RealTimeUpdateService} from "./real-time-update.service";
import {debounceTime, distinctUntilChanged, filter, map, Observer, switchMap} from "rxjs";
import {FormControl, FormGroup} from "@angular/forms";


@Injectable({
    providedIn: 'root'
})
export class TasksPageCacheService {

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
        status: new FormControl(['ACTIVE', 'PROCESSING']),
        template: new FormControl([]),
        searchPhrase: new FormControl(null),
        tags: new FormControl([]),
    })

    // Флаг внутренней инициализации смены страницы для предотвращения зацикливания события
    isPageChanging = false;

    // Форма поиска по полям из шаблона задачи, устанавливается из компонента страницы
    templateFilterForm: FormGroup = new FormGroup<any>({
        author: new FormControl(null),
        dateOfCreation: new FormControl(null),
    });
    // Массив доступных фильтров полученный из шаблона
    templateFilterFields: FieldItem[] = [];
    // Строка для контекстного поиска
    contextSearchString = '';
    // Состояние загрузки задач
    loadingState: LoadingState = LoadingState.LOADING;
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
            filter(value => value.template.length === 1),
            distinctUntilChanged(
                (prev, curr) =>
                    curr.template[0] === prev.template[0]
            ),
            switchMap(values => this.api.getWireframe(values.template[0])),
            map(wireframe => {
                if (!wireframe) return [];
                return wireframe.steps.reduce<FieldItem[]>((prev, step) => [...prev, ...step.fields], [])
            })
        ).subscribe(fieldItems => {
            this.templateFilterForm = new FormGroup({
                author: this.templateFilterForm.controls['author'],
                dateOfCreation: this.templateFilterForm.controls['dateOfCreation'],
                ...fieldItems.reduce((prev, fieldItem) => {
                    return {...prev, [fieldItem.id]: new FormControl(null)};
                }, {})
            });
            this.templateFilterFields = fieldItems;
        });

        this.filterForm.valueChanges.pipe(
            debounceTime(500),
            distinctUntilChanged(),
        ).subscribe(this.filtersApply.bind(this))
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
        this.loadingState = LoadingState.LOADING;


        const formValues = this.templateFilterForm.getRawValue();
        const templateFilter = JSON.stringify(this.templateFilterFields.filter(f => formValues[f.id]).map(field => {
            const value = formValues[field.id];
            return {
                id: field.id,
                wireframeFieldType: field.type,
                value
            }
        }));


        // Запрашиваем данные по задачам из базы данных
        this.api.getPageOfTasks(page, {
            ...this.filterForm.getRawValue(),
            author: this.templateFilterForm.value['author'],
            dateOfCreation: this.templateFilterForm.value['dateOfCreation'],
            templateFilter
        }).subscribe(this.observerHandlers());
        this.filterForm.disable({emitEvent: false});
        this.templateFilterForm.disable({emitEvent: false});
    }

    // Возвращает объект с обработчиками загрузки очередной страницы задач
    private observerHandlers(): Partial<Observer<Page<Task>>> {
        return {
            next: (value) => {
                this.totalTaskItems = value.totalElements;
                if (this.totalTaskItems === 0) this.loadingState = LoadingState.EMPTY;
                else this.loadingState = LoadingState.READY;
                this.taskItems = value.content;
                this.changePage(this.pageNumber);
                this.filterForm.enable({emitEvent: false});
                this.templateFilterForm.enable({emitEvent: false});
            },
            error: () => {
                this.loadingState = LoadingState.ERROR;
                this.filterForm.enable({emitEvent: false});
                this.templateFilterForm.enable({emitEvent: false});
            }
        }
    }
}
