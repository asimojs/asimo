import { describe, expect, it } from "vitest";
import { bundle, createContainer, factory } from "../asimo";
import type { IoCContainer } from "../asimo.types";
import { addNumbers, multiplyNumbers, divideNumbers, subtractNumbers } from "./examples/operations";
import { ADDER, CALCULATOR, DIVIDER, MULTIPLIER, SUBTRACTOR, UNKNOWN } from "./examples/types";
import { createCalculator } from "./examples/calculator";

describe("IoC Container", () => {
    describe("Container with no parents", () => {
        it("should create an empty container with a name and services", () => {
            const context = createContainer({
                name: "mycontainer",
                services: [],
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

            // get allows to retrieve services with sync and async factories
            const addPromise = context.get(ADDER);
            expect(addPromise).toBeInstanceOf(Promise);
            const add2 = await addPromise;
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
            expect(() => context.get(DIVIDER as any)).toThrow(
                "[Asimo] Service not found: asimo.src.test.Divider at /math-container",
            );
            await expect(context.fetch(DIVIDER as any)).rejects.toThrow(
                "[Asimo] Service not found: asimo.src.test.Divider at /math-container",
            );
        });

        it("should pass the container context to the service factory", async () => {
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
                    factory({
                        provide: SUBTRACTOR,
                        load: async () => subtractNumbers,
                    }),
                    factory({
                        provide: CALCULATOR,
                        dependencies: [MULTIPLIER, DIVIDER, ADDER, SUBTRACTOR],
                        load: (c) => createCalculator(c),
                    }),
                ],
            });

            const calculator = c.get(CALCULATOR);
            expect(calculator.multiply(3, 4)).toBe(12);
            expect(calculator.divide(12, 4)).toBe(3);
            expect(await calculator.add(2, 3)).toBe(5);
            expect(await calculator.subtract(2, 3)).toBe(-1);
        });
    });

    describe("Container with parents", () => {
        function createTestContaier() {
            // c4 -> c2 -> c1
            //    -> c3

            const c1 = createContainer({
                name: "substraction",
                services: [
                    factory({
                        provide: SUBTRACTOR,
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
            const c = createTestContaier();

            // c4 -> c2 -> c1, c3 (path follows the first parent chain: c1/c2/c4)
            expect(c.path).toBe("/substraction/addition/multiplier");
        });

        it("should retrieve all dependencies", async () => {
            const c = createTestContaier();

            const [multiply, divide] = c.get(MULTIPLIER, DIVIDER);
            expect(multiply(3, 4)).toBe(12);
            expect(divide(12, 4)).toBe(3);

            const [add2, substract2, multiply2, divide2] = await c.fetch(
                ADDER,
                SUBTRACTOR,
                MULTIPLIER,
                DIVIDER,
            );
            expect(multiply2(3, 4)).toBe(12);
            expect(divide2(12, 4)).toBe(3);
            expect(add2(2, 3)).toBe(5);
            expect(substract2(2, 3)).toBe(-1);
        });

        it("should allow to get optional services that are not necessarily defined on the container", () => {
            const c = createTestContaier();

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
            const c = createTestContaier();

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
            const c4 = createTestContaier();
            const c5 = createContainer({
                name: "calculator",
                extends: [c4],
                services: [
                    factory({
                        provide: CALCULATOR,
                        dependencies: [MULTIPLIER, DIVIDER, ADDER, SUBTRACTOR],
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
                extends: [parent as any],
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
                extends: [p1 as any, p2 as any],
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
                extends: [grandparent as any],
                services: [],
            });
            const child = createContainer({
                name: "c",
                extends: [parent as any],
                services: [],
            });
            expect(child.parents).toHaveLength(1);
            expect(child.parents![0].name).toBe("p");
            expect(child.parents![0].parents![0].name).toBe("gp");
        });

        it("should be the same parents array reference passed to extends", () => {
            const arr: IoCContainer<any>[] = [];
            const parent = createContainer({
                name: "parent",
                services: [
                    factory({
                        provide: MULTIPLIER,
                        load: () => multiplyNumbers,
                    }),
                ],
            });
            arr.push(parent as any);
            const child = createContainer({
                name: "child",
                extends: arr,
                services: [],
            });
            expect(child.parents).toBe(arr);
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
                    // SUBTRACTOR is not registered — this passes typecheck
                    // because we bypass it with `as any`, but throws at runtime
                    factory({
                        provide: CALCULATOR,
                        dependencies: [MULTIPLIER, DIVIDER, ADDER, SUBTRACTOR] as any,
                        load: (ctx: any) => createCalculator(ctx),
                    }) as any,
                ],
            });

            const calculator = c.get(CALCULATOR);
            expect(calculator.multiply(3, 4)).toBe(12);
            expect(calculator.divide(12, 4)).toBe(3);
            await expect(calculator.add(2, 3)).resolves.toBe(5);
            // SUBTRACTOR is missing — subtract() should throw at runtime
            await expect(calculator.subtract(2, 3)).rejects.toThrow(
                "[Asimo] Service not found: asimo.src.test.Subtractor at /calculator-container",
            );
        });
    });

    describe("Bundle loading", () => {
        it("should load a bundle on-demand and resolve the requested service", async () => {
            const c = createContainer({
                name: "bundle-test",
                services: [
                    bundle({
                        provide: [ADDER, SUBTRACTOR],
                        load: async () =>
                            createContainer({
                                name: "bundle-sub",
                                services: [
                                    factory({
                                        provide: ADDER,
                                        load: async () => addNumbers,
                                    }),
                                    factory({
                                        provide: SUBTRACTOR,
                                        load: async () => subtractNumbers,
                                    }),
                                ],
                            }),
                    }),
                ],
            });

            const add = await c.fetch(ADDER);
            expect(add(2, 3)).toBe(5);

            const subtract = await c.fetch(SUBTRACTOR);
            expect(subtract(5, 3)).toBe(2);
        });

        it("should load a bundle via get() since async IIDs return Promise<T>", async () => {
            const c = createContainer({
                name: "bundle-get-test",
                services: [
                    bundle({
                        provide: [ADDER, SUBTRACTOR],
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
                                        provide: SUBTRACTOR,
                                        load: async () => subtractNumbers,
                                    }),
                                ],
                            }),
                    }),
                ],
            });

            const addPromise = c.get(ADDER);
            const subtractPromise = c.get(SUBTRACTOR);
            const add = await addPromise;
            const subtract = await subtractPromise;
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
                        provide: [ADDER, SUBTRACTOR],
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
                                        provide: SUBTRACTOR,
                                        load: async () => subtractNumbers,
                                    }),
                                ],
                            });
                        },
                    }),
                ],
            });

            const [add, subtract] = await Promise.all([c.fetch(ADDER), c.fetch(SUBTRACTOR)]);

            expect(add(2, 3)).toBe(5);
            expect(subtract(5, 3)).toBe(2);
            expect(loadCount).toBe(1);
        });

        it("should not eagerly invoke sub-factories when a bundle is loaded", async () => {
            let adderLoadCount = 0;
            let subtractorLoadCount = 0;
            const c = createContainer({
                name: "lazy-factory-bundle",
                services: [
                    bundle({
                        provide: [ADDER, SUBTRACTOR],
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
                                        provide: SUBTRACTOR,
                                        load: async () => {
                                            subtractorLoadCount++;
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
            expect(subtractorLoadCount).toBe(0);

            // Fetch only ADDER — SUBTRACTOR factory should NOT be called
            const add = await c.fetch(ADDER);
            expect(add(2, 3)).toBe(5);
            expect(adderLoadCount).toBe(1);
            expect(subtractorLoadCount).toBe(0);

            // Fetch SUBTRACTOR later — now its factory is invoked
            const subtract = await c.fetch(SUBTRACTOR);
            expect(subtract(5, 3)).toBe(2);
            expect(subtractorLoadCount).toBe(1);

            // Second fetch of ADDER reuses cached instance, no new factory call
            const add2 = await c.fetch(ADDER);
            expect(add2(3, 4)).toBe(7);
            expect(adderLoadCount).toBe(1);
            expect(subtractorLoadCount).toBe(1);
        });

        it("should not eagerly load nested bundles", async () => {
            let innerBundleLoadCount = 0,
                outerBundleLoadCount = 0;
            const c = createContainer({
                name: "lazy-bundle-test",
                services: [
                    bundle({
                        provide: [ADDER, SUBTRACTOR],
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
                                        provide: [SUBTRACTOR],
                                        load: async () => {
                                            innerBundleLoadCount++;
                                            await new Promise((r) => setTimeout(r, 5));
                                            return createContainer({
                                                name: "inner-sub",
                                                services: [
                                                    factory({
                                                        provide: SUBTRACTOR,
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

            // Fetch SUBTRACTOR — now the inner bundle is loaded on-demand
            const subtract = await c.fetch(SUBTRACTOR);
            expect(subtract(5, 3)).toBe(2);
            expect(innerBundleLoadCount).toBe(1);

            // Second fetch of SUBTRACTOR reuses cached instance, inner bundle not reloaded
            const subtract2 = await c.fetch(SUBTRACTOR);
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

            await expect(c.fetch(ADDER as any)).rejects.toThrow(
                "[Asimo] Circular bundle loading detected for: asimo.src.test.Adder at /circular-bundle",
            );
        });

        it("should support nested bundles (bundle returning sub-bundles)", async () => {
            const c = createContainer({
                name: "nested-bundle",
                services: [
                    bundle({
                        provide: [ADDER, SUBTRACTOR],
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

            const add = await c.fetch(ADDER);
            expect(add(2, 3)).toBe(5);

            const subtract = await c.fetch(SUBTRACTOR);
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
                                    // SUBTRACTOR is NOT in the outer bundle's provide
                                    factory({
                                        provide: SUBTRACTOR,
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

            // SUBTRACTOR is NOT in provide — should throw at runtime
            await expect(c.fetch(SUBTRACTOR as any)).rejects.toThrow(
                "[Asimo] Service not found: asimo.src.test.Subtractor at /bundle-scope-test",
            );
        });

        it("should throw if a bundle doesn't fully provide its declared services", async () => {
            const c = createContainer({
                name: "nested-bundle",
                services: [
                    bundle({
                        provide: [ADDER, SUBTRACTOR],
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

            await expect(c.fetch(SUBTRACTOR as any)).rejects.toThrow(
                "[Asimo] Bundle did not provide service: asimo.src.test.Subtractor at /nested-bundle",
            );
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
            expect(info!.status).toBe('registered');
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

            expect(c.inspect(MULTIPLIER)!.status).toBe('registered');
            c.get(MULTIPLIER);
            expect(c.inspect(MULTIPLIER)!.status).toBe('loaded');
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

            expect(c.inspect(ADDER)!.status).toBe('registered');
            await c.fetch(ADDER);
            expect(c.inspect(ADDER)!.status).toBe('loaded');
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
            expect(all.find((i) => i.ns === MULTIPLIER.ns)!.status).toBe('registered');
            expect(all.find((i) => i.ns === DIVIDER.ns)!.status).toBe('registered');
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
                status: 'pending',
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
                status: 'loaded',
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
            expect(output).toBe("Asimo IoC Container: /test\n  /test: asimo.src.test.Multiplier - registered");
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
            const lines = output.split('\n').filter(l => l.includes(MULTIPLIER.ns));
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
