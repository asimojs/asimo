import type { Container, InferType } from "../../asimo.types";
import { ADDER, DIVIDER, MULTIPLIER, SUBTRACTER } from "./types";

/** Calculator factory function */
export function createCalculator(
    context: Container<typeof MULTIPLIER | typeof DIVIDER | typeof ADDER | typeof SUBTRACTER>,
) {
    const [multiply, divide] = context.get(MULTIPLIER, DIVIDER);

    return {
        multiply,
        divide,
        async add(a: number, b: number) {
            const add = await context.fetch(ADDER);
            return add(a, b);
        },
        async subtract(a: number, b: number) {
            const subtract = await context.fetch(SUBTRACTER);
            return subtract(a, b);
        },
    };
}

/** Calculator class */
export class Calculator {
    private _multiply: InferType<typeof MULTIPLIER>;
    private _divide: InferType<typeof DIVIDER>;

    constructor(
        private readonly context: Container<typeof MULTIPLIER | typeof DIVIDER | typeof ADDER | typeof SUBTRACTER>,
    ) {
        this._multiply = context.get(MULTIPLIER);
        this._divide = context.get(DIVIDER);
    }

    multiply(a: number, b: number) {
        return this._multiply(a, b);
    }

    divide(a: number, b: number) {
        return this._divide(a, b);
    }

    async add(a: number, b: number) {
        const add = await this.context.fetch(ADDER);
        return add(a, b);
    }

    async subtract(a: number, b: number) {
        const subtract = await this.context.fetch(SUBTRACTER);
        return subtract(a, b);
    }
}
