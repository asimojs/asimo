import { Container } from "../../asimo.types";
import { ADDER, DIVIDER, MULTIPLIER, SUBTRACTER } from "./types";

export function createCalculator(
    context: Container<typeof MULTIPLIER | typeof DIVIDER | typeof ADDER | typeof SUBTRACTER>,
) {
    const [multiplier, divider] = context.get(MULTIPLIER, DIVIDER);

    return {
        multiply: multiplier,
        divide: divider,
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
