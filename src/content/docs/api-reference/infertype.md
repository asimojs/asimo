---
title: InferType
description: API reference for the InferType type helper
---

Extracts the interface type bound to an `InterfaceId`, `SyncIID`, or `AsyncIID` token.

## Signature

```ts
type InferType<T extends InterfaceId<any, any>> = NonNullable<T['_type']>
```

## Parameters

| Parameter | Type | Description |
|---|---|---|
| `T` | `InterfaceId<any, any>` | An IID token type from `syncIID<T>()` or `asyncIID<T>()` |

**Returns**: The interface type `T` that was bound to the IID.

## Examples

### Basic Usage

```ts
import { syncIID, asyncIID, InferType } from "@asimojs/asimo";

interface Logger { log(msg: string): void; }
const LOGGER = syncIID<Logger>()("app.Logger");

interface Database { query(sql: string): Promise<any[]>; }
const DB = asyncIID<Database>()("app.Database");

type LoggerType = InferType<typeof LOGGER>;  // Logger
type DBType = InferType<typeof DB>;          // Database
```

### Class Field Annotations

When a class stores dependencies eagerly in the constructor, use `InferType` to annotate fields without importing the original interfaces:

```ts
class UserService {
    private db: InferType<typeof DB>;
    private logger: InferType<typeof LOGGER>;

    constructor(context: Container<typeof DB | typeof LOGGER>) {
        this.db = context.get(DB);
        this.logger = context.get(LOGGER);
    }
}
```

### Factory Return Types

```ts
function createLogger(
    context: Container<typeof DB>,
): InferType<typeof LOGGER> {
    const db = context.get(DB);
    return {
        log: (msg: string) => db.query(`INSERT INTO logs: ${msg}`),
    };
}
```

## How It Works

`InferType` reads the phantom `_type` field on the IID token. This field is never set at runtime — it only exists to make the TypeScript type structural:

```ts
// Internally:
interface SyncIID<T, NS extends string = string> {
    ns: NS;
    sync: true;
    readonly _type?: T;  // ← NonNullable<'T | undefined'> → T
}
```

Since `_type` is optional (`_type?`), its type is `T | undefined`. `NonNullable` strips the `undefined`, yielding `T`.

## Related

- [syncIID / asyncIID](/api-reference/iids) — Creating IID tokens
- [Core Concepts: IID Tokens](/core-concepts/iids) — Understanding sync vs async IIDs
- [Implementing Services](/guides/services) — Class-based and factory-based service patterns
