import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {ApiService} from "../../../services/api.service";
import {Comment, Employee, FileData, FileSuggestion} from "../../../types/transport-interfaces";
import {AutoUnsubscribe, OnChangeObservable} from "../../../decorators";
import {combineLatest, filter, ReplaySubject, shareReplay, startWith, switchMap, tap} from "rxjs";
import {MenuItem} from "primeng/api";
import {FormControl} from "@angular/forms";

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
    @OnChangeObservable('visible') visibleChange$ = new ReplaySubject<boolean>(1);
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

    appointedInstallersOptions: MenuItem[] = [
        {
            label: 'Отложенное назначение',
            icon: 'mdi-update',
            command: () => {
                this.scheduleAppointDialogVisible = true;
            }
        }
    ]

    commentsSelectDialogVisible = false;
    selectedTaskComments: number[] = [];
    taskComments: Comment[] = [];
    taskCommentsSub = combineLatest([this.visibleChange$.pipe(filter(v => v)),this.onTaskIdChange])
        .pipe(
            switchMap(([visible, taskId]) => this.api.getComments(taskId, 0, 100)),
            shareReplay(1)
        )
        .subscribe(
            comments => {
                this.selectedTaskComments = comments.content.map(com=>com.commentId);
                this.taskComments = comments.content
            }
        )

    scheduleAppointDialogVisible = false;
    scheduleDateControl = new FormControl(new Date());
    scheduleTimeControl = new FormControl(new Date());

    dateTimeUpdateSub = this.scheduleDateControl.valueChanges.pipe(startWith(new Date()), tap(date => {
        if (date?.getHours() === 0) {
            date?.setHours(8, 0, 0, 0)
        }else{
            const extraMinutes = (date?.getMinutes() || 0) % 10;
            let currentHours = date?.getHours() || 0;
            let currentMinutes = (date?.getMinutes() || 0);
            if(extraMinutes > 0){
                currentMinutes += 10 - extraMinutes;
            }
            date?.setHours(currentHours+1, currentMinutes, 0, 0)
        }
    })).subscribe(date => this.scheduleTimeControl.setValue(date))

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

    sendListAppointedInstallers(scheduled?: Date | null) {
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
            scheduled
        }).subscribe({
            next: () => {
                this.appointmentRequested = false;
                this.scheduleAppointDialogVisible = false;
                this.setVisible(false);
            }, error: () => this.appointmentRequested = false
        })
    }

    resetDate() {
        this.scheduleDateControl.reset(new Date());
    }
}
