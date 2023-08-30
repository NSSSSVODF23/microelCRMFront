import {Subscription} from "rxjs";

export enum WireframeFieldType {
    BOOLEAN = "BOOLEAN",
    SMALL_TEXT = "SMALL_TEXT",
    LARGE_TEXT = "LARGE_TEXT",
    INTEGER = "INTEGER",
    FLOAT = "FLOAT",
    ADDRESS = "ADDRESS",
    LOGIN = "LOGIN",
    AD_SOURCE = "AD_SOURCE",
    REQUEST_INITIATOR = "REQUEST_INITIATOR",
    IP = "IP",
    EQUIPMENTS = "EQUIPMENTS",
    CONNECTION_SERVICES = "CONNECTION_SERVICES",
    CONNECTION_TYPE = "CONNECTION_TYPE",
    PHONE_ARRAY = "PHONE_ARRAY",
}

export interface TaskStage {
    stageId: string;
    label: string;
    orderIndex: number;
}

export interface Wireframe {
    wireframeId: number;
    wireframeType: WireframeType;
    name: string;
    description: string;
    steps: StepItem[];
    defaultObservers?: DefaultObservers[];
    created: string;
    creator: Employee;
    deleted: boolean;
    listViewType?: string;
    detailedViewType?: string;
    stages?: TaskStage[];
    allFields?: FieldItem[];
}

export interface StepItem {
    id: number;
    name: string;
    fields: FieldItem[];
}

export interface FieldItem {
    id: string;
    name: string;
    type: WireframeFieldType;
    variation?: string;
    listViewIndex?: number;
    orderPosition?: number;
}

export enum WireframeType {
    MODEL = "MODEL", PIPELINE = "PIPELINE"
}

export interface Employee {
    login: string;
    department?: Department;
    position?: Position;
    avatar?: string;
    secondName?: string;
    firstName?: string;
    lastName?: string;
    fullName?: string;
    internalPhoneNumber?: string;
    access?: number;
    password?: string;
    created?: string;
    telegramUserId?: string;
    inventory?: InventoryItem[];
    offsite?: boolean;
    responsibilitiesTasks?: Task[];
    deleted?: boolean;
    status?: EmployeeStatus;
    lastSeen?: string;
}

export interface Department {
    departmentId: number;
    name: string;
    description?: string;
    created: string;
    deleted?: boolean;
}

export enum DefaultObserverTargetType {
    EMPLOYEE = "EMPLOYEE", DEPARTMENT = "DEPARTMENT"
}

export interface DefaultObservers {
    targetId: string;
    targetName: string;
    targetType: DefaultObserverTargetType;
}

export interface Position {
    positionId: number;
    name: string;
    description?: string;
    created: string;
    access?: number;
    deleted?: boolean;
}

export interface InventoryItem {
    inventoryItemId?: number;
    count?: number;
    stuff?: Stuff;
}

export interface Stuff {
    stuffId?: number;
    group?: ItemsGroup;
    photo?: string;
    name?: string;
    description?: string;
    buyPrice?: number;
    rentPrice?: number;
    instalmentsPrice?: number;
    instalmentsMonth?: number;
    purchasePrice?: number;
    deleted?: boolean;
}

export interface ItemsGroup {
    itemsGroupId?: number;
    name?: string;
    description?: string;
    parent?: ItemsGroup;
}

export interface Task {
    allEmployeesObservers: Employee[];
    taskId: number;
    created?: string;
    updated?: string;
    lastComment?: Comment;
    creator?: Employee;
    comments?: Comment[];
    taskEvents?: TaskEvent[];
    actualFrom?: string;
    actualTo?: string;
    deleted?: boolean;
    responsible?: Employee;
    employeesObservers?: Employee[];
    departmentsObservers?: Department[];
    taskStatus?: TaskStatus;
    group?: TaskGroup;
    tags?: TaskTag[];
    modelWireframe?: Wireframe;
    currentStage?: TaskStage;
    fields?: ModelItem[];
    pipelineWireframes?: Wireframe[];
    pipelines?: Pipeline[];
    parent?: number;
    children?: Task[];
    // Список полей для отображения в элементе списка
    listItemFields: ModelItem[];
}

