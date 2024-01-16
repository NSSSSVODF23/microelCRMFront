import {Address, Wireframe} from "./transport-interfaces";

export interface SimpleMessage {
    severity: "INFO" | "WARNING" | "ERROR";
    message: string;
}

export interface OldTracker {
    settings: OldTrackerParserSettings;
    notCreatedTasksPool: { [key: string]: Task };
    addressCorrectingPool: { [key: string]: AddressCorrecting };
    cookies: { [key: string]: string };
    isRunning: boolean;
    currentTask?: number;
    averageTimePerTask?: number;
    remainingTime?: number;
    elapsedTime?: number;
}

export interface OldTrackerParserSettings {
    startId: number;
    endId: number;
    trackerLogin: string;
    trackerPassword: string;
    trackerUrl: string;
    bindings: BindingsCollection;
}

export interface BindingsCollection {
    accident: AccidentBindings;
    connection: ConnectionBindings;
    privateSectorVD: PrivateSectorVD;
    privateSectorRM: PrivateSectorRM;
}

export interface AccidentBindings {
    login: string;
    address: string;
    description: string;
    workReport: string;
    phone: string;
    wireframe: Wireframe;
}

export interface ConnectionBindings {
    takenFrom: string;
    type: string;
    login: string;
    password: string;
    fullName: string;
    address: string;
    phone: string;
    advertisingSource: string;
    techInfo: string;
    wireframe: Wireframe;
}

export interface PrivateSectorVD {
    district: string;
    address: string;
    name: string;
    phone: string;
    advertisingSource: string;
    wireframe: Wireframe;
}

export interface PrivateSectorRM {
    gardening: string;
    address: string;
    name: string;
    phone: string;
    advertisingSource: string;
    wireframe: Wireframe;
}

export interface AddressCorrecting {
    address: Address;
    streetRaw: string;
    houseRaw: string;
    apartRaw: string;
    types: ('STREET' | 'HOUSE' | 'APART')[];
}
