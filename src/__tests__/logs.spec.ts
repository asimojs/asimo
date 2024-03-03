import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { interfaceId, asm as rsm } from "../asimo";
import { AsmContext } from "../types";
import { _CalculatorService } from "./calculator";
import { Adder } from "./adder";
import { CalculatorIID } from "./types";

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
                    logs.push(args[0].replace(/\%c/g, ""));
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
            await asm.get("asimo.src.tests.Calc123");
        } catch (ex) {
            err = ex.message;
        }
        expect(logs.join("")).toBe("ASM [/asm] Interface not found: asimo.src.tests.Calc123");
        expect(err).toBe("[asimo:/asm] Interface not found: asimo.src.tests.Calc123");
        logs = [];

        try {
            const add = await asm.get(AdderIID2);
        } catch (ex) {
            err = ex.message;
        }
        expect(logs.join("")).toBe("ASM [/asm] Interface not found: asimo.src.tests.Adder2");
        expect(err).toBe("[asimo:/asm] Interface not found: asimo.src.tests.Adder2");
    });

    it("should not log when consoleOutput is empty", async () => {
        asm.consoleOutput = "";
        expect(logs.join("")).toBe("");
        try {
            await asm.get("asimo.src.tests.Calc123");
        } catch (ex) {}
        expect(logs.join("")).toBe("");
        logs = [];
        try {
            const add = await asm.get(AdderIID2);
            expect(add).toBe(null);
        } catch (ex) {}
        expect(logs.join("")).toBe("");
        asm.consoleOutput = "Errors";
    });

    it("should validate iids", async () => {
        logs = [];
        asm.registerService(123 as any, () => 123);
        expect(logs.join("")).toBe("ASM [/asm/test] registerService: Invalid interface id: 123");

        logs = [];
        asm.registerService({ ns: "" }, () => 123);
        expect(logs.join("")).toBe(
            'ASM [/asm/test] registerService: Invalid interface id: {"ns":""}',
        );

        logs = [];
        asm.registerService({ ns: 234 as any }, () => 123);
        expect(logs.join("")).toBe(
            'ASM [/asm/test] registerService: Invalid interface id: {"ns":234}',
        );

        logs = [];
        asm.registerService(undefined as any, () => 123);
        expect(logs.join("")).toBe(
            "ASM [/asm/test] registerService: Invalid interface id: undefined",
        );
    });

    it("should validate factories and group loaders", async () => {
        logs = [];
        asm.registerService(CalculatorIID, 123 as any);
        expect(logs.join("")).toBe("ASM [/asm/test] registerService: Invalid factory: 123");

        logs = [];
        asm.registerFactory(CalculatorIID, 123 as any);
        expect(logs.join("")).toBe("ASM [/asm/test] registerFactory: Invalid factory: 123");

        logs = [];
        asm.registerGroup([CalculatorIID], 123 as any);
        expect(logs.join("")).toBe("ASM [/asm/test] [registerGroup] Invalid group loader: 123");
    });
});
