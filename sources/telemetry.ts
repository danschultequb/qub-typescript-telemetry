import * as qub from "qub";

/**
 * An interface that describes the type of properties that can be assigned to a telemetry Event.
 */
export interface Properties {
    [key: string]: boolean | string | number | (() => boolean | string | number);
}

/**
 * A telemetry event that can be sent to a telemetry endpoint.
 */
export class Event {
    /**
     * Create a new TelemetryEvent with the provided eventName.
     * @param eventName The name of the telemetry event.
     */
    constructor(public eventName: string, properties?: Properties) {
        if (properties) {
            for (const propertyName in properties) {
                this[propertyName] = resolvePropertyValue(properties[propertyName]);
            }
        }
    }

    [key: string]: boolean | string | number;
}

export function resolvePropertyValue(unresolvedPropertyValue: boolean | string | number | (() => boolean | string | number)): boolean | string | number {
    let resolvedPropertyValue: boolean | string | number;
    if (!unresolvedPropertyValue) {
        resolvedPropertyValue = unresolvedPropertyValue as (boolean | string | number);
    }
    else {
        const propertyValueType: string = typeof unresolvedPropertyValue;
        switch (propertyValueType) {
            case "boolean":
            case "number":
            case "string":
                resolvedPropertyValue = unresolvedPropertyValue as (boolean | string | number);
                break;

            default:
                resolvedPropertyValue = (unresolvedPropertyValue as (() => boolean | string | number))();
                break;
        }
    }
    return resolvedPropertyValue;
}

/**
 * Convert the provided property value to a string.
 * @param propertyValue The property value to convert to a string.
 */
export function eventPropertyValueToString(propertyValue: boolean | string | number): string {
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
export function eventToString(event: Event): string {
    let result = `"eventName": "${event.eventName}"`;

    for (let propertyName in event) {
        if (propertyName !== "eventName") {
            result += `, "${propertyName}": ${eventPropertyValueToString(event[propertyName])}`;
        }
    }

    return result;
}

/**
 * An endpoint where telemetry events can be sent to.
 */
export abstract class Endpoint {
    /**
     * Write the provided telemetry Event to this telemetry Endpoint.
     * @param event The telemetry Event to write to the telemetry Endpoint.
     */
    public abstract write(event: Event): void;

    /**
     * Release any resources that are associated with this telemetry Endpoint.
     */
    public close(): void {
    }
}

/**
 * A telemetry Endpoint decorator that applies the provided properties to each telemetry Event that
 * is written.
 */
export class PropertySetter extends Endpoint {
    constructor(private _innerEndpoint: Endpoint, private _propertiesToSet: Properties) {
        super();
    }

    /**
     * Write the provided telemetry Event to the telemetry Endpoint.
     * @param event The telemetry Event to write to the telemetry Endpoint.
     */
    public write(event: Event): void {
        if (event) {
            let newEvent: Event;

            if (!this._propertiesToSet || Object.keys(this._propertiesToSet).length === 0) {
                newEvent = event;
            }
            else {
                newEvent = new Event(event.eventName);
                for (const propertyName in event) {
                    if (propertyName !== "eventName") {
                        newEvent[propertyName] = event[propertyName];
                    }
                }

                for (const propertyName in this._propertiesToSet) {
                    newEvent[propertyName] = resolvePropertyValue(this._propertiesToSet[propertyName]);
                }
            }

            this._innerEndpoint.write(newEvent);
        }
    }

    /**
     * Release any resources that are associated with this telemetry Endpoint.
     */
    public close(): void {
        this._innerEndpoint.close();
    }
}

/**
 * A telemetry Endpoint where all of the written events will be kept in memory.
 */
export class InMemoryEndpoint extends Endpoint {
    private _events = new qub.SingleLinkList<Event>();

    /**
     * Get the telemetry Events that have been written to this telemetry Endpoint.
     */
    public get events(): qub.Indexable<Event> {
        return this._events;
    }

    /**
     * Write the provided telemetry Event to the telemetry Endpoint.
     * @param event The telemetry Event to write to the telemetry Endpoint.
     */
    public write(event: Event) {
        this._events.add(event);
    }
}