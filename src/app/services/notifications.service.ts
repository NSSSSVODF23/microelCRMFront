import {Injectable} from '@angular/core';
import {INotification, NotificationType, Page} from "../types/transport-interfaces";
import {ApiService} from "./api.service";
import {RealTimeUpdateService} from "./real-time-update.service";
import {FocusStatus, PersonalityService} from "./personality.service";

const NOTIFICATION_LIMIT = 25;

export enum NotificationViewMode {
    ALL,
    UNREAD
}

@Injectable({
    providedIn: 'root'
})
export class NotificationsService {
    // Список загруженных уведомлений с сервера
    notifications?: Page<INotification>;
    // Массив недавно поступивших уведомлений
    receivedNotifications: INotification[] = [];
    // Коллекция таймеров удаляющих уведомления из receivedNotifications
    timers: { [key: number]: any } = {};
    // Флаг указывающий показывать ли боковую панель уведомлений
    displaySideBar = false;
    // Кол-во не прочитанных уведомлений
    unreadCount: number = 0;
    // Режим отображения уведомлений
    notificationViewMode: NotificationViewMode | string = NotificationViewMode.UNREAD;

    titles: { [key: string]: string } = {
        [NotificationType.NEW_COMMENT]: 'Комментарий',
        [NotificationType.TASK_CREATED]: 'Новая задача',
        [NotificationType.TASK_EDITED]: 'Изменены детали задачи',
        [NotificationType.TASK_DELETED]: 'Задача удалена',
        [NotificationType.TASK_CLOSED]: 'Задача закрыта',
        [NotificationType.TASK_REOPENED]: 'Задача возобновлена',
        [NotificationType.TASK_PROCESSED]: 'Задача назначена',
        [NotificationType.TASK_STAGE_CHANGED]: 'Стадия задачи изменена',
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
    }

    private notificationAudios: { [key: string]: HTMLAudioElement } = {
        loud: new Audio('/assets/audio/notify/loud-notify.mp3'),
        quiet: new Audio('/assets/audio/notify/quiet-notify.mp3'),
    };

    constructor(
        readonly api: ApiService,
        readonly rt: RealTimeUpdateService,
        readonly personality: PersonalityService
    ) {
        this.api.getCountOfUnreadNotifications().subscribe({
            next: (value) => {
                this.unreadCount = value;
            }
        })
        this.load();
        personality.onGettingUserData.subscribe(
            me => {
                if (!me.login) return;
                this.rt.notificationCreated(me.login).subscribe(this.createNotificationHandler.bind(this));
                this.rt.notificationUpdated(me.login).subscribe(this.updateNotificationHandler.bind(this));
            }
        )
        Notification.requestPermission().then(permission => console.log(permission));
    }

    get isEmpty() {
        return !this.notifications?.content || this.notifications.content.length === 0;
    };

    get list() {
        return this.notifications?.content ?? [];
    }

    get isLast() {
        return this.notifications?.last ?? false;
    }

    get isHasUnread() {
        return this.unreadCount > 0;
    }

    // Показать боковую панель уведомлений
    showSideBar() {
        this.displaySideBar = true;
        this.receivedNotifications = [];
        Object.entries(this.timers).forEach(([key, value]) => {
            clearTimeout(value);
            delete this.timers[parseInt(key)];
        })
    }

    // Изменяет режим загрузки уведомлений
    changeNotificationViewMode(mode: string) {
        this.notificationViewMode = mode;
        this.notifications = undefined;
        this.load();
    }

    readAllNotifications() {
        if (this.isHasUnread) {
            this.api.readAllNotifications().subscribe({
                next: () => {
                    this.unreadCount = 0;
                    this.notifications = undefined;
                }
            })
        }
        this.notificationViewMode = NotificationViewMode.UNREAD;
        this.notifications = undefined;
    }

    load() {
        if (!this.notifications) {
            this.api.getNotifications(0, NOTIFICATION_LIMIT, this.notificationViewMode === NotificationViewMode.UNREAD).subscribe({
                next: (value) => {
                    this.notifications = value;
                }
            })
        } else {
            this.api.getNotifications(this.notifications.pageable.offset + NOTIFICATION_LIMIT, NOTIFICATION_LIMIT, this.notificationViewMode === NotificationViewMode.UNREAD).subscribe({
                    next: (value) => {
                        value.content = [...this.notifications?.content ?? [], ...value.content];
                        this.notifications = value;
                    }
                }
            )
        }
    }

    suspendClosing(notificationId: number) {
        if (!this.timers[notificationId]) return;
        clearTimeout(this.timers[notificationId]);
        delete this.timers[notificationId];
    }

    resumeClosure(notificationId: number) {
        if (this.timers[notificationId]) return;
        this.timers[notificationId] = setTimeout(() => {
            this.receivedNotifications = this.receivedNotifications.filter(n => n.notificationId !== notificationId);
            delete this.timers[notificationId];
        }, 10000)
    }

    close(notificationId: number) {
        if (this.timers[notificationId]) {
            clearTimeout(this.timers[notificationId]);
            delete this.timers[notificationId];
        }
        this.receivedNotifications = this.receivedNotifications.filter(n => n.notificationId !== notificationId);
    }

    private playNotifySound() {
        if (this.personality.focusStatus === FocusStatus.FOCUS) {
            if (this.notificationAudios['quiet'].paused) this.notificationAudios['quiet'].play().then();
        } else {
            if (this.notificationAudios['loud'].paused) this.notificationAudios['loud'].play().then();
        }
    }

    private showExternalNotification(noti: INotification) {
        new Notification(this.titles[noti.type], {
            body: noti.message,
        });
    }


    private createNotificationHandler(notification: INotification) {
        if (!this.displaySideBar) {
            // Добавление уведомления в список для отображения недавно принятых
            this.receivedNotifications.unshift(notification);
            // Создание таймера для удаления уведомления
            this.timers[notification.notificationId] = setTimeout(() => {
                this.receivedNotifications = this.receivedNotifications.filter(n => n.notificationId !== notification.notificationId);
                delete this.timers[notification.notificationId];
            }, 10000)
        }
        this.unreadCount++;

        if (this.personality.focusStatus === FocusStatus.BLUR) this.showExternalNotification(notification);

        this.playNotifySound();

        if (!this.notifications?.content) return;
        if (this.notifications.content.find(n => n.notificationId === notification.notificationId)) return;
        this.notifications?.content?.unshift(notification);
    }

    private updateNotificationHandler(notification: INotification) {
        if (!this.notifications?.content) return;
        const index = this.notifications.content.findIndex(n => n.notificationId === notification.notificationId);
        if (index === -1) return;
        this.notifications.content[index] = notification;
    }
}
