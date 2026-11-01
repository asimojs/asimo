import type { Context } from "../../asimo.types";
import { DIVIDER } from "./types";

export function componentC({ context }: { context: Context<typeof DIVIDER> }) {
    const divide = context.get(DIVIDER);

    return {
        divideBy2(a: number) {
            return divide(a, 2);
        },
    };
}
