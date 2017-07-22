import * as assert from "assert";
import * as qub from "qub";

import * as telemetry from "../sources/telemetry";

suite("Telemetry", () => {
    test("Event", () => {
        const event = new telemetry.Event("A", { "B": undefined, "C": null, "D": false, "E": true, "F": 20, "G": "test", "H": () => 300 });
        assert.deepStrictEqual(event.eventName, "A");
        assert.deepStrictEqual(event["B"], undefined);
        assert.deepStrictEqual(event["C"], null);
        assert.deepStrictEqual(event["D"], false);
        assert.deepStrictEqual(event["E"], true);
        assert.deepStrictEqual(event["F"], 20);
        assert.deepStrictEqual(event["G"], "test");
        assert.deepStrictEqual(event["H"], 300);
    });

    suite("eventPropertyValueToString()", () => {
        function eventPropertyValueToStringTest(value: string | number | boolean, expectedString: string): void {
            test(`with ${typeof value === "string" ? qub.escapeAndQuote(value) : value}`, () => {
                assert.deepStrictEqual(telemetry.eventPropertyValueToString(value), expectedString);
            });
        }

        eventPropertyValueToStringTest(undefined, "undefined");
        eventPropertyValueToStringTest(null, "null");
        eventPropertyValueToStringTest("", `""`);
        eventPropertyValueToStringTest("hello", `"hello"`);
        eventPropertyValueToStringTest(15, "15");
        eventPropertyValueToStringTest(-1.7, "-1.7");
        eventPropertyValueToStringTest(false, "false");
        eventPropertyValueToStringTest(true, "true");
    });

    suite("eventToString()", () => {
        test("with undefined", () => {
            assert.throws(() => telemetry.eventToString(undefined));
        });

        test("with null", () => {
            assert.throws(() => telemetry.eventToString(null));
        });

        function telemetryEventToStringTest(testName: string, event: telemetry.Event, expectedString: string): void {
            test(testName, () => {
                assert.deepStrictEqual(telemetry.eventToString(event), expectedString);
            });
        }

        telemetryEventToStringTest(
            "with event with no properties and undefined eventName",
            new telemetry.Event(undefined),
            `"eventName": "undefined"`);

        telemetryEventToStringTest(
            "with event with no properties and null eventName",
            new telemetry.Event(null),
            `"eventName": "null"`);

        telemetryEventToStringTest(
            "with event with no properties and empty eventName",
            new telemetry.Event(""),
            `"eventName": ""`);

        telemetryEventToStringTest(
            "with event with no properties and non-empty eventName",
            new telemetry.Event("A"),
            `"eventName": "A"`);

        telemetryEventToStringTest(
            "with event with one property and non-empty eventName",
            new telemetry.Event("A", { "B": "C" }),
            `"eventName": "A", "B": "C"`);

        telemetryEventToStringTest(
            "with event with multiple properties and non-empty eventName",
            new telemetry.Event("A", { "B": "C", "D": "E" }),
            `"eventName": "A", "B": "C", "D": "E"`);
    });

    suite("PropertySetter", () => {
        test("with undefined endpoint", () => {
            const setter = new telemetry.PropertySetter(undefined, {});
            assert.throws(() => { setter.write(new telemetry.Event("A")); });
            assert.throws(() => { setter.close(); });
        });

        test("with null endpoint", () => {
            const setter = new telemetry.PropertySetter(null, {});
            assert.throws(() => { setter.write(new telemetry.Event("A")); });
            assert.throws(() => { setter.close(); });
        });

        test("with undefined properties", () => {
            const endpoint = new telemetry.InMemoryEndpoint();
            const setter = new telemetry.PropertySetter(endpoint, undefined);

            setter.write(new telemetry.Event("A"));
            assert.deepStrictEqual(endpoint.events.toArray(), [new telemetry.Event("A")]);

            setter.close();
        });

        test("with null properties", () => {
            const endpoint = new telemetry.InMemoryEndpoint();
            const setter = new telemetry.PropertySetter(endpoint, null);

            setter.write(new telemetry.Event("A"));
            assert.deepStrictEqual(endpoint.events.toArray(), [new telemetry.Event("A")]);

            setter.close();
        });

        test("with empty properties", () => {
            const endpoint = new telemetry.InMemoryEndpoint();
            const setter = new telemetry.PropertySetter(endpoint, {});

            setter.write(new telemetry.Event("A"));
            assert.deepStrictEqual(endpoint.events.toArray(), [new telemetry.Event("A")]);

            setter.close();
        });

        test("with properties", () => {
            const endpoint = new telemetry.InMemoryEndpoint();
            const setter = new telemetry.PropertySetter(endpoint, { "B": true });

            setter.write(new telemetry.Event("A"));
            assert.deepStrictEqual(endpoint.events.toArray(), [new telemetry.Event("A", { "B": true })]);

            setter.close();
        });

        test("with undefined event", () => {
            const endpoint = new telemetry.InMemoryEndpoint();
            const setter = new telemetry.PropertySetter(endpoint, { "B": true });

            setter.write(undefined);
            assert.deepStrictEqual(endpoint.events.toArray(), []);

            setter.close();
        });

        test("with null event", () => {
            const endpoint = new telemetry.InMemoryEndpoint();
            const setter = new telemetry.PropertySetter(endpoint, { "B": true });

            setter.write(null);
            assert.deepStrictEqual(endpoint.events.toArray(), []);

            setter.close();
        });

        test("with event with properties", () => {
            const endpoint = new telemetry.InMemoryEndpoint();
            const setter = new telemetry.PropertySetter(endpoint, { "B": true });

            setter.write(new telemetry.Event("A", { "Hello": "there" }));
            assert.deepStrictEqual(endpoint.events.toArray(), [new telemetry.Event("A", { "Hello": "there", "B": true })]);

            setter.close();
        });
    });

    test("InMemoryEndpoint", () => {
        const endpoint = new telemetry.InMemoryEndpoint();
        assert.deepStrictEqual(endpoint.events.toArray(), []);

        endpoint.write(new telemetry.Event("A"));
        assert.deepStrictEqual(endpoint.events.toArray(), [
            new telemetry.Event("A")
        ]);

        endpoint.write(new telemetry.Event("B"));
        assert.deepStrictEqual(endpoint.events.toArray(), [
            new telemetry.Event("A"),
            new telemetry.Event("B")
        ]);

        endpoint.close();
    });
});