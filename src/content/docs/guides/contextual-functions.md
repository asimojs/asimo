---
title: Contextual Functions
description: Composing contextual functions with typed dependency contexts
---

A **contextual function** is a plain function that receives a single props object containing a `context` property:

```ts
type ContextualFunction = (props: { context: Context<IIDs> }) => Result;
```

Use `Context<IIDs>` instead of `Container<IIDs>` for contextual function props. Unlike `Container`, `Context` accepts containers that provide **additional** IIDs, which lets a parent contextual function pass its own context down to nested contextual functions. Missing dependencies are still rejected at compile time.

## React components as contextual functions

React function components are a natural fit: their props object can carry a `context` property. `ContextDeps` then composes dependencies across the React tree in the same way.

```tsx
import type { Context } from "@asimojs/asimo";
import { MULTIPLIER } from "./types";

export function MultiplyView({
    context,
    a,
    b,
}: {
    context: Context<typeof MULTIPLIER>;
    a: number;
    b: number;
}) {
    const multiply = context.get(MULTIPLIER);
    return <span>{multiply(a, b)}</span>;
}
```

```tsx
import type { Context, ContextDeps } from "@asimojs/asimo";
import { MultiplyView } from "./MultiplyView";

export function CalculatorView({
    context,
    a,
    b,
}: {
    context: Context<ContextDeps<typeof MultiplyView>>;
    a: number;
    b: number;
}) {
    return <MultiplyView context={context} a={a} b={b} />;
}
```

`CalculatorView` inherits `MultiplyView`’s dependency (`MULTIPLIER`) through `ContextDeps`, and passes its `context` down as a normal React prop. The next section shows how to add the parent’s own dependencies to the union.

## Defining a contextual function

```ts
import type { Context } from "@asimojs/asimo";
import { MULTIPLIER } from "./types";

export function componentB({ context }: { context: Context<typeof MULTIPLIER> }) {
    const multiply = context.get(MULTIPLIER);

    return {
        multiply(a: number, b: number) {
            return multiply(a, b);
        },
    };
}
```

`context` exposes the usual container API (`get`, `fetch`, `getOptional`, etc.), but is scoped to the dependencies the function declares.

## Composing dependencies

`ContextDeps<Fn>` extracts the IIDs declared by a contextual function’s `context` prop. A parent can then declare its dependencies as its own IIDs plus those of its nested contextual functions:

```ts
import type { Context, ContextDeps } from "@asimojs/asimo";
import { ADDER } from "./types";
import { componentB } from "./componentB";

export function componentA({
    context,
}: {
    context: Context<typeof ADDER | ContextDeps<typeof componentB>>;
}) {
    const b = componentB({ context }); // context is narrowed safely

    return {
        multiply: b.multiply,
        async add(a: number, b: number) {
            const adder = await context.fetch(ADDER);
            return adder(a, b);
        },
    };
}
```

This composes transitively. If `componentB` itself depends on `componentC`, then `ContextDeps<typeof componentB>` includes `componentC`’s dependencies automatically.

## Passing a wider context

Because `Context` is contravariant with respect to the required IIDs, a container holding extra services is accepted:

```ts
const app = createContainer({
    name: "app",
    services: [
        factory({ provide: [ADDER], load: async () => addNumbers }),
        factory({ provide: [MULTIPLIER], load: () => multiplyNumbers }),
        factory({ provide: [DIVIDER], load: () => divideNumbers }),
    ],
});

const a = componentA({ context: app });
```

The container may provide `ADDER`, `MULTIPLIER`, and `DIVIDER`, while `componentB` only needs `MULTIPLIER` (and whatever `componentC` declares). Missing services still produce a type error.

## Contextual functions without a context prop

A contextual function is not required to take a `context` prop. When it has none, `ContextDeps` resolves to `never`, so it contributes no dependencies when composed:

```ts
export function pureFormatter(props: { locale: string }) {
    return (value: number) => value.toLocaleString(props.locale);
}

type PureDeps = ContextDeps<typeof pureFormatter>; // never
```

## Related

- [Context / ContextDeps](/api-reference/context) — API reference
- [Implementing Services](/guides/services) — Factory and class-based patterns
- [Type Safety](/guides/type-safety) — Dependency validation at compile time
