import type { Context, ContextDeps } from "../../asimo.types";
import { componentB } from "./componentB";
import { ADDER } from "./types";

// Sample component containing a sub-component B with different dependencies
export function componentA({
    context,
}: {
    context: Context<typeof ADDER | ContextDeps<typeof componentB>>;
}) {
    const b = componentB({ context });

    return {
        multiply: b.multiply,
        async add(a: number, b: number) {
            const adder = await context.fetch(ADDER);
            return adder(a, b);
        },
    };
}
