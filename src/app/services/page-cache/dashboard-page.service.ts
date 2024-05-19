import {Injectable} from '@angular/core';
import {ApiService} from "../api.service";
import {RealTimeUpdateService} from "../real-time-update.service";
import {DashboardItem, TaskStatusItem, TypeItem} from "../../types/task-dashboard";
import {LoadingState, TimeFrame} from "../../types/transport-interfaces";
import {Router} from "@angular/router";

@Injectable({
    providedIn: 'root'
})
export class DashboardPageService {

    dashboardItems: DashboardItem[] = [] as DashboardItem[];
    loading = LoadingState.LOADING;

    constructor(private api: ApiService, private rt: RealTimeUpdateService, private router: Router) {
        this.api.getTaskDashboard().subscribe({
            next: data => {
                this.dashboardItems = data;
                if(data.length === 0)
                    this.loading = LoadingState.EMPTY;
                else
                    this.loading = LoadingState.READY;
            },
            error: err => {
                this.loading = LoadingState.ERROR;
            }
        });
        this.rt.updateCachedTaskCounter().subscribe(data => {
            // console.log(data);
            for (const item of this.dashboardItems) {
                for (const statusItem of item.activeTasks) {
                    if (statusItem.updatePath === data.conditions.id) {
                        statusItem.count = data.count;
                        break;
                    }
                    for (const typeItem of statusItem.typesItems) {
                        if (typeItem.updatePath === data.conditions.id) {
                            typeItem.count = data.count;
                            break;
                        }
                        for (const directionItem of typeItem.directoriesItems) {
                            if (directionItem.updatePath === data.conditions.id) {
                                directionItem.count = data.count;
                                break;
                            }
                            for (const tagItem of directionItem.tagsItems) {
                                if (tagItem.updatePath === data.conditions.id) {
                                    tagItem.count = data.count;
                                    break;
                                }
                            }
                        }
                        for (const tagItem of typeItem.tagsItems) {
                            if (tagItem.updatePath === data.conditions.id) {
                                tagItem.count = data.count;
                                break;
                            }
                        }
                    }
                }
                for (const statusItem of item.processedTasks) {
                    if (statusItem.updatePath === data.conditions.id) {
                        statusItem.count = data.count;
                        break;
                    }
                    for (const typeItem of statusItem.typesItems) {
                        if (typeItem.updatePath === data.conditions.id) {
                            typeItem.count = data.count;
                            break;
                        }
                        for (const tagItem of typeItem.tagsItems) {
                            if (tagItem.updatePath === data.conditions.id) {
                                tagItem.count = data.count;
                                break;
                            }
                        }
                    }
                }
                for (const statusItem of item.closedTasks) {
                    if (statusItem.updatePath === data.conditions.id) {
                        statusItem.count = data.count;
                        break;
                    }
                    for (const typeItem of statusItem.typesItems) {
                        if (typeItem.updatePath === data.conditions.id) {
                            typeItem.count = data.count;
                            break;
                        }
                        for (const timeItem of typeItem.timeFramesItems) {
                            if (timeItem.updatePath === data.conditions.id) {
                                timeItem.count = data.count;
                                break;
                            }
                            for (const tagItem of timeItem.tagsItems) {
                                if (tagItem.updatePath === data.conditions.id) {
                                    tagItem.count = data.count;
                                    break;
                                }
                            }
                        }
                    }
                }
                for (const statusItem of item.scheduledTasks) {
                    if (statusItem.updatePath === data.conditions.id) {
                        statusItem.count = data.count;
                        break;
                    }
                    for (const typeItem of statusItem.typesItems) {
                        if (typeItem.updatePath === data.conditions.id) {
                            typeItem.count = data.count;
                            break;
                        }
                        for (const timeItem of typeItem.timeFramesItems) {
                            if (timeItem.updatePath === data.conditions.id) {
                                timeItem.count = data.count;
                                break;
                            }
                            for (const tagItem of timeItem.tagsItems) {
                                if (tagItem.updatePath === data.conditions.id) {
                                    tagItem.count = data.count;
                                    break;
                                }
                            }
                        }
                    }
                }
                for (const statusItem of item.deadlinesTasks) {
                    if (statusItem.updatePath === data.conditions.id) {
                        statusItem.count = data.count;
                        break;
                    }
                    for (const typeItem of statusItem.typesItems) {
                        if (typeItem.updatePath === data.conditions.id) {
                            typeItem.count = data.count;
                            break;
                        }
                        for (const timeItem of typeItem.timeFramesItems) {
                            if (timeItem.updatePath === data.conditions.id) {
                                timeItem.count = data.count;
                                break;
                            }
                            for (const tagItem of typeItem.tagsItems) {
                                if (tagItem.updatePath === data.conditions.id) {
                                    tagItem.count = data.count;
                                    break;
                                }
                            }
                        }
                    }
                }
            }
        });
    }

