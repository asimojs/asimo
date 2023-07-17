import { asm } from "../asimo";
import { Calculator, CalculatorIID } from "./types";

// Calculator implementation
export class _CalculatorService implements Calculator {
    numberOfCalls = 0;

    add(a: number, b: number) {
        this.numberOfCalls++;
        return a + b;
    }
}

// Service registration
asm.registerService(CalculatorIID, () => new _CalculatorService());
