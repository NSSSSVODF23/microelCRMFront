import {NotificationType} from "./transport-interfaces";

export interface NotificationSettings {
    notificationSettingsId: number;
    muted: boolean;
    passedTypes: NotificationType[];
}

export interface NotificationSettingsForm {
    muted: boolean;
    passedTypes: NotificationType[];
}
