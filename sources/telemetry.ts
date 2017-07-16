import * as qub from "qub";

/**
 * An interface that describes the type of properties that can be assigned to a telemetry Event.
 */
export interface TelemetryProperties {
    [key: string]: boolean | string | number | (() => boolean | string | number);
}

/**
 * A telemetry event that can be sent to a telemetry endpoint.
 */
export class TelemetryEvent {
    public eventName: string;

    [key: string]: boolean | string | number;
}

function eventPropertyValueToString(propertyValue: boolean | string | number): string {
    let result: string;
    if (propertyValue === null) {
        result = "null";
    }
    else if (propertyValue === undefined) {
        result = "undefined";
    }
    else if (typeof propertyValue === "string") {
        result = `"${propertyValue}"`;
    }
    else {
        result = propertyValue.toString();
    }
    return result;
}

/**
 * Convert a telemetry event to a string.
 */
export function telemetryEventToString(event: TelemetryEvent): string {
    let result = `"eventName": "${event.eventName}"`;

    for (let propertyName in event) {
        if (propertyName !== "eventName") {
            result += `, "${propertyName}": ${eventPropertyValueToString(event[propertyName])}`;
        }
    }

    return result;
}

/**
 * A target where telemetry events can be sent to.
 */
export abstract class TelemetryEndpoint {
    public abstract log(event: TelemetryEvent): void;

    public close(): void {
    }
}

/**
 * A telemetry Endpoint decorator that applies the provided properties to each Event that is
 * logged.
 */
export class TelemetryPropertySetter extends TelemetryEndpoint {
    constructor(private _innerEndpoint: TelemetryEndpoint, private _propertiesToSet: TelemetryProperties) {
        super();
    }

    public log(event: TelemetryEvent): void {
        let newEvent = event;

        if (this._propertiesToSet) {
            newEvent = qub.clone(event);

            for (const propertyName in this._propertiesToSet) {
                const propertyValue: string | number | boolean | (() => string | number | boolean) = this._propertiesToSet[propertyName];
                if (typeof propertyValue === "string" || typeof propertyValue === "number" || typeof propertyValue === "boolean") {
                    newEvent[propertyName] = propertyValue;
                }
                else {
                    newEvent[propertyName] = propertyValue();
                }
            }
        }

        this._innerEndpoint.log(newEvent);
    }

    public close(): void {
        this._innerEndpoint.close();
    }
}