    followTheLink(updatePath: string) {
        if(!updatePath || updatePath.length === 0) throw new Error('Invalid update path');
        const splitPath = updatePath.split('/');
        let path;
        if(splitPath.length > 1) {
            switch (splitPath[0]) {
                case 'EXCEPT_PLANNED':
                    if(splitPath.length > 4)
                        path = ['/tasks/catalog/active/', ...splitPath.slice(2,4), 'dir', ...splitPath.slice(4)];
                    else
                        path = ['/tasks/catalog/active/',...splitPath.slice(2)];
                    this.router.navigate(path, {}).then();
                    break;
                case 'PLANNED':
                    if(splitPath.length > 4)
                        path = ['/tasks/catalog/scheduled/active/', ...splitPath.slice(2,4), 'actual-time', ...splitPath.slice(4)];
                    else
                        path = ['/tasks/catalog/scheduled/active/',...splitPath.slice(2)];
                    this.router.navigate(path, {}).then();
                    break;
            }
        }
    }

    doneTasksToday(dashboardItem: DashboardItem): number {
        return dashboardItem.closedTasks.reduce((acc, item) => this.reduceStatusItem(acc, item, TimeFrame.TODAY), 0);
    }

    doneTasksYesterday(dashboardItem: DashboardItem): number {
        return dashboardItem.closedTasks.reduce((acc, item) => this.reduceStatusItem(acc, item, TimeFrame.YESTERDAY), 0);
    }

    doneTasksThisWeek(dashboardItem: DashboardItem): number {
        return dashboardItem.closedTasks.reduce((acc, item) => this.reduceStatusItem(acc, item, TimeFrame.THIS_WEEK), 0);
    }

    doneTasksThisMonth(dashboardItem: DashboardItem): number {
        return dashboardItem.closedTasks.reduce((acc, item) => this.reduceStatusItem(acc, item, TimeFrame.THIS_MONTH), 0);
    }

    doneTasksLastWeek(dashboardItem: DashboardItem): number {
        return dashboardItem.closedTasks.reduce((acc, item) => this.reduceStatusItem(acc, item, TimeFrame.LAST_WEEK), 0);
    }

    doneTasksLastMonth(dashboardItem: DashboardItem): number {
        return dashboardItem.closedTasks.reduce((acc, item) => this.reduceStatusItem(acc, item, TimeFrame.LAST_MONTH), 0);
    }

    private reduceStatusItem(acc: number, statusItem: TaskStatusItem, targetTimeFrame: TimeFrame): number {
        return statusItem.typesItems.reduce((acc, item) => this.reduceTypeItem(acc, item, targetTimeFrame), acc);
    }

    private reduceTypeItem(acc: number, typeItem: TypeItem, targetTimeFrame: TimeFrame): number {
        return typeItem.timeFramesItems.reduce((acc, item) => {
            if (item.timeFrame === targetTimeFrame) {
                acc += item.count;
            }
            return acc;
        }, acc);
    }
}
