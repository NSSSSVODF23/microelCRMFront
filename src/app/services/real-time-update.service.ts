import {Injectable} from '@angular/core';
import {StompClientService} from "./stomp-client.service";
import {finalize, map, Observable, retry, share} from "rxjs";
import {
    AcpCommutator,
    AcpConf,
    BillingConf,
    BillingTotalUserInfo,
    Chat,
    ChatUnreadCounter,
    City,
    ClientEquipment,
    Comment,
    DateRange,
    Department,
    DhcpBinding,
    Employee,
    House,
    INotification,
    PaidAction,
    PaidWork,
    PingMonitoring,
    Position,
    SalaryTable,
    SchedulingType,
    Street,
    SuperMessage,
    Switch,
    SwitchBaseInfo,
    Task,
    TaskEvent,
    TaskTag,
    TelegramConf,
    TreeElementPosition,
    TreeNodeMoveEvent,
    TreeNodeUpdateEvent,
    Wireframe,
    WireframeTaskCounter,
    WorkLog
} from "../types/transport-interfaces";
import {cyrb53} from "../util";
import {OldTracker, SimpleMessage} from "../types/parsing-interfaces";
import {PageType, TasksCatalogPageCacheService} from "./tasks-catalog-page-cache.service";
import {RxStompState} from "@stomp/rx-stomp";
import {BlockIcon, BlockMessage, BlockUiService, BlockZIndex} from "./block-ui.service";

@Injectable({
    providedIn: 'root'
})
export class RealTimeUpdateService {

    // Коллекция действующих observable
    watchCacheMap: { [hash: string]: Observable<any> } = {}
    connectionState$ = this.stomp.connectionState$;

    constructor(private stomp: StompClientService, private blockUiService: BlockUiService) {
        const LOST_CONNECTION_MESSAGE: BlockMessage & BlockZIndex & BlockIcon = {message:'Потеряно соединение с сервером', styleClass:'text-red-400', icon: 'mds-error', pos: 'bottom'};
        this.connectionState$.subscribe({
            next:(state)=> {
                if(state === RxStompState.OPEN)
                    this.blockUiService.unblock()
                else
                    this.blockUiService.block(LOST_CONNECTION_MESSAGE)
            },
            error:()=>this.blockUiService.block(LOST_CONNECTION_MESSAGE),
        })
    }

    commentCreated(taskId: number) {
        return this.watch<Comment>('task', taskId.toString(), 'comment', 'create')
    }

    commentUpdated(taskId: number) {
        return this.watch<Comment>('task', taskId.toString(), 'comment', 'update')
    }

    commentDeleted(taskId: number) {
        return this.watch<Comment>('task', taskId.toString(), 'comment', 'delete')
    }

    taskEventCreated(taskId: number) {
        return this.watch<TaskEvent>('task', taskId.toString(), 'event', 'create')
    }

    employeeCreated() {
        return this.watch<Employee>('employee', 'create')
    }

    employeeUpdated(login?: string) {
        if (login) return this.watch<Employee>('employee', login, 'update')
        return this.watch<Employee>('employee', 'update')
    }

    employeeDeleted() {
        return this.watch<Employee>('employee', 'delete')
    }

    departmentCreated() {
        return this.watch<Department>('department', 'create')
    }

    departmentUpdated(id?: number) {
        if (id) return this.watch<Department>('department', id.toString(), 'update')
        return this.watch<Department>('department', 'update')
    }

    departmentDeleted() {
        return this.watch<Department>('department', 'delete')
    }

    positionCreated() {
        return this.watch<Position>('position', 'create')
    }

    positionUpdated(id?: number) {
        if (id) return this.watch<Position>('position', id.toString(), 'update')
        return this.watch<Position>('position', 'update')
    }

    positionDeleted() {
        return this.watch<Position>('position', 'delete')
    }

    taskTagCreated() {
        return this.watch<TaskTag>('task-tag', 'create')
    }

