import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import {ApiService} from "../../services/api.service";
import {Task, Wireframe} from "../../transport-interfaces";
import {Utils} from "../../util";
import {fade} from "../../animations";
import {OverlayPanel} from "primeng/overlaypanel";
import {Subscription} from "rxjs";
import {RealTimeUpdateService} from "../../services/real-time-update.service";

const LIMIT_TASK_LOAD = 10;

@Component({
    templateUrl: './stages-page.component.html', styleUrls: ['./stages-page.component.scss'], animations: [fade]
})
export class StagesPageComponent implements OnInit, OnDestroy {

    wireframe?: Wireframe;
    tasks: { [stageId: string]: Task[] } = {}
    tasksCount: { [stageId: string]: number } = {};
    tasksLoading: { [stageId: string]: boolean } = {};
    checkedTasks: number[] = [];
    selectedStageToMove?: string;
    @ViewChild('taskMovePanel') taskMovePanel!: OverlayPanel;
    taskMoving: boolean = false;

    anyTaskUpdatingSub?: Subscription;

    constructor(readonly api: ApiService, readonly route: ActivatedRoute, readonly rt: RealTimeUpdateService) {
    }

    ngOnInit(): void {
        this.route.params.subscribe(params => {
            const {template} = params;
            this.api.getWireframe(template).subscribe(wireframe => {
                this.api.getActiveTaskInNullStage(0, LIMIT_TASK_LOAD, wireframe.wireframeId).subscribe(page => {
                    this.tasks['null-pointer'] = page.content;
                    this.tasksCount['null-pointer'] = page.totalElements;
                });

                wireframe.stages = wireframe.stages?.sort((a, b) => a.orderIndex - b.orderIndex);

                wireframe.stages?.forEach(stage => {
                    this.api.getActiveTaskInStage(0, LIMIT_TASK_LOAD, wireframe.wireframeId, stage.stageId).subscribe(page => {
                        this.tasks[stage.stageId] = page.content;
                        this.tasksCount[stage.stageId] = page.totalElements;
                    });
                })
                this.wireframe = wireframe;

                if (this.anyTaskUpdatingSub) this.anyTaskUpdatingSub.unsubscribe();
                this.anyTaskUpdatingSub = this.rt.taskUpdated().subscribe(this.onAnyTaskUpdate.bind(this));
            });
        })
    }

    ngOnDestroy() {
        if (this.anyTaskUpdatingSub) this.anyTaskUpdatingSub.unsubscribe();
    }

    onAnyTaskUpdate(updatedTask: Task) {
        for (const tasksKey in this.tasks) {
            // We are looking for a task in which a change has occurred and if the stage of the task has changed, we move it to a new one
            const foundIndex = this.tasks[tasksKey].findIndex(task => task.taskId === updatedTask.taskId);
            if (foundIndex >= 0) {
                const oldStage = this.tasks[tasksKey][foundIndex].currentStage?.stageId;
                const newStage = updatedTask.currentStage?.stageId;
                if (newStage && newStage !== oldStage) {
                    this.tasks[tasksKey].splice(foundIndex, 1);
                    this.tasks[newStage]?.push(updatedTask);
                    if (oldStage) this.tasksCount[oldStage]--;
                    this.tasksCount[newStage]++;
                    this.tasks[newStage] = this.tasks[newStage]?.sort((a, b) => new Date(b.created ?? "").getTime() - new Date(a.created ?? "").getTime());
                } else {
                    this.tasks[tasksKey].splice(foundIndex, 1, updatedTask);
                }
            }
        }
    }

    stageScrollDown(stageId: string): void {
        // check if length of task array is less tasksCount[stageId]
        if (this.tasks[stageId].length < this.tasksCount[stageId] && !this.tasksLoading[stageId] && this.wireframe && stageId !== 'null-pointer') {
            this.tasksLoading[stageId] = true;
            this.api.getActiveTaskInStage(this.tasks[stageId].length, LIMIT_TASK_LOAD, this.wireframe.wireframeId, stageId).subscribe(page => {
                this.tasks[stageId] = [...this.tasks[stageId], ...page.content];
                this.tasksLoading[stageId] = false;
            });
        } else if (this.tasks[stageId].length < this.tasksCount[stageId] && !this.tasksLoading[stageId] && this.wireframe && stageId === 'null-pointer') {
            this.tasksLoading['null-pointer'] = true;
            this.api.getActiveTaskInStage(this.tasks['null-pointer'].length, LIMIT_TASK_LOAD, this.wireframe.wireframeId, 'null-pointer').subscribe(page => {
                this.tasks['null-pointer'] = [...this.tasks['null-pointer'], ...page.content];
                this.tasksLoading['null-pointer'] = false;
            });
        }
    }

    declineTask(length: number) {
        return Utils.declineOfNumber(length, ["задачи", "задач", "задач"]);
    }

    taskMoveApply() {
        const doneArray: number[] = [];
        this.checkedTasks.forEach(taskId => {
            if (typeof this.selectedStageToMove !== 'string') return;
            this.taskMoving = true;
            this.api.changeTaskStage(taskId, this.selectedStageToMove).subscribe({
                next: () => {
                    doneArray.push(taskId);
                    this.checkedTasks = this.checkedTasks.filter((taskId) => !doneArray.includes(taskId));
                    if (this.checkedTasks.length === 0) {
                        this.taskMovePanel.hide();
                        this.taskMoving = false;
                    }
                }, error: () => {
                    doneArray.push(taskId);
                    this.checkedTasks = this.checkedTasks.filter((taskId) => !doneArray.includes(taskId));
                    if (this.checkedTasks.length === 0) {
                        this.taskMovePanel.hide();
                        this.taskMoving = false;
                    }
                }
            })
        })
    }

    allTaskChecked(stageId: string, event: any) {
        if (!this.wireframe) return;
        if (stageId !== 'null-pointer')
            this.api.getActiveTaskIdsInStage(this.wireframe?.wireframeId, stageId).subscribe(taskIds => {
                if (event.checked) {
                    this.checkedTasks = [...this.checkedTasks, ...taskIds];
                } else {
                    this.checkedTasks = this.checkedTasks.filter(taskId => !taskIds.includes(taskId));
                }
            })
        else
            this.api.getActiveTaskIdsInNullStage(this.wireframe?.wireframeId).subscribe(taskIds => {
                if (event.checked) {
                    this.checkedTasks = [...this.checkedTasks, ...taskIds];
                } else {
                    this.checkedTasks = this.checkedTasks.filter(taskId => !taskIds.includes(taskId));
                }
            })
    }

    getCount(stageId: string) {
        const count = this.tasksCount[stageId];
        if (!count) return '0';
        return this.tasksCount[stageId].toString()
    }
}
