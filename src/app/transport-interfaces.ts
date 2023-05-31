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
    listViewIndex?: number;
    orderPosition?: number;
}

export enum WireframeType {
    MODEL = "MODEL", PIPELINE = "PIPELINE"
}

export interface Employee {
    login?: string;
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
    departmentId?: number;
    name?: string;
    description?: string;
    created?: string;
    deleted?: boolean;
}

export enum DefaultObserverTargetType {
    EMPLOYEE = "EMPLOYEE", DEPARTMENT = "DEPARTMENT"
}

export interface DefaultObservers {
    targetId: string;
    targetType: DefaultObserverTargetType;
}

export interface Position {
    positionId?: number;
    name?: string;
    description?: string;
    created?: string;
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
    addressData?: Address;
    booleanData?: boolean;
    integerData?: number;
    floatData?: number;
    stringData?: string;
    timestampData?: string;
    phoneData?: { [id: string]: string };
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
}

export interface City {
    cityId?: number;
    name?: string;
    deleted?: boolean;
}

export interface District {
    districtId?: number;
    name?: string;
    deleted?: boolean;
}

export interface Street {
    streetId?: number;
    name?: string;
    prefix?: string;
    city?: City;
    deleted?: boolean;
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
    created?: string;
    creator?: Employee;
    attachments?: Attachment[];
    replyComment?: Comment;
    edited?: boolean;
    deleted?: boolean;
    parent?: Task;
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

export interface ChatMessage{
    chatMessageId: number;
    text: string;
    attachment?: Attachment;
    sendAt: string;
    readByEmployees?: Employee[];
    edited?: string;
    deleted?: string;
    author: Employee;
}

export interface SuperMessage{
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
}

export interface Chat{
    chatId: number;
    title?: string;
    messages: ChatMessage[];
    deleted: boolean;
    created: string;
    creator: Employee;
    members: Employee[];
    updated: string;
    lastMessage: ChatMessage;
}

export interface ChatUnreadCounter{
    chatId: number;
    count: number;
}

export interface WorkReport{
    workReportId: number;
    description: string;
    author: Employee;
    created: string;
}

export interface WorkLog{
    workLogId: number;
    chat: Chat;
    workReports: WorkReport[];
    created: string;
    closed?: string;
    isForceClosed?: boolean;
    employees: Employee[];
    task: Task;
    creator: Employee;
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
