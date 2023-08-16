import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {CalendarOptions, DateSelectArg, EventClickArg, EventDropArg, EventHoveringArg} from "@fullcalendar/core";
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin, {EventResizeDoneArg} from '@fullcalendar/interaction';
import {ApiService} from "../../services/api.service";
import {fromEvent, map} from "rxjs";
import {Task} from "../../transport-interfaces";
import {SubscriptionsHolder, Utils} from "../../util";
import {OverlayPanel} from "primeng/overlaypanel";
import {RealTimeUpdateService} from "../../services/real-time-update.service";
import {Router} from "@angular/router";
import {ConfirmationService, MenuItem} from "primeng/api";
import {ContextMenu} from "primeng/contextmenu";
import {
    TaskSelectingDialogComponent
} from "../../components/panels/task-linking-dialog/task-selecting-dialog.component";

enum ScheduleType {
    RANGE = 'RANGE',
    START = 'START',
    END = 'END'
}

@Component({
    templateUrl: './task-calendar-page.component.html',
    styleUrls: ['./task-calendar-page.component.scss']
})
export class TaskCalendarPageComponent implements OnInit, OnDestroy {

    @ViewChild('taskPanel') taskPanel?: OverlayPanel;
    taskEvent: any[] = [];
    hoveredTask: number = 0;
    subscriptionsHolder = new SubscriptionsHolder();
    @ViewChild('eventMenu') eventMenu?: ContextMenu;
    eventMenuModel: MenuItem[] = [];
    @ViewChild('scheduleTaskDialog') scheduleTaskDialog?: TaskSelectingDialogComponent;
    private currentCalendarRange = {
        start: 0,
        end: 0
    }
    calendarOptions: CalendarOptions = {
        initialView: 'dayGridMonth',
        locale: 'ru',
        aspectRatio: 1.5,
        selectable: true,
        nowIndicator: true,
        slotEventOverlap: false,
        plugins: [dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin],
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,listWeek,timeGridDay'
        },
        editable: true,
        eventMouseEnter: this.openPreviewTaskPanel.bind(this),
        eventMouseLeave: this.hidePreviewTaskPanel.bind(this),
        eventDrop: this.scheduleMove.bind(this),
        eventResize: this.scheduleResizing.bind(this),
        eventClick: this.openContextOfTask.bind(this),
        select: this.openContextOfSelectDate.bind(this),
        datesSet: (ev) => {
            this.currentCalendarRange.start = ev.start.getTime();
            this.currentCalendarRange.end = ev.end.getTime();
            this.api.getScheduledTask(Utils.dateFormatTS(ev.start), Utils.dateFormatTS(ev.end))
                .pipe(map(this.tasksToEvents.bind(this)))
                .subscribe(events => this.taskEvent = events);
        },
        firstDay: 1,
        buttonText: {
            today: "Сегодня",
            month: "Месяц",
            week: "Неделя",
            day: "День",
        },
        allDayText: "Весь день",
        weekText: "Неделя",
        moreLinkText: "Больше",
        noEventsText: "Задач нет",
        navLinks: true
    };
    private hideTimer?: any;
    private scheduleType: ScheduleType = ScheduleType.RANGE;
    private scheduleDate?: DateSelectArg;
    private unscheduleTask(taskId: number){
        this.api.clearActualFromDate(taskId).subscribe()
        this.api.clearActualToDate(taskId).subscribe()
    };

    constructor(readonly api: ApiService, readonly rt: RealTimeUpdateService, readonly router: Router, readonly confirmation: ConfirmationService) {
    }

    ngOnInit(): void {
        this.subscriptionsHolder.addSubscription("updTsk", this.rt.taskUpdated().subscribe(this.updateCalendar.bind(this)));
        this.subscriptionsHolder.addSubscription("hidePv", fromEvent(window, 'mousedown').subscribe(this.hidePreviewTaskPanel.bind(this)));
    }

    ngOnDestroy() {
        this.subscriptionsHolder.unsubscribeAll();
    }

    openContextOfTask(event: EventClickArg) {
        this.eventMenuModel = [
            {label: 'Открыть задачу', icon: 'mdi-open_in_new', command: this.openTask.bind(this, event)},
            {label: 'Убрать задачу', icon: 'mdi-event_busy', command: this.confirmUnschedulingTask.bind(this, event)}
        ];
        setTimeout(() => {
            this.eventMenu?.show(event.jsEvent);
        })
    }

    openContextOfSelectDate(event: DateSelectArg) {
        this.eventMenuModel = [
            {
                label: 'Запланировать диапазон',
                icon: 'mdi-date_range',
                command: this.openSelectTaskDialog.bind(this, event, ScheduleType.RANGE)
            },
            {
                label: 'Запланировать начало',
                icon: 'mdi-today',
                command: this.openSelectTaskDialog.bind(this, event, ScheduleType.START)
            },
            {
                label: 'Установить срок',
                icon: 'mdi-free_cancellation',
                command: this.openSelectTaskDialog.bind(this, event, ScheduleType.END)
            },
        ];
        setTimeout(() => {
            if (event.jsEvent) this.eventMenu?.show(event.jsEvent);
        })
    }

    confirmUnschedulingTask(event: EventClickArg){
        if(!event.event.id) return;
        const taskId = parseInt(event.event.id);
        this.confirmation.confirm({
            header: "Убрать задачу из календаря",
            message: `Убрать задачу #${event.event.id}?`,
            accept: this.unscheduleTask.bind(this, taskId)
        })
    }

    private openSelectTaskDialog(date: DateSelectArg, type: ScheduleType) {
        this.scheduleType = type;
        this.scheduleDate = date;
        this.scheduleTaskDialog?.open('single');
    }

    confirmScheduleTask(taskId: number) {
        if (!this.scheduleDate) return;
        let message = "";
        switch (this.scheduleType) {
            case ScheduleType.RANGE:
                message = `Запланировать задачу #${taskId} с ${Utils.dateFormatTS(this.scheduleDate.start)} по ${Utils.dateFormatTS(this.scheduleDate.end)}`;
                break;
            case ScheduleType.START:
                message = `Запланировать задачу #${taskId} с ${Utils.dateFormatTS(this.scheduleDate.start)}`;
                break;
            case ScheduleType.END:
                message = `Установить срок задачи #${taskId} по ${Utils.dateFormatTS(this.scheduleDate.end)}`;
                break;
        }
        this.confirmation.confirm({
            header: "Запланировать задачу",
            message,
            accept: this.scheduleTask.bind(this, taskId)
        })
    }

    private scheduleTask(taskId: number) {
        if (!this.scheduleDate) return;
        switch (this.scheduleType) {
            case ScheduleType.RANGE:
                this.api.changeTaskActualFrom(taskId, this.scheduleDate?.start).subscribe();
                this.api.changeTaskActualTo(taskId, this.scheduleDate?.end).subscribe();
                break;
            case ScheduleType.START:
                this.api.changeTaskActualFrom(taskId, this.scheduleDate?.start).subscribe();
                break;
            case ScheduleType.END:
                this.api.changeTaskActualTo(taskId, this.scheduleDate?.end).subscribe();
        }
    }

    private taskToEvent(task: Task) {

        const event = {
            id: task.taskId.toString(),
            title: task.modelWireframe?.name + " #" + task.taskId,
            start: task.actualFrom,
            end: task.actualTo,
            backgroundColor: Utils.stringToColor(task.modelWireframe?.name ?? "", 70, 95, 70, 90),
            borderColor: Utils.stringToColor(task.modelWireframe?.name ?? "", 80, 100, 30, 80),
        }

        if(!task.actualFrom){
            event.start = task.actualTo;
            event.borderColor = '#ff0000';
        }

        return event;
    }

    private tasksToEvents(tasks: Task[]) {
        return tasks.map(this.taskToEvent.bind(this));
    }

    private openPreviewTaskPanel(event: EventHoveringArg) {
        if (this.hideTimer) clearTimeout(this.hideTimer);
        this.hoveredTask = parseInt(event.event.id);
        this.taskPanel?.show(event.jsEvent, event.el);
    }

    private hidePreviewTaskPanel() {
        this.hideTimer = setTimeout(() => {
            this.taskPanel?.hide();
        })
    }

    private scheduleMove(event: EventDropArg) {
        this.api.moveScheduledTask(parseInt(event.event.id), event.delta).subscribe()
    }

    private scheduleResizing(event: EventResizeDoneArg) {
    }

    /* Проверяет запланирована ли задача, есть ли уже в календаре, находится ли дата в диапазоне календаря.
     Если да, то обновляет календарь, добавляя задачу в календарь или обновляя существующую. */
    private updateCalendar(task: Task) {
        // Находим существующую задачу
        let existEventIndex = this.taskEvent.findIndex(taskEvent => parseInt(taskEvent.id) === task.taskId);

        let startPass = false;
        let endPass = false;
        if (task.actualFrom) {
            const startMs = new Date(task.actualFrom).getTime();
            startPass = this.currentCalendarRange.start <= startMs && startMs <= this.currentCalendarRange.end;
        }
        if (task.actualTo) {
            const endMs = new Date(task.actualTo).getTime();
            endPass = this.currentCalendarRange.start <= endMs && endMs <= this.currentCalendarRange.end;
        }
        if ((startPass || endPass) && existEventIndex !== -1) {
            this.taskEvent[existEventIndex] = this.taskToEvent(task);
            this.taskEvent = [...this.taskEvent];
        } else if ((startPass || endPass) && existEventIndex === -1) {
            this.taskEvent = [...this.taskEvent, this.taskToEvent(task)];
        } else if (!(startPass || endPass) && existEventIndex !== -1) {
            this.taskEvent.splice(existEventIndex, 1);
            this.taskEvent = [...this.taskEvent];
        }
    }

    private openTask(event: EventClickArg) {
        this.router.navigate(['/task', event.event.id]).then();
    };
}
