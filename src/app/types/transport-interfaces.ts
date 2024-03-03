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
    COUNTING_LIVES = "COUNTING_LIVES",
    PASSPORT_DETAILS = "PASSPORT_DETAILS",
}

export interface TaskStage {
    stageId: string;
    label: string;
    orderIndex: number;
    oldTrackerBind?: any;
    directories: TaskTypeDirectory[];
}

export interface TaskTypeDirectory{
    taskTypeDirectoryId: number;
    name: string;
    description: string;
    orderIndex?: number;
}

export type TagListItem = {id: number, name: string, count: number}

export interface OldTrackerBind {
    oldTrackerBindId: number;
    classId: number;
    initialStageId: number;
    processingStageId: number;
    manualCloseStageId: number;
    autoCloseStageId: number;
    fieldDataBinds: FieldDataBind[];
    assignFieldDataBinds: FieldDataBind;
}

export interface FieldDataBind {
    fieldDataBindId: number;
    fieldItemId: string;
}

export interface AddressFieldDataBind extends FieldDataBind {
    streetFieldId: number;
    houseFieldId: number;
    apartmentFieldId: number;
    entranceFieldId: number;
    floorFieldId: number;
}

export interface AdSourceFieldDataBind extends FieldDataBind {
    adSourceFieldId: number;
}

export interface ConnectionTypeFieldDataBind extends FieldDataBind {
    connectionServicesInnerFieldId: string;
    ctFieldDataBind: number;
}

export interface DateFieldDataBind extends FieldDataBind {
    dateFieldDataBind: number;
}

export interface DateTimeFieldDataBind extends FieldDataBind {
    dateTimeFieldDataBind: number;
}

export interface DefaultFieldDataBind extends FieldDataBind {
    defaultFieldId: number;
}

export interface InstallersHardAssignFieldDataBind extends FieldDataBind {
    hardAssignTimeFieldId: number;
    hardAssignNamesFieldId: number;
}

export interface InstallersSimpleAssignFieldDataBind extends FieldDataBind {
    simpleAssignFieldId: number;
}

export interface TextFieldDataBind extends FieldDataBind {
    textFieldId: number;
}

export interface TaskClassOT {
    id: number;
    name: string;
    stages: TaskStageOT[];
    fields: TaskFieldOT[];
}

export interface TaskStageOT {
    id: number;
    name: string;
    type: TaskStageOTTypes;
}

export enum TaskStageOTTypes{
    ARCHIVE = 0,
    ACTIVE = 1,
}

export interface TaskFieldOT {
    id: number;
    name: string;
    type: TaskFieldOTTypes;
}

export enum TaskFieldOTTypes{
    TEXT = 0,
    STREET = 1,
    DEFAULT = 2,
    DATE = 3,
    DATETIME = 4,
    AD_SOURCE = 5,
    CONNECTION_TYPE = 6,
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
    countTask?: number;
    documentTemplates?: any[];
}

export interface WireframeDashboardStatistic{
    taskCount: DataPair[];
    taskCountByStage: DataPair[];
    worksDone: DataPair[];
    taskCountByTags: DataPair[];
}

export interface DataPair{
    label: string;
    value: any;
    color?: string;
    lcolor?: string;
    vcolor?: string;
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
    displayType?: string;
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
    telegramGroupChatId?: string | null;
    inventory?: InventoryItem[];
    offsite?: boolean;
    responsibilitiesTasks?: Task[];
    deleted?: boolean;
    status?: EmployeeStatus;
    lastSeen?: string;
    phyPhoneInfo?: PhyPhoneInfo;
    oldTrackerCredentials?: OldTrackerCredentials;
    base781Credentials?: Credentials;
    base1785Credentials?: Credentials;
    base1783Credentials?: Credentials;
}

export interface Credentials {
    username: string;
    password: string;
}

export interface OldTrackerCredentials extends Credentials{
    installerId: string;
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
    closed?: string;
    lastComments?: Comment[];
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
    currentDirectory?: TaskTypeDirectory;
    fields?: ModelItem[];
    pipelineWireframes?: Wireframe[];
    pipelines?: Pipeline[];
    parent?: number;
    children?: Task[];
    // Список полей для отображения в элементе списка
    listItemFields: ModelItem[];
    oldTrackerTaskId?: number;
    oldTrackerTaskClassId?: number;
    oldTrackerCurrentStageId?: number;
}

/**
 * Интерфейс для передачи данных о фильтрации задач на сервер
 */
