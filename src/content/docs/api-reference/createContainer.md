---
title: createContainer
description: API reference for createContainer()
---

Creates an asimo IoC container that stores and resolves services.

## Signature

```ts
function createContainer<
    const Services extends readonly ServiceEntry[],
    const Parents extends readonly Container<any>[] | null | undefined = undefined,
>(params: {
    name: string;
    extends?: Parents;
    config?: AsimoConfig;
    services?: [...]  // typed via ValidService
}): Container<ServiceIID<Services[number]> | (Parents extends any[] ? ContainerIIDs<Parents[number]> : never)>
```

## Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `name` | `string` | Yes | — | Container name. Must not contain `/`. |
| `extends` | `Container[] \| null` | No | `null` | Parent containers for service inheritance. |
| `config` | `AsimoConfig` | No | `{}` | Global retry defaults and lifecycle hooks. |
| `services` | `ServiceEntry[]` | No | `[]` | Array of factories and/or bundles. |

## Return Value

A `Container` typed with the union of all IIDs from local services and all parent containers.

## Examples

### Minimal Container

```ts
const container = createContainer({
    name: "app",
});
// container: Container<never> — no services registered
```

### Container with Services

```ts
const container = createContainer({
    name: "app",
    services: [
        factory({ provide: [LOGGER], load: () => createLogger() }),
        factory({ provide: [DB], dependencies: [LOGGER], load: (c) => createDB(c.get(LOGGER)) }),
    ],
});
// container: Container<typeof LOGGER | typeof DB>
```

### Container with Parent

```ts
const child = createContainer({
    name: "child",
    extends: [parentContainer],
    services: [
        factory({ provide: [CHILD_SVC], load: () => createChild() }),
    ],
});
// child: Container<typeof LOGGER | typeof DB | typeof CHILD_SVC>
// (inherits LOGGER + DB from parent)
```

### Multiple Parents

```ts
const merged = createContainer({
    name: "merged",
    extends: [containerA, containerB, containerC],
});
// Inherits services from all three. First match wins on conflicts.
// path is computed from containerA (first parent).
```

### With Global Config

```ts
const app = createContainer({
    name: "app",
    config: {
        maxRetries: 3,
        retryDelayMs: 2000,
        onLoad(iids, container) {
            console.log(`Loaded: ${iids[0].ns}`);
        },
        onError(error, container) {
            console.error(error.message);
        },
    },
    services: [...],
});
```

## Errors

| Condition | Error |
|---|---|
| `name` contains `/` | Throws at creation time |
| `services` is not an array | Throws at creation time |
| Service not found on `get()`/`fetch()` | `AsimoError` at resolution time |
| Missing dependency | Compile-time `ServiceDependencyNotRegistered` |
| Inline object literal as service | Compile-time brand error |

## Type Parameters

- **`Services`**: Const type parameter inferred from the `services` array. Preserves literal types for IID inference.
- **`Parents`**: Const type parameter for the `extends` array. Used to merge parent IIDs into the container's type.
- **Return type**: The union of all `ServiceIID<>` from local services plus all `ContainerIIDs<>` from parents.

## Remarks

- Container names must be valid path segments (no `/`). The `path` property is auto-generated from the first parent.
- Services are registered at creation time but **not loaded**. Loading happens on first `get()`/`fetch()`.
- The parent chain is frozen (`Object.freeze`) at creation time.
- Containers use `WeakMap` internally for service storage, which is cleaned up when the container is garbage-collected.
