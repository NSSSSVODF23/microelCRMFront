import {Injectable} from '@angular/core';
import {Employee, INotification, NotificationType} from "../types/transport-interfaces";
import {ApiService} from "./api.service";
import {RealTimeUpdateService} from "./real-time-update.service";
import {FocusStatus, PersonalityService} from "./personality.service";
import {
    combineLatest,
    debounceTime,
    distinctUntilChanged,
    filter,
    map,
    merge,
    of, reduce,
    retry, scan,
    shareReplay, startWith, Subject,
    switchMap,
    tap
} from "rxjs";
import {FormControl, FormGroup} from "@angular/forms";
import {NotificationSettings} from "../types/notification-types";
import {Message, MessageService} from "primeng/api";

const NOTIFICATION_LIMIT = 25;

export enum NotificationViewMode {
    ALL,
    UNREAD
}

@Injectable({
    providedIn: 'root'
})
export class NotificationsService {

    loadingNotifications = true;
    readingNotifications = false;
    sidebarOpenStatus = false;

    notificationIndex = 0;
    notifications = [] as INotification[];
    totalNotifications = 0;

    notificationReceived$ = this.personality.userData$
        .pipe(
            switchMap(userData => {
                if (!userData?.login) return of();
                return this.rt.notificationCreated(userData?.login);
            })
        );
    notificationTypes$ = this.api.getNotificationTypes().pipe(shareReplay(1));
    notificationSettingsForm = new FormGroup({
        muted: new FormControl(false),
        passedTypes: new FormControl([] as NotificationType[])
    });
    savingNotificationSettings = false;
    notificationSettingsChanged$ = this.notificationSettingsForm.valueChanges
        .pipe(
            distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
            tap(() => this.savingNotificationSettings = true),
            debounceTime(1500),
        );

    titles: { [key: string]: string } = {
        [NotificationType.NEW_COMMENT]: 'Комментарий',
        [NotificationType.TASK_CREATED]: 'Новая задача',
        [NotificationType.TASK_EDITED]: 'Изменены детали задачи',
        [NotificationType.TASK_DELETED]: 'Задача удалена',
        [NotificationType.TASK_CLOSED]: 'Задача закрыта',
        [NotificationType.TASK_REOPENED]: 'Задача возобновлена',
        [NotificationType.TASK_PROCESSED]: 'Задача назначена',
        [NotificationType.TASK_STAGE_CHANGED]: 'Тип задачи изменен',
        [NotificationType.TASK_MOVED_TO_DIRECTORY]: 'Категория задачи изменена',
        [NotificationType.YOU_OBSERVER]: 'Вы наблюдатель',
        [NotificationType.YOU_RESPONSIBLE]: 'Вы ответственный',
        [NotificationType.TASK_HAS_BECOME_ACTUAL]: 'Актуальная',
        [NotificationType.TASK_EXPIRED]: 'Срок истек',
        [NotificationType.WORKS_COMPLETED]: 'Работы завершены',
        [NotificationType.REPORT_RECEIVED]: 'Отчет получен',
        [NotificationType.MENTIONED_IN_TASK]: 'Вас упомянули',
    }
    icons: { [key: string]: string } = {
        [NotificationType.NEW_COMMENT]: 'mdi-add_comment',
        [NotificationType.TASK_CREATED]: 'mdi-add_task',
        [NotificationType.TASK_EDITED]: 'mdi-edit',
        [NotificationType.TASK_DELETED]: 'mdi-delete',
        [NotificationType.TASK_CLOSED]: 'mdi-swipe_down_alt',
        [NotificationType.TASK_REOPENED]: 'mdi-swipe_up_alt',
        [NotificationType.TASK_PROCESSED]: 'mdi-how_to_reg',
        [NotificationType.TASK_STAGE_CHANGED]: 'mdi-next_week',
        [NotificationType.YOU_OBSERVER]: 'mdi-visibility',
        [NotificationType.YOU_RESPONSIBLE]: 'mdi-person',
        [NotificationType.TASK_HAS_BECOME_ACTUAL]: 'mdi-event_available',
        [NotificationType.TASK_EXPIRED]: 'mdi-event_busy',
        [NotificationType.WORKS_COMPLETED]: 'mdi-fact_check',
        [NotificationType.REPORT_RECEIVED]: 'mdi-edit_note',
        [NotificationType.MENTIONED_IN_TASK]: 'mdi-campaign',
        [NotificationType.TASK_MOVED_TO_DIRECTORY]: 'mdi-move_down',
    }
    importantNotificationTypes: NotificationType[] = [
        NotificationType.YOU_OBSERVER,
        NotificationType.YOU_RESPONSIBLE,
        NotificationType.TASK_EXPIRED,
        NotificationType.REPORT_RECEIVED,
        NotificationType.MENTIONED_IN_TASK,
        NotificationType.TASK_HAS_BECOME_ACTUAL,
    ]
    private notificationAudios: { [key: string]: HTMLAudioElement } = {
        loud: new Audio('/assets/audio/notify/loud-notify.mp3'),
        quiet: new Audio('/assets/audio/notify/quiet-notify.mp3'),
    };

