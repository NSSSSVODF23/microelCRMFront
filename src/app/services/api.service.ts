import {Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {catchError, map, Observable, of, share, tap, zip} from "rxjs";
import {
    AcpCommutator,
    AcpConf,
    AcpHouse,
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
    DefaultObservers,
    Department,
    DhcpBinding,
    Employee,
    EmployeeStatus, FdbItem,
    FieldItem,
    FileData, FilesLoadFileEvent, FileSystemItem,
    House,
    INotification, LoadingDirectoryWrapper,
    MessageData,
    ModelItem, NCLHistoryItem, NCLHistoryWrapper, NetworkConnectionLocation,
    NetworkRemoteControl,
    Page,
    PaidAction,
    PaidActionFilter,
    PaidActionForm,
    PaidWork,
    PaidWorkForm,
    PaidWorkGroupForm, PhyPhoneInfo, PhyPhoneInfoForm,
    Position,
    SalaryTable,
    SuperMessage,
    Switch, SwitchBaseInfo, SwitchEditingPreset, SwitchModel, SwitchWithAddress,
    Task,
    TaskCreationBody,
    TaskEvent,
    TaskFieldsSnapshot,
    TaskFiltrationConditions, TaskJournalSortingTypes, TaskStage,
    TaskTag,
    TelegramConf,
    TokenChain,
    TreeDragDropEvent,
    TreeElementPosition, UserEvents,
    Wireframe, WireframeDashboardStatistic,
    WorkingDay,
    WorkLog
} from "../transport-interfaces";
import {MessageService, TreeNode} from "primeng/api";
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

    createWireframe(wireframe: Wireframe): Observable<Wireframe> {
        return this.sendPost('api/private/wireframe', wireframe);
    }

    updateWireframe(wireframe: Wireframe): Observable<Wireframe> {
        return this.sendPatch('api/private/wireframe', wireframe);
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
        return this.sendGet<Page<Task>>(`api/private/tasks/by-login/${login}`, {page});
    }

    getWorkLogsByTaskId(taskId: number): Observable<WorkLog[]> {
        return this.sendGet(`api/private/task/${taskId}/work-logs`);
    }

    getActiveWorkLogs() {
        return this.sendGet<WorkLog[]>('api/private/work-logs/active');
    }

    getCountOfActiveWorkLogs() {
        return this.sendGet<number>('api/private/work-logs/active/count');
    }

    getRootTask(taskId: number): Observable<Task> {
        return this.sendGet<Task>('api/private/task/' + taskId + '/root');
    }

    getFieldsTask(taskId: number): Observable<ModelItem[]> {
        return this.sendGet<ModelItem[]>(`api/private/task/${taskId}/fields`)
    }

    getPageOfTasks(page: number, filter: TaskFiltrationConditions): Observable<Page<Task>> {
        return this.sendGet<Page<Task>>(`api/private/tasks/${page}`, Utils.prepareForHttpRequest(filter));
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

    setAvatar(avatar: string) {
        return this.sendPost<Employee>("api/private/employee/avatar", avatar)
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

    assignInstallersToTask(taskId: number, targetInstallers: { installers: Employee[], description: String }) {
        return this.sendPost("api/private/task/" + taskId + "/assign-installers", targetInstallers);
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

    getTaskTags(queryName?:string | null, includingRemove?: boolean | null) {
        const query: any = {};
        if (queryName) query.query = queryName;
        if (includingRemove !== undefined && includingRemove !== null) query.includingRemove = includingRemove;
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

    getActiveWorkLogByTaskId(taskId: number) {
        return this.sendGetSilent<WorkLog>("api/private/task/" + taskId + "/work-log/active");
    }

    readAllNotifications() {
        return this.sendPatch<void>("api/private/notifications/read-all", {});
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
        return this.sendGet<Page<Task>>(`api/private/tasks/incoming/${page}`, Utils.prepareForHttpRequest(filters));

        // return this.sendGet<Page<Task>>("api/private/tasks/incoming", {
        //     page,
        //     limit,
        //     ...filters
        // });
    }

    getWireframeStages(wireframeId: number) {
        return this.sendGet<TaskStage[]>("api/private/wireframe/" + wireframeId + "/stages");
    }

    getCountIncomingTasks() {
        return this.sendGet<number>("api/private/tasks/incoming/count", {});
    }

    getCountIncomingTasksByWireframeId(wireframeId: number) {
        return this.sendGet<number>("api/private/tasks/incoming/wireframe/" + wireframeId + "/count", {});
    }

    getCountTasksByWireframeIdByTags(wireframeIds: number[]) {
        if(wireframeIds.length === 0)
            return of({} as {[key:string]:number})
        return this.sendGet<{[key:number]:number}>("api/private/tasks/wireframe/by-tags/count", {wireframeIds});
    }

    getCountIncomingTasksByWireframeIdByTags(wireframeIds: number[]) {
        if(wireframeIds.length === 0)
            return of({} as {[key:string]:number})
        return this.sendGet<{[key:number]:number}>("api/private/tasks/incoming/wireframe/by-tags/count", {wireframeIds});
    }

    getCountAllTasksByWireframeId(wireframeId: number) {
        return this.sendGet<number>("api/private/tasks/wireframe/" + wireframeId + "/count", {});
    }

    getCountIncomingTasksByStages(wireframeId: number){
        if(!wireframeId)
            return of({} as {[key:string]:number})
        return this.sendGet<{[key:string]:number}>(`api/private/tasks/incoming/wireframe/${wireframeId}/by-stages/count`, {});
    }

    getCountTasksByStages(wireframeId: number){
        if(!wireframeId)
            return of({} as {[key:string]:number})
        return this.sendGet<{[key:string]:number}>(`api/private/tasks/wireframe/${wireframeId}/by-stages/count`, {});
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

    startAddressParse() {
        return this.sendPost("api/private/parser/addresses/start", {});
    }

    getAddressSuggestions(query: string, isAcpConnected: boolean|null, isHouseOnly: boolean) {
        return this.sendGet<Address[]>("api/private/suggestions/address", {query, isAcpConnected, isHouseOnly});
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
        return this.sendGet<WorkLog[]>('api/private/work-logs/uncalculated');
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

    getBillingUsersByLogin(login: string, isActive: boolean) {
        return this.sendGet<BillingUserItemData[]>(`api/private/billing/users/by-login`, {login, isActive});
    }

    getBillingUsersByFio(query: string, isActive: boolean) {
        return this.sendGet<BillingUserItemData[]>(`api/private/billing/users/by-fio`, {query, isActive});
    }

    getBillingUsersByAddress(address: Address, isActive: boolean) {
        return this.sendGet<BillingUserItemData[]>(`api/private/billing/users/by-address`, {address, isActive});
    }

    getBillingUserInfo(login: string) {
        return this.sendGet<BillingTotalUserInfo>(`api/private/billing/user/${encodeURIComponent(login)}`);
    }

    getBillingUserEvents(login: string) {
        return this.sendGet<UserEvents>(`api/private/billing/user/${encodeURIComponent(login)}/events`);
    }

    makePayment(login: string, paymentForm: any) {
        return this.sendPost(`api/private/billing/user/${encodeURIComponent(login)}/make-payment`, paymentForm);
    }

    setDeferredPayment(login: string) {
        return this.sendPost(`api/private/billing/user/${encodeURIComponent(login)}/deferred-payment`,{});
    }

    startUserService(login: string) {
        return this.sendPost(`api/private/billing/user/${encodeURIComponent(login)}/start-service`,{});
    }

    stopUserService(login: string) {
        return this.sendPost(`api/private/billing/user/${encodeURIComponent(login)}/stop-service`,{});
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
        return this.sendPost(`api/private/street/${streetId}/house`, houseForm);
    }

    editHouse(houseId: number, houseForm: any) {
        return this.sendPatch(`api/private/house/${houseId}`, houseForm);
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

    getLastBindings(page: number, state?: number, macaddr?: string | null, login?: string | null, ip?: string | null, vlan?: number | null, buildingId?: number | null, commutator?: number | null, port?: number|null) {
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
        return this.sendGet<NCLHistoryWrapper>('api/private/acp/dhcp/binding/' + bindingId + '/ncl-history',{});
    }

    getBuildings(query?: string) {
        return this.sendGet<AcpHouse[]>('api/private/acp/buildings', {query});
    }

    getCommutators(page: number, name?: string | null, ip?: string | null, buildingId?: number | null) {
        return this.sendGet<Page<SwitchBaseInfo>>('api/private/acp/commutators/' + page+'/page', {name, ip, buildingId});
    }

    getCommutator(swId: number) {
        return this.sendGet<SwitchWithAddress>('api/private/acp/commutator/' + swId);
    }

    getCommutatorEditingPreset(swId: number) {
        return this.sendGet<SwitchEditingPreset>('api/private/acp/commutator/' + swId+'/editing-preset');
    }

    searchCommutators(query?: string|null) {
        return this.sendGet<SwitchWithAddress[]>('api/private/acp/commutators/search', {query});
    }

    getCommutatorModels(query?: string|null) {
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
        return this.sendGet<BillingConf>('api/private/configuration/billing');
    }

    getTelegramConfiguration() {
        return this.sendGet<TelegramConf>('api/private/configuration/telegram');
    }

    getAcpConfiguration() {
        return this.sendGet<AcpConf>('api/private/configuration/acp');
    }

    setBillingConfiguration(billingConf: BillingConf) {
        return this.sendPost('api/private/configuration/billing', billingConf);
    }

    setTelegramConfiguration(telegramConf: TelegramConf) {
        return this.sendPost('api/private/configuration/telegram', telegramConf);
    }

    setAcpConfiguration(acpConf: AcpConf) {
        return this.sendPost('api/private/configuration/acp', acpConf);
    }

    getClientEquipments(query?: string | null, isDeleted?: boolean | null) {
        return this.sendGet<ClientEquipment[]>('api/private/client-equipments', {query, isDeleted});
    }

    getClientEquipmentsSuggestions(query?: string | null){
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

    getCountingLivesCalculation(form: {[key:string]: any})  {
        return this.sendPost<{ result: string }>(`api/private/billing/counting-lives`, form)
    }

    attachToTask(superMessageId: number, chatId: number, description: string) {
        return this.sendPost(`api/private/chat/${chatId}/message/${superMessageId}/attach-to-task`, {description});
    }

    getFilesRoot(sortingType?: string | null){
        return this.sendGet<FileSystemItem[]>('api/private/files/root', {sortingType});
    }

    getFilesDirectory(id: number, sortingType?: string | null){
        return this.sendGet<LoadingDirectoryWrapper>(`api/private/files/directory/${id}`, {sortingType});
    }

    filesMoveTo(target: number | null, source: number[]){
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

    searchFiles(query: string, sortingType?: string | null){
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

    getPhyPhoneList(){
        return this.sendGet<{ label: string, value: number }[]>('api/private/phy-phone-list');
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

    private generateHash(uri: string, query: any) {
        return cyrb53(uri + JSON.stringify(query), 0);
    }
}
