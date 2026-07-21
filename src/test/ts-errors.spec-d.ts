import { describe, it } from "vitest";
import { bundle, createContainer, factory } from "../asimo";
import { addNumbers, divideNumbers, multiplyNumbers, subtractNumbers } from "./examples/operations";
import { ADDER, CALCULATOR, DIVIDER, MULTIPLIER, SUBTRACTOR, UNKNOWN } from "./examples/types";
import { createCalculator } from "./examples/calculator";

/**
 * This spec file is a typecheck-only spec (the `-d` suffix is picked up by vitest's
 * `typecheck.include` default glob). Vitest will NOT execute runtime assertions here;
 * it only runs `tsc` and fails if any `@ts-expect-error` directive becomes unused
 * (i.e. the expected TS error no longer occurs) or if an unexpected TS error occurs.
 */
describe("TS Errors", () => {
    it("should not allow a sync factory for an async interface", () => {
        createContainer({
            name: "test",
            services: [
                factory({
                    provide: ADDER,
                    // @ts-expect-error - sync factory is not allowed for an async interface
                    load: () => addNumbers,
                }),
            ],
        });
    });

    it("should not allow an async factory for a sync interface", () => {
        createContainer({
            name: "test",
            services: [
                factory({
                    provide: MULTIPLIER,
                    dependencies: [],
                    // @ts-expect-error - async factory (Promise) is not allowed for a sync interface
                    load: async () => multiplyNumbers,
                }),
            ],
        });
    });

    it("should not allow retrieving unknown services by get/fetch", () => {
        const context = createContainer({
            name: "math-container",
            services: [
                factory({
                    provide: ADDER,
                    dependencies: [],
                    load: async () => addNumbers,
                }),
                factory({
                    provide: MULTIPLIER,
                    dependencies: [],
                    load: () => multiplyNumbers,
                }),
            ],
        });

        // @ts-expect-error - DIVIDER is not part of the container services
        context.get(DIVIDER);
        // @ts-expect-error - DIVIDER is not part of the container services
        void context.fetch(DIVIDER);
    });

    it("should not allow retrieving AsyncIID services through get", async () => {
            const context = createContainer({
                name: "math-container",
                services: [
                    factory({
                        provide: ADDER,
                        load: async () => addNumbers,
                    }),
                    factory({
                        provide: MULTIPLIER,
                        load: () => multiplyNumbers,
                    }),
                ],
            });

            // @ts-expect-error - ADDER is an AsyncIID and cannot be retrieved through get()
            const addPromise = context.get(ADDER);
        });

    it("should not allow a service to declare dependencies that are not registered in the container", () => {
        createContainer({
            name: "calculator-container",
            services: [
                factory({
                    provide: MULTIPLIER,
                    load: () => multiplyNumbers,
                }),
                factory({
                    provide: DIVIDER,
                    dependencies: [],
                    load: () => divideNumbers,
                }),
                factory({
                    provide: ADDER,
                    load: async () => addNumbers,
                }),
                // @ts-expect-error - SUBTRACTOR is declared as a dependency but is not registered in the container
                factory({
                    provide: CALCULATOR,
                    dependencies: [MULTIPLIER, DIVIDER, ADDER, SUBTRACTOR],
                    load: (c) => createCalculator(c),
                }),
            ],
        });
    });

    it("should not allow a service where a factory is missing a dependency", () => {
        createContainer({
            name: "calculator-container",
            services: [
                factory({
                    provide: MULTIPLIER,
                    dependencies: [],
                    load: () => multiplyNumbers,
                }),
                factory({
                    provide: DIVIDER,
                    dependencies: [],
                    load: () => divideNumbers,
                }),
                factory({
                    provide: ADDER,
                    dependencies: [],
                    load: async () => addNumbers,
                }),
                factory({
                    provide: SUBTRACTOR,
                    dependencies: [],
                    load: async () => subtractNumbers,
                }),
                factory({
                    provide: CALCULATOR,
                    dependencies: [MULTIPLIER, ADDER, SUBTRACTOR],
                    // @ts-expect-error - DIVIDER is required by createCalculator but not listed in dependencies
                    load: (c) => createCalculator(c),
                }),
            ],
        });
    });

    it("should not allow inline service objects (must use factory())", () => {
        createContainer({
            name: "test",
            services: [
                // @ts-expect-error - inline objects without the __asimoServiceFactory brand are rejected
                {
                    interface: MULTIPLIER,
                    load: () => multiplyNumbers,
                },
            ],
        });
    });

    it("should not allow a bundle with a SyncIID in provide", () => {
        createContainer({
            name: "test",
            services: [
                bundle({
                    // @ts-expect-error - MULTIPLIER is SyncIID, bundle only accepts AsyncIID
                    provide: [MULTIPLIER],
                    load: async () => ({}) as any,
                }),
            ],
        });
    });

    it("should not allow a bundle with unregistered dependencies", () => {
        createContainer({
            name: "test",
            services: [
                factory({
                    provide: ADDER,
                    load: async () => addNumbers,
                }),
                // @ts-expect-error - UNKNOWN is declared as a dependency but is not registered
                bundle({
                    provide: [ADDER],
                    dependencies: [UNKNOWN],
                    load: async (_ctx) => ({}) as any,
                }),
            ],
        });
    });

    it("should not allow fetching services not defined int the bundle provide", () => {
        const c = createContainer({
            name: "nested-bundle",
            services: [
                factory({
                    provide: MULTIPLIER,
                    load: () => multiplyNumbers,
                }),
                bundle({
                    provide: [ADDER],
                    dependencies: [],
                    load: async () =>
                        createContainer({
                            name: "bundle-sub",
                            services: [
                                bundle({
                                    provide: [SUBTRACTOR],
                                    dependencies: [],
                                    load: async () =>
                                        createContainer({
                                            name: "inner-sub",
                                            services: [
                                                factory({
                                                    provide: SUBTRACTOR,
                                                    load: async () => subtractNumbers,
                                                }),
                                            ],
                                        }),
                                }),
                                factory({
                                    provide: ADDER,
                                    load: async () => addNumbers,
                                }),
                            ],
                        }),
                }),
            ],
        });

        // @ts-expect-error - SUBTRACTOR is not part of the bundle provide
        c.fetch(SUBTRACTOR);
    });
});