export interface TaskFiltrationConditions {
    status?: string[] | null;
    template?: number[] | null;
    templateFilter?: FilterModelItem[] | null;
    fieldFilters?: TaskFieldFilter[] | null;
    searchPhrase?: string | null;
    author?: string | null;
    assignedEmployee?: string | null;
    dateOfCreation?: DateRange | null;
    exclusionIds?: number[] | null;
    tags?: number[] | null;
    onlyMy?: boolean | null;
    limit?: number | null;
    page?: number | null;
    stage?: string | null;
    directory?: number | null;
    schedulingType?: 'ALL' | 'SCHEDULED' | 'UNSCHEDULED' | 'PLANNED' | 'DEADLINE' | 'EXCEPT_PLANNED' | null;
    dateOfClose?: DateRange | null;
    actualFrom?: DateRange | null;
    actualTo?: DateRange | null;
}

export interface TaskFieldFilter{
    type: FilteringType;
    textValue?: string;
    addressValue?: Address;
    adSourceValue?: AdvertisingSource;
    connectionTypeValue?: ConnectionType;
    connectionServiceValue?: number;
}

export enum FilteringType{
    TEXT = "TEXT",
    LOGIN = "LOGIN",
    ADDRESS = "ADDRESS",
    PHONE = "PHONE",
    AD_SOURCE = "AD_SOURCE",
    CONNECTION_TYPE = "CONNECTION_TYPE",
    CONNECTION_SERVICE = "CONNECTION_SERVICE"
}

export enum AdvertisingSource {
    RESUMPTION = "RESUMPTION",
    LOSS = "LOSS",
    MAIL = "MAIL",
    LEAFLET = "LEAFLET",
    SOUND = "SOUND",
    RADIO = "RADIO",
    SOCIALNET = "SOCIALNET",
    BANNER = "BANNER",
    KITH = "KITH",
    SMS = "SMS",
    INTERNET = "INTERNET",
    MANAGER = "MANAGER",
    EARLYUSED = "EARLYUSED"
}

export enum ConnectionType{
    NEW = "NEW",
    RESUMPTION = "RESUMPTION",
    TRANSFER = "TRANSFER"
}

/**
 * Интерфейс для создания задачи
 */
export interface TaskCreationBody {
    wireframeId: number;
    fields: ModelItem[];
    childId?: number;
    parentId?: number;
    initialComment?: string;
    tags?: TaskTag[];
    observers?: DefaultObservers[];
    type?: string;
    directory?: number;
    isDuplicateInOldTracker?: boolean;
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
    tasksCount?: number;
    unbindAfterClose: boolean;
}

export interface ModelItem {
    modelItemId: number;
    id: string;
    name?: string;
    wireframeFieldType: WireframeFieldType;
    variation?: string;
    displayType?: string;
    addressData?: Address;
    booleanData?: boolean;
    integerData?: number;
    floatData?: number;
    stringData?: string;
    timestampData?: string;
    phoneData?: { [id: string]: string };
    connectionServicesData?: { connectionService: string }[];
    equipmentRealizationsData?: ClientEquipmentRealization[];
    passportDetailsData?: PassportDetails;
    textRepresentation?: string;
}

export interface PassportDetails {
    passportDetailsId: number;
    passportSeries: string;
    passportNumber: string;
    passportIssuedBy: string;
    passportIssuedDate: string;
    departmentCode: string;
    registrationAddress: string;
}

