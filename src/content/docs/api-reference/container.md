---
title: Container Interface
description: API reference for the Container type
---

The `Container<IIDs>` interface represents an asimo IoC container. It is returned by `createContainer()`.

## Type Parameter

```ts
interface Container<IIDs extends InterfaceId<any, any> = InterfaceId<any, any>>
```

`IIDs` is the union of all InterfaceId tokens registered in this container and its ancestors. It drives type inference for `get()`, `fetch()`, and all retrieval methods.

## Properties

| Property | Type | Description |
|---|---|---|
| `name` | `string` | The container's name (without `/`). |
| `path` | `string` | Full hierarchical path: `/${firstParent.path}/${name}`. Unique per container. |
| `parents` | `readonly Container[] \| null` | The parent containers. `null` for root containers. |
| `_iids` | `(x: IIDs) => IIDs` (phantom) | Internal phantom field ensuring type invariance. Not used at runtime. |

## Methods

### `get()`

```ts
get<IID extends Extract<IIDs, SyncIID<any, any>>>(iid: IID):
    IID extends SyncIID<infer T, any> ? T : never;

get<Args extends Extract<IIDs, SyncIID<any, any>>[]>(...iids: Args):
    { [K in keyof Args]: Args[K] extends SyncIID<infer T, any> ? T : never };
```

Retrieves one or more services synchronously. Only accepts `SyncIID` tokens.

> A "service not found" error only occurs at runtime when types are bypassed (e.g., `Container<any>`, `any`-cast IIDs). With proper typing, the compiler guarantees all requested services are registered.

```ts
const logger = container.get(LOGGER);               // single
const [a, b] = container.get(SVC_A, SVC_B);         // multiple
```

### `fetch()`

```ts
fetch<IID extends IIDs>(iid: IID):
    IID extends InterfaceId<infer T, any> ? Promise<T> : never;

fetch<Args extends IIDs[]>(...iids: Args):
    Promise<{ [K in keyof Args]: Args[K] extends InterfaceId<infer T, any> ? T : never }>;
```

Retrieves one or more services asynchronously. Accepts both `SyncIID` and `AsyncIID` tokens.

> A "service not found" error only occurs at runtime when types are bypassed (e.g., `Container<any>`, `any`-cast IIDs). With proper typing, the compiler guarantees all requested services are registered.

```ts
const config = await container.fetch(CONFIG);              // single
const [cfg, db] = await container.fetch(CONFIG, DB);       // multiple
```

### `getOptional()`

```ts
getOptional<IID extends InterfaceId<any, any>>(iid: IID):
    IID extends SyncIID<infer T, any>
        ? T | null
        : IID extends AsyncIID<infer T, any>
          ? Promise<T> | null
          : never;

getOptional<Args extends InterfaceId<any, any>[]>(...iids: Args):
    { [K in keyof Args]: ... };
```

Retrieves services synchronously, returning `null` for missing services instead of throwing. Accepts both sync and async IIDs.

```ts
const logger = container.getOptional(LOGGER);       // Logger | null
const config = container.getOptional(CONFIG);       // Promise<Config> | null
```

### `fetchOptional()`

```ts
fetchOptional<IID extends InterfaceId<any, any>>(iid: IID):
    Promise<IID extends InterfaceId<infer T, any> ? T : never | null>;

fetchOptional<Args extends InterfaceId<any, any>[]>(...iids: Args):
    Promise<{ ... }>;
```

Like `getOptional()` but always returns a `Promise`.

```ts
const config = await container.fetchOptional(CONFIG);  // Config | null
```

### `inspect()`

```ts
inspect(iid: InterfaceId<any>): ServiceInspectInfo | null;
inspect(): ServiceInspectInfo[];
```

Inspects service registration status.

```ts
// Single service
const info = container.inspect(LOGGER);
// { ns: "app.Logger", path: "/app", status: "loaded" } | null

// All services (including ancestors)
const all = container.inspect();
// ServiceInspectInfo[]
```

### `has()`

```ts
has(iid: InterfaceId<any, any>): boolean;
```

Returns `true` if the service is registered in this container or any ancestor.

### `entries()`

```ts
entries(): IterableIterator<ServiceInspectInfo>;
```

Iterates over services defined directly on this container (excluding parents).

### `dump()`

```ts
dump(): string;
```

Returns a human-readable description of all services, their paths, and statuses. Useful for debugging.

```
Asimo IoC Container: /app
  /app: app.services.Logger - loaded
  /app: app.services.Config - pending
```

## ServiceInspectInfo

```ts
interface ServiceInspectInfo {
    ns: string;                                    // IID namespace
    path: string;                                  // Container path where defined
    status: "loaded" | "registered" | "pending";   // Load status
}
```

## Related

- [createContainer()](/api-reference/createContainer)
- [factory()](/api-reference/factory)
- [bundle()](/api-reference/bundle)
