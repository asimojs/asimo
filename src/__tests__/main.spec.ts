import { beforeEach, describe, expect, it } from "vitest";
import { asm as rsm, asyncIID, createContext, AsmContext } from "../asimo";
import { _CalculatorService } from "./calculator";
import { SyncIncrementorIID, _SyncIncrementorService } from "./syncincrementor";
import { AsyncIncrementorIID, _AsyncIncrementorService } from "./asyncincrementor";
import { Multiplier, MultiplierIID, _MultiplierImpl } from "./multiplier";
import { AdderIID, _add } from "./adder";
import { Calculator, CalculatorIID } from "./calculator.types";

describe("Asimo", () => {
    let context: AsmContext;

    function createTestContext(name?: string) {
        const c = rsm.createChildContext(name || "test");

        // override calculator service
        c.registerService(CalculatorIID, async () => new _CalculatorService());
        c.registerService(SyncIncrementorIID, () => new _SyncIncrementorService());
        c.registerService(AsyncIncrementorIID, () => new _AsyncIncrementorService());
        c.registerService(AdderIID, () => _add);
        c.logger = null;
        return c;
    }

    beforeEach(() => {
        // run tests in an independent context
        context = createTestContext();
    });

    it("should be available from globalThis", async () => {
        const _asm = (globalThis as any)["asm"];
        expect(_asm).not.toBe(undefined);
        expect(_asm).toBe(rsm);
    });

    it("should support name, path and parent properties", async () => {
        const c1 = createTestContext("test1");
        const c2 = createContext({ name: "test2", parent: c1 });
        const c3 = createContext("test3");
        const c4 = createContext("some/test/with/secial chars");

        expect(c1.name).toBe("test1");
        expect(c2.name).toBe("test2");
        expect(c3.name).toBe("test3");
        expect(c4.name).toBe("some\\/test\\/with\\/secial chars");

        expect(c1.parent).toBe(rsm);
        expect(c2.parent).toBe(c1);
        expect(c3.parent).toBe(null);
        expect(c4.parent).toBe(null);

        expect(c1.path).toBe("/asm/test1");
        expect(c2.path).toBe("/asm/test1/test2");
        expect(c3.path).toBe("/test3");
        expect(c4.path).toBe("/some\\/test\\/with\\/secial chars");
    });

    it("should give a default name to contexts", async () => {
        const rx = /^AsmContext\d+$/;
        const c = createContext();
        const tc = rsm.createChildContext();

        expect(c.name.match(rx)?.length).toBe(1);
        expect(tc.name.match(rx)?.length).toBe(1);
        expect(tc.name).not.toBe(c.name);
    });

    it("should list the definitions that have been registered in a given context", async () => {
        const c = createTestContext("test1");
        c.registerFactory(MultiplierIID, () => new _MultiplierImpl());

        expect(c.definitions).toMatchObject([
            { iid: "asimo.src.tests.Calculator", type: "service", loaded: false },
            { iid: "asimo.src.tests.SyncIncrementor", type: "service", loaded: false },
            { iid: "asimo.src.tests.AsyncIncrementor", type: "service", loaded: false },
            { iid: "asimo.src.tests.Adder", type: "service", loaded: false },
            { iid: "asimo.src.tests.Multiplier", type: "object" },
        ]);

        const calc = await c.fetch(CalculatorIID);
        expect(c.definitions).toMatchObject([
            { iid: "asimo.src.tests.Calculator", type: "service", loaded: true }, // now loaded
            { iid: "asimo.src.tests.SyncIncrementor", type: "service", loaded: false },
            { iid: "asimo.src.tests.AsyncIncrementor", type: "service", loaded: false },
            { iid: "asimo.src.tests.Adder", type: "service", loaded: false },
            { iid: "asimo.src.tests.Multiplier", type: "object" },
        ]);

        expect(calc.add(2, 3)).toBe(5);
    });

    it("should support independent sub-contexts", async function () {
        const c1 = createTestContext("test1");
        const c2 = createTestContext("test2");

        expect(c1).not.toBe(c2);

        const s1 = await c1.fetch(CalculatorIID);
        const s2 = await c2.fetch(CalculatorIID);

        expect(s1).not.toBe(s2);

        expect(s1?.numberOfCalls).toBe(0);
        expect(s1!.add(1, 2)).toBe(3);
        expect(s1?.numberOfCalls).toBe(1);

        expect(s2?.numberOfCalls).toBe(0);
        expect(s2!.add(1, 2)).toBe(3);
        expect(s2?.numberOfCalls).toBe(1);

        const s1bis = await c1.fetch(CalculatorIID)!;
        expect(s1bis).toBe(s1);
        expect(s1bis?.numberOfCalls).toBe(1);

        const s = await context.fetch(CalculatorIID)!;
        expect(s).not.toBe(s1);
        expect(s).not.toBe(s2);
        expect(s?.numberOfCalls).toBe(0);
    });

    it("should support async factories", async () => {
        // create a 2nd interface id for the calculator
        const CalcIID = asyncIID<Calculator>("asimo.src.tests.Calc");
        context.registerService(CalcIID, async () => new _CalculatorService());

        const calc = await context.fetch(CalcIID)!;

        expect(calc?.numberOfCalls).toBe(0);
        expect(calc?.add(21, 21)).toBe(42);
        expect(calc?.numberOfCalls).toBe(1);
    });

    it("should pass the context to factories", async () => {
        // create a 2nd interface id for the calculator
        const CalcIID = asyncIID<Calculator>("asimo.src.tests.Calc");
        let factoryContext: any = null;
        context.registerService(CalcIID, async (c: AsmContext) => {
            factoryContext = c;
            return new _CalculatorService();
        });

        const calc = await context.fetch(CalcIID)!;
        expect(calc?.add(21, 21)).toBe(42);
        expect(factoryContext).toBe(context);
    });

    it("should delegate creation to parent context", async () => {
        const calc1 = await context.fetch(CalculatorIID)!;
        calc1?.add(1, 2);

        const c1 = context.createChildContext();
        const calc2 = await c1.fetch(CalculatorIID)!;

        expect(calc2).toBe(calc1);
        expect(calc2?.numberOfCalls).toBe(1);
    });

    it("should return null for unknown interfaces", async () => {
        const lg = context.logger;
        const CalcIID = asyncIID<Calculator>("asimo.src.tests.Calc");

        context.logger = null;
        let err = "";
        try {
            const calc = await context.fetch(CalcIID)!;
        } catch (ex) {
            err = ex.message;
        }
        context.logger = lg;
        expect(err).toBe('ASM [/asm/test] Interface not found: "asimo.src.tests.Calc"');
    });

    describe("Invalid factories", () => {
        it("should return null when factory return undefined", async () => {
            // create a 2nd interface id for the calculator
            const CalcIID = asyncIID<Calculator>("asimo.src.tests.Calc");
            context.registerService(CalcIID, () => undefined);

            const calc = await context.fetch(CalcIID, null)!;

            expect(calc).toBe(null);
        });

        it("should return null when async factory returns undefined", async () => {
            // create a 2nd interface id for the calculator
            const CalcIID = asyncIID<Calculator>("asimo.src.tests.Calc");
            context.registerService(CalcIID, async () => undefined);

            const calc = await context.fetch(CalcIID, null)!;

            expect(calc).toBe(null);
        });

        it("should throw when factory does not return an object", async () => {
            // create a 2nd interface id for the calculator
            const CalcIID = asyncIID<Calculator>("asimo.src.tests.Calc");
            context.registerService(CalcIID, () => 123 as any);

            let msg = "";
            try {
                const calc = await context.fetch(CalcIID);
            } catch (ex) {
                msg = ex.message;
            }
            expect(msg).toBe('ASM [/asm/test] Interface not found: "asimo.src.tests.Calc"');
        });

        it("should throw when async factory does not return an object", async () => {
            // create a 2nd interface id for the calculator
            const CalcIID = asyncIID<Calculator>("asimo.src.tests.Calc");
            context.registerService(CalcIID, async () => 123 as any);

            let msg = "";
            try {
                const calc = await context.fetch(CalcIID)!;
            } catch (ex) {
                msg = ex.message;
            }
            expect(msg).toBe('ASM [/asm/test] Interface not found: "asimo.src.tests.Calc"');
        });

        it("should log an error in case factory call error", async () => {
            let logs: string[] = [];
            context.logger = {
                log(msg: any) {
                    logs.push("" + msg);
                },
            };
            const CalcIID = asyncIID<Calculator>("asimo.src.tests.Calc");
            context.registerService(CalcIID, async () => {
                throw "Unexpected error";
            });

            const calc = await context.fetch(CalcIID, null);
            expect(calc).toBe(null);

            expect(logs).toEqual([
                "ASM [/asm/test] Instantiation error: Unexpected error",
                'ASM [/asm/test] Invalid factory output: "asimo.src.tests.Calc"',
            ]);
        });
    });

    describe("Sync style service dependencies", () => {
        it("should load a service with a custom context", async () => {
            const calc = (await context.fetch(CalculatorIID))!;
            const inc = (await context.fetch(SyncIncrementorIID))!;

            await inc.init(context);

            expect(calc.numberOfCalls).toBe(0);
            expect(inc.increment(41)).toBe(42);
            expect(calc.numberOfCalls).toBe(1); // calc service was called
            inc.offset = 3;
            expect(inc.increment(42)).toBe(45);
            expect(calc.numberOfCalls).toBe(2); // calc service was called
        });

        it("should load a service with the default context", async () => {
            const rootCalc = (await rsm.fetch(CalculatorIID))!;
            const calc = (await context.fetch(CalculatorIID))!;
            const inc = (await context.fetch(SyncIncrementorIID))!;

            await inc.init(); // no args => rootAsm will be used

            rootCalc.numberOfCalls = 0; // reset
            inc.offset = 1;
            expect(calc.numberOfCalls).toBe(0);
            expect(inc.increment(41)).toBe(42);
            expect(rootCalc.numberOfCalls).toBe(1); // calc service was called
            inc.offset = 3;
            expect(inc.increment(42)).toBe(45);
            expect(rootCalc.numberOfCalls).toBe(2); // calc service was called
            expect(calc.numberOfCalls).toBe(0); // was never called
        });

        it("should support function services", async () => {
            const add = await context.fetch(AdderIID);
            expect(add(39, 3)).toBe(42);
        });
    });

    describe("Async style service dependencies", () => {
        it("should load a service with a custom context", async () => {
            const calc = (await context.fetch(CalculatorIID))!;
            const inc = (await context.fetch(AsyncIncrementorIID))!;

            inc.di = context;

            expect(calc.numberOfCalls).toBe(0);
            expect(await inc.increment(41)).toBe(42);
            expect(calc.numberOfCalls).toBe(1); // calc service was called
            inc.offset = 3;
            expect(await inc.increment(42)).toBe(45);
            expect(calc.numberOfCalls).toBe(2); // calc service was called
        });
        it("should load a service with the default context", async () => {
            const rootCalc = (await rsm.fetch(CalculatorIID))!;
            const calc = await context.fetch(CalculatorIID);
            const inc = (await context.fetch(AsyncIncrementorIID))!;

            rootCalc.numberOfCalls = 0; // reset
            expect(calc.numberOfCalls).toBe(0);
            expect(inc.offset).toBe(1);
            expect(await inc.increment(41)).toBe(42);
            expect(rootCalc.numberOfCalls).toBe(1); // calc service was called
            inc.offset = 3;
            expect(await inc.increment(42)).toBe(45);
            expect(rootCalc.numberOfCalls).toBe(2); // calc service was called
            expect(calc.numberOfCalls).toBe(0); // no changes as root calc was used
        });
    });

    describe("Object factories", () => {
        it("should create multiple instances of a given object (root context / get", async () => {
            const m1 = await context.fetch(MultiplierIID);
            const m2 = await context.fetch(MultiplierIID);

            expect(m1).not.toBe(m2);
            expect(m1.numberOfCalls).toBe(0);
            expect(m2.numberOfCalls).toBe(0);
            expect(m1.multiply(2, 4)).toBe(8);
            expect(m1.multiply(4)).toBe(8);
            expect(m1.numberOfCalls).toBe(2);
            expect(m2.numberOfCalls).toBe(0);
            expect(m2.multiply(5, 4)).toBe(20);
            expect(m1.numberOfCalls).toBe(2);
            expect(m2.numberOfCalls).toBe(1);
        });

        it("should create multiple instances of a given object (root context) / fetch", async () => {
            const m1 = (await context.fetch(MultiplierIID))!;
            const m2 = (await context.fetch(MultiplierIID))!;

            expect(m1).not.toBe(m2);
            expect(m1.numberOfCalls).toBe(0);
            expect(m2.numberOfCalls).toBe(0);
            expect(m1.multiply(2, 4)).toBe(8);
            expect(m1.multiply(4)).toBe(8);
            expect(m1.numberOfCalls).toBe(2);
            expect(m2.numberOfCalls).toBe(0);
            expect(m2.multiply(5, 4)).toBe(20);
            expect(m1.numberOfCalls).toBe(2);
            expect(m2.numberOfCalls).toBe(1);
        });

        it("should return null if object is not found (fetch)", async () => {
            const calc = await context.fetch({ ns: "asimo.src.tests.Calc123", sync: false }, null);
            expect(calc).toBe(null);
        });

        it("should create multiple instances of a given object (sub context) / get", async () => {
            context.registerFactory(MultiplierIID, () => {
                const m = new _MultiplierImpl();
                m.defaultArg = 3;
                return m;
            });

            const m1 = await context.fetch(MultiplierIID);
            const m2 = await context.fetch(MultiplierIID);

            expect(m1).not.toBe(m2);
            expect(m1.numberOfCalls).toBe(0);
            expect(m2.numberOfCalls).toBe(0);
            expect(m1.multiply(2, 4)).toBe(8);
            expect(m1.multiply(4)).toBe(12); // defaultArg is 3
            expect(m1.numberOfCalls).toBe(2);
            expect(m2.numberOfCalls).toBe(0);
            expect(m2.multiply(5)).toBe(15); // defaultArg is 3
            expect(m1.numberOfCalls).toBe(2);
            expect(m2.numberOfCalls).toBe(1);
        });

        it("should create multiple instances of a given object (sub context) / fetch", async () => {
            context.registerFactory(MultiplierIID, () => {
                const m = new _MultiplierImpl();
                m.defaultArg = 3;
                return m;
            });

            const m1 = (await context.fetch(MultiplierIID))!;
            const m2 = (await context.fetch(MultiplierIID))!;

            expect(m1).not.toBe(m2);
            expect(m1.numberOfCalls).toBe(0);
            expect(m2.numberOfCalls).toBe(0);
            expect(m1.multiply(2, 4)).toBe(8);
            expect(m1.multiply(4)).toBe(12); // defaultArg is 3
            expect(m1.numberOfCalls).toBe(2);
            expect(m2.numberOfCalls).toBe(0);
            expect(m2.multiply(5)).toBe(15); // defaultArg is 3
            expect(m1.numberOfCalls).toBe(2);
            expect(m2.numberOfCalls).toBe(1);
        });
    });

    describe("Multi getter", () => {
        it("should return multiple object instances", async () => {
            const [m1, m2] = await context.fetch(MultiplierIID, MultiplierIID);
            expect(m1.multiply(2, 5)).toBe(10);
            expect(m1.numberOfCalls).toBe(1);
            expect(m2.numberOfCalls).toBe(0);
            expect(m2.multiply(2, 21)).toBe(42);
        });

        it("should return object and service instances", async () => {
            const [m, c1, c2] = await context.fetch(MultiplierIID, CalculatorIID, CalculatorIID);
            expect(m.multiply(2, 5)).toBe(10);
            expect(c1).toBe(c2);
            expect(m.numberOfCalls).toBe(1);
            expect(c1.add(3, 4)).toBe(7);
            expect(c2.numberOfCalls).toBe(1); // c2 === c1
        });

        it("should return object and service instances / fetch", async () => {
            const [m, c1, c2] = await context.fetch(MultiplierIID, CalculatorIID, CalculatorIID);
            expect(m?.multiply(2, 5)).toBe(10);
            expect(c1).toBe(c2);
            expect(m?.numberOfCalls).toBe(1);
            expect(c1?.add(3, 4)).toBe(7);
            expect(c2?.numberOfCalls).toBe(1); // c2 === c1
        });

        it("should return multiple instances through string namespaces", async () => {
            const [m, c] = await context.fetch(MultiplierIID, CalculatorIID);
            expect((m as Multiplier).multiply(2, 5)).toBe(10);
            expect((c as Calculator).add(3, 4)).toBe(7);
        });

        it("should return multiple object instances", async () => {
            const [m1, m2] = await context.fetch(MultiplierIID, MultiplierIID);
            expect(m1?.multiply(2, 5)).toBe(10);
            expect(m1?.numberOfCalls).toBe(1);
            expect(m2?.numberOfCalls).toBe(0);
            expect(m2?.multiply(2, 21)).toBe(42);
        });
    });

    // TODO
    // factory crash error
    // 2 different interface id objects with the same namespace should resolve to the same object
});
