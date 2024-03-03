import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {ApiService} from "../../../services/api.service";
import {Comment, Employee, FileData, FileSuggestion} from "../../../types/transport-interfaces";
import {AutoUnsubscribe, OnChangeObservable} from "../../../decorators";
import {ReplaySubject, shareReplay, switchMap} from "rxjs";

@Component({
    selector: 'app-appoint-installers-dialog',
    templateUrl: './appoint-installers-dialog.component.html',
    styleUrls: ['./appoint-installers-dialog.component.scss']
})
@AutoUnsubscribe()
export class AppointInstallersDialogComponent implements OnInit {

    @Input() taskId?: number | undefined;
    @OnChangeObservable('taskId') onTaskIdChange = new ReplaySubject<number>(1);
    @Input() visible = false;
    @Output() visibleChange = new EventEmitter<boolean>();

    sourceInstallers: Employee[] = [];
    targetInstallers: Employee[] = [];
    targetDescription: string = "";
    gangLeader?: string;
    deferredReport = false;
    gangLeaders: {label:string, value: string|undefined|null}[] = [{label:"Без бригадира", value:null}];
    appointmentRequested = false;
    loadingFiles: FileData[] = [];
    serverFiles: FileSuggestion[] = [];

    commentsSelectDialogVisible = false;
    selectedTaskComments: number[] = [];
    taskComments: Comment[] = [];
    taskCommentsSub = this.onTaskIdChange
        .pipe(
            switchMap(taskId => this.api.getComments(taskId, 0, 100)),
            shareReplay(1)
        )
        .subscribe(
            comments => {
                this.selectedTaskComments = comments.content.map(com=>com.commentId);
                this.taskComments = comments.content
            }
        )

    constructor(private api: ApiService) {
    }

    ngOnInit(): void {
    }

    setVisible(value = false){
        this.visible = value;
        this.visibleChange.emit(value);
    }

    loadAppointInstallers() {
        this.api.getInstallersEmployees().subscribe(employees => {
            this.sourceInstallers = employees;
            this.targetInstallers = [];
        })
    }

    updateGangLeaders() {
        setTimeout(() => {
            if (this.targetInstallers.length > 1) {
                this.gangLeaders = [{
                    label: "Без бригадира", value: null
                }, ...this.targetInstallers.map(installers => ({
                    label: installers.fullName ?? installers.login, value: installers.login
                }))];
            } else {
                this.gangLeaders = [{label: "Без бригадира", value: null}];
            }
        })
    }

    resetListAppointedInstallers() {
        this.sourceInstallers = [...this.sourceInstallers, ...this.targetInstallers];
        this.targetInstallers = [];
    }

    clearAppointInstallers() {
        this.targetDescription = "";
        this.targetInstallers = [];
        this.gangLeader = undefined;
        this.deferredReport = false;
    }

    sendListAppointedInstallers() {
        if (!this.taskId) return;
        this.appointmentRequested = true;
        this.api.assignInstallersToTask(this.taskId, {
            installers: this.targetInstallers,
            description: this.targetDescription,
            gangLeader: this.gangLeader,
            deferredReport: this.deferredReport,
            files: this.loadingFiles,
            serverFiles: this.serverFiles,
            comments: this.selectedTaskComments,
        }).subscribe({
            next: () => {
                this.appointmentRequested = false;
                this.setVisible(false);
            }, error: () => this.appointmentRequested = false
        })
    }

}