    unMutedNotificationReceived$ = this.notificationReceived$
        .pipe(
            filter(notification => {
                return notification.unread;
            }),
            tap(notification => {
                if (this.sidebarOpenStatus) {
                    if (this.notificationAudios['quiet'].paused) this.notificationAudios['quiet'].play().then();
                } else {
                    if (this.notificationAudios['loud'].paused) this.notificationAudios['loud'].play().then();
                }
            })
        );

    readNotification$ = new Subject<number>();

    unreadNum = 0;
    _unreadNum$ = merge(
        this.api.getCountOfUnreadNotifications().pipe(shareReplay(1)),
        this.unMutedNotificationReceived$.pipe(map(()=>1)),
        this.readNotification$
    ).pipe(
        // startWith(0),
        scan((acc, num) => {
            if (acc === 0 && num < 0) return 0;
            return acc + num;
        }, 0),
        shareReplay(1)
    );

    statusColorClass$ = this._unreadNum$
        .pipe(
            map(num => {
                if (num > 0) return 'text-orange-500 hover:bg-orange-50 hover:text-orange-500'
                return 'text-bluegray-300 hover:bg-bluegray-50 hover:text-bluegray-500'
            })
        );
    statusIcon$ = combineLatest([this._unreadNum$, this.personality.userData$])
        .pipe(
            map(([unreadNum, userData]) => {
                if (userData?.notificationSettings?.muted) return 'mdi-notifications_off';
                if (unreadNum > 0) return 'mdi-notifications_active';
                return 'mdi-notifications_none'
            }),
            shareReplay(1)
        );

    constructor(
        readonly api: ApiService,
        readonly rt: RealTimeUpdateService,
        readonly personality: PersonalityService,
        private messageService: MessageService
    ) {
        this.notificationReceived$.subscribe(notification => {
            if(this.notifications.length === 0) return;
            if (this.notifications.length > 100) {
                this.notifications = [notification, ...this.notifications.slice(0, 100)];
            }else{
                this.notifications = [notification, ...this.notifications];
            }
            this.totalNotifications++;
        });
        this.unMutedNotificationReceived$.subscribe(notification => {
            if (this.sidebarOpenStatus) return;
            this.messageService.add({
                id: notification.notificationId,
                key: 'notification',
                severity: 'notification',
                icon: this.icons[notification.type],
                summary: this.titles[notification.type],
                detail: notification.message,
                life: 10000,
                sticky: this.importantNotificationTypes.includes(notification.type),
                data: notification
            })
        });

        this._unreadNum$.subscribe(num => {
            this.unreadNum = num
        });

        // Обновляем настройки уведомлений при смене пользователя
        combineLatest([personality.userData$, this.notificationTypes$])
            .subscribe(([employee, types]) => {
                this.updateNotificationSettings(employee, types.map(val => val.value))
            });
        this.notificationSettingsChanged$
            .pipe(
                switchMap(settings => this.api.saveNotificationSettings(settings as NotificationSettings)),
                tap(() => this.savingNotificationSettings = false),
                retry(),
            )
            .subscribe()
    }

    loadNext() {
        if (this.loadingNotifications && this.notificationIndex < this.totalNotifications) return;
        this.load(this.notificationIndex += NOTIFICATION_LIMIT).subscribe(page => {
            this.notifications = this.notifications.concat(page.content);
        });
    }

    loadFirst() {
        this.messageService.clear('notification');
        if(this.notifications.length > 0) return; // Если уже загружены данные, то не загружаем их повторно
        this.notificationIndex = 0;
        this.load(this.notificationIndex).subscribe(page => {
            this.notifications = page.content;
        });
    }

    inView(notify: INotification) {
        if (!notify.unread) return;
        this.api.readNotification(notify.notificationId)
            .subscribe(() => {
                notify.unread = false;
                this.readNotification$.next(-1);
            });
    }

    readAll() {
        this.readingNotifications = true
        this.api.readAllNotifications()
            .pipe(tap(()=>{
                this.readNotification$.next(-this.unreadNum);
                this.messageService.clear('notification');
            }))
            .subscribe({
            next: () => this.readingNotifications = false,
            error: () => this.readingNotifications = false,
        });
    }

    private load(index: number) {
        this.loadingNotifications = true
        return this.api.getNotifications(index, NOTIFICATION_LIMIT).pipe(
            tap(notifications => {
                this.loadingNotifications = false;
                this.totalNotifications = notifications.totalElements;
            }),
        );
    }

    /**
     * Обновляет настройки уведоблений
     * @private
     */
    private updateNotificationSettings(employee: Employee | null, types: NotificationType[]) {
        if (!employee) return;
        this.notificationSettingsForm.reset({
            muted: employee.notificationSettings?.muted ?? false,
            passedTypes: employee.notificationSettings?.passedTypes ?? types
        }, {emitEvent: !employee.notificationSettings?.notificationSettingsId})
    }
}
