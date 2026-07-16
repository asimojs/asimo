import { describe, it } from "vitest";
import { createIocContainer } from "../asimo";
import { addNumbers, divideNumbers, multiplyNumbers, subtractNumbers } from "./examples/operations";
import { ADDER, CALCULATOR, DIVIDER, MULTIPLIER, SUBTRACTOR } from "./examples/types";
import { createCalculator } from "./examples/calculator";
import type { Container } from "../asimo.types";

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
                {
                    interface: ADDER,
                    // @ts-expect-error - sync factory is not allowed for an async interface
                    load: () => addNumbers,
                },
            ],
        });
    });

    it("should not allow an async factory for a sync interface", () => {
        createIocContainer({
            name: "test",
            services: [
                {
                    interface: MULTIPLIER,
                    // @ts-expect-error - async factory (Promise) is not allowed for a sync interface
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

    it("should not allow accessing the container in load() without declaring dependencies", () => {
        createIocContainer({
            name: "test",
            services: [
                {
                    interface: MULTIPLIER,
                    load: () => multiplyNumbers,
                },
                {
                    interface: DIVIDER,
                    load: () => divideNumbers,
                },
                {
                    interface: CALCULATOR,
                    // no dependencies declared — load's context is `undefined`, not a container
                    // @ts-expect-error - `c` is `undefined` because no dependencies are declared
                    load: (c) => {
                        createCalculator(c);
                        return null as any;
                    },
                },
            ],
        });
    });

    it("should not allow a service to declare dependencies that are not registered in the container", () => {
        createIocContainer({
            name: "calculator-container",
            services: [
                {
                    interface: MULTIPLIER,
                    load: () => multiplyNumbers,
                },
                {
                    interface: DIVIDER,
                    load: () => divideNumbers,
                },
                {
                    interface: ADDER,
                    load: async () => addNumbers,
                },
                {
                    // @ts-expect-error - SUBTRACTOR is declared as a dependency but is not registered in the container
                    interface: CALCULATOR,
                    dependencies: [MULTIPLIER, DIVIDER, ADDER, SUBTRACTOR],
                    load: (c) => createCalculator(c),
                },
            ],
        });
    });

    it("should not allow a service where a factory is missing a dependency", () => {
        createIocContainer({
            name: "calculator-container",
            services: [
                {
                    interface: MULTIPLIER,
                    load: () => multiplyNumbers,
                },
                {
                    interface: DIVIDER,
                    load: () => divideNumbers,
                },
                {
                    interface: ADDER,
                    load: async () => addNumbers,
                },
                {
                    interface: SUBTRACTOR,
                    load: async () => subtractNumbers,
                },
                {
                    interface: CALCULATOR,
                    dependencies: [MULTIPLIER, ADDER, SUBTRACTOR],
                    // The load context is explicitly typed with the declared dependencies (only 3).
                    // `createCalculator` requires all 4 IIDs — the invariant phantom on IoCContainer
                    // catches the mismatch at compile time, since IoCContainer<3 IIDs> is NOT
                    // assignable to IoCContainer<4 IIDs>.
                    // @ts-expect-error - DIVIDER is required by createCalculator but not listed in dependencies
                    load: (c: Container<[typeof MULTIPLIER, typeof ADDER, typeof SUBTRACTOR]>) => createCalculator(c),
                },
            ],
        });
    });
});