/**
 * Интерфейс для передачи данных о фильтрации задач на сервер
 */
export interface TaskFiltrationConditions {
    status?: TaskStatus[] | null;
    template?: number[] | null;
    templateFilter?: string | null;
    searchPhrase?: string | null;
    author?: string | null;
    dateOfCreation?: string[] | null;
    exclusionIds?: number[] | null;
    tags?: number[] | null;
    onlyMy?: boolean | null;
}

/**
 * Интерфейс для создания задачи
 */

export interface TaskCreationBody {
    wireframeId: number;
    fields: ModelItem[];
    childId?: number;
    parentId?: number;
}

export class TimestampItem {
    timestamp: Date | undefined;
    count: number | undefined;
}

export enum SeverityType {
    INFO = "INFO", SUCCESS = "SUCCESS", WARNING = "WARNING", DANGER = "DANGER"
}

export enum TaskStatus {
    ACTIVE = "ACTIVE", PROCESSING = "PROCESSING", CLOSE = "CLOSE"
}

export interface TaskGroup {
    groupId: number;
    parent: TaskGroup;
    name: string;
    description: string;
}

export interface TaskTag {
    taskTagId: number;
    name: string;
    color: string;
    deleted: boolean;
    created?: string;
    creator?: Employee;
    task?: Task[];
}

export interface ModelItem {
    modelItemId: number;
    id: string;
    name?: string;
    wireframeFieldType: WireframeFieldType;
    variation?: string;
    addressData?: Address;
    booleanData?: boolean;
    integerData?: number;
    floatData?: number;
    stringData?: string;
    timestampData?: string;
    phoneData?: { [id: string]: string };
    connectionServicesData?: { connectionService: string }[];
    equipmentRealizationsData?: ClientEquipmentRealization[];
    textRepresentation?: string;
}

export interface Address {
    addressId?: number;
    city?: City;
    district?: District;
    street?: Street;
    houseNum?: number;
    fraction?: number;
    letter?: string;
    build?: number;
    entrance?: number;
    floor?: number;
    apartmentNum?: number;
    apartmentMod?: string;
    addressName?: string;
    acpHouseBind?: AcpHouse;
}

export interface City {
    cityId: number;
    name: string;
    deleted?: boolean;
}

export interface District {
    districtId?: number;
    name?: string;
    deleted?: boolean;
}

export interface Street {
    streetId: number;
    name: string;
    altNames?: string;
    billingAlias?: string;
    prefix: string;
    city: City;
    deleted?: boolean;
    nameWithPrefix: string;
    streetName: string;
}

export interface House {
    houseId: number;
    houseNum: number;
    fraction?: number;
    letter?: string;
    build?: number;
    houseName: string;
    addressName: string;
    streetId: number;
    isApartmentHouse: boolean;
    acpHouseBind: AcpHouse;
    place?: Place;
}

export interface Place {
    placeId: number;
    latitude: number;
    longitude: number;
}

export interface Pipeline {
    pipelineId: number;
    wireframe: Wireframe;
    currentStage: number;
    stages: PipelineItem[];
    deleted: boolean;
}

export interface PipelineItem {
    pipelineItemId: number;
    parentPipeline: Pipeline;
    index: number;
    innerName: string;
    name: string;
    description: string;
    wireframeFieldType: WireframeFieldType;
    data: string;
    processed: string;
    skip: boolean;
}

export interface Page<T> {
    content: T[];
    empty: boolean;
    first: boolean;
    last: boolean;
    number: number;
    numberOfElements: number;
    pageable: { offset: number, sort: { empty: boolean, sorted: boolean, unsorted: boolean }, pageSize: number, pageNumber: number, paged: boolean, unpaged: boolean }
    size: number;
    sort: { empty: boolean, sorted: boolean, unsorted: boolean }
    totalElements: number;
    totalPages: number;
}

export interface Comment {
    commentId: number;
    message: string;
    created: string;
    creator: Employee;
    attachments?: Attachment[];
    replyComment?: Comment;
    edited?: boolean;
    deleted?: boolean;
    parent: Task;
    // Отчищенное от форматирования сообщение
    simpleText: string;
}

