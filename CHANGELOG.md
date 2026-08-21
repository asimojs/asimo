# Changelog

## 7.0.0

### Breaking changes

- **Multi-interface services**: `factory()` now takes `provide` as an array of IIDs. A single-interface service must use `provide: [MY_IID]` (previously `provide: MY_IID`).
- **`onLoad` callback signature**: now receives an array of IIDs — `(iids, container)` instead of `(iid, container)`.
- **`ServiceFactory` shape**: the `interface` property is replaced by `provide: InterfaceId[]`. The loaded value is a single object that must satisfy every provided interface.

### Features

- A single factory can now provide multiple interfaces; the `load` result is typed as the intersection of all provided IID types (e.g. `Adder & Multiplier`) via the new `FactoryLoadResult` type.
- Async multi-interface factories share one load promise across all their IIDs, so the load runs only once even when several interfaces are fetched.

### Fixes

- Invalid service registrations (not created via `factory()` or `bundle()`) now throw an `AsimoError` at container creation.

## 6.0.0

**Full rewrite of the asimo library.** ~2KB gzipped, zero dependencies.

### Core

- Complete TypeScript rewrite with `verbatimModuleSyntax` and strict mode
- `Container` replaces `IoCContainer` with improved generics and default `Container<never>` when no dependencies are defined
- Compile-time dependency validation via branded error types (`ServiceDependencyNotRegistered`, `RetryNotSupportedForSyncIID`)
- Phantom-based type invariance ensures correct IID tracking through the container hierarchy

### Features

- **Lazy bundle loading** (`bundle()`): on-demand async service groups with deduplication, circular detection, and scope filtering
- **Retry with exponential backoff**: configurable per-factory, per-bundle, or per-container via `config.maxRetries` / `config.retryDelayMs`
- **`inspect()` / `dump()` / `entries()`**: runtime introspection with `'loaded' | 'registered' | 'pending'` status per service
- **`has()`**: check if an IID is available in the container hierarchy
- **`onLoad` / `onError` callbacks**: per-container lifecycle hooks on `AsimoConfig`
- **Parent containers**: frozen hierarchy with immutable `parents` array, child-over-parent shadowing
- **Container name & services validation**: prevents slashes in names and non-array services at creation time

### Errors

- `AsimoError` with `container` path on every throw
- `AsimoLoadError extends AsimoError` with `cause` for retry exhaustion

### Size

- ESM: 5.1 kB minified / 1.9 kB gzipped
- UMD: 5.4 kB minified / 2.0 kB gzipped
