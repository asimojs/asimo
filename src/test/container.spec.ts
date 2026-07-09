import { describe, expect, it } from "vitest";
import { createIocContainer } from "../asimo";
import { addNumbers, multiplyNumbers } from "./examples/operations";
import { ADDER, MULTIPLIER } from "./examples/types";

describe("IoC Container", () => {
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

        // fetch allows to retrieve services with sync and async factories
        const multiply2 = await context.fetch(MULTIPLIER);
        expect(multiply2(3, 4)).toBe(12);
    });
});
