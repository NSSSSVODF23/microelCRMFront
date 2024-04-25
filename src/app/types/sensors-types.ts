import {EventType} from "./transport-interfaces";

export interface TemperatureSensor {
    temperatureSensorId: number;
    active: boolean;
    name: string;
    value: number;
    created: string;
    updated: string;
    currentRange?: TemperatureRange;
    ranges: TemperatureRange[];
}

export interface TemperatureRange {
    temperatureRangeId: number;
    name: string;
    color: string;
    minTemp: number;
    maxTemp: number;
}

export interface TemperatureSnapshot {
    temperatureSnapshotId: number;
    timestamp: string;
    value: number;
}

export interface SensorUpdateEvent {
    eventType: EventType;
    data: TemperatureSensor;
}
