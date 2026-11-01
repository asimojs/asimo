---
title: Context / ContextDeps
description: API reference for Context and ContextDeps
---

Helpers for typing contextual functions. A contextual function takes a single props object with a `context` property:

```ts
type ContextualFunction = (props: { context: Context<IIDs> }) => Result;
```

## Signatures

```ts
type Context<IIDs extends InterfaceId<any, any>> =
    Omit<Container<IIDs>, "_iids"> & { readonly _iids?: (iids: IIDs) => any };

type ContextDeps<Fn> =
    Fn extends (props: infer Props) => any
        ? Props extends { context: Context<infer IIDs> }
            ? IIDs
            : never
        : never;
```

## `Context`

### Parameters

| Parameter | Type | Description |
|---|---|---|
| `IIDs` | `InterfaceId` | The IIDs the contextual function reads from its context |

**Returns**: A container-compatible type that accepts containers providing **at least** `IIDs`. Extra IIDs are allowed.

### Example

```ts
import type { Context } from "@asimojs/asimo";

export function componentB({ context }: { context: Context<typeof MULTIPLIER> }) {
    const multiply = context.get(MULTIPLIER);
    return { multiply };
}
```

```ts
const app = createContainer({
    name: "app",
    services: [
        factory({ provide: [MULTIPLIER], load: () => multiplyNumbers }),
        factory({ provide: [ADDER], load: async () => addNumbers }),
    ],
});

componentB({ context: app }); // OK: app provides MULTIPLIER and more
```

## `ContextDeps`

### Parameters

| Parameter | Type | Description |
|---|---|---|
| `Fn` | contextual function type | The contextual function to inspect. Use `typeof componentB`. |

**Returns**: The IIDs declared by the contextual function’s `context` prop, or `never` if there is no `context` prop.

### Example

```ts
import type { Context, ContextDeps } from "@asimojs/asimo";

export function componentB({ context }: { context: Context<typeof MULTIPLIER> }) {
    return { multiply: context.get(MULTIPLIER) };
}

export function componentA({
    context,
}: {
    context: Context<typeof ADDER | ContextDeps<typeof componentB>>;
}) {
    const b = componentB({ context });
    return { multiply: b.multiply };
}
```

`ContextDeps` composes transitively: if `componentB` depends on `componentC`, `ContextDeps<typeof componentB>` includes `componentC`’s dependencies as well.

### Contextual function without a context prop

```ts
export function pureFormatter(props: { locale: string }) {
    return (value: number) => value.toLocaleString(props.locale);
}

type PureDeps = ContextDeps<typeof pureFormatter>; // never
```

## How it works

`Container<IIDs>` is invariant through its `_iids` phantom, which prevents passing a container with extra IIDs to a contextual function typed against fewer.

`Context<IIDs>` keeps the container API but replaces `_iids` with a contravariant signature, `(iids: IIDs) => any`. This:

- accepts containers providing **more** IIDs than required (safe — the contextual function only reads what it declares);
- rejects containers missing required IIDs (compile-time error).

`ContextDeps` reads the `context` property from the contextual function’s props type and infers its `IIDs` parameter.

## Related

- [Contextual Functions](/guides/contextual-functions) — Composing contextual functions
- [Container Interface](/api-reference/container) — Container API
- [Type Safety](/guides/type-safety) — Compile-time dependency validation
