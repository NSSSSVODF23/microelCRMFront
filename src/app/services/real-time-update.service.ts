import {Injectable} from '@angular/core';
import {StompClientService} from "./stomp-client.service";
import {finalize, map, Observable, share} from "rxjs";
import {
    AcpCommutator,
    AcpConf,
    BillingConf,
    Chat,
    ChatUnreadCounter,
    City, ClientEquipment,
    Comment,
    Department, DhcpBinding,
    Employee,
    House,
    INotification,
    PaidAction,
    PaidWork,
    PingMonitoring,
    Position, SalaryTable, SalaryTableCell,
    Street,
    SuperMessage, Switch,
    Task,
    TaskEvent,
    TaskTag,
    TelegramConf,
    TreeElementPosition,
    TreeNodeMoveEvent,
    TreeNodeUpdateEvent,
    Wireframe,
    WorkLog
} from "../transport-interfaces";
import {cyrb53} from "../util";
import {OldTracker, SimpleMessage} from "../parsing-interfaces";

@Injectable({
    providedIn: 'root'
})
export class RealTimeUpdateService {

    // Коллекция действующих observable
    watchCacheMap: { [hash: string]: Observable<any> } = {}

    constructor(readonly stomp: StompClientService) {
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

    incomingTaskCreated(login: string) {
        return this.watchUnicast<Task>(login, 'task', 'create')
    }

    notificationCreated(login: string) {
        return this.watchUnicast<INotification>(login, 'notification', 'create')
    }

    notificationUpdated(login: string) {
        return this.watchUnicast<INotification>(login, 'notification', 'update')
    }

    chatMessageCreated(chatId?: number) {
        if (!chatId) return this.watch<SuperMessage>('chat', 'message', 'create')
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
}
