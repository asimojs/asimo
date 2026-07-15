import { describe, it } from "vitest";
import { createIocContainer } from "../asimo";
import { addNumbers, multiplyNumbers } from "./examples/operations";
import { ADDER, DIVIDER, MULTIPLIER } from "./examples/types";

/**
 * This spec file is a typecheck-only spec (the `-d` suffix is picked up by vitest's
 * `typecheck.include` default glob). Vitest will NOT execute runtime assertions here;
 * it only runs `tsc` and fails if any `@ts-expect-error` directive becomes unused
 * (i.e. the expected TS error no longer occurs) or if an unexpected TS error occurs.
 */
describe("TS Errors", () => {
    it("should not allow a sync factory for an async interface", () => {
        createIocContainer({
            name: "test",
            services: [
                // @ts-expect-error - sync factory is not allowed for an async interface
                {
                    interface: ADDER,
                    load: () => addNumbers,
                },
            ],
        });
    });

    it("should not allow an async factory for a sync interface", () => {
        createIocContainer({
            name: "test",
            services: [
                // @ts-expect-error - async factory (Promise) is not allowed for a sync interface
                {
                    interface: MULTIPLIER,
                    load: async () => multiplyNumbers,
                },
            ],
        });
    });

    it("should not allow retrieving unknown services by get/fetch", () => {
        const context = createIocContainer({
            name: "math-container",
            services: [
                {
                    interface: ADDER,
                    load: async () => addNumbers,
                },
                {
                    interface: MULTIPLIER,
                    load: () => multiplyNumbers,
                },
            ],
        });

        // @ts-expect-error - DIVIDER is not part of the container services
        context.get(DIVIDER);
        // @ts-expect-error - DIVIDER is not part of the container services
        void context.fetch(DIVIDER);
    });
});