export interface Address {
    addressId?: number;
    city?: City;
    district?: District;
    street?: Street;
    houseId?: number | null;
    houseNum?: number | null;
    fraction?: number | null;
    letter?: string | null;
    build?: number | null;
    entrance?: number | null;
    floor?: number | null;
    apartmentNum?: number | null;
    apartmentMod?: string | null;
    addressName?: string | null;
    acpHouseBind?: AcpHouse | null;
    streetNamePart?: string | null;
    tailPart?: string | null;
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

export interface StreetSuggestion {
    cityId: number;
    streetId: number;
    name: string;
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
    createdAt?: string;
    modifiedAt?: string;
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
    MOVED_TO_DIRECTORY = "MOVED_TO_DIRECTORY"
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
    wireframeFieldType: string;
    name: string;
    value: any;
}

export interface DateRange {
    timeFrame?: TimeFrame | null;
    start?: Date | null;
    end?: Date | null;
}

export enum SchedulingType{
    ALL = "ALL",
    SCHEDULED = "SCHEDULED",
    UNSCHEDULED = "UNSCHEDULED",
    PLANNED = "PLANNED",
    DEADLINE = "DEADLINE",
    EXCEPT_PLANNED = "EXCEPT_PLANNED",
}

export interface UserTariff{
    id: number;
    name: string;
    cost: number;
    description: string;
    disabled?: boolean;
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
    awaitingWriting: boolean;
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
    targetFiles: WorkLogTargetFile[];
    targetDescription?: string;
    isReportsUncompleted: boolean;
    lastAcceptedTimestamp?: string;
    //    private Boolean taskIsClearlyCompleted;
    // private List<Contract> concludedContracts;
    taskIsClearlyCompleted?: boolean;
    concludedContracts: Contract[];
}

export interface WorkLogTargetFile {
    workLogTargetFileId: number;
    name: string;
    mimeType: string;
    type: AttachmentType;
    size: number;
    createdAt: string;
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

export interface TokenChainWithUserInfo {
    tokenChain: TokenChain;
    employee: Employee;
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
    isPaidWork: boolean;
    amountOfMoneyTaken: number;
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
    stateName: string;
    stateColor: string;
}

export interface BillingPaymentForm {
    sum: number;
    payType: BillingPayType;
    comment: string;
}

export enum BillingPayType {
    REFUND = 3,
    CREDIT = 4,
    SERVICE = 11
}

export interface UserEvents {
    uname: string;
    fromDate: string;
    events: UserEventLog[];
    pays: UserPaysLog[];
    tarifs: UserTariffLog[];
}

export interface UserEventLog {
    evdate: string;
    evtime: string;
    evTimeStamp: string;
    xtype: number;
    lastuse: string;
    uname: string;
    money: number;
    coment: string;
    price: number;
    event: string;
    edate: string;
    hdate: string;
    info: string;
    eventName: string;
    eventColor: string;
    moneyDirection: number;
}

export interface UserPaysLog {
    bmoney: number;
    uname: string;
    money: number;
    pdate: string;
    ptype: number;
    cmt: string;
    who: string;
}

export interface UserTariffLog {
    lasttime: string;
    uname: string;
    mdate: string;
    service: string;
    price: number;
    stype: number;
    adate: string;
    state: number;
    edate: string;
    hdate: string;
    iExt: string;
}

export interface ClientEquipment {
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

export interface ClientEquipmentRealization {
    clientEquipmentRealizationId: number;
    equipment: ClientEquipment;
    count: number;
}

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
    userStatusName: string;
    userStatusColor: string;
    isPossibleEnableDeferredPayment: boolean;
    isServiceSuspended: boolean;
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

export interface PingMonitoring {
    ip: string;
    reachablePercentage: number;
    delayAvg: number;
    isReachable: boolean;
    chartData: any;
}

export interface BillingConf {
    host: string;
    port: number;
    login: string;
    password: string;
    selfIp: string;
}

export interface TelegramConf {
    botToken: string;
    botName: string;
    dhcpNotificationChatId: string;
}

export interface AcpConf {
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
    lastConnectionLocation?: NetworkConnectionLocation;
}

export interface AcpUserBriefLogin{
    login: string;
    uname: string;
    ipaddr: string;
    lastUse: string;
    ctime: string;
    state: number;
}

export interface AcpUserBriefAccount{
    uname: string;
    utype: string;
    ndog: string;
    login: string;
    addr: string;
    fio: string;
    comment: string;
    phone: string;
}

export interface AcpUserBriefBalance{
    bmoney: string;
    bcredit: string;
    btraf: string;
    btime: string;
    deferredPay: boolean;
}

export interface AcpUserBriefTariff{
    serviceN: number;
    service: string;
    uname: string;
    login: string;
    price: number;
    hdate: string;
    edate: string;
    adate: string;
    mdate: string;
    state: number;
    isMain: string;
    last: string;
    autorun: string;
    stype: string;
    iExt: string;
}

export interface AcpUserBrief {
    address?: string;
    statusName: string;
    statusColor: string;
}

export interface DhcpSessions {
    id: number;
    authName: string;
    macaddr: string;
    ipaddr: string;
    evTime: string;
    evType: string;
    description: string;
}

export interface DhcpLogsRequest {
    logs: DhcpLog[];
    isLast: boolean;
    currentPage: number;
}

export interface DhcpLog {
    startDatetime: string;
    endDatetime: string;
    type: 'SIMPLE_ONLINE' | 'SIMPLE_OFFLINE' | 'REPEATED' | 'EMPTY';
    description: string;
    numberRepetitions: number;
    macAddresses: string;
}

export interface NetworkConnectionLocation {
    id: number;
    commutatorName: string;
    commutatorIp: string;
    commutatorId: number;
    portName: string;
    portId: number;
    vid: number;
    vlanName: string;
    dhcpBindingId: number;
    isLast: boolean;
    createdAt: Date;
    checkedAt: Date;
    isHasLink: boolean;
    portSpeed?: PortSpeed;
    lastPortCheck?: Date;
}

export interface NCLHistoryWrapper{
    from: string;
    to: string;
    nclItems: {
        [nclId: string]: NCLHistoryItem[];
    }
}

export interface NCLHistoryItem {
    nclId: number;
    color: string;
    borderColor: string;
    connectionName: string;
    commutatorId: number;
    bindingId: number;
    timeStart: string;
    timeEnd: string;
    percentStart: number;
    percentEnd: number;
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

export interface SwitchBaseInfo {
    id: number;
    name: string;
    ip: string;
    isOnline: boolean;
    modelId: number;
    model: string;
    type: number;
    isHasError: boolean;
    errorMessage: string;
}

export interface SwitchEditingPreset {
    targetCommutator: Switch;
    address: Address;
    model: SwitchModel;
    uplinkCommutator: SwitchWithAddress;
}

export interface AcpCommutator {
    acpCommutatorId: number;
    externalId: number;
    available: boolean;
    lastUpdate: Date;
    deleted: boolean;
    systemInfo?: SystemInfo;
    ports?: PortInfo[];
    remoteUpdateLogs?: RemoteUpdateLog[];
    isLastUpdateError: boolean;
    lastErrorMessage: string;
}

export interface RemoteUpdateLog {
    remoteUpdateLogId: number;
    isError: boolean;
    message: string;
    timestamp: string;
}

export interface SystemInfo {
    systemInfoId: number;
    device: string;
    mac?: string;
    hwVersion: string;
    fwVersion: string;
    uptime?: number;
    lastUpdate: Date;
}

export interface FdbItem {
    fdbItemId: number;
    vid: number;
    vlanName: string;
    mac: string;
    portId: number;
    dynamic: boolean;
    dhcpBinding?: DhcpBinding;
}

export interface PortInfo {
    portInfoId: number;
    status: PortStatus;
    name: string;
    speed?: PortSpeed;
    force: boolean;
    type: InterfaceType;
    portType: PortType;
    uptime?: number;
    description?: string;
    portId?: number;
}

export enum PortStatus {
    UP = "UP",
    DOWN = "DOWN",
    ADMIN_DOWN = "ADMIN_DOWN",
    PREPARE = "PREPARE"
}

export enum PortSpeed {
    HALF10 = "HALF10",
    FULL10 = "FULL10",
    HALF100 = "HALF100",
    FULL100 = "FULL100",
    HALF1000 = "HALF1000",
    FULL1000 = "FULL1000"
}

export enum InterfaceType {
    ETHERNET = "ETHERNET",
    GIGABIT = "GIGABIT",
    TENGIGABIT = "TENGIGABIT"
}

export enum PortType {
    COPPER = "COPPER",
    FIBER = "FIBER",
    PON = "PON"
}

export enum TimeFrame {
    NEXT_MONTH = "NEXT_MONTH",
    NEXT_WEEK = "NEXT_WEEK",
    TOMORROW = "TOMORROW",
    TODAY = "TODAY",
    YESTERDAY = "YESTERDAY",
    THIS_WEEK = "THIS_WEEK",
    LAST_WEEK = "LAST_WEEK",
    THIS_MONTH = "THIS_MONTH",
    LAST_MONTH = "LAST_MONTH"
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

export interface CommutatorListItem{
    id: number;
    ip: string;
    name: string;
    model: string;
    type: string;
    uplink?: CommutatorListItem;
}

export interface AcpHouse {
    streetId: number;
    streetName: string;
    buildingId: number;
    houseNum: string;
    fullName: string;
    uplink?: AcpHouse;
    downlinks?: AcpHouse[];
    networks?: Network[];
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

export enum TaskJournalSortingTypes {
    CREATE_DATE_ASC = "CREATE_DATE_ASC",
    CREATE_DATE_DESC = "CREATE_DATE_DESC"
}

export interface WireframeTaskCounter{
    id: number;
    num: number;
    stages: {id:string, num: number}[]
}

export interface FileSystemItem{
    discriminator: string | null;
    fileSystemItemId: number;
    name: string;
    size?: number;
    createdAt?: string;
    modifiedAt?: string;
    parent: Directory | null;
}

export interface Directory extends FileSystemItem{
    fileCount: number;
}

export interface TFile extends FileSystemItem{
    mimeType: string | null;
    sizeMbyte: number;
    type: AttachmentType;
}

export interface FileSuggestion {
    id: number;
    name: string;
    type: AttachmentType;
    path: string;
}

export interface FilesLoadFileEvent {
    name: string;
    data: number[];
    targetDirectoryId?: number | null;
}

export interface LoadingDirectoryWrapper{
    path: Directory[];
    files: FileSystemItem[];
}

export interface PhyPhoneInfo{
    phyPhoneInfoId: number;
    ip: string;
    login: string;
    password: string;
    model: PhyPhoneModel;
}

export interface PhyPhoneInfoForm{
    employeeLogin?: string | null;
    ip?: string | null;
    login?: string | null;
    password?: string | null;
    model?: PhyPhoneModel | null;
}

export enum PhyPhoneModel{
    NEW = "NEW",
    OLD = "OLD"
}

export interface CreateUserForm{
    address: Address;
    fullName: string;
    phone: string;
    userType: UserType;
}

export enum UserType {
    PHY = "обычн.",
    ORG = "орг."
}

export interface EmployeeWorkLogs{
    employees: Employee[];
    active: WorkLog | null;
    unactive: WorkLog[];
}

export interface TypesOfContracts{
    typeOfContractId: number;
    name: string;
    description?: string;
    receivers: Employee[];
    archivers: Employee[];
    createdBy: EmployeeIntervention;
    updatedBy: EmployeeIntervention;
    deletedBy: EmployeeIntervention;
    isDeleted: boolean;
}

export interface TypesOfContractsForm{
    name: string;
    description?: string;
    receivers: string[];
    archivers: string[];
}

export interface TypesOfContractsSuggestion{
    label: string;
    value: number;
}

export interface Contract{
    contractId: number;
    typeOfContract: TypesOfContracts;
    count: number;
    received?: EmployeeIntervention;
    archived?: EmployeeIntervention;
}

export namespace Statistics{

