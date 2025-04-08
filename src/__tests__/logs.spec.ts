import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { interfaceId, asm as rsm } from "../asimo";
import { AsmContext } from "../types";
import { _CalculatorService } from "./calculator";
import { Adder, AdderIID } from "./adder";
import { CalculatorIID } from "./types";
import { _MultiplierImpl, MultiplierIID } from "./multiplier";

describe("Asimo Logs", () => {
    let asm: AsmContext,
        logs: string[] = [];

    const console1 = globalThis.console;

    const AdderIID2 = interfaceId<Adder>("asimo.src.tests.Adder2");

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
        const c = rsm.createChildContext("test");

        // override calculator service
        c.registerService(CalculatorIID, async () => new _CalculatorService());
        return c;
    }

    beforeEach(() => {
        // run tests in an independent context
        mockGlobalConsole();
        logs = [];
        asm = createContext();
    });

    afterEach(() => {
        resetGlobalConsole();
    });

    it("should log errors on the console by default", async () => {
        expect(logs.join("")).toBe("");
        let err = "";
        try {
            await asm.fetch("asimo.src.tests.Calc123");
        } catch (ex) {
            err = ex.message;
        }
        expect(logs.join("")).toBe(
            'ASM [/asm/test] Interface not found: "asimo.src.tests.Calc123"',
        );
        expect(err).toBe('ASM [/asm/test] Interface not found: "asimo.src.tests.Calc123"');
        logs = [];

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
        asm.registerObject(CalculatorIID, {} as any);
        let err = "";
        try {
            asm.get(AdderIID2);
        } catch (ex) {
            err = ex.message;
        }
        expect(logs.join(";")).toBe('ASM [/asm/test] Object not found: "asimo.src.tests.Adder2"');

        logs = [];
        err = "";
        try {
            asm.get(CalculatorIID, AdderIID2);
        } catch (ex) {
            err = ex.message;
        }
        expect(logs.join(";")).toBe('ASM [/asm/test] Object not found: "asimo.src.tests.Adder2"');

        logs = [];
        err = "";
        try {
            asm.get(AdderIID, AdderIID2);
        } catch (ex) {
            err = ex.message;
        }
        expect(logs.join(";")).toBe(
            'ASM [/asm/test] Objects not found: ["asimo.src.tests.Adder", "asimo.src.tests.Adder2"]',
        );
    });

    it("should not log when consoleOutput is empty", async () => {
        asm.consoleOutput = "";
        expect(logs.join("")).toBe("");
        try {
            await asm.fetch("asimo.src.tests.Calc123");
        } catch (ex) {}
        expect(logs.join("")).toBe("");
        logs = [];
        try {
            const add = await asm.fetch(AdderIID2);
            expect(add).toBe(null);
        } catch (ex) {}
        expect(logs.join("")).toBe("");
        asm.consoleOutput = "Errors";
    });

    it("should validate iids", async () => {
        logs = [];
        asm.registerService(123 as any, () => 123);
        expect(logs.join("")).toBe("ASM [/asm/test] [registerService] Invalid interface id: 123");

        logs = [];
        asm.registerService({ ns: "" }, () => 123);
        expect(logs.join("")).toBe(
            'ASM [/asm/test] [registerService] Invalid interface id: {"ns":""}',
        );

        logs = [];
        asm.registerService({ ns: 234 as any }, () => 123);
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
        const c2 = asm.createChildContext("context2");
        c2.registerService(CalculatorIID, async () => new _CalculatorService());
        c2.registerService(MultiplierIID, () => new _MultiplierImpl());

        c2.logState();
        expect(logs).toEqual([
            "Context /asm/test/context2:",
            "+ asimo.src.tests.Calculator [service]: not loaded",
            "+ asimo.src.tests.Multiplier [service]: not loaded",
            "Context /asm/test:",
            "+ asimo.src.tests.Calculator [service]: not loaded",
            "Context /asm:",
            "+ asimo.src.tests.Calculator [service]: not loaded",
            "+ asimo.src.tests.Adder [service]: not loaded",
            "+ asimo.src.tests.Multiplier [object]",
        ]);

        logs = [];
        const mult = await c2.fetch(MultiplierIID);
        expect(mult.multiply(2, 4)).toBe(8);
        c2.logState();
        expect(logs).toEqual([
            "Context /asm/test/context2:",
            "+ asimo.src.tests.Calculator [service]: not loaded",
            "+ asimo.src.tests.Multiplier [service]: loaded", // loaded here
            "Context /asm/test:",
            "+ asimo.src.tests.Calculator [service]: not loaded",
            "Context /asm:",
            "+ asimo.src.tests.Calculator [service]: not loaded",
            "+ asimo.src.tests.Adder [service]: not loaded",
            "+ asimo.src.tests.Multiplier [object]",
        ]);
    });

    it("should logState in an output array", async () => {
        const c2 = asm.createChildContext("context2");
        const out: string[] = [];
        const [mult, adder] = await c2.fetch(MultiplierIID, AdderIID);
        expect(mult.multiply(2, 4)).toBe(8);
        expect(adder(5, 4)).toBe(9);

        c2.logState(out);
        expect(logs).toEqual([]);
        expect(out).toEqual([
            "Context /asm/test/context2 [empty]",
            "Context /asm/test:",
            "+ asimo.src.tests.Calculator [service]: not loaded",
            "Context /asm:",
            "+ asimo.src.tests.Calculator [service]: not loaded",
            "+ asimo.src.tests.Adder [service]: loaded", // loaded
            "+ asimo.src.tests.Multiplier [object]",
        ]);
    });
});
