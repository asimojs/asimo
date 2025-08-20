import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { asyncIID, createContainer, asm as rsm, syncIID } from "../asimo";
import { IoCContainer } from "../asimo.types";
import { _CalculatorService } from "./calculator";
import { Adder, AdderIID } from "./adder";
import { Calculator, CalculatorIID } from "./calculator.types";
import { _MultiplierImpl, MultiplierIID } from "./multiplier";

const CalculatorSIID = syncIID<Calculator>("asimo.src.tests.logs.Calculator");

describe("Asimo Logs", () => {
    let asm: IoCContainer,
        logs: string[] = [];

    const console1 = globalThis.console;

    const AdderIID2 = asyncIID<Adder>("asimo.src.tests.Adder2");
    const AdderSIID2 = syncIID<Adder>("asimo.src.tests.Adder2");
    const AdderIID3 = asyncIID<Adder>("asimo.src.tests.Adder3");

    function mockGlobalConsole() {
        globalThis.console = Object.create(console1, {
            log: {
                writable: true,
                configurable: true,
                value: (...args: any[]) => {
                    if (Array.isArray(args[0])) {
                        logs.push(...args[0]);
                    } else {
                        logs.push(args[0].replace(/\%c/g, ""));
                    }
                },
            },
        });
        return logs;
    }

    function resetGlobalConsole() {
        globalThis.console = console1;
    }

    function createContext() {
        const c = createContainer({ name: "test", parent: rsm });

        // override calculator service
        c.registerService(CalculatorIID, async () => new _CalculatorService());
        return c;
    }

    beforeEach(() => {
        // run tests in an independent context
        mockGlobalConsole();
        logs = [];
        asm = createContext();
        asm.logger = globalThis.console;
    });

    afterEach(() => {
        resetGlobalConsole();
    });

    it("should log errors on the console by default", async () => {
        expect(logs.join("")).toBe("");
        let err = "";

        try {
            const [add2, add3] = await asm.fetch(AdderIID2, AdderIID3);
        } catch (ex) {
            err = ex.message;
        }
        expect(logs.join("")).toBe(
            'ASM [/asm/test] Interfaces not found: ["asimo.src.tests.Adder2", "asimo.src.tests.Adder3"]',
        );
        expect(err).toBe(
            'ASM [/asm/test] Interfaces not found: ["asimo.src.tests.Adder2", "asimo.src.tests.Adder3"]',
        );
    });

    it("should log errors on the console by default (multiple iids)", async () => {
        expect(logs.join("")).toBe("");
        let err = "";

        try {
            const add = await asm.fetch(AdderIID2);
        } catch (ex) {
            err = ex.message;
        }
        expect(logs.join("")).toBe('ASM [/asm/test] Interface not found: "asimo.src.tests.Adder2"');
        expect(err).toBe('ASM [/asm/test] Interface not found: "asimo.src.tests.Adder2"');
    });

    it("should log errors when fetching multiple iids (1 error)", async () => {
        expect(logs.join("")).toBe("");
        let err = "";
        try {
            await asm.fetch(CalculatorIID, AdderIID2);
        } catch (ex) {
            err = ex.message;
        }
        expect(logs.join("")).toBe('ASM [/asm/test] Interface not found: "asimo.src.tests.Adder2"');
        expect(err).toBe('ASM [/asm/test] Interface not found: "asimo.src.tests.Adder2"');
        logs = [];
    });

    it("should log errors when fetching multiple iids (>1 error)", async () => {
        expect(logs.join("")).toBe("");
        asm.registerService(AdderIID2, () => 123 as any);
        let err = "";
        try {
            await asm.fetch(AdderIID2);
        } catch (ex) {
            err = ex.message;
        }
        expect(logs.join(";")).toBe(
            'ASM [/asm/test] Invalid factory output: "asimo.src.tests.Adder2";ASM [/asm/test] Interface not found: "asimo.src.tests.Adder2"',
        );
        expect(err).toBe('ASM [/asm/test] Interface not found: "asimo.src.tests.Adder2"');
        logs = [];
    });

    it("should log errors when get doesn't find one or multipe object", async () => {
        asm.registerObject(CalculatorSIID, {} as any);
        let err = "";
        try {
            asm.get(AdderSIID2);
        } catch (ex) {
            err = ex.message;
        }
        expect(logs.join(";")).toBe('ASM [/asm/test] Object not found: "asimo.src.tests.Adder2"');

        logs = [];
        err = "";
        try {
            asm.get(CalculatorSIID, AdderSIID2);
        } catch (ex) {
            err = ex.message;
        }
        expect(logs.join(";")).toBe('ASM [/asm/test] Object not found: "asimo.src.tests.Adder2"');

        logs = [];
        err = "";
        try {
            asm.get(AdderIID as any, AdderIID2);
        } catch (ex) {
            err = ex.message;
        }
        expect(logs.join(";")).toBe(
            'ASM [/asm/test] Objects not found: ["asimo.src.tests.Adder", "asimo.src.tests.Adder2"]',
        );
    });

    it("should not log when logger is null", async () => {
        asm.logger = null;
        expect(logs.join("")).toBe("");
        try {
            await asm.fetch({ ns: "asimo.src.tests.Calc123", sync: false });
        } catch (ex) {}
        expect(logs.join("")).toBe("");
        logs = [];
        try {
            const add = await asm.fetch(AdderIID2);
            expect(add).toBe(null);
        } catch (ex) {}
        expect(logs.join("")).toBe("");
        asm.logger = console;
    });

    it("should validate iids", async () => {
        logs = [];
        asm.registerService(123 as any, () => 123);
        expect(logs.join("")).toBe("ASM [/asm/test] [registerService] Invalid interface id: 123");

        logs = [];
        asm.registerService({ ns: "", sync: false }, () => 123);
        expect(logs.join("")).toBe(
            'ASM [/asm/test] [registerService] Invalid interface id: {"ns":"","sync":false}',
        );

        logs = [];
        asm.registerService({ ns: 234 } as any, () => 123);
        expect(logs.join("")).toBe(
            'ASM [/asm/test] [registerService] Invalid interface id: {"ns":234}',
        );

        logs = [];
        asm.registerService(undefined as any, () => 123);
        expect(logs.join("")).toBe(
            "ASM [/asm/test] [registerService] Invalid interface id: undefined",
        );
    });

    it("should validate factories and group loaders", async () => {
        logs = [];
        asm.registerService(CalculatorIID, 123 as any);
        expect(logs.join("")).toBe("ASM [/asm/test] [registerService] Invalid factory: 123");

        logs = [];
        asm.registerFactory(CalculatorIID, 123 as any);
        expect(logs.join("")).toBe("ASM [/asm/test] [registerFactory] Invalid factory: 123");

        logs = [];
        asm.registerGroup([CalculatorIID], 123 as any);
        expect(logs.join("")).toBe("ASM [/asm/test] [registerGroup] Invalid group loader: 123");
    });

    it("should logState in the console", async () => {
        const c2 = createContainer({ name: "context2", parent: asm });
        c2.registerService(CalculatorIID, async () => new _CalculatorService());
        c2.registerService(MultiplierIID, () => new _MultiplierImpl());

        c2.logState();
        expect(logs).toEqual([
            "Container /asm/test/context2:",
            "+ asimo.src.tests.Calculator [service]: not loaded",
            "+ asimo.src.tests.Multiplier [service]: not loaded",
            "Container /asm/test:",
            "+ asimo.src.tests.Calculator [service]: not loaded",
            "Container /asm:",
            "+ asimo.src.tests.Calculator [service]: not loaded",
            "+ asimo.src.tests.Adder [service]: not loaded",
            "+ asimo.src.tests.Multiplier [object]",
        ]);

        logs = [];
        const mult = await c2.fetch(MultiplierIID);
        expect(mult.multiply(2, 4)).toBe(8);
        c2.logState();
        expect(logs).toEqual([
            "Container /asm/test/context2:",
            "+ asimo.src.tests.Calculator [service]: not loaded",
            "+ asimo.src.tests.Multiplier [service]: loaded", // loaded here
            "Container /asm/test:",
            "+ asimo.src.tests.Calculator [service]: not loaded",
            "Container /asm:",
            "+ asimo.src.tests.Calculator [service]: not loaded",
            "+ asimo.src.tests.Adder [service]: not loaded",
            "+ asimo.src.tests.Multiplier [object]",
        ]);
    });

    it("should logState in an output array", async () => {
        const c2 = createContainer({ name: "context2", parent: asm });
        const out: string[] = [];
        const [mult, adder] = await c2.fetch(MultiplierIID, AdderIID);
        expect(mult.multiply(2, 4)).toBe(8);
        expect(adder(5, 4)).toBe(9);

        c2.logState(out);
        expect(logs).toEqual([]);
        expect(out).toEqual([
            "Container /asm/test/context2 [empty]",
            "Container /asm/test:",
            "+ asimo.src.tests.Calculator [service]: not loaded",
            "Container /asm:",
            "+ asimo.src.tests.Calculator [service]: not loaded",
            "+ asimo.src.tests.Adder [service]: loaded", // loaded
            "+ asimo.src.tests.Multiplier [object]",
        ]);
    });
});