    taskTagUpdated() {
        return this.watch<TaskTag>('task-tag', 'update')
    }

    taskTagDeleted() {
        return this.watch<TaskTag>('task-tag', 'delete')
    }

    taskUpdated(taskId?: number) {
        if (taskId) return this.watch<Task>('task', taskId.toString(), 'update')
        return this.watch<Task>('task', 'update')
    }

    taskDeleted(taskId?: number) {
        if (taskId) return this.watch<Task>('task', taskId.toString(), 'delete')
        return this.watch<Task>('task', 'delete')
    }

    taskCreated() {
        return this.watch<Task>('task', 'create')
    }

    taskMoved() {
        return this.watch<null>('task', 'moved')
    }

    incomingTaskCreated(login: string) {
        return this.watchUnicast<Task>(login, 'task', 'create')
    }

    incomingTaskDeleted(login: string) {
        return this.watchUnicast<Task>(login, 'task', 'delete')
    }

    notificationCreated(login: string) {
        return this.watchUnicast<INotification>(login, 'notification', 'create')
    }

    notificationUpdated(login: string) {
        return this.watchUnicast<INotification>(login, 'notification', 'update')
    }

    chatMessageCreated(login: string) {
        return this.watchUnicast<SuperMessage>(login, 'chat', 'message', 'create')
    }

    chatMessageCreatedByChat(chatId: number) {
        return this.watch<SuperMessage>('chat', chatId.toString(), 'message', 'create')
    }

    chatMessageUpdated(chatId: number) {
        return this.watch<SuperMessage>('chat', chatId.toString(), 'message', 'update')
    }

    chatMessageDeleted(chatId: number) {
        return this.watch<SuperMessage>('chat', chatId.toString(), 'message', 'delete')
    }

    updateTrackerParserState() {
        return this.watch<OldTracker>('parser', 'tracker', 'update')
    }

    parserMessageReceived() {
        return this.watch<SimpleMessage>('parser', 'message')
    }

    updateCountUnreadMessages(login: string) {
        return this.watchUnicast<ChatUnreadCounter>(login, 'chat', 'message', 'unread')
    }

    chatCreated(login: string) {
        return this.watchUnicast<Chat>(login, 'chat', 'create')
    }

    chatUpdated() {
        return this.watch<Chat>('chat', 'update');
    }

    chatClosed() {
        return this.watch<Chat>('chat', 'close');
    }

    workLogCreated() {
        return this.watch<WorkLog>('worklog', 'create')
    }

    workLogUpdated(workLogId?: number) {
        if (workLogId) return this.watch<WorkLog>('work-log', workLogId.toString(), 'update')
        return this.watch<WorkLog>('worklog', 'update')
    }

    workLogClosed() {
        return this.watch<WorkLog>('worklog', 'close')
    }

    workLogDeleted(workLogId?: number) {
        if (workLogId) return this.watch<WorkLog>('work-log', workLogId.toString(), 'delete')
        return this.watch<WorkLog>('worklog', 'delete')
    }

    wireframeCreated() {
        return this.watch<Wireframe>('wireframe', 'create');
    }

    wireframeUpdated(wireframeId?: number) {
        if (wireframeId) return this.watch<Wireframe>('wireframe', wireframeId.toString(), 'update')
        return this.watch<Wireframe>('wireframe', 'update');
    }

    wireframeDeleted(wireframeId?: number) {
        if (wireframeId) return this.watch<Wireframe>('wireframe', wireframeId.toString(), 'delete')
        return this.watch<Wireframe>('wireframe', 'delete');
    }

    paidActionCreated() {
        return this.watch<PaidAction>('paid-action', 'create')
    }

    paidActionUpdated(paidActionId?: number) {
        if (paidActionId) return this.watch<PaidAction>('paid-action', paidActionId.toString(), 'update')
        return this.watch<PaidAction>('paid-action', 'update')
    }

