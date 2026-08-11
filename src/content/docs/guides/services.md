---
title: Implementing Services
description: Patterns for implementing services with asimo
---

asimo is framework-agnostic and doesn't impose any particular way of implementing services — you can use plain objects, factory functions, or classes. What matters is that each service receives its dependencies via a typed `Container` context.

This page compares two approaches using the same example: a `Calculator` service that depends on four sub-services (`MULTIPLIER`, `DIVIDER`, `ADDER`, `SUBTRACTER`).

## Common Setup

All examples below share these IID tokens and operations:

```ts
// types.ts
import { syncIID, asyncIID } from "@asimojs/asimo";

export interface Multiplier { (a: number, b: number): number; }
export const MULTIPLIER = syncIID<Multiplier>()("math.Multiplier");

export interface Divider { (a: number, b: number): number; }
export const DIVIDER = syncIID<Divider>()("math.Divider");

export interface Adder { (a: number, b: number): number; }
export const ADDER = asyncIID<Adder>()("math.Adder");

export interface Subtracter { (a: number, b: number): number; }
export const SUBTRACTER = asyncIID<Subtracter>()("math.Subtracter");
```

## Factory-Based Services

Return a plain object from a `load` function. Simple, no class boilerplate, natural fit with asimo's factory pattern:

```ts
import type { Container } from "@asimojs/asimo";
import { ADDER, DIVIDER, MULTIPLIER, SUBTRACTER } from "./types";

export function createCalculator(
    context: Container<typeof MULTIPLIER | typeof DIVIDER | typeof ADDER | typeof SUBTRACTER>,
) {
    const [multiplier, divider] = context.get(MULTIPLIER, DIVIDER);

    return {
        multiply: (a: number, b: number) => multiplier(a, b),
        divide: (a: number, b: number) => divider(a, b),
        async add(a: number, b: number) {
            const add = await context.fetch(ADDER);
            return add(a, b);
        },
        async subtract(a: number, b: number) {
            const subtract = await context.fetch(SUBTRACTER);
            return subtract(a, b);
        },
    };
}
```

**Registration**:

```ts
factory({
    provide: [CALCULATOR],
    dependencies: [MULTIPLIER, DIVIDER, ADDER, SUBTRACTER],
    load: (c) => createCalculator(c),
})
```

## Class-Based Services

Use a class when you want encapsulation, `instanceof` checks, or a more traditional OOP style. Store sync dependencies eagerly in the constructor; fetch async ones on demand:

```ts
import type { Container, InferType } from "@asimojs/asimo";
import { ADDER, DIVIDER, MULTIPLIER, SUBTRACTER } from "./types";

export class Calculator {
    private multiplier: InferType<typeof MULTIPLIER>;
    private divider: InferType<typeof DIVIDER>;

    constructor(
        private readonly context: Container<typeof MULTIPLIER | typeof DIVIDER | typeof ADDER | typeof SUBTRACTER>,
    ) {
        this.multiplier = context.get(MULTIPLIER);
        this.divider = context.get(DIVIDER);
    }

    multiply(a: number, b: number) {
        return this.multiplier(a, b);
    }

    divide(a: number, b: number) {
        return this.divider(a, b);
    }

    async add(a: number, b: number) {
        const add = await this.context.fetch(ADDER);
        return add(a, b);
    }

    async subtract(a: number, b: number) {
        const subtract = await this.context.fetch(SUBTRACTER);
        return subtract(a, b);
    }
}
```

**Registration**

```ts
factory({
    provide: [CALCULATOR],
    dependencies: [MULTIPLIER, DIVIDER, ADDER, SUBTRACTER],
    load: (c) => new Calculator(c),
})
```

> `InferType<typeof MULTIPLIER>` extracts the interface type (`Multiplier`) directly from the IID token, avoiding the need to import the interface separately. It works on both sync and async IIDs.

## Eager vs Lazy Dependency Resolution

Both examples above follow the same pattern:

- **Sync dependencies** (`MULTIPLIER`, `DIVIDER`) are resolved eagerly — at service creation time, via `context.get()` in the factory or constructor.
- **Async dependencies** (`ADDER`, `SUBTRACTER`) are resolved lazily — on first method call, via `context.fetch()`. Until a method calls `add()` or `subtract()`, those services are never loaded.

This is a deliberate design: sync dependencies (lightweight, available immediately) are retrieved upfront so every synchronous method is fast. Async dependencies (potentially heavy, network-bound) are deferred to the first call that actually needs them.
