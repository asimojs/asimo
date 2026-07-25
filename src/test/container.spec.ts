import { describe, expect, it } from "vitest";
import { AsimoError, AsimoLoadError, bundle, createContainer, factory } from "../asimo";
import { addNumbers, multiplyNumbers, divideNumbers, subtractNumbers } from "./examples/operations";
import { ADDER, CALCULATOR, DIVIDER, MULTIPLIER, SUBTRACTER, UNKNOWN } from "./examples/types";
import { createCalculator, Calculator } from "./examples/calculator";

describe("IoC Container", () => {
    describe("Container with no parents", () => {
        it("should create an empty container with a name and services", () => {
            const context = createContainer({
                name: "mycontainer",
            });

            expect(context.name).toBe("mycontainer");
        });

        it("should create a container with one async service", async () => {
            const context = createContainer({
                name: "adder-container",
                services: [
                    factory({
                        provide: ADDER,
                        load: async () => addNumbers,
                    }),
                ],
            });
            expect(context.name).toBe("adder-container");
            const add = await context.fetch(ADDER);
            expect(add(2, 3)).toBe(5);
        });

        it("should create a container with one sync service", () => {
            const context = createContainer({
                name: "multiplier-container",
                services: [
                    factory({
                        provide: MULTIPLIER,
                        load: () => multiplyNumbers,
                    }),
                ],
            });
            expect(context.name).toBe("multiplier-container");
            const multiply = context.get(MULTIPLIER);
            expect(multiply(2, 3)).toBe(6);
        });

        it("should support multiple services in the same container", async () => {
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

            const add = await context.fetch(ADDER);
            const multiply = context.get(MULTIPLIER);
            expect(add(2, 3)).toBe(5);
            expect(multiply(2, 3)).toBe(6);

            // fetch allows to retrieve services with sync and async factories
            const multiply2 = await context.fetch(MULTIPLIER);
            expect(multiply2(3, 4)).toBe(12);

            // fetch retrieves services with sync and async factories
            const add2 = await context.fetch(ADDER);
            expect(add2(3, 4)).toBe(7);
        });

        it("should allow to get and fetch multiple services at once", async () => {
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
                    factory({
                        provide: DIVIDER,
                        load: () => divideNumbers,
                    }),
                ],
            });

            const [multiply, divide] = context.get(MULTIPLIER, DIVIDER);
            expect(multiply(2, 3)).toBe(6);
            expect(divide(6, 3)).toBe(2);

            const [add2, multiply2, divide2] = await context.fetch(ADDER, MULTIPLIER, DIVIDER);
            expect(add2(2, 3)).toBe(5);
            expect(multiply2(3, 4)).toBe(12);
            expect(divide2(12, 4)).toBe(3);
        });

        it("should allow to get optional services that are not necessarily defined on the container", async () => {
            const context = createContainer({
                name: "math-container",
                services: [
                    factory({
                        provide: MULTIPLIER,
                        load: () => multiplyNumbers,
                    }),
                ],
            });

            const multiply = context.getOptional(MULTIPLIER);
            expect(multiply!(2, 3)).toBe(6);

            const divide = context.getOptional(DIVIDER);
            expect(divide).toBeNull();
        });

        it("should allow to fetch optional services that are not necessarily defined on the container", async () => {
            const context = createContainer({
                name: "math-container",
                services: [
                    factory({
                        provide: MULTIPLIER,
                        load: () => multiplyNumbers,
                    }),
                ],
            });

            const multiply = await context.fetchOptional(MULTIPLIER);
            expect(multiply!(2, 3)).toBe(6);

            const divide = await context.fetchOptional(DIVIDER);
            expect(divide).toBeNull();
        });

        it("should expose a path equal to its name when the container has no parent", () => {
            const context = createContainer({
                name: "mycontainer",
                services: [],
            });

            expect(context.path).toBe("/mycontainer");
        });

        it("should throw when retrieving unknown services via get/fetch", async () => {
            const context = createContainer({
                name: "math-container",
                services: [
                    factory({
                        provide: MULTIPLIER,
                        load: () => multiplyNumbers,
                    }),
                ],
            });

            // Bypass type safety intentionally: runtime verifies the throw, typecheck
            // verification is covered by ts-errors.spec-d.ts
            {
                let error: unknown;
                try {
                    context.get(DIVIDER as any);
                } catch (e) {
                    error = e;
                }
                expect(error).toBeInstanceOf(AsimoError);
                expect((error as AsimoError).container).toBe("/math-container");
                expect((error as Error).message).toBe(
                    "[Asimo] Service not found: asimo.src.test.Divider at /math-container",
                );
            }
            {
                let error: unknown;
                try {
                    await context.fetch(DIVIDER as any);
                } catch (e) {
                    error = e;
                }
                expect(error).toBeInstanceOf(AsimoError);
                expect((error as AsimoError).container).toBe("/math-container");
                expect((error as Error).message).toBe(
                    "[Asimo] Service not found: asimo.src.test.Divider at /math-container",
                );
            }
        });

        it("should throw when creating a container with a forward slash in its name", () => {
            expect(() =>
                createContainer({
                    name: "bad/name",
                    services: [],
                }),
            ).toThrow('[Asimo] Container name must not contain forward slashes: "bad/name"');
        });

        it("should throw when services is a single object instead of an array", () => {
            expect(() =>
                (createContainer as any)({
                    name: "test",
                    services: {
                        provide: ADDER,
                        load: async () => addNumbers,
                    },
                }),
            ).toThrow("[Asimo] services must be an array");
        });

    });

    describe("Container with parents", () => {
        function createTestContainer() {
            // c4 -> c2 -> c1
            //    -> c3

            const c1 = createContainer({
                name: "substraction",
                services: [
                    factory({
                        provide: SUBTRACTER,
                        load: async () => subtractNumbers,
                    }),
                ],
            });
            const c2 = createContainer({
                name: "addition",
                extends: [c1],
                services: [
                    factory({
                        provide: ADDER,
                        load: async () => addNumbers,
                    }),
                ],
            });
            const c3 = createContainer({
                name: "division",
                services: [
                    factory({
                        provide: DIVIDER,
                        load: () => divideNumbers,
                    }),
                ],
            });
            const c4 = createContainer({
                name: "multiplier",
                extends: [c2, c3],
                services: [
                    factory({
                        provide: MULTIPLIER,
                        load: () => multiplyNumbers,
                    }),
                ],
            });
            return c4;
        }

        it("should expose a path built from the first parent's path and its own name", () => {
            const c = createTestContainer();

            // c4 -> c2 -> c1, c3 (path follows the first parent chain: c1/c2/c4)
            expect(c.path).toBe("/substraction/addition/multiplier");
        });

        it("should allow a container to be defined with no services", async () => {
            // c3 -> c1
            //    -> c2

            const c1 = createContainer({
                name: "substraction",
                services: [
                    factory({
                        provide: SUBTRACTER,
                        load: async () => subtractNumbers,
                    }),
                ],
            });
            const c2 = createContainer({
                name: "addition",
                services: [
                    factory({
                        provide: ADDER,
                        load: async () => addNumbers,
                    }),
                ],
            });
            const c3 = createContainer({
                name: "group",
                extends: [c1, c2],
            });

            const [add, substract] = await c3.fetch(ADDER, SUBTRACTER);
            expect(add(2, 3)).toBe(5);
            expect(substract(2, 3)).toBe(-1);
        });

        it("should retrieve all dependencies", async () => {
            const c = createTestContainer();

            const [multiply, divide] = c.get(MULTIPLIER, DIVIDER);
            expect(multiply(3, 4)).toBe(12);
            expect(divide(12, 4)).toBe(3);

            const [add2, substract2, multiply2, divide2] = await c.fetch(
                ADDER,
                SUBTRACTER,
                MULTIPLIER,
                DIVIDER,
            );
            expect(multiply2(3, 4)).toBe(12);
            expect(divide2(12, 4)).toBe(3);
            expect(add2(2, 3)).toBe(5);
            expect(substract2(2, 3)).toBe(-1);
        });

        it("should allow to get optional services that are not necessarily defined on the container", () => {
            const c = createTestContainer();

            // services defined in the container or its parents
            const multiply = c.getOptional(MULTIPLIER);
            expect(multiply!(3, 4)).toBe(12);

            // service missing in the container and its parents
            const unknown = c.getOptional(UNKNOWN);
            expect(unknown).toBeNull();

            // mixed: known + unknown
            const [multiply2, unknown2] = c.getOptional(MULTIPLIER, UNKNOWN);
            expect(multiply2!(3, 4)).toBe(12);
            expect(unknown2).toBeNull();
        });

        it("should allow to fetch optional services that are not necessarily defined on the container", async () => {
            const c = createTestContainer();

            const multiply = await c.fetchOptional(MULTIPLIER);
            expect(multiply!(3, 4)).toBe(12);

            const unknown = await c.fetchOptional(UNKNOWN);
            expect(unknown).toBeNull();

            const [add2, unknown2, divide2] = await c.fetchOptional(ADDER, UNKNOWN, DIVIDER);
            expect(add2!(2, 3)).toBe(5);
            expect(unknown2).toBeNull();
            expect(divide2!(12, 4)).toBe(3);
        });

        it("should pass the container context to the service factory", async () => {
            const c4 = createTestContainer();
            const c5 = createContainer({
                name: "calculator",
                extends: [c4],
                services: [
                    factory({
                        provide: CALCULATOR,
                        dependencies: [MULTIPLIER, DIVIDER, ADDER, SUBTRACTER],
                        load: (c) => createCalculator(c),
                    }),
                ],
            });

            const calculator = c5.get(CALCULATOR);
            expect(calculator.multiply(3, 4)).toBe(12);
            expect(calculator.divide(12, 4)).toBe(3);
            expect(await calculator.add(2, 3)).toBe(5);
            expect(await calculator.subtract(2, 3)).toBe(-1);
        });

        it("should instantiate Calculator class with container context", () => {
            const c = createTestContainer();
            const calc = new Calculator(c);

            expect(calc.multiply(3, 4)).toBe(12);
            expect(calc.divide(12, 4)).toBe(3);
        });

        it("should support async operations on Calculator class", async () => {
            const c = createTestContainer();
            const calc = new Calculator(c);

            const sum = await calc.add(2, 3);
            const diff = await calc.subtract(2, 3);

            expect(sum).toBe(5);
            expect(diff).toBe(-1);
        });

        it("should lazily load async dependencies on Calculator class", () => {
            const c = createTestContainer();
            const calc = new Calculator(c);

            // Before any async call, ADDER and SUBTRACTER should be "registered" (not loaded)
            expect(c.inspect(ADDER)?.status).toBe("registered");
            expect(c.inspect(SUBTRACTER)?.status).toBe("registered");

            // Sync services should already be loaded (accessed in constructor)
            expect(c.inspect(MULTIPLIER)?.status).toBe("loaded");
            expect(c.inspect(DIVIDER)?.status).toBe("loaded");
        });

        it("should load async dependencies on first access with Calculator class", async () => {
            const c = createTestContainer();
            const calc = new Calculator(c);

            expect(c.inspect(ADDER)?.status).toBe("registered");

            await calc.add(2, 3);

            expect(c.inspect(ADDER)?.status).toBe("loaded");

            // SUBTRACTER should still be unloaded (not yet accessed)
            expect(c.inspect(SUBTRACTER)?.status).toBe("registered");
        });

        it("should load all async dependencies after calling both Calculator class methods", async () => {
            const c = createTestContainer();
            const calc = new Calculator(c);

            await calc.add(2, 3);
            await calc.subtract(5, 1);

            expect(c.inspect(ADDER)?.status).toBe("loaded");
            expect(c.inspect(SUBTRACTER)?.status).toBe("loaded");
        });

        it("should expose null parents for a root container", () => {
            const c = createContainer({
                name: "root",
                services: [],
            });
            expect(c.parents).toBeNull();
        });

        it("should expose the parent container when extends is used", () => {
            const parent = createContainer({
                name: "parent",
                services: [
                    factory({
                        provide: MULTIPLIER,
                        load: () => multiplyNumbers,
                    }),
                ],
            });
            const child = createContainer({
                name: "child",
                extends: [parent],
                services: [],
            });
            expect(child.parents).toHaveLength(1);
            expect(child.parents![0].name).toBe("parent");
        });

        it("should expose multiple parents when extends has multiple containers", () => {
            const p1 = createContainer({
                name: "p1",
                services: [
                    factory({
                        provide: MULTIPLIER,
                        load: () => multiplyNumbers,
                    }),
                ],
            });
            const p2 = createContainer({
                name: "p2",
                services: [
                    factory({
                        provide: DIVIDER,
                        load: () => divideNumbers,
                    }),
                ],
            });
            const child = createContainer({
                name: "child",
                extends: [p1, p2],
                services: [],
            });
            expect(child.parents).toHaveLength(2);
            expect(child.parents![0].name).toBe("p1");
            expect(child.parents![1].name).toBe("p2");
        });

        it("should expose only the immediate parent, not the grandparent", () => {
            const grandparent = createContainer({
                name: "gp",
                services: [
                    factory({
                        provide: MULTIPLIER,
                        load: () => multiplyNumbers,
                    }),
                ],
            });
            const parent = createContainer({
                name: "p",
                extends: [grandparent],
                services: [],
            });
            const child = createContainer({
                name: "c",
                extends: [parent],
                services: [],
            });
            expect(child.parents).toHaveLength(1);
            expect(child.parents![0].name).toBe("p");
            expect(child.parents![0].parents![0].name).toBe("gp");
        });

        it("should freeze the parents array to prevent external mutation", () => {
            const parent = createContainer({
                name: "parent",
                services: [
                    factory({
                        provide: MULTIPLIER,
                        load: () => multiplyNumbers,
                    }),
                ],
            });

            const parents = [parent];
            const child = createContainer({
                name: "child",
                extends: parents,
                services: [],
            });
            parents.push(createContainer({
                name: "another-parent",
                services: [
                    factory({
                        provide: MULTIPLIER,
                        load: () => multiplyNumbers,
                    }),
                ],
            }));
            expect(Object.isFrozen(child.parents)).toBe(true);
            expect(child.parents).toHaveLength(1);
            expect(child.parents![0].name).toBe("parent");
        });

        it("should throw at runtime when a dependency listed in dependencies is not registered", async () => {
            const c = createContainer({
                name: "calculator-container",
                services: [
                    factory({
                        provide: MULTIPLIER,
                        load: () => multiplyNumbers,
                    }),
                    factory({
                        provide: DIVIDER,
                        load: () => divideNumbers,
                    }),
                    factory({
                        provide: ADDER,
                        load: async () => addNumbers,
                    }),
                    // SUBTRACTER is not registered — this passes typecheck
                    // because we bypass it with `as any`, but throws at runtime
                    factory({
                        provide: CALCULATOR,
                        dependencies: [MULTIPLIER, DIVIDER, ADDER, SUBTRACTER] as any,
                        load: (ctx: any) => createCalculator(ctx),
                    }) as any,
                ],
            });

            const calculator = c.get(CALCULATOR);
            expect(calculator.multiply(3, 4)).toBe(12);
            expect(calculator.divide(12, 4)).toBe(3);
            await expect(calculator.add(2, 3)).resolves.toBe(5);
            // SUBTRACTER is missing — subtract() should throw at runtime
            {
                let error: unknown;
                try {
                    await calculator.subtract(2, 3);
                } catch (e) {
                    error = e;
                }
                expect(error).toBeInstanceOf(AsimoError);
                expect((error as AsimoError).container).toBe("/calculator-container");
                expect((error as Error).message).toBe(
                    "[Asimo] Service not found: asimo.src.test.Subtracter at /calculator-container",
                );
            }
        });
    });

    describe("Bundle loading", () => {
        it("should load a bundle on-demand and resolve the requested service", async () => {
            const c = createContainer({
                name: "bundle-test",
                services: [
                    bundle({
                        provide: [ADDER, SUBTRACTER],
                        load: async () =>
                            createContainer({
                                name: "bundle-sub",
                                services: [
                                    factory({
                                        provide: ADDER,
                                        load: async () => addNumbers,
                                    }),
                                    factory({
                                        provide: SUBTRACTER,
                                        load: async () => subtractNumbers,
                                    }),
                                ],
                            }),
                    }),
                ],
            });

            const add = await c.fetch(ADDER);
            expect(add(2, 3)).toBe(5);

            const subtract = await c.fetch(SUBTRACTER);
            expect(subtract(5, 3)).toBe(2);
        });

        it("should load a bundle via fetch()", async () => {
            const c = createContainer({
                name: "bundle-get-test",
                services: [
                    bundle({
                        provide: [ADDER, SUBTRACTER],
                        dependencies: [],
                        load: async () =>
                            createContainer({
                                name: "bundle-sub",
                                services: [
                                    factory({
                                        provide: ADDER,
                                        load: async () => addNumbers,
                                    }),
                                    factory({
                                        provide: SUBTRACTER,
                                        load: async () => subtractNumbers,
                                    }),
                                ],
                            }),
                    }),
                ],
            });

            const [add, subtract] = await c.fetch(ADDER, SUBTRACTER);
            expect(add(10, 5)).toBe(15);
            expect(subtract(10, 5)).toBe(5);
        });

        it("should load a bundle only once (subsequent requests use cached instance)", async () => {
            let loadCount = 0;
            const c = createContainer({
                name: "bundle-once-test",
                services: [
                    bundle({
                        provide: [ADDER],
                        load: async () => {
                            loadCount++;
                            return createContainer({
                                name: "bundle-sub",
                                services: [
                                    factory({
                                        provide: ADDER,
                                        load: async () => addNumbers,
                                    }),
                                ],
                            });
                        },
                    }),
                ],
            });

            const add1 = await c.fetch(ADDER);
            expect(add1(1, 2)).toBe(3);
            expect(loadCount).toBe(1);

            const add2 = await c.fetch(ADDER);
            expect(add2(3, 4)).toBe(7);
            expect(loadCount).toBe(1);
        });

        it("should not trigger multiple loads when the same bundle is fetched concurrently", async () => {
            let loadCount = 0;
            const c = createContainer({
                name: "concurrent-bundle",
                services: [
                    bundle({
                        provide: [ADDER, SUBTRACTER],
                        load: async () => {
                            loadCount++;
                            // Simulate a realistic async load (e.g. dynamic import)
                            await new Promise((r) => setTimeout(r, 10));
                            return createContainer({
                                name: "bundle-sub",
                                services: [
                                    factory({
                                        provide: ADDER,
                                        load: async () => addNumbers,
                                    }),
                                    factory({
                                        provide: SUBTRACTER,
                                        load: async () => subtractNumbers,
                                    }),
                                ],
                            });
                        },
                    }),
                ],
            });

            const [add, subtract] = await Promise.all([c.fetch(ADDER), c.fetch(SUBTRACTER)]);

            expect(add(2, 3)).toBe(5);
            expect(subtract(5, 3)).toBe(2);
            expect(loadCount).toBe(1);
        });

        it("should not eagerly invoke sub-factories when a bundle is loaded", async () => {
            let adderLoadCount = 0;
            let subtracterLoadCount = 0;
            const c = createContainer({
                name: "lazy-factory-bundle",
                services: [
                    bundle({
                        provide: [ADDER, SUBTRACTER],
                        load: async () => {
                            await new Promise((r) => setTimeout(r, 5));
                            return createContainer({
                                name: "bundle-sub",
                                services: [
                                    factory({
                                        provide: ADDER,
                                        load: async () => {
                                            adderLoadCount++;
                                            return addNumbers;
                                        },
                                    }),
                                    factory({
                                        provide: SUBTRACTER,
                                        load: async () => {
                                            subtracterLoadCount++;
                                            return subtractNumbers;
                                        },
                                    }),
                                ],
                            });
                        },
                    }),
                ],
            });

            expect(adderLoadCount).toBe(0);
            expect(subtracterLoadCount).toBe(0);

            // Fetch only ADDER — SUBTRACTER factory should NOT be called
            const add = await c.fetch(ADDER);
            expect(add(2, 3)).toBe(5);
            expect(adderLoadCount).toBe(1);
            expect(subtracterLoadCount).toBe(0);

            // Fetch SUBTRACTER later — now its factory is invoked
            const subtract = await c.fetch(SUBTRACTER);
            expect(subtract(5, 3)).toBe(2);
            expect(subtracterLoadCount).toBe(1);

            // Second fetch of ADDER reuses cached instance, no new factory call
            const add2 = await c.fetch(ADDER);
            expect(add2(3, 4)).toBe(7);
            expect(adderLoadCount).toBe(1);
            expect(subtracterLoadCount).toBe(1);
        });

        it("should not eagerly load nested bundles", async () => {
            let innerBundleLoadCount = 0,
                outerBundleLoadCount = 0;
            const c = createContainer({
                name: "lazy-bundle-test",
                services: [
                    bundle({
                        provide: [ADDER, SUBTRACTER],
                        load: async () => {
                            outerBundleLoadCount++;
                            await new Promise((r) => setTimeout(r, 5));
                            return createContainer({
                                name: "outer-sub",
                                services: [
                                    factory({
                                        provide: ADDER,
                                        load: async () => addNumbers,
                                    }),
                                    bundle({
                                        provide: [SUBTRACTER],
                                        load: async () => {
                                            innerBundleLoadCount++;
                                            await new Promise((r) => setTimeout(r, 5));
                                            return createContainer({
                                                name: "inner-sub",
                                                services: [
                                                    factory({
                                                        provide: SUBTRACTER,
                                                        load: async () => subtractNumbers,
                                                    }),
                                                ],
                                            });
                                        },
                                    }),
                                ],
                            });
                        },
                    }),
                ],
            });
            expect(outerBundleLoadCount).toBe(0);

            // Fetch ADDER — outer bundle loads, inner bundle is registered but NOT loaded
            const add = await c.fetch(ADDER);
            expect(add(2, 3)).toBe(5);
            expect(innerBundleLoadCount).toBe(0);
            expect(outerBundleLoadCount).toBe(1);

            // Fetch SUBTRACTER — now the inner bundle is loaded on-demand
            const subtract = await c.fetch(SUBTRACTER);
            expect(subtract(5, 3)).toBe(2);
            expect(innerBundleLoadCount).toBe(1);

            // Second fetch of SUBTRACTER reuses cached instance, inner bundle not reloaded
            const subtract2 = await c.fetch(SUBTRACTER);
            expect(subtract2(10, 4)).toBe(6);
            expect(innerBundleLoadCount).toBe(1);

            expect(outerBundleLoadCount).toBe(1);
        });

        it("should throw on circular bundle loading", async () => {
            const c = createContainer({
                name: "circular-bundle",
                services: [
                    bundle({
                        provide: [ADDER],
                        dependencies: [],
                        load: async (ctx: any) => {
                            await ctx.fetch(ADDER);
                            return createContainer({
                                name: "bundle-sub",
                                services: [],
                            });
                        },
                    } as any),
                ],
            });

            {
                let error: unknown;
                try {
                    await c.fetch(ADDER as any);
                } catch (e) {
                    error = e;
                }
                expect(error).toBeInstanceOf(AsimoError);
                expect((error as AsimoError).container).toBe("/circular-bundle");
                expect((error as AsimoError).messagePrefix).toBe("[Asimo] ");
                expect((error as Error).message).toBe(
                    "[Asimo] Circular bundle loading detected for: asimo.src.test.Adder at /circular-bundle",
                );
            }
        });

        it("should support nested bundles (bundle returning sub-bundles)", async () => {
            const c = createContainer({
                name: "nested-bundle",
                services: [
                    bundle({
                        provide: [ADDER, SUBTRACTER],
                        dependencies: [],
                        load: async () =>
                            createContainer({
                                name: "bundle-sub",
                                services: [
                                    bundle({
                                        provide: [SUBTRACTER],
                                        dependencies: [],
                                        load: async () =>
                                            createContainer({
                                                name: "inner-sub",
                                                services: [
                                                    factory({
                                                        provide: SUBTRACTER,
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

            const add = await c.fetch(ADDER);
            expect(add(2, 3)).toBe(5);

            const subtract = await c.fetch(SUBTRACTER);
            expect(subtract(5, 3)).toBe(2);
        });

        it("should not expose sub-container IIDs not in the bundle's provide at runtime", async () => {
            const c = createContainer({
                name: "bundle-scope-test",
                services: [
                    bundle({
                        provide: [ADDER],
                        load: async () =>
                            createContainer({
                                name: "sub",
                                services: [
                                    factory({
                                        provide: ADDER,
                                        load: async () => addNumbers,
                                    }),
                                    // SUBTRACTER is NOT in the outer bundle's provide
                                    factory({
                                        provide: SUBTRACTER,
                                        load: async () => subtractNumbers,
                                    }),
                                ],
                            }),
                    }),
                ],
            });

            // ADDER is in provide — accessible
            const add = await c.fetch(ADDER);
            expect(add(2, 3)).toBe(5);

            // SUBTRACTER is NOT in provide — should throw at runtime
            {
                let error: unknown;
                try {
                    await c.fetch(SUBTRACTER as any);
                } catch (e) {
                    error = e;
                }
                expect(error).toBeInstanceOf(AsimoError);
                expect((error as AsimoError).container).toBe("/bundle-scope-test");
                expect((error as Error).message).toBe(
                    "[Asimo] Service not found: asimo.src.test.Subtracter at /bundle-scope-test",
                );
            }
        });

        it("should throw if a bundle doesn't fully provide its declared services", async () => {
            const c = createContainer({
                name: "nested-bundle",
                services: [
                    bundle({
                        provide: [ADDER, SUBTRACTER],
                        dependencies: [],
                        load: async () =>
                            createContainer({
                                name: "bundle-sub",
                                services: [
                                    factory({
                                        provide: ADDER,
                                        load: async () => addNumbers,
                                    }),
                                ],
                            }),
                    }),
                ],
            });

            {
                let error: unknown;
                try {
                    await c.fetch(SUBTRACTER as any);
                } catch (e) {
                    error = e;
                }
                expect(error).toBeInstanceOf(AsimoError);
                expect((error as AsimoError).container).toBe("/nested-bundle");
                expect((error as Error).message).toBe(
                    "[Asimo] Bundle did not provide service: asimo.src.test.Subtracter at /nested-bundle",
                );
            }
        });

        it("should return null from getOptional for a bundle-provided service before loading", () => {
            const c = createContainer({
                name: "bundle-get-optional",
                services: [
                    bundle({
                        provide: [ADDER],
                        load: async () =>
                            createContainer({
                                name: "sub",
                                services: [
                                    factory({
                                        provide: ADDER,
                                        load: async () => addNumbers,
                                    }),
                                ],
                            }),
                    }),
                ],
            });

            expect(c.getOptional(ADDER)).toBeNull();
        });

        it("should throw when concurrent accesses to a bundle that doesn't fully provide its services", async () => {
            const c = createContainer({
                name: "concurrent-bundle-missing",
                services: [
                    bundle({
                        provide: [ADDER, SUBTRACTER],
                        load: async () => {
                            await new Promise((r) => setTimeout(r, 10));
                            return createContainer({
                                name: "sub",
                                services: [
                                    factory({
                                        provide: ADDER,
                                        load: async () => addNumbers,
                                    }),
                                ],
                            });
                        },
                    }),
                ],
            });

            const [r1, r2] = await Promise.allSettled([c.fetch(ADDER), c.fetch(SUBTRACTER as any)]);
            expect(r1.status).toBe("fulfilled");
            expect(r2.status).toBe("rejected");
            if (r2.status === "rejected") {
                expect(r2.reason).toBeInstanceOf(AsimoError);
                expect((r2.reason as AsimoError).container).toBe("/concurrent-bundle-missing");
                expect(r2.reason.message).toContain(
                    "Bundle did not provide service: asimo.src.test.Subtracter",
                );
            }
        });
    });

    describe("Retry with exponential backoff", () => {
        it("should retry an async factory with default maxRetries (2) and eventually succeed", async () => {
            let callCount = 0;
            const c = createContainer({
                name: "retry-factory",
                services: [
                    factory({
                        provide: ADDER,
                        load: async () => {
                            callCount++;
                            if (callCount < 3) throw new Error("fail");
                            return addNumbers;
                        },
                    }),
                ],
            });

            const start = Date.now();
            const add = await c.fetch(ADDER);
            const elapsed = Date.now() - start;

            expect(callCount).toBe(3);
            expect(add(2, 3)).toBe(5);
            // retryDelayMs defaults to 1000ms: first retry at 1000ms, second at 2000ms
            expect(elapsed).toBeGreaterThanOrEqual(2900);
        });

        it("should retry a bundle with default maxRetries (2) and eventually succeed", async () => {
            let callCount = 0;
            const c = createContainer({
                name: "retry-bundle",
                services: [
                    bundle({
                        provide: [ADDER],
                        load: async () => {
                            callCount++;
                            if (callCount < 3) throw new Error("fail");
                            return createContainer({
                                name: "sub",
                                services: [
                                    factory({
                                        provide: ADDER,
                                        load: async () => addNumbers,
                                    }),
                                ],
                            });
                        },
                    }),
                ],
            });

            const start = Date.now();
            const add = await c.fetch(ADDER);
            const elapsed = Date.now() - start;

            expect(callCount).toBe(3);
            expect(add(2, 3)).toBe(5);
            expect(elapsed).toBeGreaterThanOrEqual(2900);
        });

        it("should throw AsimoLoadError when all retries are exhausted for a factory", async () => {
            let callCount = 0;
            const c = createContainer({
                name: "retry-exhausted",
                services: [
                    factory({
                        provide: ADDER,
                        maxRetries: 0,
                        load: async () => {
                            callCount++;
                            throw new Error("fail");
                        },
                    }),
                ],
            });

            await expect(c.fetch(ADDER)).rejects.toThrow(AsimoLoadError);
            expect(callCount).toBe(1);
        });

        it("should throw AsimoLoadError when all retries are exhausted for a bundle", async () => {
            const c = createContainer({
                name: "retry-bundle-exhausted",
                services: [
                    bundle({
                        provide: [ADDER],
                        maxRetries: 0,
                        load: async () => {
                            throw new Error("fail");
                        },
                    }),
                ],
            });

            await expect(c.fetch(ADDER)).rejects.toThrow(AsimoLoadError);
        });

        it("should allow re-fetching an IID after a previous load exhausted retries", async () => {
            let callCount = 0;
            const c = createContainer({
                name: "retry-refetch",
                services: [
                    factory({
                        provide: ADDER,
                        maxRetries: 0,
                        load: async () => {
                            callCount++;
                            if (callCount === 1) throw new Error("fail");
                            return addNumbers;
                        },
                    }),
                ],
            });

            // First fetch fails
            await expect(c.fetch(ADDER)).rejects.toThrow(AsimoLoadError);
            expect(callCount).toBe(1);

            // Second fetch succeeds since instance was cleared on failure
            const add = await c.fetch(ADDER);
            expect(callCount).toBe(2);
            expect(add(2, 3)).toBe(5);
        });

        it("should allow re-fetching a bundle after a previous load exhausted retries", async () => {
            let callCount = 0;
            const c = createContainer({
                name: "retry-bundle-refetch",
                services: [
                    bundle({
                        provide: [ADDER],
                        maxRetries: 0,
                        load: async () => {
                            callCount++;
                            if (callCount === 1) throw new Error("fail");
                            return createContainer({
                                name: "sub",
                                services: [
                                    factory({
                                        provide: ADDER,
                                        load: async () => addNumbers,
                                    }),
                                ],
                            });
                        },
                    }),
                ],
            });

            await expect(c.fetch(ADDER)).rejects.toThrow(AsimoLoadError);
            expect(callCount).toBe(1);

            const add = await c.fetch(ADDER);
            expect(callCount).toBe(2);
            expect(add(2, 3)).toBe(5);
        });

        it("should use custom retry params (maxRetries + retryDelayMs)", async () => {
            let callCount = 0;
            const c = createContainer({
                name: "retry-custom",
                services: [
                    factory({
                        provide: ADDER,
                        maxRetries: 1,
                        retryDelayMs: 50,
                        load: async () => {
                            callCount++;
                            if (callCount < 2) throw new Error("fail");
                            return addNumbers;
                        },
                    }),
                ],
            });

            const start = Date.now();
            const add = await c.fetch(ADDER);
            const elapsed = Date.now() - start;

            expect(callCount).toBe(2);
            expect(add(2, 3)).toBe(5);
            // 1 retry at 50ms
            expect(elapsed).toBeGreaterThanOrEqual(45);
            expect(elapsed).toBeLessThan(500);
        });

        it("should use custom retry params for bundles", async () => {
            let callCount = 0;
            const c = createContainer({
                name: "retry-bundle-custom",
                services: [
                    bundle({
                        provide: [ADDER],
                        maxRetries: 1,
                        retryDelayMs: 50,
                        load: async () => {
                            callCount++;
                            if (callCount < 2) throw new Error("fail");
                            return createContainer({
                                name: "sub",
                                services: [
                                    factory({
                                        provide: ADDER,
                                        load: async () => addNumbers,
                                    }),
                                ],
                            });
                        },
                    }),
                ],
            });

            const start = Date.now();
            const add = await c.fetch(ADDER);
            const elapsed = Date.now() - start;

            expect(callCount).toBe(2);
            expect(add(2, 3)).toBe(5);
            expect(elapsed).toBeGreaterThanOrEqual(45);
            expect(elapsed).toBeLessThan(500);
        });

        it("should not retry sync IID factories", () => {
            let callCount = 0;
            const c = createContainer({
                name: "retry-sync",
                services: [
                    factory({
                        provide: MULTIPLIER,
                        load: () => {
                            callCount++;
                            throw new Error("fail");
                        },
                    }),
                ],
            });

            expect(() => c.get(MULTIPLIER)).toThrow("fail");
            expect(callCount).toBe(1);
        });

        it("should use container config defaults for retry", async () => {
            let callCount = 0;
            const c = createContainer({
                name: "retry-container-config",
                config: { maxRetries: 1, retryDelayMs: 30 },
                services: [
                    factory({
                        provide: ADDER,
                        load: async () => {
                            callCount++;
                            if (callCount < 2) throw new Error("fail");
                            return addNumbers;
                        },
                    }),
                ],
            });

            const start = Date.now();
            const add = await c.fetch(ADDER);
            const elapsed = Date.now() - start;

            expect(callCount).toBe(2);
            expect(add(2, 3)).toBe(5);
            expect(elapsed).toBeGreaterThanOrEqual(25);
            expect(elapsed).toBeLessThan(500);
        });

        it("should let per-service params override container config", async () => {
            let callCount = 0;
            const c = createContainer({
                name: "retry-override",
                config: { maxRetries: 2, retryDelayMs: 500 },
                services: [
                    factory({
                        provide: ADDER,
                        maxRetries: 0,
                        load: async () => {
                            callCount++;
                            throw new Error("fail");
                        },
                    }),
                ],
            });

            await expect(c.fetch(ADDER)).rejects.toThrow(AsimoLoadError);
            expect(callCount).toBe(1);
        });
    });

    describe("onLoad callback", () => {
        it("should fire for a sync factory", () => {
            const calls: Array<{ iid: string; container: string }> = [];
            const c = createContainer({
                name: "onload-sync",
                config: {
                    onLoad: (iid, container) => calls.push({ iid: iid.ns, container: container.path }),
                },
                services: [
                    factory({
                        provide: MULTIPLIER,
                        load: () => multiplyNumbers,
                    }),
                ],
            });

            c.get(MULTIPLIER);
            expect(calls).toEqual([
                { iid: MULTIPLIER.ns, container: "/onload-sync" },
            ]);
        });

        it("should fire once for an async factory after successful retry", async () => {
            const calls: Array<{ iid: string; container: string }> = [];
            let attempt = 0;
            const c = createContainer({
                name: "onload-async",
                config: {
                    onLoad: (iid, container) => calls.push({ iid: iid.ns, container: container.path }),
                },
                services: [
                    factory({
                        provide: ADDER,
                        load: async () => {
                            attempt++;
                            if (attempt < 2) throw new Error("fail");
                            return addNumbers;
                        },
                    }),
                ],
            });

            await c.fetch(ADDER);
            expect(calls).toEqual([
                { iid: ADDER.ns, container: "/onload-async" },
            ]);
        });

        it("should fire for each individual factory loaded from a bundle", async () => {
            const calls: Array<{ iid: string; container: string }> = [];
            const c = createContainer({
                name: "onload-bundle",
                config: {
                    onLoad: (iid, container) => calls.push({ iid: iid.ns, container: container.path }),
                },
                services: [
                    bundle({
                        provide: [ADDER, SUBTRACTER],
                        load: async () =>
                            createContainer({
                                name: "sub",
                                services: [
                                    factory({
                                        provide: ADDER,
                                        load: async () => addNumbers,
                                    }),
                                    factory({
                                        provide: SUBTRACTER,
                                        load: async () => subtractNumbers,
                                    }),
                                ],
                            }),
                    }),
                ],
            });

            // Fetch both — each factory load fires onLoad independently
            const [add, subtract] = await c.fetch(ADDER, SUBTRACTER);
            expect(add(2, 3)).toBe(5);
            expect(subtract(5, 3)).toBe(2);
            expect(calls).toEqual([
                { iid: ADDER.ns, container: "/onload-bundle" },
                { iid: SUBTRACTER.ns, container: "/onload-bundle" },
            ]);
        });

        it("should not fire on a failed load", async () => {
            const calls: string[] = [];
            const c = createContainer({
                name: "onload-fail",
                config: {
                    maxRetries: 0,
                    onLoad: (iid) => calls.push(iid.ns),
                },
                services: [
                    factory({
                        provide: ADDER,
                        load: async () => {
                            throw new Error("fail");
                        },
                    }),
                ],
            });

            await expect(c.fetch(ADDER)).rejects.toThrow(AsimoLoadError);
            expect(calls).toEqual([]);
        });

        it("should not fire when the service is already loaded", () => {
            const calls: Array<{ iid: string; container: string }> = [];
            const c = createContainer({
                name: "onload-cached",
                config: {
                    onLoad: (iid, container) => calls.push({ iid: iid.ns, container: container.path }),
                },
                services: [
                    factory({
                        provide: MULTIPLIER,
                        load: () => multiplyNumbers,
                    }),
                ],
            });

            c.get(MULTIPLIER);
            c.get(MULTIPLIER); // second call — already loaded

            expect(calls).toHaveLength(1);
        });
    });

    describe("onError callback", () => {
        it("should fire on Service not found error", async () => {
            const errors: AsimoError[] = [];
            const c = createContainer({
                name: "onerror-notfound",
                config: {
                    onError: (error) => errors.push(error),
                },
                services: [
                    factory({
                        provide: MULTIPLIER,
                        load: () => multiplyNumbers,
                    }),
                ],
            });

            try {
                await c.fetch(ADDER as any);
            } catch {
                // expected
            }
            expect(errors).toHaveLength(1);
            expect(errors[0]).toBeInstanceOf(AsimoError);
            expect(errors[0].message).toContain("Service not found: asimo.src.test.Adder");
            expect(errors[0].container).toBe("/onerror-notfound");
        });

        it("should fire on exhausted retries", async () => {
            const errors: AsimoLoadError[] = [];
            const c = createContainer({
                name: "onerror-exhausted",
                config: {
                    maxRetries: 0,
                    onError: (error) => errors.push(error as AsimoLoadError),
                },
                services: [
                    factory({
                        provide: ADDER,
                        load: async () => {
                            throw new Error("fail");
                        },
                    }),
                ],
            });

            await expect(c.fetch(ADDER)).rejects.toThrow(AsimoLoadError);
            expect(errors).toHaveLength(1);
            expect(errors[0]).toBeInstanceOf(AsimoLoadError);
            expect(errors[0].container).toBe("/onerror-exhausted");
            expect(errors[0].cause).toBeInstanceOf(Error);
        });

        it("should fire on circular bundle loading", async () => {
            const errors: AsimoError[] = [];
            const c = createContainer({
                name: "onerror-circular",
                config: {
                    onError: (error) => errors.push(error),
                },
                services: [
                    bundle({
                        provide: [ADDER],
                        dependencies: [],
                        load: async (ctx: any) => {
                            await ctx.fetch(ADDER);
                            return createContainer({ name: "sub", services: [] });
                        },
                    } as any),
                ],
            });

            await expect(c.fetch(ADDER as any)).rejects.toThrow(
                "[Asimo] Circular bundle loading detected for: asimo.src.test.Adder at /onerror-circular",
            );
            expect(errors).toHaveLength(1);
            expect(errors[0]).toBeInstanceOf(AsimoError);
            expect(errors[0].message).toContain("Circular bundle loading detected");
        });
    });

    describe("Inspect", () => {
        it("should return null for an unknown service", () => {
            const c = createContainer({
                name: "test",
                services: [],
            });
            expect(c.inspect(MULTIPLIER)).toBeNull();
        });

        it("should return info for a registered service before loading", () => {
            const c = createContainer({
                name: "test",
                services: [
                    factory({
                        provide: MULTIPLIER,
                        load: () => multiplyNumbers,
                    }),
                ],
            });

            const info = c.inspect(MULTIPLIER);
            expect(info).not.toBeNull();
            expect(info!.ns).toBe(MULTIPLIER.ns);
            expect(info!.path).toBe("/test");
            expect(info!.status).toBe("registered");
        });

        it("should mark a service as loaded after get()", () => {
            const c = createContainer({
                name: "test",
                services: [
                    factory({
                        provide: MULTIPLIER,
                        load: () => multiplyNumbers,
                    }),
                ],
            });

            expect(c.inspect(MULTIPLIER)!.status).toBe("registered");
            c.get(MULTIPLIER);
            expect(c.inspect(MULTIPLIER)!.status).toBe("loaded");
        });

        it("should mark an async service as loaded after fetch()", async () => {
            const c = createContainer({
                name: "test",
                services: [
                    factory({
                        provide: ADDER,
                        load: async () => addNumbers,
                    }),
                ],
            });

            expect(c.inspect(ADDER)!.status).toBe("registered");
            await c.fetch(ADDER);
            expect(c.inspect(ADDER)!.status).toBe("loaded");
        });

        it("should list all services via inspect()", () => {
            const c = createContainer({
                name: "test",
                services: [
                    factory({
                        provide: MULTIPLIER,
                        load: () => multiplyNumbers,
                    }),
                    factory({
                        provide: DIVIDER,
                        load: () => divideNumbers,
                    }),
                ],
            });

            const all = c.inspect();
            expect(all).toHaveLength(2);
            expect(all.find((i) => i.ns === MULTIPLIER.ns)!.status).toBe("registered");
            expect(all.find((i) => i.ns === DIVIDER.ns)!.status).toBe("registered");
        });

        it("should show a bundle-provided service as not loaded before fetch", async () => {
            const c = createContainer({
                name: "bundle-inspect",
                services: [
                    bundle({
                        provide: [ADDER],
                        load: async () =>
                            createContainer({
                                name: "sub",
                                services: [
                                    factory({
                                        provide: ADDER,
                                        load: async () => addNumbers,
                                    }),
                                ],
                            }),
                    }),
                ],
            });

            // Before fetching, the service is still a bundle stub — pending
            expect(c.inspect(ADDER)).toEqual({
                ns: "asimo.src.test.Adder",
                path: "/bundle-inspect",
                status: "pending",
            });
        });

        it("should show a bundle-provided service as loaded after fetch", async () => {
            const c = createContainer({
                name: "bundle-inspect-loaded",
                services: [
                    bundle({
                        provide: [ADDER],
                        load: async () =>
                            createContainer({
                                name: "sub",
                                services: [
                                    factory({
                                        provide: ADDER,
                                        load: async () => addNumbers,
                                    }),
                                ],
                            }),
                    }),
                ],
            });

            await c.fetch(ADDER);
            expect(c.inspect(ADDER)).toEqual({
                ns: "asimo.src.test.Adder",
                path: "/bundle-inspect-loaded",
                status: "loaded",
            });
        });

        it("should find services defined in parent containers", () => {
            const parent = createContainer({
                name: "parent",
                services: [
                    factory({
                        provide: MULTIPLIER,
                        load: () => multiplyNumbers,
                    }),
                ],
            });

            const child = createContainer({
                name: "child",
                extends: [parent],
                services: [
                    factory({
                        provide: DIVIDER,
                        load: () => divideNumbers,
                    }),
                ],
            });

            // Service defined in child
            const dividerInfo = child.inspect(DIVIDER)!;
            expect(dividerInfo.ns).toBe(DIVIDER.ns);
            expect(dividerInfo.path).toBe("/parent/child");

            // Service defined in parent — visible from child via parent traversal
            const multiplierInfo = child.inspect(MULTIPLIER)!;
            expect(multiplierInfo.ns).toBe(MULTIPLIER.ns);
            expect(multiplierInfo.path).toBe("/parent");
        });

        it("should list all services including parent services via inspect()", () => {
            const parent = createContainer({
                name: "parent",
                services: [
                    factory({
                        provide: MULTIPLIER,
                        load: () => multiplyNumbers,
                    }),
                ],
            });

            const child = createContainer({
                name: "child",
                extends: [parent],
                services: [
                    factory({
                        provide: DIVIDER,
                        load: () => divideNumbers,
                    }),
                ],
            });

            const all = child.inspect();
            const nsList = all.map((i) => i.ns);
            expect(all).toHaveLength(2);
            expect(nsList).toContain(MULTIPLIER.ns);
            expect(nsList).toContain(DIVIDER.ns);
        });

        it("should prefer child service over parent when names overlap", () => {
            const parent = createContainer({
                name: "parent",
                services: [
                    factory({
                        provide: MULTIPLIER,
                        load: () => multiplyNumbers,
                    }),
                ],
            });

            const child = createContainer({
                name: "child",
                extends: [parent],
                services: [
                    factory({
                        provide: MULTIPLIER,
                        load: () => multiplyNumbers,
                    }),
                ],
            });

            const info = child.inspect(MULTIPLIER)!;
            // Child shadows parent — should show child's path
            expect(info.path).toBe("/parent/child");
        });
    });

    describe("entries()", () => {
        it("should iterate over own services only", () => {
            const c = createContainer({
                name: "entries-test",
                services: [
                    factory({
                        provide: MULTIPLIER,
                        load: () => multiplyNumbers,
                    }),
                    factory({
                        provide: DIVIDER,
                        load: () => divideNumbers,
                    }),
                ],
            });

            const result = Array.from(c.entries());
            expect(result).toHaveLength(2);
            const nsList = result.map(e => e.ns);
            expect(nsList).toContain(MULTIPLIER.ns);
            expect(nsList).toContain(DIVIDER.ns);
            for (const e of result) {
                expect(e.path).toBe("/entries-test");
            }
        });

        it("should not include parent services", () => {
            const parent = createContainer({
                name: "parent",
                services: [
                    factory({
                        provide: MULTIPLIER,
                        load: () => multiplyNumbers,
                    }),
                ],
            });
            const child = createContainer({
                name: "child",
                extends: [parent],
                services: [
                    factory({
                        provide: DIVIDER,
                        load: () => divideNumbers,
                    }),
                ],
            });

            const result = Array.from(child.entries());
            expect(result).toHaveLength(1);
            expect(result[0].ns).toBe(DIVIDER.ns);
        });

        it("should show status for each entry", () => {
            const c = createContainer({
                name: "entries-status",
                services: [
                    factory({
                        provide: MULTIPLIER,
                        load: () => multiplyNumbers,
                    }),
                ],
            });

            const before = Array.from(c.entries());
            expect(before[0].status).toBe("registered");

            c.get(MULTIPLIER);
            const after = Array.from(c.entries());
            expect(after[0].status).toBe("loaded");
        });
    });

    describe("has()", () => {
        it("should return true for a registered service", () => {
            const c = createContainer({
                name: "has-test",
                services: [factory({ provide: MULTIPLIER, load: () => multiplyNumbers })],
            });
            expect(c.has(MULTIPLIER)).toBe(true);
        });

        it("should return false for an unknown service", () => {
            const c = createContainer({
                name: "has-test",
                services: [factory({ provide: MULTIPLIER, load: () => multiplyNumbers })],
            });
            expect(c.has(UNKNOWN)).toBe(false);
        });

        it("should return true for a service in an ancestor", () => {
            const parent = createContainer({
                name: "parent",
                services: [factory({ provide: MULTIPLIER, load: () => multiplyNumbers })],
            });
            const child = createContainer({
                name: "child",
                extends: [parent],
                services: [],
            });
            expect(child.has(MULTIPLIER)).toBe(true);
        });

        it("should cache not-found results", () => {
            const c = createContainer({
                name: "has-cache",
                services: [factory({ provide: MULTIPLIER, load: () => multiplyNumbers })],
            });
            expect(c.has(UNKNOWN)).toBe(false);
            // Repeated call exercises the cached notFound entry
            expect(c.has(UNKNOWN)).toBe(false);
        });
    });

    describe("Dump", () => {
        it("should return a string with service path, ns, and status", () => {
            const c = createContainer({
                name: "test",
                services: [
                    factory({
                        provide: MULTIPLIER,
                        load: () => multiplyNumbers,
                    }),
                ],
            });

            const output = c.dump();
            expect(output).toBe(
                "Asimo IoC Container: /test\n  /test: asimo.src.test.Multiplier - registered",
            );
        });

        it("should show loaded status after get()", () => {
            const c = createContainer({
                name: "test",
                services: [
                    factory({
                        provide: MULTIPLIER,
                        load: () => multiplyNumbers,
                    }),
                ],
            });

            c.get(MULTIPLIER);
            const output = c.dump();
            expect(output).toContain("loaded");
            expect(output).not.toContain("registered");
        });

        it("should show bundle services as pending before fetch", async () => {
            const c = createContainer({
                name: "bundle-dump",
                services: [
                    bundle({
                        provide: [ADDER],
                        load: async () =>
                            createContainer({
                                name: "sub",
                                services: [
                                    factory({
                                        provide: ADDER,
                                        load: async () => addNumbers,
                                    }),
                                ],
                            }),
                    }),
                ],
            });

            const output = c.dump();
            expect(output).toContain("pending");
            expect(output).not.toContain("loaded");
        });

        it("should show bundle services as loaded after fetch", async () => {
            const c = createContainer({
                name: "bundle-dump",
                services: [
                    bundle({
                        provide: [ADDER],
                        load: async () =>
                            createContainer({
                                name: "sub",
                                services: [
                                    factory({
                                        provide: ADDER,
                                        load: async () => addNumbers,
                                    }),
                                ],
                            }),
                    }),
                ],
            });

            await c.fetch(ADDER);
            const output = c.dump();
            expect(output).toContain("loaded");
            expect(output).not.toContain("pending");
        });

        it("should include parent services with their path", () => {
            const parent = createContainer({
                name: "parent",
                services: [
                    factory({
                        provide: MULTIPLIER,
                        load: () => multiplyNumbers,
                    }),
                ],
            });

            const child = createContainer({
                name: "child",
                extends: [parent],
                services: [
                    factory({
                        provide: DIVIDER,
                        load: () => divideNumbers,
                    }),
                ],
            });

            expect(child.dump()).toEqual(`\
Asimo IoC Container: /parent/child
  /parent/child: asimo.src.test.Divider - registered
  /parent: asimo.src.test.Multiplier - registered\
`);
        });

        it("should not include parent services shadowed by child", () => {
            const parent = createContainer({
                name: "parent",
                services: [
                    factory({
                        provide: MULTIPLIER,
                        load: () => multiplyNumbers,
                    }),
                ],
            });

            const child = createContainer({
                name: "child",
                extends: [parent],
                services: [
                    factory({
                        provide: MULTIPLIER,
                        load: () => multiplyNumbers,
                    }),
                ],
            });

            const output = child.dump();
            const lines = output.split("\n").filter((l) => l.includes(MULTIPLIER.ns));
            // Only one line for MULTIPLIER — the child's
            expect(lines).toHaveLength(1);
            expect(lines[0]).toContain("/parent/child");
        });

        it("should include grandparent services", () => {
            const grandparent = createContainer({
                name: "gp",
                services: [
                    factory({
                        provide: MULTIPLIER,
                        load: () => multiplyNumbers,
                    }),
                ],
            });

            const parent = createContainer({
                name: "p",
                extends: [grandparent],
                services: [
                    factory({
                        provide: DIVIDER,
                        load: () => divideNumbers,
                    }),
                ],
            });

            const child = createContainer({
                name: "c",
                extends: [parent],
                services: [
                    factory({
                        provide: ADDER,
                        load: async () => addNumbers,
                    }),
                ],
            });

            const output = child.dump();
            expect(output).toContain("/gp: " + MULTIPLIER.ns);
            expect(output).toContain("/gp/p: " + DIVIDER.ns);
            expect(output).toContain("/gp/p/c: " + ADDER.ns);
        });
    });
});