    paidActionDeleted(paidActionId?: number) {
        if (paidActionId) return this.watch<PaidAction>('paid-action', paidActionId.toString(), 'delete')
        return this.watch<PaidAction>('paid-action', 'delete')
    }

    paidWorksTreeMoved() {
        return this.watch<TreeNodeMoveEvent>('paid-works', 'tree', 'move')
    }

    paidWorksTreeUpdated() {
        return this.watch<TreeNodeUpdateEvent>('paid-works', 'tree', 'update')
    }

    paidWorksTreeCreated() {
        return this.watch<TreeNodeUpdateEvent>('paid-works', 'tree', 'create')
    }

    paidWorksTreeDeleted() {
        return this.watch<TreeNodeUpdateEvent>('paid-works', 'tree', 'delete')
    }

    worksTreeReposition() {
        return this.watch<TreeElementPosition[]>('paid-works', 'tree', 'reposition')
    }

    paidWorkUpdated(id?: number) {
        if (id) return this.watch<PaidWork>('paid-work', id.toString(), 'update')
        return this.watch<PaidWork>('paid-work', 'update')
    }

    cityCreated() {
        return this.watch<City>('city', 'create')
    }

    cityUpdated(id?: number) {
        if (id) return this.watch<City>('city', id.toString(), 'update')
        return this.watch<City>('city', 'update')
    }

    cityDeleted(id?: number) {
        if (id) return this.watch<City>('city', id.toString(), 'delete')
        return this.watch<City>('city', 'delete')
    }

    streetCreated() {
        return this.watch<Street>('street', 'create')
    }

    streetUpdated(id?: number) {
        if (id) return this.watch<Street>('street', id.toString(), 'update')
        return this.watch<Street>('street', 'update')
    }

    streetDeleted(id?: number) {
        if (id) return this.watch<Street>('street', id.toString(), 'delete')
        return this.watch<Street>('street', 'delete')
    }

    houseCreated() {
        return this.watch<House>('house', 'create')
    }

    houseUpdated(id?: number) {
        if (id) return this.watch<House>('house', id.toString(), 'update')
        return this.watch<House>('house', 'update')
    }

    houseDeleted(id?: number) {
        if (id) return this.watch<House>('house', id.toString(), 'delete')
        return this.watch<House>('house', 'delete')
    }

    billingUserUpdated(login?: string) {
        if (login) return this.watch<BillingTotalUserInfo>('billing', 'user', login, 'update')
        return this.watch<BillingTotalUserInfo>('billing', 'user', 'update')
    }

    pingMonitoring(ip: string) {
        return this.watch<PingMonitoring>('monitoring', 'ping', ip)
    }

    billingConfigChanged() {
        return this.watch<BillingConf>('billing-config', 'change')
    }

    telegramConfigChanged() {
        return this.watch<TelegramConf>('telegram-config', 'change')
    }

    acpConfigChanged() {
        return this.watch<AcpConf>('acp-config', 'change')
    }

    salaryTableUpdated() {
        return this.watch<SalaryTable>('salary-table', 'update')
    }

    clientEquipmentsCreated() {
        return this.watch<ClientEquipment>('client-equipment', 'create')
    }

    clientEquipmentsUpdated() {
        return this.watch<ClientEquipment>('client-equipment', 'update')
    }

    clientEquipmentsDeleted() {
        return this.watch<ClientEquipment>('client-equipment', 'delete')
    }

    acpDhcpBindingUpdated() {
        return this.watch<DhcpBinding>('acp', 'dhcp-binding', 'update')
    }

    acpDhcpBindingHousePageUpdateSignal(){
        return this.watch<{ vlan: number }>('acp', 'dhcp-binding', 'house-page', 'update')
    }

    acpCommutatorStatusUpdated() {
        return this.watch<AcpCommutator>('acp', "commutator", "status", "update")
    }

