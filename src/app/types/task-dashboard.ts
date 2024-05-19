import {TimeFrame} from "./transport-interfaces";

export interface DashboardItem {
    taskClassId: number;
    taskClassName: string;
    count: number;

    activeTasks: TaskStatusItem[];
    processedTasks: TaskStatusItem[];
    closedTasks: TaskStatusItem[];
    scheduledTasks: TaskStatusItem[];
    deadlinesTasks: TaskStatusItem[];
}

export interface TaskStatusItem {
    statusId: number;
    statusName: string;
    count: number;
    updatePath: string;

    typesItems: TypeItem[];
    tagsItems: TagItem[];
}

export interface TypeItem {
    typeId: number;
    typeName: string;
    count: number;
    updatePath: string;

    directoriesItems: DirectoryItem[];
    timeFramesItems: TimeFrameItem[];
    tagsItems: TagItem[];
}

export interface DirectoryItem {
    directoryId: number;
    directoryName: string;
    count: number;
    updatePath: string;

    tagsItems: TagItem[];
}

export interface TimeFrameItem {
    timeFrame: TimeFrame;
    timeFrameName: string;
    count: number;
    updatePath: string;

    tagsItems: TagItem[];
}

export interface TagItem {
    tagId: number;
    tagName: string;
    color: string;
    count: number;
    updatePath: string;
}