export interface Attachment {
    name?: string;
    mimeType?: string;
    type?: AttachmentType;
    size?: number;
    created?: string;
    modified?: string;
}

export enum AttachmentType {
    PHOTO = "PHOTO", VIDEO = "VIDEO", DOCUMENT = "DOCUMENT", AUDIO = "AUDIO", FILE = "FILE"
}

export enum ContentType {
    VISUAL = "VISUAL",
    AUDIO = "AUDIO",
    FILE = "FILE"
}

export enum TaskEventType {
    CHANGE_STAGE = "CHANGE_STAGE",
    CREATE_WORK_LOG = "CREATE_WORK_LOG",
    FORCE_CLOSE_WORK_LOG = "FORCE_CLOSE_WORK_LOG",
    CLOSE_WORK_LOG = "CLOSE_WORK_LOG",
    CHANGE_RESPONSIBILITY = "CHANGE_RESPONSIBILITY",
    LINKED_TO_PARENT_TASK = "LINKED_TO_PARENT_TASK",
    UNLINKED_FROM_PARENT_TASK = "UNLINKED_FROM_PARENT_TASK",
    UNLINK_CHILD_TASK = "UNLINK_CHILD_TASK",
    LINKED_TO_CHILD_TASKS = "LINKED_TO_CHILD_TASKS",
    CHANGE_TAGS = "CHANGE_TAGS",
    CLEAN_TAGS = "CLEAN_TAGS",
    CHANGE_OBSERVERS = "CHANGE_OBSERVERS",
    UNBIND_RESPONSIBLE = "UNBIND_RESPONSIBLE",
    CHANGE_ACTUAL_FROM = "CHANGE_ACTUAL_FROM",
    CHANGE_ACTUAL_TO = "CHANGE_ACTUAL_TO",
    CLEAR_ACTUAL_FROM_TASK = "CLEAR_ACTUAL_FROM_TASK",
    CLEAR_ACTUAL_TO_TASK = "CLEAR_ACTUAL_TO_TASK",
    CLOSE_TASK = "CLOSE_TASK",
    REOPEN_TASK = "REOPEN_TASK",
    EDIT_FIELDS = "EDIT_FIELDS",
    REPORT_CREATED = "REPORT_CREATED",
}

export interface TaskEvent {
    taskEventId: number;
    type: TaskEventType;
    message: string;
    created: string;
    creator: Employee;
    newStage?: TaskStage;
    eventTask?: Task;
    tasks?: Task[];
    employee?: Employee;
}

export interface TaskFieldsSnapshot {
    taskFieldsSnapshotId: number;
    beforeEditing: ModelItem[];
    afterEditing: ModelItem[];
    task: Task;
    whoEdited: Employee;
    whenEdited: string;
}

export interface FilterModelItem {
    id: string;
    wireframeFieldType: WireframeFieldType;
    value: any;
}

export interface DateRange {
    start: Date | string | undefined;
    end: Date | string | undefined;
}

export interface FileData {
    name: string;
    modified: number;
    data: number[];
    type?: string;
}

export interface MessageData {
    text?: string;
    files?: FileData[];
    replyMessageId?: number;
}

export interface CommentData {
    taskId: number;
    text: string;
    files: FileData[];
}

export enum LongPollEventType {
    NULL = "NULL",
    COMMENT_CREATED = "COMMENT_CREATED",
    TASK_EVENT_CREATED = "TASK_EVENT_CREATED",
    COMMENT_UPDATED = "COMMENT_UPDATED",
    COMMENT_DELETED = "COMMENT_DELETED",
    TASK_UPDATED = "TASK_UPDATED",
}

export interface LongPollEvent<T> {
    type: LongPollEventType;
    payload: T;
    created: string;
}

export interface ChatMessage {
    chatMessageId: number;
    text: string;
    attachment?: Attachment;
    sendAt: string;
    readByEmployees?: Employee[];
    edited?: string;
    deleted?: string;
    author: Employee;
}

