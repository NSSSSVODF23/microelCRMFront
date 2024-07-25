import {DateRange, EmployeeIntervention} from "./transport-interfaces";

export interface LogsForm {
    dateRange: DateRange;
    page: number;
    plen: number;
    login: string;
}

export interface LogItem {
    timestamp: string;
    action: string;
    description: string;
    amount: number;
    balance: number;
}

export interface TelegramUserTariff {
    userTariffId: number;
    baseName: string;
    baseId: string;
    name: string;
    isService: boolean;
    price: number;
    priceLabel: string;
    paymentPeriod: number;
    createdBy: EmployeeIntervention;
    editedBy: EmployeeIntervention | null;
    deleted: boolean;
}

export interface TelegramUserRequest {
    userRequestId: number;
    title: string;
    type: 'REPLACE_TARIFF' | 'APPEND_SERVICE' | 'REMOVE_SERVICE';
    subject: string;
    userLogin: string;
    chatId: string | null;
    phoneNumber: string | null;
    description: string;
    fromSource: string;
    created: string;
    processedBy?: EmployeeIntervention;
    deleted: boolean;
}
