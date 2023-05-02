import {Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {catchError, map, Observable, share, tap, zip} from "rxjs";
import {
    Attachment,
    Chat,
    ChatMessage,
    City,
    Comment,
    Department,
    Employee,
    EmployeeStatus,
    FieldItem,
    FileData,
    FilterModelItem,
    INotification,
    MessageData,
    ModelItem,
    Page,
    Position,
    Task,
    TaskEvent,
    TaskFieldsSnapshot,
    TaskTag,
    TokenChain,
    Wireframe,
    WorkLog
} from "../transport-interfaces";
import {MessageService} from "primeng/api";
import {cyrb53, Storage, Utils} from "../util";
import {Duration} from "@fullcalendar/core";
import {AddressCorrecting, OldTracker} from "../parsing-interfaces";


@Injectable({
    providedIn: 'root'
})
export class ApiService {

    requestCacheMap: { [hash: string]: Observable<any> } = {}
    loggedIn = false;

    constructor(readonly client: HttpClient, readonly toast: MessageService) {
    }

    getWireframe(id: number) {
        return this.sendGet<Wireframe>('api/private/wireframe/' + id);
    }

    getWireframeFields(id: number) {
        return this.sendGet<FieldItem[]>('api/private/wireframe/' + id + '/fields');
    }

    getWireframes(): Observable<Wireframe[]> {
        return this.sendGet('api/private/wireframes');
    }

    getWireframesNames(): Observable<Wireframe[]> {
        return this.sendGet('api/private/wireframes/names');
    }

    createWireframe(wireframe: Wireframe): Observable<Wireframe> {
        return this.sendPost('api/private/wireframe', wireframe);
    }

    updateWireframe(wireframe: Wireframe): Observable<Wireframe> {
        console.log(wireframe)
        return this.sendPatch('api/private/wireframe', wireframe);
    }

    createTask(task: Task): Observable<Task> {
        return this.sendPost<Task>('api/private/task', task);
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

    getRootTask(taskId: number): Observable<Task> {
        return this.sendGet<Task>('api/private/task/' + taskId + '/root');
    }

    getFieldsTask(taskId: number): Observable<ModelItem[]> {
        return this.sendGet<ModelItem[]>(`api/private/task/${taskId}/fields`)
    }

    getPageOfTasks(page: number, limit: number, mainFilter: any, templateFilter: any): Observable<Page<Task>> {
        return this.sendGet<Page<Task>>('api/private/tasks', {page, limit, ...mainFilter, templateFilter});
    }

    getPageTasksByStatus(page: number, limit: number, status: string[], commonFilteringString?: string, taskCreator?: string, taskCreationDate?: Date[], filterTags?: TaskTag[], exclusionIds?: number[]): Observable<Page<Task>> {
        const query: any = {page, limit, status}
        if (commonFilteringString) query.commonFilteringString = commonFilteringString;
        if (taskCreator) query.taskCreator = taskCreator;
        if (taskCreationDate) query.taskCreationDate = Utils.dateArrayToStringRange(taskCreationDate);
        if (filterTags) query.filterTags = filterTags.map(t => t.taskTagId);
        if (exclusionIds) query.exclusionIds = exclusionIds;
        return this.sendGet<Page<Task>>('api/private/tasks', query);
    }

    getPageTasksByStatusAndTemplate(page: number, limit: number, status: string[], template: number, filters?: { [filterId: string]: FilterModelItem }, filterTags?: TaskTag[], exclusionIds?: number[]) {
        const query: any = {page, limit, status, template}
        if (filters) {
            let filterModelItems = Object.values(filters);
            if (filterModelItems.length > 0 && filterModelItems.some(f => f.value)) {
                query.filters = JSON.stringify(Object.values(filters))
            }
        }
        if (filterTags) query.filterTags = filterTags.map(t => t.taskTagId);
        if (exclusionIds) query.exclusionIds = exclusionIds;
        return this.sendGet<Page<Task>>('api/private/tasks', query);
    }

    getStreets(cityId: number): Observable<any> {
        return this.sendGet('api/private/streets/' + cityId);
    }

    getCities(): Observable<City[]> {
        return this.sendGet('api/private/cities');
    }

    createComment(text: string, taskId: number, files: FileData[], replyComment?: Comment): Observable<Comment> {
        return this.sendPost<Comment>("api/private/comment", {
            taskId,
            text,
            files,
            replyComment
        })
    }

    getComments(taskId: number, offset: number, limit: number): Observable<Page<Comment>> {
        return this.sendGet<Page<Comment>>('api/private/comments', {taskId, offset, limit});
    }

    getTaskJournal(taskId: number, offset: number, limit: number): Observable<Page<Comment | TaskEvent>> {
        return this.sendGet<Page<Comment | TaskEvent>>(`api/private/task/${taskId}/journal`, {offset, limit});
    }

    getEmployees(globalFilter?: string, showDeleted?: boolean, showOffsite?: boolean): Observable<Employee[]> {
        const query: any = {};
        if (globalFilter) query['globalFilter'] = globalFilter;
        if (typeof showDeleted === 'boolean' && !showDeleted) query['showDeleted'] = showDeleted;
        if (typeof showOffsite === 'boolean' && !showOffsite) query['showOffsite'] = showOffsite;
        return this.sendGet('api/private/employees/list', query)
    }

    getEmployeesOptionsList(globalFilter?: string): Observable<any[]> {
        return this.sendGet<any[]>('api/private/employees/list', {globalFilter: globalFilter ?? ""})
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
        return this.sendPost<TokenChain>("api/public/sign-in", formValues)
            .pipe(tap(chain => {
                Storage.save('token', chain.token);
                this.loggedIn = true;
            }))
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

    setAvatar(login?: string, avatar?: string): Observable<string> | undefined {
        if (!login || !avatar) return;
        return this.sendPost<string>("api/private/employee/" + login + "/avatar", {avatar})
    }

    getResponsible(): Observable<(Department | Employee)[]> {
        return zip(this.sendGet<Department[]>("api/private/departments"), this.sendGet<Employee[]>("api/private/employees/list")).pipe(map(arr => arr.flat()), map(arr => arr.filter(i => !i.deleted)))
    }

    getActiveTaskInStage(offset: number, limit: number, templateId: number, stageId: string): Observable<Page<Task>> {
        return this.sendGet<Page<Task>>(`api/private/tasks/template/${templateId}/stage/${stageId}`, {offset, limit});
    }

    getActiveTaskInNullStage(offset: number, limit: number, templateId: number): Observable<Page<Task>> {
        return this.sendGet<Page<Task>>(`api/private/tasks/template/${templateId}/stage`, {offset, limit});
    }

    changeTaskStage(taskId: number, stageId: string): Observable<Task> {
        return this.sendPatch<Task>(`api/private/task/${taskId}/stage`, {stageId})
    }

    getActiveTaskIdsInStage(templateId: number, stageId: string) {
        return this.sendGet<number[]>(`api/private/tasks/template/${templateId}/stage/${stageId}/taskIdOnly`);
    }

    getActiveTaskIdsInNullStage(templateId: number) {
        return this.sendGet<number[]>(`api/private/tasks/template/${templateId}/stage/taskIdOnly`);
    }

    updateComment(editedComment: Comment): Observable<Comment> {
        return this.sendPatch<Comment>("api/private/comment", editedComment);
    }

    deleteComment(commentId: number) {
        return this.sendDelete("api/private/comment/" + commentId);
    }

    getInstallersEmployees() {
        return this.sendGet<Employee[]>("api/private/employees/installers");
    }

    assignInstallersToTask(taskId: number, targetInstallers: Employee[]) {
        return this.sendPost("api/private/task/" + taskId + "/assign-installers", targetInstallers);
    }

    forceCloseWorkLog(taskId: number) {
        return this.sendPost("api/private/task/" + taskId + "/force-close-work-log", {});
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

    getTaskTags(includingRemote?: boolean) {
        const query: any = {};
        if (includingRemote !== undefined) query.includingRemote = includingRemote;
        return this.sendGet<TaskTag[]>("api/private/task-tags", query);
    }

    createTaskTag(taskTag: TaskTag) {
        return this.sendPost<TaskTag>("api/private/task-tag", taskTag);
    }

    modifyTaskTag(taskTag: TaskTag) {
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

    getEditTaskSnapshots(taskId: number) {
        return this.sendGet<TaskFieldsSnapshot[]>("api/private/task/" + taskId + "/edit-snapshots");
    }

    getNotifications(first: number, limit: number, unreadOnly: boolean = false) {
        return this.sendGet<Page<INotification>>("api/private/notifications", {first, limit, unreadOnly});
    }

    getCountOfUnreadNotifications() {
        return this.sendGet<number>("api/private/notifications/unread-count");
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

    readAllNotifications() {
        return this.sendPatch<void>("api/private/notifications/read-all", {});
    }

    changeMyStatus(status: EmployeeStatus) {
        return this.sendPatch<Employee>("api/private/employee/status", status);
    }

    getChatMessages(chatId: number, first: number, limit: number) {
        return this.sendGet<Page<ChatMessage>>("api/private/chat/" + chatId + "/messages", {first, limit});
    }

    getActiveTaskChat(taskId: number) {
        return this.sendGet<Chat>("api/private/task/" + taskId + "/active-chat");
    }

    sendChatMessage(chatId: number, text: string, files: FileData[], replyMessageId: number) {
        return this.sendPost<ChatMessage>("api/private/chat/" + chatId + "/message", {
            text,
            files,
            replyMessageId
        } as MessageData);
    }

    getIncomingTasks(page: number, limit: number, filters: any) {
        return this.sendGet<Page<Task>>("api/private/tasks/incoming", {
            page,
            limit,
            ...filters
        });
    }

    getIncomingTasksCount() {
        return this.sendGet<number>("api/private/tasks/incoming/count", {});
    }

    getScheduledTask(start: string, end: string) {
        return this.sendGet<Task[]>("api/private/tasks/scheduled", {start, end});
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

    // Результаты запросов на сервер кэшируются по таймауту, чтобы не было доп нагрузки на сервер
    private sendGet<T>(uri: string, query?: any) {
        // Генерируем хэш запроса на основе конечной точки и параметров запроса
        const requestHash = this.generateHash(uri, query);
        // Объявляем результирующий observable
        let observable: Observable<T> | null = null;
        // Если запрос не в кэше, создаем его
        if (!this.requestCacheMap[requestHash]) {
            observable = this.client.get<T>(uri, {params: query})
                .pipe(share(), catchError(async (err, caught) => {
                    this.toast.add({severity: 'error', summary: "Ошибка запроса", detail: err.error.message})
                    throw err;
                }));
            this.requestCacheMap[requestHash] = observable;
            // После создания запроса создаем таймер удаляющий его из кэша по таймауту
            setTimeout(() => {
                delete this.requestCacheMap[requestHash];
            }, 10000);
        } else {
            // Если запрос в кэше, возвращаем его
            observable = this.requestCacheMap[requestHash];
        }
        return observable;
    }

    // Результаты запросов на сервер кэшируются по таймауту, чтобы не было доп нагрузки на сервер
    private sendGetSilent<T>(uri: string, query?: any) {
        const requestHash = this.generateHash(uri, query);
        let observable: Observable<T> | null = null;
        if (!this.requestCacheMap[requestHash]) {
            observable = this.client.get<T>(uri, {params: query})
                .pipe(share());
            this.requestCacheMap[requestHash] = observable;
            setTimeout(() => {
                delete this.requestCacheMap[requestHash];
            }, 10000);
        } else {
            observable = this.requestCacheMap[requestHash];
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

    // Генерируем хэш запроса по URI и параметрам запроса
    private generateHash(uri: string, query: any) {
        return cyrb53(uri + JSON.stringify(query), 0);
    }
}
