import { asm, interfaceId } from "../asimo";
import { AsmContext } from "../types";
import { Calculator, CalculatorIID } from "./types";

/**
 * Incrementor with a sync increment() method
 * and an async init() method to setup the service once and for all
 */
export interface AsyncIncrementor {
    offset: number;
    di: AsmContext;
    increment(n: number): Promise<number>;
}

export class _AsyncIncrementorService implements AsyncIncrementor {
    offset = 1;
    di = asm; // DI context

    async increment(n: number) {
        if (!this.di) throw "Not DI context";
        return (await this.di.get(CalculatorIID))!.add(n, this.offset);
    }
}

// NB: interface and registration should be defined in separate files to benefit from on-demand module load
export const AsyncIncrementorIID = interfaceId<AsyncIncrementor>("asimo.src.tests.AsyncIncrementor");
asm.registerService(AsyncIncrementorIID, () => new _AsyncIncrementorService());
