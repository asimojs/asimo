import { asm, interfaceId } from "../asimo";

export interface Calculator {
    numberOfCalls: number;
    add(a: number, b: number): number;
}

export class CalculatorService implements Calculator {
    numberOfCalls = 0;

    add(a: number, b: number) {
        this.numberOfCalls++;
        return a + b;
    }
}

// NB: interface and registration should be defined in separate files to benefit from on-demand module load
export const CalculatorIID = interfaceId<Calculator>("asimo.src.tests.Calculator");
asm.registerService(CalculatorIID, () => new CalculatorService());