export interface SuperMessage {
    superMessageId: number;
    text: string;
    attachments: Attachment[];
    edited?: string;
    deleted: boolean;
    author: Employee;
    replyTo: SuperMessage;
    sendAt: string;
    readByEmployees?: Employee[];
    includedMessages: number[];
    attachmentType?: ContentType;
    isMediaGroup: boolean;
    parentChatId: number;
    descriptionOfAttachment?: string;
}

export interface Chat {
    chatId: number;
    title?: string;
    messages: ChatMessage[];
    deleted: boolean;
    created: string;
    creator: Employee;
    members: Employee[];
    updated: string;
    closed?: string;
    lastMessage: ChatMessage;
}

export interface ChatUnreadCounter {
    chatId: number;
    count: number;
}

export interface WorkReport {
    workReportId: number;
    description: string;
    author: Employee;
    created: string;
}

export interface WorkLog {
    status: "ACTIVE" | "CLOSE" | "FORCE_CLOSE";
    whoAccepted: Employee[];
    whoClosed: Employee[];
    whoActive: Employee[];
    report: string;
    leadTime: number;
    forceClosedReason?: string;
    workLogId: number;
    chat: Chat;
    workReports: WorkReport[];
    created: string;
    closed?: string;
    isForceClosed?: boolean;
    employees: Employee[];
    task: Task;
    creator: Employee;
    calculated: boolean;
    targetDescription?: string;
}

export enum NotificationType {
    TASK_CREATED = "TASK_CREATED",
    TASK_EDITED = "TASK_EDITED",
    TASK_CLOSED = "TASK_CLOSED",
    TASK_DELETED = "TASK_DELETED",
    TASK_PROCESSED = "TASK_PROCESSED",
    TASK_REOPENED = "TASK_REOPENED",
    TASK_STAGE_CHANGED = "TASK_STAGE_CHANGED",
    YOU_RESPONSIBLE = "YOU_RESPONSIBLE",
    YOU_OBSERVER = "YOU_OBSERVER",
    NEW_COMMENT = "NEW_COMMENT",
    TASK_HAS_BECOME_ACTUAL = "TASK_HAS_BECOME_ACTUAL",
    TASK_EXPIRED = "TASK_EXPIRED",
    WORKS_COMPLETED = "WORKS_COMPLETED",
    REPORT_RECEIVED = "REPORT_RECEIVED",
    MENTIONED_IN_TASK = "MENTIONED_IN_TASK",
}

export interface INotification {
    notificationId: number;
    type: NotificationType;
    message: string;
    created: string;
    unread: boolean;
    whenRead?: string;
    employee: Employee;
}

export interface TokenChain {
    token: string;
    refreshToken: string;
}

export enum EmployeeStatus {
    ONLINE = "ONLINE",
    AWAY = "AWAY",
    OFFLINE = "OFFLINE"
}

export enum LoadingState {
    READY = "READY",
    LOADING = "LOADING",
    ERROR = "ERROR",
    EMPTY = "EMPTY"
}

export interface PaidAction {
    paidActionId: number;
    identifier: string;
    name: string;
    description?: string;
    created: string;
    creator: Employee;
    edited: boolean;
    deleted: boolean;
    unit: PaidActionUnit;
    cost: number;
}

export enum PaidActionUnit {
    AMOUNT = "AMOUNT",
    METRES = "METRES",
    KILOGRAMS = "KILOGRAMS"
}

export interface PaidActionForm {
    name: string;
    description?: string;
    unit: PaidActionUnit;
    cost: number;
}

export interface PaidActionFilter {
    nameQuery?: string;
    includeDeleted?: boolean;
}

export interface PaidWorkGroup {
    paidWorkGroupId: number;
    name: string;
    description?: string;
    isRoot: boolean;
    childrenGroups: PaidWorkGroup[];
}

export interface PaidWorkGroupForm {
    name: string;
    description?: string;
    parentGroupId?: number;
}

export interface PaidWork {
    paidWorkId: number;
    name: string;
    description?: string;
    position: number;
    actions: PaidActionTemplate[];
    path: number[];
}

export interface PaidWorkForm {
    name: string;
    description?: string;
}

export interface TreeNodeMoveEvent {
    sourcePath: number[];
    targetPath: number[];
    object: TreeNodeDto;
}

