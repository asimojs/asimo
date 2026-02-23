import { asm, asyncIID, IoCContainer } from "../asimo";

export interface Multiplier {
    numberOfCalls: number;
    multiply(a: number, b?: number): number;
}

class _MultiplierImpl implements Multiplier {
    defaultArg = 2;
    numberOfCalls = 0;

    multiply(a: number, b?: number) {
        b = b === undefined ? this.defaultArg : b;
        this.numberOfCalls++;
        return a * b;
    }
}

export function multiplierFactory() {
    return new _MultiplierImpl();
}

// NB: interface and registration should be defined in separate files to benefit from on-demand module load
export const MultiplierFactoryIID = asyncIID<typeof multiplierFactory>("asimo.src.tests.MultiplierFactory");


asm.registerService(MultiplierFactoryIID, async (c: IoCContainer) => {
    // the factory could be asyncrhonously initialized
    return multiplierFactory
});
