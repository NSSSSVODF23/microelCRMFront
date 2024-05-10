import {Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {catchError, debounceTime, delay, first, map, Observable, of, share, shareReplay, tap, zip} from "rxjs";
import {
    AcpConf,
    AcpHouse,
    AcpUserBrief,
    Address,
    Attachment,
    BillingConf,
    BillingTotalUserInfo,
    BillingUserItemData,
    Chat,
    ChatMessage,
    City,
    ClientEquipment,
    Comment,
    CommutatorListItem,
    DefaultObservers,
    Department,
    DhcpBinding,
    DhcpLogsRequest,
    DynamicTableCell,
    DynamicTableColumn,
    Employee,
    EmployeeStatus,
    EmployeeWorkLogs,
    FdbItem,
    FieldItem,
    FileData,
    FilesLoadFileEvent,
    FileSuggestion,
    FileSystemItem,
    FilterModelItem,
    House,
    INotification,
    LoadingDirectoryWrapper,
    MessageData,
    ModelItem,
    NCLHistoryWrapper,
    NetworkRemoteControl,
    Olt,
    Ont,
    OntStatusChangeEvent,
    Page,
    PaidAction,
    PaidActionFilter,
    PaidActionForm,
    PaidWork,
    PaidWorkForm,
    PaidWorkGroupForm,
    PhyPhoneInfoForm,
    Position,
    SalaryTable,
    Statistics,
    StreetSuggestion,
    SuperMessage,
    Switch,
    SwitchBaseInfo,
    SwitchEditingPreset,
    SwitchModel,
    SwitchWithAddress,
    TagListItem,
    Task,
    TaskClassOT,
    TaskCreationBody,
    TaskEvent,
    TaskFieldsSnapshot,
    TaskFiltrationConditions,
    TaskJournalSortingTypes,
    TaskStage,
    TaskStatus,
    TaskTag,
    TaskTypeDirectory,
    TelegramConf,
    TelnetConnectionCredentials,
    TokenChain,
    TokenChainWithUserInfo,
    TopologyStreet,
    TreeDragDropEvent,
    TreeElementPosition,
    TypesOfContracts,
    TypesOfContractsForm,
    TypesOfContractsSuggestion,
    UserEvents,
    UserTariff,
    Wireframe,
    WireframeDashboardStatistic,
    OltWorker,
    WorkingDay,
    WorkLog, DateRange, AutoTariff, AutoTariffForm, EmployeeFiltrationForm, NotificationType, WorkCalculationForm
} from "../types/transport-interfaces";
import {MessageService, TreeNode} from "primeng/api";
import {cyrb53, Storage, Utils} from "../util";
import {Duration} from "@fullcalendar/core";
import {AddressCorrecting, OldTracker} from "../types/parsing-interfaces";
import {DhcpBindingFilter} from "../types/service-interfaces";
import EmployeeWorkStatisticsTable = Statistics.EmployeeWorkStatisticsTable;
import EmployeeWorkStatisticsForm = Statistics.EmployeeWorkStatisticsForm;
import {PonForm} from "../pon/scheme/froms";
import {PonData} from "../pon/scheme/elements";
import {TemperatureRange, TemperatureSensor} from "../types/sensors-types";
import {NotificationSettingsForm} from "../types/notification-types";

@Injectable({
    providedIn: 'root'
})
export class ApiService {

    requestCacheMap: { [hash: string]: Observable<any> } = {}
    requestCacheMapTimers: { [hash: string]: any } = {}
    loggedIn = false;

    constructor(readonly client: HttpClient, readonly toast: MessageService) {
    }

    // Результаты запросов на сервер кэшируются по таймауту, чтобы не было доп нагрузки на сервер

    private sendGet<T>(uri: string, query?: any) {
        for (let q in query) {
            if (query[q] === undefined || query[q] === null) {
                delete query[q];
            }
        }
        // Генерируем хэш запроса на основе конечной точки и параметров запроса
        const requestHash = this.generateHash(uri, query);
        // Объявляем результирующий observable
        let observable: Observable<T> | null = null;
        // Если запрос не в кэше, создаем его
        if (!this.requestCacheMap[requestHash]) {
            observable = this.client.get<T>(uri, {params: query})
                .pipe(shareReplay(1), catchError(async (err, caught) => {
                    this.toast.add({severity: 'error', summary: "Ошибка запроса", detail: err.error.message})
                    throw err;
                }));
            this.requestCacheMap[requestHash] = observable;
            // После создания запроса создаем таймер удаляющий его из кэша по таймауту
            setTimeout(() => {
                delete this.requestCacheMap[requestHash];
            }, 30000);
        } else {
            clearTimeout(this.requestCacheMapTimers[requestHash]);
            // Если запрос в кэше, возвращаем его
            observable = this.requestCacheMap[requestHash];
            this.requestCacheMapTimers[requestHash] = this.requestCacheMapTimers[requestHash] = setTimeout(() => {
                delete this.requestCacheMap[requestHash];
            }, 30000);
        }
        return observable;
    }

    // Генерируем хэш запроса по URI и параметрам запроса

    private sendGetSilent<T>(uri: string, query?: any) {
        for (let q in query) {
            if (query[q] === undefined || query[q] === null) {
                delete query[q];
            }
        }
        const requestHash = this.generateHash(uri, query);
        let observable: Observable<T> | null = null;
        if (!this.requestCacheMap[requestHash]) {
            // console.log(uri, query);

            observable = this.client.get<T>(uri, {params: query})
                .pipe(shareReplay(1));
            this.requestCacheMap[requestHash] = observable;
            this.requestCacheMapTimers[requestHash] = setTimeout(() => {
                delete this.requestCacheMap[requestHash];
            }, 30000);
        } else {
            clearTimeout(this.requestCacheMapTimers[requestHash]);
            observable = this.requestCacheMap[requestHash];
            this.requestCacheMapTimers[requestHash] = setTimeout(() => {
                delete this.requestCacheMap[requestHash];
            }, 30000);
        }
        return observable;
    }

    private sendPost<T>(uri: string, body: any) {
        return this.client.post<T>(uri, body)
            .pipe(catchError(async (err, caught) => {
                this.toast.add({severity: 'error', summary: "Ошибка запроса", detail: err.error.message})
                throw err;
            }));
    }

    private sendPatch<T>(uri: string, body: any) {
        return this.client.patch<T>(uri, body)
            .pipe(catchError((err, caught) => {
                this.toast.add({severity: 'error', summary: "Ошибка запроса", detail: err.error.message})
                throw err;
            }));
    }

    private sendDelete(uri: string) {
        return this.client.delete(uri)
            .pipe(catchError(async (err, caught) => {
                this.toast.add({severity: 'error', summary: "Ошибка запроса", detail: err.error.message})
                throw err;
            }));
    }

    private generateHash(uri: string, query: any) {
        return cyrb53(uri + JSON.stringify(query), 0);
    }

    getWireframe(id: number) {
        return this.sendGet<Wireframe>('api/private/wireframe/' + id);
    }

    getWireframeDashboardStatistic(id: number) {
        return this.sendGet<WireframeDashboardStatistic>('api/private/wireframe/' + id + '/dashboard-statistic');
    }

    getWireframeFields(id: number) {
        return this.sendGet<FieldItem[]>('api/private/wireframe/' + id + '/fields');
    }

    getWireframes(includingRemoved?: boolean): Observable<Wireframe[]> {
        if (includingRemoved === undefined || includingRemoved === null) {
            return this.sendGet('api/private/wireframes');
        }
        return this.sendGet('api/private/wireframes', {includingRemoved});
    }

    getWireframesNames(): Observable<Wireframe[]> {
        return this.sendGet('api/private/wireframes/names');
    }

    createWireframe(wireframe: any): Observable<Wireframe> {
        return this.sendPost('api/private/wireframe', wireframe);
    }

    updateWireframe(id: number, wireframe: any): Observable<Wireframe> {
        return this.sendPatch('api/private/wireframe/' + id, wireframe);
    }

    createTask(taskCreationBody: TaskCreationBody): Observable<Task> {
        return this.sendPost<Task>('api/private/task', taskCreationBody);
    }

    deleteTask(id: number) {
        return this.sendDelete('api/private/task/' + id);
    }

    getTask(taskId: number, silent: boolean = false): Observable<Task> {
        const url = 'api/private/task/' + taskId;
        if (silent) {
            return this.sendGetSilent<Task>(url);
        }
        return this.sendGet<Task>(url);
    }

    getTasksByLogin(login: string, page: number): Observable<Page<Task>> {
        return this.sendGet<Page<Task>>(`api/private/task/page/by-login/${login}`, {page});
    }

    getWorkLogsByTaskId(taskId: number): Observable<WorkLog[]> {
        return this.sendGet(`api/private/work-log/task/${taskId}/list`);
    }

    getCountOfActiveWorkLogs() {
        return this.sendGet<number>('api/private/work-log/active/count');
    }

    getRootTask(taskId: number): Observable<Task> {
        return this.sendGet<Task>('api/private/task/' + taskId + '/root');
    }

    getFieldsTask(taskId: number): Observable<ModelItem[]> {
        return this.sendGet<ModelItem[]>(`api/private/task/${taskId}/fields`)
    }

    getPageOfTasks(page: number, filter: TaskFiltrationConditions): Observable<Page<Task>> {
        return this.sendPost<Page<Task>>(`api/private/task/page/${page}`, filter);
    }

    getWireframeFiltrationFields(wireframeId: number) {
        return this.sendGet<FilterModelItem[]>(`api/private/wireframe/${wireframeId}/filter-fields`);
    }

    checkCompatibility(taskId: number, otTaskId: number): Observable<any> {
        return this.sendGet<any>(`api/private/task/${taskId}/check-compatibility/${otTaskId}`);
    }

    connectToOldTracker(taskId: number, otTaskId: number): Observable<any> {
        return this.sendPatch(`api/private/task/${taskId}/connect-to/${otTaskId}`, {});
    }

    // getPageTasksByStatus(page: number, limit: number, status: string[], commonFilteringString?: string, taskCreator?: string, taskCreationDate?: Date[], filterTags?: TaskTag[], exclusionIds?: number[]): Observable<Page<Task>> {
    //     const query: any = {page, limit, status}
    //     if (commonFilteringString) query.commonFilteringString = commonFilteringString;
    //     if (taskCreator) query.taskCreator = taskCreator;
    //     if (taskCreationDate) query.taskCreationDate = Utils.dateArrayToStringRange(taskCreationDate);
    //     if (filterTags) query.filterTags = filterTags.map(t => t.taskTagId);
    //     if (exclusionIds) query.exclusionIds = exclusionIds;
    //     return this.sendGet<Page<Task>>('api/private/tasks', query);
    // }

    // getPageTasksByStatusAndTemplate(page: number, limit: number, status: string[], template: number, filters?: { [filterId: string]: FilterModelItem }, filterTags?: TaskTag[], exclusionIds?: number[]) {
    //     const query: any = {page, limit, status, template}
    //     if (filters) {
    //         let filterModelItems = Object.values(filters);
    //         if (filterModelItems.length > 0 && filterModelItems.some(f => f.value)) {
    //             query.filters = JSON.stringify(Object.values(filters))
    //         }
    //     }
    //     if (filterTags) query.filterTags = filterTags.map(t => t.taskTagId);
    //     if (exclusionIds) query.exclusionIds = exclusionIds;
    //     return this.sendGet<Page<Task>>('api/private/tasks', query);
    // }

    getHouses(id: number) {
        return this.sendGet<House[]>(`api/private/houses/${id}`);
    }

    getStreets(cityId: number, filter?: string): Observable<any> {
        if (filter) return this.sendGet('api/private/streets/' + cityId, {filter});
        return this.sendGet('api/private/streets/' + cityId);
    }

    getStreetSuggestions(query?: string | null) {
        return this.sendGet<StreetSuggestion[]>('api/private/suggestions/street', {query});
    }

    getCities(): Observable<City[]> {
        return this.sendGet('api/private/cities');
    }

    getAvailableObservers(): Observable<DefaultObservers[]> {
        return this.sendGet('api/private/available-observers');
    }

    getAvailableObserversSuggestions(query: string): Observable<DefaultObservers[]> {
        return this.sendGet(`api/private/available-observers/${query}`);
    }

    createComment(text: string | null, taskId: number, files: FileData[] | null, replyComment?: number): Observable<Comment> {
        return this.sendPost<Comment>("api/private/comment", {
            taskId,
            text: text ? text : '',
            files: files ? files : [],
            replyComment
        })
    }

    getComments(taskId: number, offset: number, limit: number): Observable<Page<Comment>> {
        return this.sendGet<Page<Comment>>('api/private/comments', {taskId, offset, limit});
    }

    getTaskJournal(taskId: number, offset: number, limit: number, sorting: TaskJournalSortingTypes): Observable<Page<Comment | TaskEvent>> {
        return this.sendGet<Page<Comment | TaskEvent>>(`api/private/task/${taskId}/journal`, {offset, limit, sorting});
    }

    getEmployees(globalFilter?: string, showDeleted?: boolean, showOffsite?: boolean): Observable<Employee[]> {
        const query: any = {};
        if (globalFilter) query['globalFilter'] = globalFilter;
        if (typeof showDeleted === 'boolean' && !showDeleted) query['showDeleted'] = showDeleted;
        if (typeof showOffsite === 'boolean' && !showOffsite) query['showOffsite'] = showOffsite;
        return this.sendGet('api/private/employee/list', query)
    }

    /**
     * Получить список сотрудников отфильтрованых по фильр-форме
     * @param form EmployeeFiltrationForm
     */
    getEmployeesListFiltered(form: EmployeeFiltrationForm): Observable<Employee[]> {
        return this.sendPost<Employee[]>('api/private/employee/filter/list', form);
    }

    getEmployeesOptionsList(globalFilter?: string): Observable<any[]> {
        return this.sendGet<any[]>('api/private/employee/list', {globalFilter: globalFilter ?? ""})
            .pipe(
                map(
                    (response) => {
                        return response.map(employee => {
                            const {firstName, secondName, lastName, login} = employee;
                            const fullName = `${lastName} ${firstName} ${secondName}`;
                            return {label: !firstName || !secondName || !lastName ? login : fullName, value: login};
                        })
                    })
            );
    }

    getAllTaskAttachments(taskId: number) {
        return this.sendGet<Attachment[]>('api/private/task/' + taskId + '/attachments');
    }

    getCountAllTaskAttachments(taskId: number) {
        return this.sendGet<number>('api/private/task/' + taskId + '/attachments/count');
    }

    getDepartments(): Observable<Department[]> {
        return this.sendGet<Department[]>("api/private/departments");
    }

    getPositions(): Observable<Position[]> {
        return this.sendGet<Position[]>("api/private/positions");
    }

    createDepartment(formValues: any) {
        return this.sendPost("api/private/department", formValues);
    }

    editDepartment(formValues: any, departmentId: number) {
        return this.sendPatch("api/private/department/" + departmentId, formValues);
    }

    deleteDepartment(departmentId: number) {
        return this.sendDelete("api/private/department/" + departmentId);
    }

    createPosition(formValues: any) {
        return this.sendPost("api/private/position", formValues);
    }

    editPosition(formValues: any, positionId: number) {
        return this.sendPatch("api/private/position/" + positionId, formValues);
    }

    deletePosition(positionId: number) {
        return this.sendDelete("api/private/position/" + positionId);
    }

    createEmployee(formValues: any) {
        return this.sendPost("api/private/employee", formValues);
    }

    editEmployee(formValues: any, login: string) {
        return this.sendPatch("api/private/employee/" + login, formValues);
    }

    deleteEmployee(login: string) {
        return this.sendDelete("api/private/employee/" + login);
    }

    getEmployee(login: string, silent: boolean = false): Observable<Employee> {
        const url = "api/private/employee/" + login;

        if (silent) {
            return this.sendGetSilent(url);
        }
        return this.sendGet(url);
    }

    signIn(formValues: any) {
        return this.sendPost<TokenChainWithUserInfo>("api/public/sign-in", formValues)
            .pipe(tap(chain => {
                Storage.save('token', chain.tokenChain.token);
                Storage.save('isOffsite', chain.employee.offsite)
                this.loggedIn = true;
            }), delay(100))
    }

    authCheckout(): Observable<TokenChain> {
        return this.sendGet<TokenChain>("api/public/auth-checkout")
            .pipe(tap(chain => {
                if (chain) localStorage.setItem('token', chain.token)
            }))
    }

    getMe(): Observable<Employee> {
        return this.sendGet<Employee>("api/private/me");
    }

    setAvatar(avatar: string) {
        return this.sendPost<Employee>("api/private/employee/avatar", avatar)
    }

    getResponsible(): Observable<(Department | Employee)[]> {
        return zip(this.sendGet<Department[]>("api/private/departments"), this.sendGet<Employee[]>("api/private/employee/list")).pipe(map(arr => arr.flat()), map(arr => arr.filter(i => !i.deleted)))
    }

    getActiveTaskInStage(offset: number, limit: number, templateId: number, stageId: string): Observable<Page<Task>> {
        return this.sendGet<Page<Task>>(`api/private/task/page/template/${templateId}/stage/${stageId}`, {
            offset,
            limit
        });
    }

    getActiveTaskInNullStage(offset: number, limit: number, templateId: number): Observable<Page<Task>> {
        return this.sendGet<Page<Task>>(`api/private/task/page/template/${templateId}/stage`, {offset, limit});
    }

    changeTaskStage(taskId: number, stageId: string): Observable<Task> {
        return this.sendPatch<Task>(`api/private/task/${taskId}/stage`, {stageId})
    }

    getActiveTaskIdsInStage(templateId: number, stageId: string) {
        return this.sendGet<number[]>(`api/private/task/template/${templateId}/stage/${stageId}/taskIdOnly`);
    }

    getActiveTaskIdsInNullStage(templateId: number) {
        return this.sendGet<number[]>(`api/private/task/template/${templateId}/stage/taskIdOnly`);
    }

    updateComment(editedComment: Comment): Observable<Comment> {
        return this.sendPatch<Comment>("api/private/comment", editedComment);
    }

    deleteComment(commentId: number) {
        return this.sendDelete("api/private/comment/" + commentId);
    }

    getInstallersEmployees() {
        return this.sendGet<Employee[]>("api/private/employee/installers");
    }

    assignInstallersToTask(taskId: number, targetInstallers: {
        installers: Employee[], gangLeader?: string,
        deferredReport: boolean, description: string, files?: FileData[], serverFiles?: FileSuggestion[],
        comments: number[], scheduled?: Date | null
    }) {
        return this.sendPost("api/private/task/" + taskId + "/assign-installers", targetInstallers);
    }

    saveReport(form: any) {
        return this.sendPatch("api/private/work-log/writing-report", form);
    }

    forceCloseWorkLog(taskId: number, reasonOfClosing: string) {
        return this.sendPost("api/private/task/" + taskId + "/force-close-work-log", reasonOfClosing);
    }

    changeTaskObservers(taskId: number, departmentObservers: number[], personalObservers: string[]) {
        return this.sendPatch<Task>("api/private/task/" + taskId + "/observers", {
            departmentObservers: departmentObservers,
            personalObservers: personalObservers
        });
    }

    unlinkParentTask(taskId: number) {
        return this.sendPatch("api/private/task/" + taskId + "/unlink-parent", {});
    }

    changeLinkToParentTask(currentTaskId: number, parentTaskId: number) {
        return this.sendPatch("api/private/task/" + currentTaskId + "/link-to-parent", {parentTaskId});
    }

    appendLinksToChildrenTasks(taskId: number, childIds: number[]) {
        return this.sendPatch<Task>("api/private/task/" + taskId + "/append-links-to-children", childIds);
    }

    getTaskTag(id: number) {
        return this.sendGet<TaskTag>("api/private/task-tag/" + id);
    }

    getTaskTags(queryName?: string | null, includingRemove?: boolean | null) {
        const query: any = {};
        if (queryName) query.query = queryName;
        if (includingRemove !== undefined && includingRemove !== null) query.includingRemove = includingRemove;
        return this.sendGet<TaskTag[]>("api/private/task-tags", query);
    }

    createTaskTag(taskTag: any) {
        return this.sendPost<TaskTag>("api/private/task-tag", taskTag);
    }

    modifyTaskTag(taskTag: any) {
        return this.sendPatch<TaskTag>("api/private/task-tag", taskTag);
    }

    deleteTaskTag(taskTagId: number) {
        return this.sendDelete("api/private/task-tag/" + taskTagId);
    }

    setTaskTags(taskId: number, tags: TaskTag[]) {
        return this.sendPatch<Task>(`api/private/task/${taskId}/tags`, tags);
    }

    changeTaskResponsible(taskId: number, responsible: Employee) {
        return this.sendPatch<Task>("api/private/task/" + taskId + "/responsible", responsible);
    }

    unbindResponsible(taskId: number) {
        return this.sendPatch<Task>("api/private/task/" + taskId + "/unbind-responsible", {});
    }

    changeTaskActualFrom(taskId: number, dateTime: Date) {
        return this.sendPatch<Task>("api/private/task/" + taskId + "/actual-from", dateTime);
    }

    changeTaskActualTo(taskId: number, dateTime: Date) {
        return this.sendPatch<Task>("api/private/task/" + taskId + "/actual-to", dateTime);
    }

    clearActualFromDate(taskId: number) {
        return this.sendPatch<Task>("api/private/task/" + taskId + "/clear-actual-from-date", {});
    }

    clearActualToDate(taskId: number) {
        return this.sendPatch<Task>("api/private/task/" + taskId + "/clear-actual-to-date", {});
    }

    closeTask(taskId: number) {
        return this.sendPatch<Task>("api/private/task/" + taskId + "/close", {});
    }

    reopenTask(taskId: number) {
        return this.sendPatch<Task>("api/private/task/" + taskId + "/reopen", {});
    }

    editTask(taskId: number, modelItems: ModelItem[]) {
        return this.sendPatch<Task>("api/private/task/" + taskId + "/edit-fields", modelItems);
    }

    moveTaskToDirectory(taskIds: number[], directoryId: number) {
        return this.sendPatch("api/private/task/move-to-directory", {taskIds, directoryId});
    }

    getEditTaskSnapshots(taskId: number) {
        return this.sendGet<TaskFieldsSnapshot[]>("api/private/task/" + taskId + "/edit-snapshots");
    }

    getNotifications(first: number, limit: number) {
        return this.sendGet<Page<INotification>>("api/private/notifications", {first, limit});
    }

    getNotificationTypes() {
        return this.sendGet<{label: string, value: NotificationType}[]>("api/private/types/notification");
    }

    saveNotificationSettings(settings: NotificationSettingsForm){
        return this.sendPatch("api/private/employee/notification-settings", settings);
    }

    getCountOfUnreadNotifications() {
        return this.sendGet<number>("api/private/notifications/unread-count");
    }

    getAvailableTaskTypesToChange(taskId: number) {
        return this.sendGet<TaskStage[]>("api/private/task/" + taskId + "/type-list/available-to-change");
    }

    getAvailableDirectoriesToChange(taskId: number) {
        return this.sendGet<TaskTypeDirectory[]>("api/private/task/" + taskId + "/directory-list/available-to-change");
    }

    getDepartment(id: number, silent: boolean = false) {
        if (silent) {
            return this.sendGetSilent<Department>("api/private/department/" + id);
        } else {
            return this.sendGet<Department>("api/private/department/" + id);
        }
    }

    getWorkLog(id: number, silent: boolean = false) {
        if (silent) {
            return this.sendGetSilent<WorkLog>("api/private/work-log/" + id);
        } else {
            return this.sendGet<WorkLog>("api/private/work-log/" + id);
        }
    }

    getActiveWorkLogByTaskId(taskId: number) {
        return this.sendGetSilent<WorkLog>("api/private/work-log/task/" + taskId + "/active");
    }

    readAllNotifications() {
        return this.sendPatch<void>("api/private/notifications/read-all", {});
    }

    readNotification(id: number) {
        return this.sendPatch<void>(`api/private/notifications/${id}/read`, {});
    }

    changeMyStatus(status: EmployeeStatus) {
        return this.sendPatch<Employee>("api/private/employee/status", status);
    }

    getChatMessages(chatId: number, first: number, limit: number) {
        return this.sendGet<Page<SuperMessage>>("api/private/chat/" + chatId + "/messages", {first, limit});
    }

    setMessagesAsRead(messageIds: number[]) {
        return this.sendPatch<void>("api/private/chat/messages/read", messageIds);
    }

    getActiveTaskChat(taskId: number) {
        return this.sendGet<Chat>("api/private/task/" + taskId + "/active-chat");
    }

    getChat(chatId: number) {
        return this.sendGet<Chat>("api/private/chat/" + chatId);
    }

    sendChatMessage(chatId: number, text: string, files: FileData[], replyMessageId?: number) {
        return this.sendPost<ChatMessage>("api/private/chat/" + chatId + "/message", {
            text,
            files,
            replyMessageId
        } as MessageData);
    }

    editChatMessage(messageId: number, text: string) {
        return this.sendPatch<ChatMessage>("api/private/chat/message/" + messageId, text);
    }

    deleteChatMessage(chatId: number, messageId: number) {
        return this.sendDelete("api/private/chat/message/" + messageId);
    }

    getMyActiveChats() {
        return this.sendGet<Chat[]>("api/private/chats/my/active");
    }

    getIncomingTasks(page: number, filters: any) {
        return this.sendGet<Page<Task>>(`api/private/task/page/incoming/${page}`, Utils.prepareForHttpRequest(filters));
    }

    getWireframeStages(wireframeId: number) {
        return this.sendGet<TaskStage[]>("api/private/wireframe/" + wireframeId + "/stages");
    }

    getCountIncomingTasks() {
        return this.sendGet<number>("api/private/task/incoming/count", {});
    }

    getCountIncomingTasksByWireframeId(wireframeId: number) {
        return this.sendGet<number>("api/private/task/incoming/wireframe/" + wireframeId + "/count", {});
    }

    getCountTasksByWireframeIdByTags(wireframeIds: number[]) {
        if (wireframeIds.length === 0)
            return of({} as { [key: string]: number })
        return this.sendGet<{ [key: number]: number }>("api/private/task/wireframe/by-tags/count", {wireframeIds});
    }

    getCountIncomingTasksByWireframeIdByTags(wireframeIds: number[]) {
        if (wireframeIds.length === 0)
            return of({} as { [key: string]: number })
        return this.sendGet<{ [key: number]: number }>("api/private/task/incoming/wireframe/by-tags/count", {wireframeIds});
    }

    getCountAllTasksByWireframeId(wireframeId: number) {
        return this.sendGet<number>("api/private/task/wireframe/" + wireframeId + "/count", {});
    }

    getCountIncomingTasksByStages(wireframeId: number) {
        if (!wireframeId)
            return of({} as { [key: string]: number })
        return this.sendGet<{ [key: string]: number }>(`api/private/task/incoming/wireframe/${wireframeId}/by-stages/count`, {});
    }

    getCountTasksByStages(wireframeId: number) {
        if (!wireframeId)
            return of({} as { [key: string]: number })
        return this.sendGet<{ [key: string]: number }>(`api/private/task/wireframe/${wireframeId}/by-stages/count`, {});
    }

    // getCountTasks(status: string[], cls: number[] | null, type: string | null, directory:  number | null,
    //               tags: number[] | null, schedulingType: SchedulingType | null, dateOfClose: DateRange | null,
    //               actualFrom: DateRange | null, actualTo: DateRange | null, filters: any) {
    //     return this.sendPost<number>("api/private/tasks/count", {...filters, status, template: cls,
    //         stage: type, tags, directory, schedulingType, dateOfClose, actualFrom, actualTo});
    // }

    getCountTasks(filters: TaskFiltrationConditions = {}) {
        return this.sendPost<number>("api/private/task/count", filters);
    }

    getTagsListFromCatalog(filters: TaskFiltrationConditions = {}) {
        return this.sendPost<TagListItem[]>("api/private/tags/catalog/list", filters);
    }

    getScheduledTask(start: string, end: string) {
        return this.sendGet<Task[]>("api/private/task/list/scheduled", {start, end});
    }

    moveScheduledTask(taskId: number, delta: Duration) {
        return this.sendPatch<Task>(`api/private/task/${taskId}/scheduled/move`, delta);
    }

    signOut() {
        return this.sendPost("api/public/sign-out", {}).pipe(tap(() => {
            this.loggedIn = false;
        }));
    }

    deleteWireframe(wireframeId: number) {
        return this.sendDelete(`api/private/wireframe/${wireframeId}`)
    }

    getTrackerParserState() {
        return this.sendGet<OldTracker>("api/private/parser/tracker");
    }

    saveTrackerParserSettings(settings: any) {
        return this.sendPatch("api/private/parser/tracker/settings", settings);
    }

    startTrackerParser() {
        return this.sendPost("api/private/parser/tracker/start", {});
    }

    stopTrackerParser() {
        return this.sendPost("api/private/parser/tracker/stop", {});
    }

    getAddressCorrectingPool() {
        return this.sendGet<{ [key: string]: AddressCorrecting }>("api/private/parser/tracker/address-correcting-pool");
    }

    sendCorrectedAddress(correctedAddress: { [p: string]: AddressCorrecting }) {
        return this.sendPost("api/private/parser/tracker/address-correcting-pool", correctedAddress);
    }

    startAddressParse() {
        return this.sendPost("api/private/parser/addresses/start", {});
    }

    getAddressSuggestions(query: string, isAcpConnected: boolean | null, isHouseOnly: boolean) {
        return this.sendGet<Address[]>("api/private/suggestions/address", {query, isAcpConnected, isHouseOnly});
    }

    getAddressSuggestionsAlt(streetId: number, query: string, isAcpConnected: boolean | null, isHouseOnly: boolean) {
        return this.sendGet<Address[]>("api/private/suggestions/address/alt", {
            streetId,
            query,
            isAcpConnected,
            isHouseOnly
        });
    }

    getCountOfUnreadMessages(chatId: number) {
        return this.sendGet<number>("api/private/chat/" + chatId + "/messages/unread-count");
    }

    getPageOfPaidActions(page: number, filter: PaidActionFilter) {
        return this.sendGet<Page<PaidAction>>(`api/private/salary/paid-actions/${page}`, filter);
    }

    getListAvailablePaidActions() {
        return this.sendGet<PaidAction[]>('api/private/salary/paid-actions/available');
    }

    createPaidAction(paidActionForm: PaidActionForm) {
        return this.sendPost("api/private/salary/paid-action", paidActionForm);
    }

    editPaidAction(paidActionId: number, paidActionForm: PaidActionForm) {
        return this.sendPatch("api/private/salary/paid-action/" + paidActionId, paidActionForm);
    }

    deletePaidAction(paidActionId: number) {
        return this.sendDelete("api/private/salary/paid-action/" + paidActionId);
    }

    getRootTreeOfWorks(groupsUndraggable?: boolean) {
        return this.sendGet<TreeNode<any>[]>('api/private/salary/paid-works-tree/root', {groupsUndraggable: groupsUndraggable ?? false});
    }

    getWorksOfGroup(groupId: string, groupsUndraggable?: boolean) {
        return this.sendGet<TreeNode<any>[]>(`api/private/salary/paid-works-tree/${groupId}`, {groupsUndraggable: groupsUndraggable ?? false});
    }

    treeWorksDragDrop(event: TreeDragDropEvent) {
        return this.sendPatch('api/private/salary/paid-works-tree/drag-drop', event);
    }

    createPaidWorkGroup(paidWorkGroupForm: PaidWorkGroupForm) {
        return this.sendPost('api/private/salary/paid-work-group', paidWorkGroupForm);
    }

    editPaidWorkGroup(paidWorkGroupId: number, paidWorkGroupForm: PaidWorkGroupForm) {
        return this.sendPatch('api/private/salary/paid-work-group/' + paidWorkGroupId, paidWorkGroupForm);
    }

    deletePaidWorkGroup(paidWorkGroupId: number) {
        return this.sendDelete('api/private/salary/paid-work-group/' + paidWorkGroupId);
    }

    createPaidWork(formValue: PaidWorkForm) {
        return this.sendPost('api/private/salary/paid-work', formValue);
    }

    editPaidWork(paidWorkId: number, formValue: PaidWorkForm) {
        return this.sendPatch('api/private/salary/paid-work/' + paidWorkId, formValue);
    }

    deletePaidWork(paidWorkId: number) {
        return this.sendDelete('api/private/salary/paid-work/' + paidWorkId);
    }

    getPaidWorkById(paidWorkId: number) {
        return this.sendGet<PaidWork>('api/private/salary/paid-work/' + paidWorkId);
    }

    paidWorkTreeReposition(positionList: TreeElementPosition[]) {
        return this.sendPatch('api/private/salary/paid-works-tree/reposition', positionList);
    }

    getUncalculatedWorkLogs() {
        return this.sendGet<WorkLog[]>('api/private/work-log/uncalculated/list');
    }

    getAfterWorkList() {
        return this.sendGet<WorkLog[]>('api/private/work-log/after-work/list');
    }

    getUncompletedReports() {
        return this.sendGet<WorkLog[]>('api/private/uncompleted-reports');
    }

    sendWorkCalculation(form: any) {
        return this.sendPost('api/private/salary/work-calculation', form);
    }

    sendBypassWorkCalculation(form: any) {
        return this.sendPost('api/private/salary/work-calculation/bypass', form);
    }

    getSalaryTable(filter: any) {
        return this.sendGet<SalaryTable>('api/private/salary/table', filter);
    }

    searchBillingUsers(query: string, isActive: boolean) {
        return this.sendGet<BillingUserItemData[]>(`api/private/billing/users/search`, {query, isActive});
    }

    getBillingUsersByLogin(login: string, isActive: boolean) {
        return this.sendGet<BillingUserItemData[]>(`api/private/billing/users/by-login`, {login, isActive});
    }

    getBillingUsersByFio(query: string, isActive: boolean) {
        return this.sendGet<BillingUserItemData[]>(`api/private/billing/users/by-fio`, {query, isActive});
    }

    getBillingUsersByAddress(address: string, isActive: boolean) {
        return this.sendGet<BillingUserItemData[]>(`api/private/billing/users/by-address`, {address, isActive});
    }

    getBillingUserInfo(login: string) {
        return this.sendGet<BillingTotalUserInfo>(`api/private/billing/user/${encodeURIComponent(login)}`);
    }

    getBillingUserEvents(login: string) {
        return this.sendGet<UserEvents>(`api/private/billing/user/${encodeURIComponent(login)}/events`);
    }

    updateBalance(login: string, updateBalanceForm: any) {
        return this.sendPost(`api/private/billing/user/${encodeURIComponent(login)}/update-balance`, updateBalanceForm);
    }

    setDeferredPayment(login: string) {
        return this.sendPost(`api/private/billing/user/${encodeURIComponent(login)}/deferred-payment`, {});
    }

    startUserService(login: string) {
        return this.sendPost(`api/private/billing/user/${encodeURIComponent(login)}/start-service`, {});
    }

    stopUserService(login: string) {
        return this.sendPost(`api/private/billing/user/${encodeURIComponent(login)}/stop-service`, {});
    }

    balanceReset(login: string, comment: string) {
        return this.sendPatch(`api/private/billing/user/${encodeURIComponent(login)}/balance-reset`, comment);
    }

    isLoginEnable(login: string) {
        return this.sendGetSilent<boolean>(`api/private/billing/user/${encodeURIComponent(login)}/is-enable`);
    }

    enableLogin(login: string) {
        return this.sendPatch(`api/private/billing/user/${encodeURIComponent(login)}/enable-login`, {});
    }

    changeUserAddress(login: string, address: string) {
        return this.sendPatch(`api/private/billing/user/${encodeURIComponent(login)}/change/address`, address);
    }

    changeUserFullName(login: string, fullName: string) {
        return this.sendPatch(`api/private/billing/user/${encodeURIComponent(login)}/change/full-name`, fullName);
    }

    changeUserPhone(login: string, phone: string) {
        return this.sendPatch(`api/private/billing/user/${encodeURIComponent(login)}/change/phone`, phone);
    }

    changeUserComment(login: string, comment: string) {
        return this.sendPatch(`api/private/billing/user/${encodeURIComponent(login)}/change/comment`, comment);
    }

    editUser(login: string, editUserForm: any) {
        return this.sendPatch(`api/private/billing/user/${encodeURIComponent(login)}/edit`, editUserForm);
    }

    convertBillingAddress(addressString: string | undefined) {
        return this.sendGet<Address | null>('api/private/convert/billing-address-string', {addressString});
    }

    createCity(cityForm: any) {
        return this.sendPost('api/private/city', cityForm);
    }

    editCity(cityId: number, cityForm: any) {
        return this.sendPatch(`api/private/city/${cityId}`, cityForm);
    }

    deleteCity(cityId: number) {
        return this.sendDelete(`api/private/city/${cityId}`);
    }

    createStreet(cityId: number, streetForm: any) {
        return this.sendPost(`api/private/city/${cityId}/street`, streetForm);
    }

    editStreet(streetId: number, streetForm: any) {
        return this.sendPatch(`api/private/street/${streetId}`, streetForm);
    }

    deleteStreet(streetId: number) {
        return this.sendDelete(`api/private/street/${streetId}`);
    }

    createHouse(streetId: number, houseForm: any) {
        return this.sendPost<Address>(`api/private/street/${streetId}/house`, houseForm);
    }

    editHouse(houseId: number, houseForm: any) {
        return this.sendPatch(`api/private/house/${houseId}`, houseForm);
    }

    makeHouseAnApartmentsBuilding(houseId: number) {
        return this.sendPatch(`api/private/house/${houseId}/to-apartments-building`, {});
    }

    deleteHouse(houseId: number) {
        return this.sendDelete(`api/private/house/${houseId}`);
    }

    getWorkingDay(date: Date, login: string) {
        return this.sendGet<WorkingDay>('api/private/working-day/', {date, login});
    }

    getAlreadyCalculatedWorkForm(workLogId: number) {
        return this.sendGet<any | null>(`api/private/salary/already-calculated-work/${workLogId}/form`);
    }

    getDhcpBindingsByLogin(login: string) {
        return this.sendGet<DhcpBinding[]>('api/private/acp/dhcp/bindings', {login});
    }

    getDhcpLogsByLogin(login: string, page: number = 0) {
        return this.sendGet<DhcpLogsRequest>(`api/private/acp/dhcp/binding/${login}/logs/${page}`, {});
    }

    getLastBindings(page: number, state?: number, macaddr?: string | null, login?: string | null, ip?: string | null, vlan?: number | null, buildingId?: number | null, commutator?: number | null, port?: number | null) {
        return this.sendGet<Page<DhcpBinding>>('api/private/acp/dhcp/bindings/' + page + '/last', {
            state,
            macaddr,
            login,
            ip,
            vlan,
            buildingId,
            commutator,
            port
        });
    }

    getDhcpBindingsByVlan(page: number, vlan: number, excludeLogin?: string) {
        return this.sendGet<Page<DhcpBinding>>('api/private/acp/vlan/' + vlan + '/dhcp/bindings/' + page, {excludeLogin});
    }

    authDhcpBinding(login: string, macaddr: string) {
        return this.sendPost('api/private/acp/dhcp/binding/auth', {login, macaddr});
    }

    getNetworkConnectionLocationHistory(bindingId: number) {
        return this.sendGet<NCLHistoryWrapper>('api/private/acp/dhcp/binding/' + bindingId + '/ncl-history', {});
    }

    getBuildings(query?: string) {
        return this.sendGet<AcpHouse[]>('api/private/acp/buildings', {query});
    }

    getCommutators(page: number, name?: string | null, ip?: string | null, buildingId?: number | null) {
        return this.sendGet<Page<SwitchBaseInfo>>('api/private/acp/commutators/' + page + '/page', {
            name,
            ip,
            buildingId
        });
    }

    getCommutatorsTable(paging: any) {
        return this.sendPost<Page<SwitchBaseInfo>>('api/private/acp/commutators/table', paging);
    }

    getCommutator(swId: number) {
        return this.sendGet<SwitchWithAddress>('api/private/acp/commutator/' + swId);
    }

    getCommutatorEditingPreset(swId: number) {
        return this.sendGet<SwitchEditingPreset>('api/private/acp/commutator/' + swId + '/editing-preset');
    }

    searchCommutators(query?: string | null) {
        return this.sendGet<SwitchWithAddress[]>('api/private/acp/commutators/search', {query});
    }

    getCommutatorModels(query?: string | null) {
        return this.sendGet<SwitchModel[]>('api/private/acp/commutator/models', {query});
    }

    getCommutatorModel(swmodelId: number) {
        return this.sendGet<SwitchModel>(`api/private/acp/commutator/model/${swmodelId}`);
    }

    getBuildingAddress(buildingId: number) {
        return this.sendGet<Address>(`api/private/acp/building/${buildingId}/address`);
    }

    checkCommutatorNameExist(name: string) {
        return this.sendGet<boolean>('api/private/acp/commutator/check-exist/name', {name});
    }

    checkCommutatorIpExist(ip: string) {
        return this.sendGet<boolean>('api/private/acp/commutator/check-exist/ip', {ip});
    }

    checkRemoteControl(ipaddr: any) {
        return this.sendGet<NetworkRemoteControl>(`api/private/remote-control/${ipaddr}/check-access`);
    }

    getDocumentTemplateTypes() {
        return this.sendGet<{ label: string, value: string }[]>('api/private/types/document-template');
    }

    getFieldDisplayTypes() {
        return this.sendGet<{ label: string, value: string }[]>('api/private/types/field-display');
    }

    getWireframeFieldTypesList() {
        return this.sendGet<{ label: string, value: string }[]>('api/private/types/wireframe-field');
    }

    getConnectionServicesList() {
        return this.sendGet<{ label: string, value: string }[]>('api/private/types/connection-service');
    }

    getConnectionServicesSuggestionsList(query: string) {
        return this.sendGet<{ label: string, value: string }[]>('api/private/types/connection-service/suggestions', {query});
    }

    getBillingPaymentTypesList() {
        return this.sendGet<{ label: string, value: string }[]>('api/private/types/billing-payment-type');
    }

    getConnectionTypesList() {
        return this.sendGet<{ label: string, value: string }[]>('api/private/types/connection-type');
    }

    getAdSourcesList() {
        return this.sendGet<{ label: string, value: string }[]>('api/private/types/advertising-source');
    }

    getFilesSortingTypes() {
        return this.sendGet<{ label: string, value: string }[]>('api/private/types/files-sorting');
    }

    getBillingConfiguration() {
        return this.sendGet<BillingConf>('api/private/billing/configuration');
    }

    getTelegramConfiguration() {
        return this.sendGet<TelegramConf>('api/private/configuration/telegram');
    }

    getAcpConfiguration() {
        return this.sendGet<AcpConf>('api/private/acp/configuration');
    }

    setBillingConfiguration(billingConf: BillingConf) {
        return this.sendPost('api/private/billing/configuration', billingConf);
    }

    setTelegramConfiguration(telegramConf: TelegramConf) {
        return this.sendPost('api/private/configuration/telegram', telegramConf);
    }

    setAcpConfiguration(acpConf: AcpConf) {
        return this.sendPatch('api/private/acp/configuration', acpConf);
    }

    getClientEquipments(query?: string | null, isDeleted?: boolean | null) {
        return this.sendGet<ClientEquipment[]>('api/private/client-equipments', {query, isDeleted});
    }

    getClientEquipmentsSuggestions(query?: string | null) {
        return this.sendGet<{ label: string, value: string }[]>('api/private/client-equipments/suggestions', {query});
    }

    createClientEquipment(clientEquipmentForm: any) {
        return this.sendPost('api/private/client-equipment', clientEquipmentForm);
    }

    editClientEquipment(clientEquipmentId: number, clientEquipmentForm: any) {
        return this.sendPatch(`api/private/client-equipment/${clientEquipmentId}`, clientEquipmentForm);
    }

    deleteClientEquipment(clientEquipmentId: number) {
        return this.sendDelete(`api/private/client-equipment/${clientEquipmentId}`);
    }

    createCommutator(form: any) {
        return this.sendPost('api/private/acp/commutator', form);
    }

    editCommutator(commutatorId: number, form: any) {
        return this.sendPatch(`api/private/acp/commutator/${commutatorId}`, form);
    }

    deleteCommutator(id: number) {
        return this.sendDelete(`api/private/acp/commutator/${id}`);
    }

    commutatorRemoteUpdate(id: number) {
        return this.sendPost(`api/private/acp/commutator/${id}/get-remote-update`, {});
    }

    commutatorRemoteUpdateByVlan(vlan: number) {
        return this.sendPost(`api/private/acp/commutators/vlan/${vlan}/get-remote-update`, {});
    }

    fdbTableByPort(id: number) {
        return this.sendGet<FdbItem[]>(`api/private/acp/commutator/port/${id}/fdb`);
    }

    getCommutatorsByVlan(vlan: number) {
        return this.sendGet<Switch[]>(`api/private/acp/commutators/vlan/${vlan}`);
    }

    getTopology() {
        return this.sendGet<TopologyStreet[]>(`api/private/acp/topology`);
    }

    getBuilding(id: number) {
        return this.sendGet<AcpHouse>('api/private/acp/building/' + id);
    }

    getCommutatorsByBuildingId(id: number) {
        return this.sendGet<CommutatorListItem[]>('api/private/acp/building/' + id + '/commutators');
    }

    getBindingsByLogin(login: string, page: number, filter?: DhcpBindingFilter) {
        return this.sendPost<Page<DhcpBinding>>('api/private/acp/user/' + login + '/bindings/' + page, filter);
    }

    getBindingsByVlan(vlan: number, page: number, filter?: DhcpBindingFilter) {
        return this.sendPost<Page<DhcpBinding>>('api/private/acp/vlan/' + vlan + '/bindings/' + page, filter);
    }

    getBindingsByBuildingId(id: number, page: number, filter?: DhcpBindingFilter) {
        return this.sendPost<Page<DhcpBinding>>('api/private/acp/building/' + id + '/bindings/' + page, filter);
    }

    getBindingsFromBuildingByLogin(login: string, page: number, filter?: DhcpBindingFilter) {
        return this.sendPost<Page<DhcpBinding>>('api/private/acp/user/' + login + '/bindings-from-building/' + page, filter);
    }

    getBindingsByCommutator(id: number, page: number, filter?: DhcpBindingFilter) {
        return this.sendPost<Page<DhcpBinding>>(`api/private/acp/commutator/${id}/bindings/${page}`, filter);
    }

    getBindingsTable(paging: any) {
        return this.sendPost<Page<DhcpBinding>>('api/private/acp/bindings/table', paging);
    }

    getActiveBindingByLogin(login: string) {
        return this.sendGet<DhcpBinding | null>('api/private/acp/user/' + login + '/active-binding');
    }

    getBuildingIdByVlan(vlanId: number) {
        return this.sendGet<number | null>('api/private/acp/vlan/' + vlanId + '/building-id');
    }

    getUserBriefInfo(login: string) {
        return this.sendGet<AcpUserBrief>(`api/private/acp/user/${login}/brief-info`);
    }

    getBulkUserBriefInfo(login: string[]) {
        return this.sendPost<{ [key: string]: AcpUserBrief }>(`api/private/acp/user/brief-info/bulk`, login);
    }

    getCountingLivesCalculation(form: { address: Address, startApart: number, endApart: number }) {
        return this.sendPost<{ result: string }>(`api/private/billing/counting-lives`, form)
    }

    attachToTask(superMessageId: number, chatId: number, description: string) {
        return this.sendPost(`api/private/chat/${chatId}/message/${superMessageId}/attach-to-task`, {description});
    }

    getFilesSuggestions(query?: string | null) {
        return this.sendGet<FileSuggestion[]>('api/private/files/suggestions', {query});
    }

    getFilesRoot(sortingType?: string | null) {
        return this.sendGet<FileSystemItem[]>('api/private/files/root', {sortingType});
    }

    getFilesDirectory(id: number, sortingType?: string | null) {
        return this.sendGet<LoadingDirectoryWrapper>(`api/private/files/directory/${id}`, {sortingType});
    }

    filesMoveTo(target: number | null, source: number[]) {
        return this.sendPatch(`api/private/files/move-to`, {target, source});
    }

    filesCopyTo(target: number | null, source: number[]) {
        return this.sendPatch(`api/private/files/copy-to`, {target, source});
    }

    filesDelete(id: number) {
        return this.sendDelete(`api/private/files/delete/${id}`);
    }

    filesRename(id: number, name: string) {
        return this.sendPatch(`api/private/files/rename`, {id, name});
    }

    filesCreateDirectory(name: string, parentDirectoryId?: number | null) {
        return this.sendPost(`api/private/files/create-directory`, {parentDirectoryId, name});
    }

    filesUpload(fileEvents: FilesLoadFileEvent[]) {
        return this.sendPost(`api/private/files/load`, fileEvents);
    }

    searchFiles(query: string, sortingType?: string | null) {
        return this.sendGet<FileSystemItem[]>('api/private/files/search', {query, sortingType});
    }

    createPhyPhoneBind(form: PhyPhoneInfoForm) {
        return this.sendPatch(`api/private/employee/phy-phone-bind/create`, form);
    }

    removePhyPhoneBind(login: string) {
        return this.sendDelete(`api/private/employee/${login}/phy-phone-bind/remove`);
    }

    getPhyPhoneModelsTypes() {
        return this.sendGet<{ label: string, value: string }[]>('api/private/types/phy-phone-models');
    }

    callToPhone(phoneNumber: string) {
        return this.sendPost(`api/private/call-to-phone`, {phoneNumber});
    }

    setPhyPhoneBind(phoneId: number | null) {
        return this.sendPatch(`api/private/employee/phy-phone/${phoneId}/bind`, {});
    }

    getPhyPhoneList() {
        return this.sendGet<{ label: string, value: number }[]>('api/private/phy-phone-list');
    }

    getOldTrackerClasses() {
        return this.sendGet<TaskClassOT[]>('api/private/ot/classes');
    }

    changeTaskStageInOldTracker(taskId: number, taskStageId: number) {
        return this.sendPatch(`api/private/task/${taskId}/old-tracker-stage/${taskStageId}/change`, {});
    }

    createUserInBilling(modelItemId: number, isOrg = false) {
        return this.sendPost(`api/private/billing/user/create`, {modelItemId, isOrg});
    }

    getBillingUserTariffs(login: string) {
        return this.sendGet<UserTariff[]>(`api/private/billing/user/${login}/tariffs`);
    }

    getBillingUserServices(login: string) {
        return this.sendGet<UserTariff[]>(`api/private/billing/user/${login}/services`);
    }

    appendServiceToBillingUser(id: number, login: string) {
        return this.sendPatch(`api/private/billing/user/${login}/service/${id}/append`, {});
    }

    removeServiceFromBillingUser(name: string, login: string) {
        return this.sendPatch(`api/private/billing/user/${login}/service/${name}/remove`, {});
    }

    changeTariffInBillingUser(id: number, login: string) {
        return this.sendPatch(`api/private/billing/user/${login}/tariff/${id}`, {});
    }

    makePayment(login: string, paymentForm: any) {
        return this.sendPost(`api/private/billing/user/${login}/make-payment`, paymentForm);
    }

    makeRecalculation(login: string, recalculationForm: any) {
        return this.sendPost(`api/private/billing/user/${login}/make-recalculation`, recalculationForm);
    }

    markWorkLogAsCompleted(workLogId: number, contracts?: TypesOfContractsSuggestion[]) {
        return this.sendPatch(`api/private/work-log/${workLogId}/mark-as-completed`, contracts);
    }

    markWorkLogAsUncompleted(workLogId: number) {
        return this.sendPatch(`api/private/work-log/${workLogId}/mark-as-uncompleted`, {});
    }

    markWorkLogAsUncompletedAndClose(workLogId: number) {
        return this.sendPatch(`api/private/work-log/${workLogId}/mark-as-uncompleted-and-close`, {});
    }

    getWorkLogsUnconfirmedContracts(page: number, filters: any) {
        return this.sendPost<Page<WorkLog>>(`api/private/work-log/unconfirmed-contracts/${page}`, filters);
    }

    getEmployeeWorkLogs() {
        return this.sendGet<EmployeeWorkLogs[]>('api/private/work-log/employee-work-log/list');
    }

    getContractTypesList() {
        return this.sendGet<TypesOfContracts[]>('api/private/contract/type/list');
    }

    getContractTypesSuggestionList(query: string) {
        return this.sendGet<TypesOfContractsSuggestion[]>('api/private/contract/type/suggestion/list', {query});
    }

    createContractType(form: TypesOfContractsForm) {
        return this.sendPost('api/private/contract/type', form);
    }

    updateContractType(id: number, form: TypesOfContractsForm) {
        return this.sendPatch(`api/private/contract/type/${id}`, form);
    }

    removeContractType(id: number) {
        return this.sendDelete(`api/private/contract/type/${id}`);
    }

    markContractsAsReceived(contractIds: number[]) {
        return this.sendPatch(`api/private/contract/mark/received`, contractIds);
    }

    markContractsAsArchived(contractIds: number[]) {
        return this.sendPatch(`api/private/contract/mark/archived`, contractIds);
    }

    getEmployeeWorkStatistics(form: EmployeeWorkStatisticsForm) {
        return this.sendPost<EmployeeWorkStatisticsTable>('api/private/statistics/employee-work', form);
    }

    sendDataToTelnetSession(sessionId: string, data: string) {
        return this.sendPost(`api/private/remote/telnet/${sessionId}`, data);
    }

    connectToTelnetSession(credentials: TelnetConnectionCredentials) {
        return this.sendPost(`api/private/remote/telnet/connect`, credentials);
    }

    /**
     * Получить заголовки таблицы реестра задач
     */
    getTaskRegistryTableHeaders(taskStatus: TaskStatus, taskClass: number) {
        return this.sendGet<DynamicTableColumn[]>(`api/private/task/registry/headers/${taskStatus}/${taskClass}`);
    }

    /**
     * Получить контент таблицы реестра задач
     */
    getTaskRegistryTableContent(taskStatus: TaskStatus, taskClass: number, tagMode: string, tags: number[], paging: any) {
        return this.sendPost<Page<{ [key: string]: DynamicTableCell }>>(`api/private/task/registry/content/${taskStatus}/${taskClass}`, {
            tagMode,
            tags,
            paging
        });
    }

    /**
     * Получить контент таблицы оптических терминалов
     */
    getOntTable(paging: any) {
        return this.sendPost<Page<Ont>>(`api/private/pon/ont/table`, paging);
    }

    /**
     * Получить список оптических коммутаторов
     */
    getOltList() {
        return this.sendGet<Olt[]>(`api/private/pon/olt/list`);
    }

    /**
     * Получить события изменения статуса ONT
     * @param offset Смещение выборки из базы данных
     * @param oltId Идентификатор коммутатора
     * @param port Номер порта
     */
    getOntStatusChangeEvents(offset: number, oltId: number | null, port: number | null) {
        return this.sendGet<Page<OntStatusChangeEvent>>(`api/private/pon/event/ont/status-change/${offset}`, {
            oltId,
            port
        });
    }

    /**
     * Получить очередь обработчиков задач для коммутаторов OLT
     */
    getWorkerQueue() {
        return this.sendGet<OltWorker[]>(`api/private/pon/worker-queue`);
    }

    /**
     * Получить график сигнала оптического терминала
     * @param id Идентификатор оптического терминала
     * @param timeRange Диапазон времени для графика сигнала (from, to)
     */
    getOntSignalChart(id: number, timeRange: DateRange) {
        return this.sendPost<any[]>(`api/private/pon/ont/${id}/signal-chart`, timeRange);
    }

    /**
     * Получить информацию об оптическом терминале
     * @param id Идентификатор оптического терминала
     */
    getOnt(id: number) {
        return this.sendGet<Ont>(`api/private/pon/ont/${id}`);
    }

    /**
     * Переименовать оптический терминал
     * @param id Идентификатор оптического терминала
     * @param name Новое имя оптического терминала
     */
    renameOnt(id: number, name: string) {
        return this.sendPatch(`api/private/pon/ont/${id}/rename?name=${name}`, {});
    }

    /**
     * Назначить логин пользователя к оптическому терминалу
     * @param id Идентификатор оптического терминала
     * @param login Логин пользователя
     */
    assignLoginToOnt(id: number, login: string) {
        return this.sendPatch(`api/private/pon/ont/${id}/assign-login?login=${login}`, {});
    }

    /**
     * Перезагрузить оптический терминал
     * @param id Идентификатор оптического терминала
     */
    rebootOnt(id: number) {
        return this.sendPost(`api/private/pon/ont/${id}/reboot`, {});
    }

    /**
     * Запросить новые данные по оптическому терминалу у головы
     * @param id Идентификатор оптического терминала
     */
    updateOnt(id: number) {
        return this.sendPost<string>(`api/private/pon/ont/${id}/update`, {});
    }

    /**
     * Получить список для автозаполнения пользователей по логину или адресу
     * @param query Строка для поиска пользователей
     */
    getUserSuggestions(query: string) {
        return this.sendGet<BillingUserItemData[]>(`api/private/billing/suggestions/user`, {query});
    }

    /**
     * Получить список для автозаполнения оптических терминалов
     * @param query Строка для поиска оптических терминалов
     */
    getOntSuggestions(query: string) {
        return this.sendGet<Ont[]>(`api/private/pon/suggestions/ont`, {query});
    }

    /**
     * Получить оптический терминал по логину пользователя
     * @param login Логин пользователя
     */
    getOntByLogin(login: string) {
        return this.sendGet<Ont | null>(`api/private/pon/ont/login/${login}`);
    }

    /**
     * Получить страницу автоматически включаемых тарифов
     * @param paging
     */
    getAutoTariffList(paging: any) {
        return this.sendPost<Page<AutoTariff>>(`api/private/auto-tariff/list`, paging);
    }

    /**
     * Создать автоматически включаемый тариф
     * @param form Форма с информацией для создания
     */
    createAutoTariff(form: AutoTariffForm) {
        return this.sendPost<AutoTariff>(`api/private/auto-tariff/create`, form);
    }

    /**
     * Редактировать автоматически включаемый тариф
     * @param id Идентификатор редактируемого тарифа
     * @param form Форма с информацией для редактирования
     */
    updateAutoTariff(id: number, form: AutoTariffForm) {
        return this.sendPatch<AutoTariff>(`api/private/auto-tariff/${id}`, form);
    }

    /**
     * Удалить автоматически включаемый тариф
     * @param id Идентификатор удаляемого тарифа
     */
    deleteAutoTariff(id: number) {
        return this.sendDelete(`api/private/auto-tariff/${id}`);
    }

    /**
     * Создать оптическую схему
     * @param form Форма с информацией для создания схемы
     */
    createPonScheme(form: PonForm.Scheme){
        return this.sendPost<PonData.PonScheme>("api/private/pon/scheme/create", form);
    }

    /**
     * Редактировать оптическую схему
     * @param id Идентификатор редактируемой схемы
     * @param form Форма с информацией для редактирования схемы
     */
    updatePonScheme(id: number, form: PonForm.Scheme){
        return this.sendPatch<PonData.PonScheme>(`api/private/pon/scheme/${id}/update`, form);
    }

    /**
     * Удалить оптическую схему по идентификатору
     * @param id Идентификатор удаляемой схемы
     */
    deletePonScheme(id: number){
        return this.sendDelete(`api/private/pon/scheme/${id}/delete`);
    }

    /**
     * Получить оптическую схему по идентификатору
     * @param id Идентификатор оптической схемы
     */
    getPonScheme(id: number){
        return this.sendGet<PonData.PonScheme>(`api/private/pon/scheme/${id}`);
    }

    /**
     * Получить все оптические схемы
     */
    getPonSchemes(){
        return this.sendGet<PonData.PonScheme[]>(`api/private/pon/scheme/list`);
    }

    /**
     * Сохранить отредактированную оптическую схему
     * @param id Идентификатор редактируемой схемы
     * @param elementsData Данные для редактирования
     */
    editPonScheme(id: number, elementsData: any[] | undefined) {
        if (!elementsData || elementsData.length === 0) {
            throw new Error('Не переданы данные для редактирования');
        }
        return this.sendPatch(`api/private/pon/scheme/${id}/edit`, elementsData);
    }

    /**
     * Получить элементы оптической схемы по идентификатору схемы
     * @param id Идентификатор схемы
     */
    getPonSchemeElements(id: number){
        return this.sendGet<PonData.PonNode[]>(`api/private/pon/scheme/${id}/elements`);
    }

    /**
     * Получить все температурные датчики
     */
    getTemperatureSensors(){
        return this.sendGet<TemperatureSensor[]>("api/private/sensor/temperature");
    }

    /**
     * Удалить температурный датчик по идентификатору
     * @param id Идентификатор температурного датчика
     */
    deleteTemperatureSensor(id: number){
        return this.sendDelete(`api/private/sensor/temperature/${id}`);
    }

    /**
     * Сохранить температурные диапазоны датчика
     * @param id Идентификатор температурного датчика
     * @param ranges Диапазоны температур
     */
    patchTemperatureRanges(id: number, ranges: Partial<TemperatureRange>[]){
        return this.sendPatch(`api/private/sensor/temperature/${id}/ranges`, ranges);
    }

    /**
     * Получить график сигнала температурного датчика
     * @param id Идентификатор оптического терминала
     * @param timeRange Диапазон времени для графика сигнала (from, to)
     */
    getTemperatureSensorChart(id: number, timeRange: DateRange) {
        return this.sendPost<any>(`api/private/sensor/temperature/${id}/chart`, timeRange);
    }

    appendTemperatureRange(id: number, value: Partial<TemperatureRange>) {
        return this.sendPost(`api/private/sensor/temperature/${id}/range`, value);
    }

    editTemperatureRange(id: number, value: Partial<TemperatureRange>) {
        return this.sendPatch(`api/private/sensor/temperature/range/${id}`, value);
    }

    deleteTemperatureRange(id: number) {
        return this.sendDelete(`api/private/sensor/temperature/range/${id}`);
    }
}