export interface TreeNodeUpdateEvent {
    path: number[];
    object: TreeNodeDto;
}

export class TreeDragDropEvent {
    source: TreeNodeDto;
    target: TreeNodeDto | null = null;
    index: number | null = null;

    constructor(event: any) {
        const dragNode = event.dragNode;
        const dropNode = event.dropNode;
        this.index = event.index;
        this.source = new TreeNodeDto(dragNode);
        if (dropNode.children && dropNode.children.includes(dragNode)) {
            this.target = new TreeNodeDto(dropNode);
        } else {
            this.target = dropNode.parent ? new TreeNodeDto(dropNode.parent) : null;
        }
    }
}

export class TreeNodeDto {
    key!: string;
    label!: string;
    icon!: string;
    // data!: any;
    type!: string;

    // children!: TreeNodeDto[]

    constructor(node: any) {
        this.key = node.key;
        this.label = node.label;
        this.icon = node.icon;
        // this.data = node.data;
        this.type = node.type;
        // this.children = node.children;
    }
}

export interface PaidActionTemplate {
    paidActionTemplateId: number;
    action: PaidAction;
    count: number;
}

export interface PaidActionTemplateForm {
    actionId: number;
    count: number;
}

export interface TreeElementPosition {
    id: number;
    type: string;
    position: number;
    path?: number[];
}

export interface WorkActionFormItem {
    workName: string;
    workId: number;
    actionName: string;
    count: number;
    unit: PaidActionUnit;
    price: number;
    cost: number;
    actionId: number;
}

export interface WorkCalculationForm {
    workLogId: number;
    emptyDescription?: string;
    actions: WorkActionFormItem[];
    spreading: SpreadingItem[];
    editingDescription?: string;
}

export interface EmployeeIntervention {
    employeeInterventionId: number;
    employee: Employee;
    timestamp: string;
    description?: string;
}

export interface SpreadingItem {
    login: string;
    ratio: number;
    factorsActions: FactorAction[];
}

export interface FactorAction {
    name: string;
    factor: number;
    actionUuids: string[];
}

export interface ActionTaken {
    actionTakenId: number;
    workName: string;
    paidAction: PaidAction;
    count: number;
    uuid: string;
}

export interface WorkCalculation {
    workCalculationId: number;
    workLog: WorkLog;
    actions: ActionTaken[];
    employee: Employee;
    ratio: number;
    factorsActions: FactorAction[];
    created: string;
    creator: Employee;
    empty: boolean;
    emptyDescription: string;
    sum: number;
    sumWithoutNDFL: number;
    lastEdit?: EmployeeIntervention;
}

export interface WorkingDay {
    workingDayId: number;
    date: string;
    employee: Employee;
    calculations: WorkCalculation[]
}

export interface SalaryTableCell {
    employee: Employee;
    sumWithNDFL: number;
    sumWithoutNDFL: number;
    date: Date;
}

export interface SalaryTableTotalCell {
    employee: Employee;
    sumWithNDFL: number;
    sumWithoutNDFL: number;
}

export interface SalaryTable {
    headers: string[];
    employees: Employee[];
    payload: SalaryTableCell[][];
    totalSum: SalaryTableTotalCell[];
    totalSumAllEmployees: SalaryTableTotalCell;
}

export interface BillingUserItemData {
    tarif: string;
    uname: string;
    last: string;
    phone: string;
    coment: string;
    utype: string;
    state: string;
    addr: string;
    fio: string;
}

export interface ClientEquipment{
    clientEquipmentId: number;
    name: string;
    description: string;
    price: number;
    created: string;
    creator: Employee;
    editedBy: Employee[];
    deleted: boolean;
    lastEdit: EmployeeIntervention;
}

export interface ClientEquipmentRealization{
    clientEquipmentRealizationId: number;
    equipment: ClientEquipment;
    count: number;
}

