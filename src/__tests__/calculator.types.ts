import { asyncIID } from "../asimo";

// typescript interface
export interface Calculator {
    numberOfCalls: number;
    add(a: number, b: number): number;
}

// interface id token associated to the typescript interface
export const CalculatorIID = asyncIID<Calculator>("asimo.src.tests.Calculator");
