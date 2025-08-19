import { asm, asyncIID } from "../asimo";

export interface Multiplier {
    numberOfCalls: number;
    multiply(a: number, b?: number): number;
}

export class _MultiplierImpl implements Multiplier {
    defaultArg = 2;
    numberOfCalls = 0;

    multiply(a: number, b?: number) {
        b = b === undefined ? this.defaultArg : b;
        this.numberOfCalls++;
        return a * b;
    }
}

// NB: interface and registration should be defined in separate files to benefit from on-demand module load
export const MultiplierIID = asyncIID<Multiplier>("asimo.src.tests.Multiplier");
asm.registerFactory(MultiplierIID, () => new _MultiplierImpl());