// @Getter
// @Setter
// public static class UserMainInfo {
//     private String addr;
//     private String coment;
//     private Float credit;
//     private Date ddog;
//     private String fio;
//     private Float money;
//     private String ndog;
//     private String phone;
//
//     public static UserMainInfo from(Object o) {
//     SimpleDateFormat format = new SimpleDateFormat("yyyy-MM-dd");
//     UserMainInfo u = new UserMainInfo();
//     Map<String,String> map = (Map<String,String>) o;
//     u.addr = map.get("addr");
//     u.coment = map.get("coment");
//     u.credit = Float.valueOf(map.get("credit"));
//     try {
//     u.ddog = format.parse(map.get("ddog"));
// } catch (ParseException e) {
//     u.ddog = null;
// }
// u.fio = map.get("fio");
// u.money = Float.valueOf(map.get("money"));
// u.ndog = map.get("ndog");
// u.phone = map.get("phone");
// return u;
// }
// }
//
// @Getter
// @Setter
// public static class UserNewTarif {
//     private String cntDhcp;
//     private String cntVpn;
//     private String dstate;
//     private Date edate;
//     private Date endstate;
//     private String extIp;
//     private Date hdate;
//     private String intIp;
//     private String ipDhcp;
//     private String ipNat;
//     private String ipUser;
//     private String ipVpn;
//     private Date last;
//     private Date lastDhcp;
//     private Date lastVpn;
//     private String ndog;
//     private Integer online;
//     private Integer pstate;
//     private Integer speed;
//     private Integer staj;
//     private Integer state;
//     private String tarif;
//     private Integer tspeed;
//     private Integer tstate;
//     private String uname;
//     private String xservice;
//
//     public static UserNewTarif from(Object o) {
//     SimpleDateFormat format = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
//
//     UserNewTarif u = new UserNewTarif();
//     Map<String,String> map = (Map<String,String>) o;
//     u.cntDhcp = map.get("cnt_dhcp");
//     u.cntVpn = map.get("cnt_vpn");
//     u.dstate = map.get("dstate");
//     try {
//     u.edate = format.parse(map.get("edate"));
// } catch (ParseException e) {
//     u.edate = null;
// }
// try {
//     u.endstate = format.parse(map.get("endstate"));
// } catch (ParseException e) {
//     u.endstate = null;
// }
// u.extIp = map.get("ext_ip");
// try {
//     u.hdate = format.parse(map.get("hdate"));
// } catch (ParseException e) {
//     u.hdate = null;
// }
// u.intIp = map.get("int_ip");
// u.ipDhcp = map.get("ip_dhcp");
// u.ipNat = map.get("ip_nat");
// u.ipUser = map.get("ip_user");
// u.ipVpn = map.get("ip_vpn");
// try {
//     u.last = format.parse(map.get("last"));
// } catch (ParseException e) {
//     u.last = null;
// }
// try {
//     u.lastDhcp = format.parse(map.get("last_dhcp"));
// } catch (ParseException e) {
//     u.lastDhcp = null;
// }
// try {
//     u.lastVpn = format.parse(map.get("last_vpn"));
// } catch (ParseException e) {
//     u.lastVpn = null;
// }
// u.ndog = map.get("ndog");
// u.online = Integer.valueOf(map.get("online"));
// u.pstate = Integer.valueOf(map.get("pstate"));
// u.speed = Integer.valueOf(map.get("speed"));
// u.staj = Integer.valueOf(map.get("staj"));
// u.state = Integer.valueOf(map.get("state"));
// u.tarif = map.get("tarif");
// u.tspeed = Integer.valueOf(map.get("tspeed"));
// u.tstate = Integer.valueOf(map.get("tstate"));
// u.uname = map.get("uname");
// u.xservice = map.get("xservice");
//
// return u;
// }
// }
//
// @Getter
// @Setter
// public static class OldTarifItem {
//     private Date adate;
//     private Date edate;
//     private Date hdate;
//     private String iExt;
//     private Date mdate;
//     private Float price;
//     private String service;
//     private Integer state;
//     private Integer stype;
//
//     public static OldTarifItem from(Object o) {
//     SimpleDateFormat format = new SimpleDateFormat("yyyy-MM-dd");
//
//     OldTarifItem u = new OldTarifItem();
//     Map<String,String> map = (Map<String,String>) o;
//     try {
//     u.adate = format.parse(map.get("adate"));
// } catch (ParseException e) {
//     u.adate = null;
// }
// try {
//     u.edate = format.parse(map.get("edate"));
// } catch (ParseException e) {
//     u.edate = null;
// }
// try {
//     u.hdate = format.parse(map.get("hdate"));
// } catch (ParseException e) {
//     u.hdate = null;
// }
// u.iExt = map.get("i_ext");
// try {
//     u.mdate = format.parse(map.get("mdate"));
// } catch (ParseException e) {
//     u.mdate = null;
// }
// u.price = Float.valueOf(map.get("price"));
// u.service = map.get("service");
// u.state = Integer.valueOf(map.get("state"));
// u.stype = Integer.valueOf(map.get("stype"));
// return u;
// }
// }
//
// @Getter
// @Setter
// public static class TotalUserInfo {
//     private UserMainInfo ibase;
//     private Integer karma;
//     private UserNewTarif newTarif;
//     private List<OldTarifItem> oldTarif;
//     private String state;
//     private String uname;
//
//     public static TotalUserInfo from(Object o) {
//     TotalUserInfo u = new TotalUserInfo();
//     Map<String,Object> map = (Map<String,Object>) o;
//     u.ibase = UserMainInfo.from(map.get("ibase"));
//     u.karma = Integer.valueOf((String) map.get("karma"));
//     u.newTarif = UserNewTarif.from(map.get("new_tarif"));
//     Object[] oTarifs = (Object[]) map.get("old_tarif");
//     u.oldTarif = Stream.of(oTarifs).map(OldTarifItem::from).collect(Collectors.toList());
//     u.state = (String) map.get("state");
//     u.uname = (String) map.get("uname");
//     return u;
// }
// }

