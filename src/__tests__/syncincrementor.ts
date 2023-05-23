import { asm, interfaceId } from "../asimo";
import { AsmContext } from "../types";
import { Calculator, CalculatorIID } from "./calculator";

/**
 * Incrementor with a sync increment() method
 * and an async init() method to setup the service once and for all
 */
export interface SyncIncrementor {
    offset: number;
    increment(n: number): number;
    init(c?: AsmContext): Promise<void>;
}

export class SyncIncrementorService implements SyncIncrementor {
    offset = 1;
    calc: Calculator;

    async init(c?: AsmContext) {
        const di = c || asm;
        this.calc = (await di.get(CalculatorIID))!
    }

    increment(n: number) {
        if (!this.calc) throw "Not initialized";
        return this.calc.add(n, this.offset);
    }
}

// NB: interface and registration should be defined in separate files to benefit from on-demand module load
export const SyncIncrementorIID = interfaceId<SyncIncrementor>("asimo.src.tests.SyncIncrementor");
asm.registerService(SyncIncrementorIID, () => new SyncIncrementorService());
