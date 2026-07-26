---
title: syncIID / asyncIID
description: API reference for syncIID() and asyncIID()
---

Creates an Interface ID token that binds a TypeScript type to a unique namespace string.

## syncIID

```ts
function syncIID<T>(): <NS extends string>(ns: NS) => SyncIID<T, NS>
```

Creates a token for services that can be retrieved synchronously with `container.get()`.

| Parameter | Type | Required | Description |
|---|---|---|---|
| (none) | — | — | The `<T>` generic binds the TypeScript type. |

**Returns**: A function that accepts a namespace string and returns a `SyncIID<T, NS>`.

**Example**:
```ts
interface Logger { log(msg: string): void; }
const LOGGER = syncIID<Logger>()("app.services.Logger");
```

## asyncIID

```ts
function asyncIID<T>(): <NS extends string>(ns: NS) => AsyncIID<T, NS>
```

Creates a token for services that require asynchronous retrieval with `container.fetch()`.

| Parameter | Type | Required | Description |
|---|---|---|---|
| (none) | — | — | The `<T>` generic binds the TypeScript type. |

**Returns**: A function that accepts a namespace string and returns an `AsyncIID<T, NS>`.

**Example**:
```ts
interface Config { apiUrl: string; }
const CONFIG = asyncIID<Config>()("app.services.Config");
```

## Return Types

### SyncIID<T, NS>

```ts
interface SyncIID<T, NS extends string = string> {
    ns: NS;
    sync: true;
    readonly _type?: T;
}
```

### AsyncIID<T, NS>

```ts
interface AsyncIID<T, NS extends string = string> {
    ns: NS;
    sync: false;
    readonly _type?: T;
}
```

### InterfaceId<T, NS>

```ts
type InterfaceId<T, NS extends string = string> = SyncIID<T, NS> | AsyncIID<T, NS>;
```

Unified type that matches both sync and async IIDs. Used by `container.fetch()`, `container.inspect()`, and `container.has()`.

## Usage Notes

- The curried call pattern (`syncIID<T>()("ns")`) separates the type parameter from the namespace, enabling type-safe grouping and inference.
- The namespace must be unique across the entire application. Duplicate namespaces in the same container will cause runtime errors.
- The `sync` property (`true` or `false`) determines which container methods can retrieve the token.
- The `_type` property is a phantom field — it is never set at runtime and exists only for TypeScript structural typing.

## Naming Convention

Use a reverse-domain or dotted path pattern - e.g.:

```
"my-app-name.services.Logger"
"my-app-name.features.auth.AuthService"
"my-company.lib.utils.FetchClient"
```

This convention ensures uniqueness and makes `container.dump()` output readable.

## Related

- [Core Concepts: IID Tokens](/core-concepts/iids)
- [Container.get() / fetch()](/api-reference/container)