    export interface EmployeeWorkStatisticsForm{
        period: DateRange;
    }

    export interface EmployeeWorkStatisticsTable{
        rows: FlatEmployeeRow[];
        taskCountChart: any;
        timingsChart: any;
        moneyChart: any;
    }

    // export interface EmployeeRow{
    //     employee: Employee;
    //     rows: TaskClass[];
    // }

    export interface TaskClass{
        name: string;
        rows: TaskType[];
    }

    export interface TaskType{
        name: string;
        count: number;
        quantityPerShift: number;
        timings: Timings;
        money: Money;
    }

    export interface Timings{
        givenAndReceived: number;
        givenAndClosed: number;
        receivedAndClosed: number;
    }

    export interface Money{
        quantityPerShift: number;
        quantityPerHour: number;
    }

    //        public static class FlatEmployeeRow {
    //             @Nullable
    //             private Employee employee;
    //             private Integer employeeRowSpanCount;
    //             @Nullable
    //             private String className;
    //             private Integer taskClassRowSpanCount;
    //             private EmployeeRow.TaskClass.TaskType taskType;
    //
    //             public static FlatEmployeeRow of(Employee employee, Integer classCount, String className, Integer taskTypeCount, EmployeeRow.TaskClass.TaskType taskType) {
    //                 FlatEmployeeRow row = new FlatEmployeeRow();
    //                 row.employee = employee;
    //                 row.employeeRowSpanCount = classCount;
    //                 row.className = className;
    //                 row.taskClassRowSpanCount = taskTypeCount;
    //                 row.taskType = taskType;
    //                 return row;
    //             }
    //         }
    export interface FlatEmployeeRow {
        employee?: Employee;
        employeeRowSpanCount: number;
        className?: string;
        taskClassRowSpanCount: number;
        taskType: TaskType;
    }
}

export interface TopologyStreet {
    streetName: string;
    houses: TopologyHouse[];
    highlighted?: boolean;
}

export interface TopologyHouse {
    buildingId: number;
    houseNum: string;
    highlighted?: boolean;
}

export interface TelnetConnectionCredentials {
    name: string;
    ip: string;
    sessionId: string;
    lastState: string;
}

export interface DynamicTableColumn {
    field: string;
    title: string;
    isSort: boolean;
    filterType?: string;
}

export interface DynamicTableCell {
    type: DynamicTableCellType;
    value: string;
}

export enum DynamicTableCellType{
    STRING = "STRING",
    DATE = "DATE",
    LOGIN = "LOGIN",
    PHONE = "PHONE",
}