export interface BillingUserMainInfo {
    addr: string;
    coment: string;
    credit: number;
    ddog: Date;
    fio: string;
    money: number;
    ndog: string;
    phone: string;
}

export interface BillingUserNewTarif {
    cntDhcp: number;
    cntVpn: number;
    dstate: number;
    edate: Date;
    endstate: Date;
    extIp: string;
    hdate: Date;
    intIp: string;
    ipDhcp: string;
    ipNat: string;
    ipUser: string;
    ipVpn: string;
    last: Date;
    lastDhcp: Date;
    lastVpn: Date;
    ndog: string;
    online: number;
    pstate: number;
    speed: number;
    staj: number;
    state: number;
    tarif: string;
    tspeed: number;
    tstate: number;
    uname: string;
    xservice: string;
}

export interface BillingOldTarifItem {
    adate: Date;
    edate: Date;
    hdate: Date;
    iExt: string;
    mdate: Date;
    price: number;
    service: string;
    state: number;
    stype: number;
}

export interface BillingTotalUserInfo {
    ibase: BillingUserMainInfo;
    karma: number;
    newTarif: BillingUserNewTarif;
    oldTarif: BillingOldTarifItem[];
    state: string;
    uname: string;
}

export interface PingMonitoring{
    ip: string;
    reachablePercentage: number;
    delayAvg: number;
    isReachable: boolean;
    chartData: any;
}

export interface BillingConf{
    host: string;
    port: number;
    login: string;
    password: string;
    selfIp: string;
}

export interface TelegramConf{
    botToken: string;
    botName: string;
    dhcpNotificationChatId: string;
}

export interface AcpConf{
    acpFlexConnectorEndpoint: string;
}

export interface Area {
    id: number;
    name: string;
}

export interface Building {
    id: number;
    streetId: number;
    houseNum: string;
    areaId: number;
    entrances: number;
    storeys: number;
    flats: number;
    uplinkId: number;
    hofficeId: number;
    hcommitee: string;
    description: string;
    status: number;
}

