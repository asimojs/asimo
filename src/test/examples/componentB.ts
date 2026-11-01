import type { Context, ContextDeps } from "../../asimo.types";
import { componentC } from "./componentC";
import { MULTIPLIER } from "./types";

export function componentB({ context }: { context: Context<typeof MULTIPLIER | ContextDeps<typeof componentC>> }) {
    const multiply = context.get(MULTIPLIER);
    const c = componentC({ context });

    return {
        divideBy2: c.divideBy2,
        multiply(a: number, b: number) {
            return multiply(a, b);
        },
    };
}
