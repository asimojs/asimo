import { beforeEach, describe, expect, it } from 'vitest'
import { asm as rootAsm, interfaceId } from '../asimo';
import { Calculator, CalculatorIID, CalculatorService } from './calculator';
import { AsmContext } from '../types';
import { SyncIncrementorIID, SyncIncrementorService } from './syncincrementor';
import { AsyncIncrementorIID, AsyncIncrementorService } from './asyncincrementor';
import { Multiplier, MultiplierIID, MultiplierImpl } from './multiplier';
import { AdderIID, add as _add } from './adder';


describe('Asimo', () => {
    let asm: AsmContext;

    function createContext() {
        const c = rootAsm.createChildContext();

        // override calculator service
        c.registerService(CalculatorIID, async () => new CalculatorService());
        c.registerService(SyncIncrementorIID, () => new SyncIncrementorService());
        c.registerService(AsyncIncrementorIID, () => new AsyncIncrementorService());
        c.registerService(AdderIID, () => _add);
        return c;
    }

    beforeEach(() => {
        // run tests in an independent context
        asm = createContext();
    })

    it('should support independent sub-contexts', async function () {
        const c1 = createContext();
        const c2 = createContext();

        expect(c1).not.toBe(c2);

        const s1 = await c1.get(CalculatorIID);
        const s2 = await c2.get(CalculatorIID);

        expect(s1).not.toBe(s2);

        expect(s1?.numberOfCalls).toBe(0);
        expect(s1!.add(1, 2)).toBe(3);
        expect(s1?.numberOfCalls).toBe(1);

        expect(s2?.numberOfCalls).toBe(0);
        expect(s2!.add(1, 2)).toBe(3);
        expect(s2?.numberOfCalls).toBe(1);


        const s1bis = await c1.get(CalculatorIID)!;
        expect(s1bis).toBe(s1);
        expect(s1bis?.numberOfCalls).toBe(1);

        const s = await asm.get(CalculatorIID)!;
        expect(s).not.toBe(s1);
        expect(s).not.toBe(s2);
        expect(s?.numberOfCalls).toBe(0);
    });

    it('should support async factories', async () => {
        // create a 2nd interface id for the calculator
        const CalcIID = interfaceId<Calculator>("asimo.src.tests.Calc");
        asm.registerService(CalcIID, async () => new CalculatorService());

        const calc = await asm.get(CalcIID)!;

        expect(calc?.numberOfCalls).toBe(0);
        expect(calc?.add(21, 21)).toBe(42);
        expect(calc?.numberOfCalls).toBe(1);
    });

    it('should delegate creation to parent context', async () => {
        const calc1 = await asm.get(CalculatorIID)!;
        calc1?.add(1, 2);

        const c1 = asm.createChildContext();
        const calc2 = await c1.get(CalculatorIID)!;

        expect(calc2).toBe(calc1);
        expect(calc2?.numberOfCalls).toBe(1);
    });

    it('should support get with string namespaces', async () => {
        const calc1 = await asm.get(CalculatorIID.ns);
        (calc1 as Calculator).add(1, 2);

        const c1 = asm.createChildContext();
        const calc2 = await c1.get(CalculatorIID)!;

        expect(calc2).toBe(calc1);
        expect(calc2?.numberOfCalls).toBe(1);
    });

    it('should return null for unknown interfaces', async () => {
        const CalcIID = interfaceId<Calculator>("asimo.src.tests.Calc");

        const calc = await asm.get(CalcIID)!;
        expect(calc).toBe(null);
    });

    describe('Invalid factories', () => {
        it('should return null when factory return undefined', async () => {
            // create a 2nd interface id for the calculator
            const CalcIID = interfaceId<Calculator>("asimo.src.tests.Calc");
            asm.registerService(CalcIID, () => undefined);

            const calc = await asm.get(CalcIID)!;

            expect(calc).toBe(null);
        });

        it('should return null when async factory returns undefined', async () => {
            // create a 2nd interface id for the calculator
            const CalcIID = interfaceId<Calculator>("asimo.src.tests.Calc");
            asm.registerService(CalcIID, async () => undefined);

            const calc = await asm.get(CalcIID)!;

            expect(calc).toBe(null);
        });

        it('should return null when factory does not return an object', async () => {
            // create a 2nd interface id for the calculator
            const CalcIID = interfaceId<Calculator>("asimo.src.tests.Calc");
            asm.registerService(CalcIID, () => 123 as any);

            const calc = await asm.get(CalcIID)!;

            expect(calc).toBe(null);
        });

        it('should return null when async factory does not return an object', async () => {
            // create a 2nd interface id for the calculator
            const CalcIID = interfaceId<Calculator>("asimo.src.tests.Calc");
            asm.registerService(CalcIID, async () => 123 as any);

            const calc = await asm.get(CalcIID)!;

            expect(calc).toBe(null);
        });
    });

    describe('Sync style service dependencies', () => {
        it('should load a service with a custom context', async () => {
            const calc = (await asm.get(CalculatorIID))!;
            const inc = (await asm.get(SyncIncrementorIID))!;

            await inc.init(asm);

            expect(calc.numberOfCalls).toBe(0);
            expect(inc.increment(41)).toBe(42);
            expect(calc.numberOfCalls).toBe(1); // calc service was called
            inc.offset = 3;
            expect(inc.increment(42)).toBe(45);
            expect(calc.numberOfCalls).toBe(2); // calc service was called
        });

        it('should load a service with the default context', async () => {
            const rootCalc = (await rootAsm.get(CalculatorIID))!;
            const calc = (await asm.get(CalculatorIID))!;
            const inc = (await asm.get(SyncIncrementorIID))!;

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

        it('should support function services', async () => {
            const add = await asm.get(AdderIID);
            expect(add(39, 3)).toBe(42);
        });
    });

    describe('Async style service dependencies', () => {
        it('should load a service with a custom context', async () => {
            const calc = (await asm.get(CalculatorIID))!;
            const inc = (await asm.get(AsyncIncrementorIID))!;

            inc.di = asm;

            expect(calc.numberOfCalls).toBe(0);
            expect(await inc.increment(41)).toBe(42);
            expect(calc.numberOfCalls).toBe(1); // calc service was called
            inc.offset = 3;
            expect(await inc.increment(42)).toBe(45);
            expect(calc.numberOfCalls).toBe(2); // calc service was called
        });
        it('should load a service with the default context', async () => {
            const rootCalc = (await rootAsm.get(CalculatorIID))!;
            const calc = await asm.get(CalculatorIID);
            const inc = (await asm.get(AsyncIncrementorIID))!;

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

    describe('Object factories', () => {
        it('should create multiple instances of a given object (root context)', async () => {
            const m1 = (await asm.get(MultiplierIID))!;
            const m2 = (await asm.get(MultiplierIID))!;

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

        it('should create multiple instances of a given object (sub context)', async () => {
            asm.registerFactory(MultiplierIID, () => {
                const m = new MultiplierImpl();
                m.defaultArg = 3;
                return m;
            });

            const m1 = (await asm.get(MultiplierIID))!;
            const m2 = (await asm.get(MultiplierIID))!;

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

    describe('Multi getter', () => {
        it('should return multiple object instances', async () => {
            const [m1, m2] = await asm.get(MultiplierIID, MultiplierIID);
            expect(m1.multiply(2, 5)).toBe(10);
            expect(m1.numberOfCalls).toBe(1);
            expect(m2.numberOfCalls).toBe(0);
            expect(m2.multiply(2, 21)).toBe(42);
        });

        it('should return object and service instances', async () => {
            const [m, c1, c2] = await asm.get(MultiplierIID, CalculatorIID, CalculatorIID);
            expect(m.multiply(2, 5)).toBe(10);
            expect(c1).toBe(c2);
            expect(m.numberOfCalls).toBe(1);
            expect(c1.add(3, 4)).toBe(7);
            expect(c2.numberOfCalls).toBe(1); // c2 === c1
        });

        it('should return multiple instances through string namespaces', async () => {
            const ns1 = MultiplierIID.ns;
            const ns2 = CalculatorIID.ns;
            const [m, c] = await asm.get(ns1, ns2);
            expect((m as Multiplier).multiply(2, 5)).toBe(10);
            expect((c as Calculator).add(3, 4)).toBe(7);
        });
    });

    // TODO
    // support mechanism for service to expose multiple interfaces
    // factory crash error
    // error management / throwOnError / errLogger
    // 2 different interface id objects with the same namespace should resolve to the same object
});