export interface DhcpBinding {
    id: number;
    state: number;
    bindtype: number;
    macaddr: string;
    vlanid: number;
    nid: number;
    nidSlot: string;
    ipaddr: string;
    netmask: number;
    gw: string;
    dhcpRelayid: string;
    dhcpPortid: number;
    dhcpClient: string;
    dhcpHostname: string;
    dhcpFlags: number;
    dhcpRoutesid: number;
    authName: string;
    authDate: number;
    authExpire: number;
    hashdata: string;
    natRuleid: number;
    description: string;
    scriptname: string;
    bindGroup: string;
    creationTime: number;
    leaseStart: number;
    leaseExpire: number;
    sessionTime: number;
    isAuth: boolean;
    onlineStatus: string;
    buildingId?: number;
    houseNum?: string;
    streetId?: number;
    streetName?: string;
}

export interface DhcpSetting {
    id: string;
    authLeaseTime: number;
    leaseTime: number;
    enableNewBind: number;
    primaryDns: string;
    secondaryDns: string;
    firstFreeslot: number;
    lastFreeslot: number;
    randomFreeslot: number;
    filterDbLog: string;
    voidAuthName: string;
    voidAuthExpire: number;
    defaultHostname: string;
    defaultClient: string;
    defaultSessionTime: number;
    defaultRemoteId: string;
    authExpire: number;
}

export interface Hoffice {
    id: number;
    name: string;
    addr: string;
    dispatcher: string;
}

export interface LogBuilding {
    id: number;
    buildingsId: number;
    logDate: Date;
    logType: number;
    memo: string;
    author: string;
    status: number;
}

export interface MacService {
    id: number;
    type: number;
    macaddr: string;
    device: string;
    owner: string;
}

export interface NatLog {
    id: number;
    login: string;
    natUptime: Date;
    natDowntime: Date;
    natSestime: Date;
    natInternalip: string;
    natExternalip: string;
}

export interface NatRule {
    id: number;
    internalip: string;
    externalip: string;
    serverid: number;
    natPort: number;
    shapeClassid: number;
    shapePrio: number;
    shapeIn: number;
    shapeOut: number;
}

export interface Network {
    id: number;
    vid: number;
    network: string;
    nettype: number;
    dhcpSubnets: number;
    dhcpCustomMask: number;
    dhcpCustomGw: string;
    dhcpOpt82Autodetect: number;
    dhcpRelayIp: string;
    description: string;
    status: number;
    dhcpRoute: string;
    dhcpValDefaults: number;
}

export interface Operator {
    id: number;
    login: string;
    passw: string;
    privilage: number;
    email: string;
    lastIp: string;
    lastLog: Date;
}

export interface OpLog {
    id: number;
    opId: number;
    opLogin: string;
    opIp: string;
    opUa: string;
    action: string;
    url: string;
    postData: string;
    headers: string;
    dateof: Date;
    actionObject: string;
}

export interface StreetAcp {
    id: number;
    name: string;
    status: number;
}

export interface Switch {
    id: number;
    name: string;
    swtype: number;
    swmodelId: number;
    ipaddr: string;
    protocol: number;
    login: string;
    passw: string;
    buildId: number;
    entrance: number;
    storey: number;
    phyUplinkId: number;
    description: string;
    status: number;
    enableMonitor: number;
    enableSms: number;
    enableBackup: number;
    address?: Address;
    additionalInfo?: AcpCommutator;
}

export interface AcpCommutator{
    acpCommutatorId: number;
    externalId: number;
    available: boolean;
    lastUpdate: Date;
    deleted: boolean;
}

export interface SwitchWithAddress {
    commutator: Switch;
    address: AcpHouse;
    label: string;
    value: number;
}

export interface SwitchModel {
    id: number;
    name: string;
    portsCount: number;
    status: number;
}

export interface Switchport {
    id: number;
    swid: number;
    port: number;
    ptype: number;
    isuplink: number;
    description: string;
}

export interface AcpHouse{
    streetId: number;
    streetName: string;
    buildingId: number;
    houseNum: string;
    fullName: string;
}

export interface NetworkRemoteControl {
    ip: string;
    webPort: number;
    telnetPort: number;
    sshPort: number;
    hasAccess: boolean;
}

export class CacheUnit<T> {
    page!: Page<T>;
    state: LoadingState = LoadingState.LOADING;
    createSubscription!: Subscription;
    updateSubscription!: Subscription;
    deleteSubscription!: Subscription;
    pageNumber!: number;
    filters: any;
}