    acpCommutatorCreated() {
        return this.watch<Switch>('acp', "commutator", "create")
    }

    acpCommutatorUpdated() {
        return this.watch<Switch>('acp', "commutator", "update")
    }

    acpCommutatorDeleted() {
        return this.watch<Switch>('acp', "commutator", "delete");
    }

    acpCommutatorsRemoteUpdatePool(){
        return this.watch<Switch[]>('acp', "commutator", "remote-update-pool")
    }

    acpBaseCommutatorCreated() {
        return this.watch<SwitchBaseInfo>('acp', "commutator", "base", "create")
    }

    acpBaseCommutatorUpdated() {
        return this.watch<SwitchBaseInfo>('acp', "commutator", "base", "update")
    }

    acpBaseCommutatorDeleted() {
        return this.watch<SwitchBaseInfo>('acp', "commutator", "base", "delete");
    }

    private watchUnicast<T>(...path: string[]): Observable<T> {
        return this.getObservable<T>('user', ...path);
    }

    private watch<T>(...path: string[]): Observable<T> {
        return this.getObservable<T>('api', ...path);
    }

    // Генерируем хэш наблюдателя по месту назначения

    private getObservable<T>(prefix: string, ...path: string[]): Observable<T> {
        const destination = `/${prefix}/${path.join('/')}`;
        // Генерируем хэш запроса на основе конечной точки и параметров запроса
        const requestHash = this.generateHash(destination);
        // Объявляем результирующий observable
        let observable: Observable<T> | null = null;
        // Если запрос не в кэше, создаем его
        if (!this.watchCacheMap[requestHash]) {
            observable = this.stomp.watch(destination)
                .pipe(
                    finalize(this.deleteFromCache.bind(this, destination)),
                    share(),
                    map(msg => <T>JSON.parse(msg.body)),
                )
            this.watchCacheMap[requestHash] = observable;
        } else {
            // Если запрос в кэше, возвращаем его
            observable = this.watchCacheMap[requestHash];
        }
        return observable;
    }

    // Удаляет observable из кэша

    private generateHash(destination: string) {
        return cyrb53(destination, 0);
    }

    private deleteFromCache(hash: string) {
        delete this.watchCacheMap[hash];
    }

    incomingTaskCountChange(login: string) {
        return this.watchUnicast<WireframeTaskCounter>(login, 'task', 'count', 'change')
    }

    taskCountChange() {
        return this.watch<WireframeTaskCounter>('task', 'count', 'change')
    }

    updateTaskCount(status: string, cls?: number | null,  type?: string | null, pageType?: PageType | null,
                    directory?: number | null, tag?: number | null, dateOfClose?: DateRange | null,
                    actualFrom?: DateRange | null, actualTo?: DateRange | null, scheduling?: SchedulingType | null){

        const PATH = TasksCatalogPageCacheService.convertToPath([status.toLowerCase(), cls??null, type??null, pageType??null,
            directory??null, tag??null, dateOfClose?.timeFrame??null, actualFrom?.timeFrame??null, actualTo?.timeFrame??null, scheduling??null])

        return this.watch<number>('task', 'counter', ...PATH);
    }

    incomingTagTaskCountChange(login: string){
        return this.watchUnicast<{[tagId: number]: {[wireframeId: number]: number}}>(login, 'task', 'tag', 'count', 'change')
    }

    tagTaskCountChange(){
        return this.watch<{[tagId: number]: {[wireframeId: number]: number}}>( 'task', 'tag', 'count', 'change')
    }

    updateFilesDirectory() {
        return this.watch<number>('files', 'directory', 'update')
    }

    afterWorksAppend(login: string) {
        return this.watchUnicast<WorkLog>(login, 'after-work', 'append');
    }

    afterWorksRemoved(login: string) {
        return this.watchUnicast<number>(login, 'after-work', 'remove');
    }
}
