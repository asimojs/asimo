import { describe, expect, it } from "vitest";
import { createIocContainer } from "../asimo";
import {
    addNumbers,
    multiplyNumbers,
    divideNumbers,
    subtractNumbers,
} from "./examples/operations";
import { ADDER, CALCULATOR, DIVIDER, MULTIPLIER, SUBTRACTOR, UNKNOWN } from "./examples/types";
import { createCalculator } from "./examples/calculator";

describe("IoC Container", () => {
    describe("Container with no parents", () => {
        it("should create an empty container with a name and services", () => {
            const context = createIocContainer({
                name: "mycontainer",
                services: [],
            });

            expect(context.name).toBe("mycontainer");
        });

        it("should create a container with one async service", async () => {
            const context = createIocContainer({
                name: "adder-container",
                services: [
                    {
                        interface: ADDER,
                        load: async () => addNumbers,
                    },
                ],
            });
            expect(context.name).toBe("adder-container");
            const add = await context.fetch(ADDER);
            expect(add(2, 3)).toBe(5);
        });

        it("should create a container with one sync service", () => {
            const context = createIocContainer({
                name: "multiplier-container",
                services: [
                    {
                        interface: MULTIPLIER,
                        load: () => multiplyNumbers,
                    },
                ],
            });
            expect(context.name).toBe("multiplier-container");
            const multiply = context.get(MULTIPLIER);
            expect(multiply(2, 3)).toBe(6);
        });

        it("should support multiple services in the same container", async () => {
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

            const add = await context.fetch(ADDER);
            const multiply = context.get(MULTIPLIER);
            expect(add(2, 3)).toBe(5);
            expect(multiply(2, 3)).toBe(6);

            // This generate a TS error because DIVIDER is not part of the container services
            // const x = context.get(DIVIDER);

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
                    {
                        interface: DIVIDER,
                        load: () => divideNumbers,
                    },
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
            const context = createIocContainer({
                name: "math-container",
                services: [
                    {
                        interface: MULTIPLIER,
                        load: () => multiplyNumbers,
                    },
                ],
            });

            const multiply = context.getOptional(MULTIPLIER);
            expect(multiply!(2, 3)).toBe(6);

            const divide = context.getOptional(DIVIDER);
            expect(divide).toBeNull();
        });

        it("should allow to fetch optional services that are not necessarily defined on the container", async () => {
            const context = createIocContainer({
                name: "math-container",
                services: [
                    {
                        interface: MULTIPLIER,
                        load: () => multiplyNumbers,
                    },
                ],
            });

            const multiply = await context.fetchOptional(MULTIPLIER);
            expect(multiply!(2, 3)).toBe(6);

            const divide = await context.fetchOptional(DIVIDER);
            expect(divide).toBeNull();
        });

        it("should expose a path equal to its name when the container has no parent", () => {
            const context = createIocContainer({
                name: "mycontainer",
                services: [],
            });

            expect(context.path).toBe("/mycontainer");
        });

        it("should throw when retrieving unknown services via get/fetch", async () => {
            const context = createIocContainer({
                name: "math-container",
                services: [
                    {
                        interface: MULTIPLIER,
                        load: () => multiplyNumbers,
                    },
                ],
            });

            // Bypass type safety intentionally: runtime verifies the throw, typecheck
            // verification is covered by ts-errors.spec-d.ts
            expect(() => context.get(DIVIDER as any)).toThrow(
                "[Asimo] Service not found: asimo.src.test.Divider",
            );
            await expect(context.fetch(DIVIDER as any)).rejects.toThrow(
                "[Asimo] Service not found: asimo.src.test.Divider",
            );
        });

it("should pass the container context to the service factory", async () => {
            const c = createIocContainer({
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
                        dependencies: [MULTIPLIER, DIVIDER, ADDER, SUBTRACTOR],
                        load: (c) => createCalculator(c),
                    },
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

            const c1 = createIocContainer({
                name: "substraction",
                services: [
                    {
                        interface: SUBTRACTOR,
                        load: async () => subtractNumbers,
                    },
                ],
            });
            const c2 = createIocContainer({
                name: "addition",
                extends: [c1],
                services: [
                    {
                        interface: ADDER,
                        load: async () => addNumbers,
                    },
                ],
            });
            const c3 = createIocContainer({
                name: "division",
                services: [
                    {
                        interface: DIVIDER,
                        load: () => divideNumbers,
                    },
                ],
            });
            const c4 = createIocContainer({
                name: "multiplier",
                extends: [c2, c3],
                services: [
                    {
                        interface: MULTIPLIER,
                        load: () => multiplyNumbers,
                    },
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
            const c5 = createIocContainer({
                name: "calculator",
                extends: [c4],
                services: [
                    {
                        interface: CALCULATOR,
                        dependencies: [MULTIPLIER, DIVIDER, ADDER, SUBTRACTOR],
                        load: (c) => createCalculator(c),
                    },
                ],
            });

            const calculator = c5.get(CALCULATOR);
            expect(calculator.multiply(3, 4)).toBe(12);
            expect(calculator.divide(12, 4)).toBe(3);
            expect(await calculator.add(2, 3)).toBe(5);
            expect(await calculator.subtract(2, 3)).toBe(-1);
        });

        it("should throw at runtime when a dependency listed in dependencies is not registered", async () => {
            const c = createIocContainer({
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
                        interface: CALCULATOR,
                        // SUBTRACTOR is not registered — this passes typecheck
                        // because we bypass it with `as any`, but throws at runtime
                        dependencies: [MULTIPLIER, DIVIDER, ADDER, SUBTRACTOR] as any,
                        load: (ctx: any) => createCalculator(ctx),
                    },
                ],
            });

            const calculator = c.get(CALCULATOR);
            expect(calculator.multiply(3, 4)).toBe(12);
            expect(calculator.divide(12, 4)).toBe(3);
            await expect(calculator.add(2, 3)).resolves.toBe(5);
            // SUBTRACTOR is missing — subtract() should throw at runtime
            await expect(calculator.subtract(2, 3)).rejects.toThrow(
                "[Asimo] Service not found: asimo.src.test.Subtractor",
            );
        });
    });
});
