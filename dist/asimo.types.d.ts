/**
 * String representing an interface namespace - e.g. "myapplication.services.Settings"
 * Must be unique within the scope of an application
 */
export type InterfaceNamespace = string;
/**
 * Interface ID Token for synchronous retrieval.
 * (Binds a type T with a namespace)
 */
export interface SyncIID<T, NS extends string = string> {
    /** The interface unique name - e.g. "myapplication.services.Configuration" */
    ns: NS;
    /** Tell that the value associated to this interface can be retrieved synchronously */
    sync: true;
    /** Phantom field to make T structural (never set at runtime) */
    readonly _type?: T;
}
/**
 * Interface ID Token for asynchronous retrieval.
 * (Binds a type T with a namespace)
 */
export interface AsyncIID<T, NS extends string = string> {
    /** The interface unique name - e.g. "myapplication.services.Settings" */
    ns: NS;
    /** Tell that the value associated to this interface can be retrieved asynchronously */
    sync: false;
    /** Phantom field to make T structural (never set at runtime) */
    readonly _type?: T;
}
/**
 * Interface ID token: binds an interface type T with an interface namespace (allows to get type continuation)
 */
export type InterfaceId<T, NS extends string = string> = SyncIID<T, NS> | AsyncIID<T, NS>;
/**
 * Extracts the interface type associated with an InterfaceId, SyncIID, or AsyncIID token.
 *
 * @example
 * const LOGGER = syncIID<Logger>()("app.Logger");
 * type LoggerType = InferType<typeof LOGGER>; // Logger
 */
export type InferType<T extends InterfaceId<any, any>> = NonNullable<T['_type']>;
/** A readonly array of interface IDs used in the `dependencies` property of a ServiceFactory. */
export type ServiceDeps = InterfaceId<any, any>[];
type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never;
/**
 * Extracts the return type of a factory `load` function from an array of IIDs.
 * The factory produces a single value that must satisfy every provided interface,
 * so the type is the intersection (`&`) of all IID types (e.g. `Adder & Multiplier`).
 * When any IID is async, the return is wrapped in `Promise`.
 */
export type FactoryLoadResult<IIDs extends InterfaceId<any, any>[]> = Extract<IIDs[number], AsyncIID<any, any>> extends never ? IIDs[number] extends InterfaceId<infer T, any> ? UnionToIntersection<T> : never : Promise<IIDs[number] extends InterfaceId<infer T, any> ? UnionToIntersection<T> : never>;
/**
 * Unique symbol brand marking objects produced by the `factory()` helper.
 * `createIocContainer` only accepts services carrying this brand — inline object
 * literals (missing the brand) are rejected at compile time.
 */
export declare const __asimoServiceFactory: unique symbol;
/**
 * Unique symbol brand marking objects produced by the `bundle()` helper.
 */
export declare const __asimoServiceBundle: unique symbol;
/**
 * Factory interface for creating services — called when a service is requested for the first time.
 *
 * `Deps` is inferred from the optional `dependencies` array literal. When present, `load`
 * receives an `Container` typed with exactly those IIDs. When omitted, `Deps` defaults
 * to `[]` and `load` receives `Container<never>` (no service accessible).
 *
 * `provide` is an array of IIDs — the `load` function returns a single value
 * that implements all provided interfaces. For a single service, use
 * `provide: [MY_IID]`.
 *
 * The `__asimoServiceFactory` brand ensures only objects originating from the `factory()`
 * helper can be used as services in `createIocContainer`.
 */
export interface ServiceFactory<IIDs extends InterfaceId<any, any>[], Deps extends ServiceDeps = []> {
    /** Brand — ensures this object was produced by `factory()`. */
    readonly [__asimoServiceFactory]: true;
    /** Interface IDs this factory provides — the loaded value must satisfy all of them. */
    provide: IIDs;
    /** Optional list of interface IDs this service depends on — used to type the load context. */
    dependencies?: Deps;
    /** Factory invoked on first access. Returns a single value satisfying all provided IIDs. */
    load(context: Container<Deps[number]>): FactoryLoadResult<IIDs>;
    /** Max number of retries on load failure for async IIDs (default: 2). Only meaningful when at least one IID is async. */
    maxRetries?: number;
    /** Base delay in ms between retries, doubled after each attempt (default: 1000). */
    retryDelayMs?: number;
}
/**
 * Bundle interface for lazily loading a group of related services.
 *
 * A bundle declares one or more `AsyncIID`s it provides via `provide`.
 * When one of those IIDs is fetched, the bundle's `load()` is called (once),
 * which returns a `Container` with the bundle's sub-factories and sub-bundles
 * already registered. The parent container then extracts and merges only the
 * entries whose namespace matches one of the IIDs in `provide` — sub-services
 * not listed in `provide` are silently dropped and will not be accessible on
 * the parent container.
 *
 * Bundles support optional `dependencies` to type the `load` context.
 * Bundles cannot be used with `SyncIID`s — only `AsyncIID`s.
 */
export interface ServiceBundle<IID extends AsyncIID<any, any> = AsyncIID<any, any>, Deps extends ServiceDeps = []> {
    readonly [__asimoServiceBundle]: true;
    /** IIDs this bundle provides — all must be `AsyncIID`. */
    provide: IID[];
    /** Optional dependencies used to type the `load` context. */
    dependencies?: Deps;
    /**
     * Async factory invoked on first access to any provided IID.
     * Returns an `Container` with the sub-factories and sub-bundles registered.
     * Typically implemented as `createIocContainer({ name, services: [...] })`.
     */
    load(context: Container<Deps[number]>): Promise<Container<any>>;
    /** Max number of retries on load failure (default: 2). */
    maxRetries?: number;
    /** Base delay in ms between retries, doubled after each attempt (default: 1000). */
    retryDelayMs?: number;
}
/**
 * Branded error type shown in TS error messages when a `dependencies` entry
 * is not registered in the container (or its parents). The generic carries the
 * missing IID namespace(s) so the error message is actionable:
 * "is not assignable to type 'ServiceDependencyNotRegistered<"ns">'"
 */
export interface ServiceDependencyNotRegistered<MissingNS extends string = string> {
    readonly __asimoErrorDependencyNotRegistered: `Declared dependency not registered in this container or its parents: "${MissingNS}"`;
}
/**
 * Branded error type shown in TS error messages when `maxRetries` or `retryDelayMs`
 * are passed to a `factory()` whose IID is a `SyncIID`. Retry is only meaningful
 * for `AsyncIID`.
 */
export interface RetryNotSupportedForSyncIID {
    readonly __asimoErrorRetryNotSupportedForSync: "Retry parameters (maxRetries, retryDelayMs) are not supported for SyncIID factories";
}
/**
 * Maps a service element (from `factory()`) to its typed ServiceFactory:
 * - Preserves the `__asimoServiceFactory` brand so `createIocContainer` accepts it.
 * - If the service declares `dependencies`, each listed dependency must be registered
 *   in the container (or its parents) — otherwise resolves to
 *   `ServiceDependencyNotRegistered<...>` (compile-time error with a descriptive message).
 *   The `load` context is typed as `Container<Deps[number]>` (only the listed IIDs).
 * - If no `dependencies` are declared, the `load` context is typed as
 *   `Container<never>` (no services accessible — dependencies must be listed explicitly).
 *
 * Matching is structural (`{ __asimoServiceFactory; interface; dependencies? }`) so mismatches
 * in `load` return types are caught by the reconstructed `ServiceFactory` rather than causing
 * the extension to fail.
 */
export type ValidService<S, AllIIDs extends InterfaceId<any, any>> = S extends {
    readonly [__asimoServiceFactory]: true;
    provide: infer IIDs extends InterfaceId<any, any>[];
    dependencies?: infer Deps;
} ? Deps extends ServiceDeps ? [Deps[number]] extends [AllIIDs] ? ServiceFactory<IIDs, Deps> : ServiceDependencyNotRegistered<Exclude<Deps[number], AllIIDs> extends InterfaceId<any, infer NS> ? NS : string> : ServiceFactory<IIDs, []> : S extends {
    readonly [__asimoServiceBundle]: true;
    provide: infer IIDs extends AsyncIID<any, any>[];
    dependencies?: infer Deps;
} ? Deps extends ServiceDeps ? [Deps[number]] extends [AllIIDs] ? ServiceBundle<IIDs[number], Deps> : ServiceDependencyNotRegistered<Exclude<Deps[number], AllIIDs> extends InterfaceId<any, infer NS> ? NS : string> : ServiceBundle<IIDs[number], []> : S;
export declare class AsimoError extends Error {
    readonly container: string;
    readonly messagePrefix: string;
    constructor(message: string, container: string);
}
/**
 * Asimo container configuration. Allows to define default retry settings and hooks for load and error events.
 * Typically created as a global config object and passed to each `createContainer()` as the `config` property.
 */
export interface AsimoConfig {
    /** Default max number of retries on load failure for async IIDs (default: 2). */
    maxRetries?: number;
    /** Default base delay in ms between retries, doubled after each attempt (default: 1000). */
    retryDelayMs?: number;
    /**
     * Called when a service factory is invoked for the first time.
     * Fires at most once per factory on successful load. For factories providing
     * multiple IIDs, the array contains all provided IIDs.
     */
    onLoad?: (iids: InterfaceId<any, any>[], container: Container<any>) => void;
    /**
     * Called when an AsimoError occurs during service loading.
     * Receives the error object and the container reference.
     */
    onError?: (error: AsimoError, container: Container<any>) => void;
}
/**
 * Info returned by `container.inspect()` / `container.inspect(iid)`.
 */
export interface ServiceInspectInfo {
    /** The IID namespace */
    ns: InterfaceNamespace;
    /** The container path where this service is defined */
    path: string;
    /** The load status: 'loaded' = factory called, 'registered' = factory registered but not called, 'pending' = bundle not yet loaded */
    status: 'loaded' | 'registered' | 'pending';
}
/**
 * Asimo IoC Container that stores retrievable dependencies.
 */
export interface Container<IIDs extends InterfaceId<any, any> = InterfaceId<any, any>> {
    /** Phantom field to make IIDs invariant (both co- and contravariant positions) */
    readonly _iids?: (x: IIDs) => IIDs;
    /**
     * The container name - helps differentiating multiple contexts - must not contain any slash character ("/"))
     */
    readonly name: string;
    /**
     * The parent containers where dependencies will be retrieved if not found in the current container.
     * `null` for root containers.
     */
    readonly parents: readonly Container<any>[] | null;
    /**
     * A unique path identifier created by concatenating the 'first parent' container's path
     * with the current container's name. This allows to identify a container in a hierarchy of containers.
     * e.g. "/app/subContext1/subContext2"
     * note: root containers have a path starting with a slash ("/") - e.g. "/app"
     */
    readonly path: string;
    /**
     * Retrieve one or multiple values from the IoC container synchronously. Will recursively search
     * for the values in the parent containers if not found.
     *
     * Note: this method will throw an error if one of the values is not found. To prevent this behavior
     * you must retrieve the values one by one and pass a default value as 2nd argument.
     * @example
     * const service = container.get(SomeServiceIID); // type-safe
     * const [service, otherService] = container.get(SomeServiceIID, SomeOtherServiceIID); // throws if one is not found
     * @see fetch()
     */
    get<IID extends Extract<IIDs, SyncIID<any, any>>>(iid: IID): IID extends SyncIID<infer T, any> ? T : never;
    get<Args extends Extract<IIDs, SyncIID<any, any>>[]>(...iids: Args): {
        [K in keyof Args]: Args[K] extends SyncIID<infer T, any> ? T : never;
    };
    /**
     * Retrieve one or multiple values from the IoC container asynchronously. Will recursively search
     * for the values in the parent containers if not found.
     *
     * Note: this method will throw an error if one of the values is not found. To prevent this behavior
     * you must retrieve the values one by one and pass a default value as 2nd argument.
     * @example
     * const service = await container.fetch(SomeServiceIID); // type-safe
     * const [service, otherService] = await container.fetch(SomeServiceIID, SomeOtherServiceIID); // type-safe
     * @see get()
     */
    fetch<IID extends IIDs>(iid: IID): IID extends InterfaceId<infer T, any> ? Promise<T> : never;
    fetch<Args extends IIDs[]>(...iids: Args): Promise<{
        [K in keyof Args]: Args[K] extends InterfaceId<infer T, any> ? T : never;
    }>;
    /**
     * Retrieve one or multiple values from the IoC container synchronously. Will recursively search
     * for the values in the parent containers if not found.
     *
     * Returns null for values that are not found instead of throwing an error.
     * @example
     * const service = container.getOptional(SomeServiceIID); // type-safe, T | null
     * @see get()
     */
    getOptional<IID extends InterfaceId<any, any>>(iid: IID): IID extends SyncIID<infer T, any> ? T | null : IID extends AsyncIID<infer T, any> ? Promise<T> | null : never;
    getOptional<Args extends InterfaceId<any, any>[]>(...iids: Args): {
        [K in keyof Args]: Args[K] extends SyncIID<infer T, any> ? T | null : Args[K] extends AsyncIID<infer T, any> ? Promise<T> | null : never;
    };
    /**
     * Retrieve one or multiple values from the IoC container asynchronously. Will recursively search
     * for the values in the parent containers if not found.
     *
     * Returns null for values that are not found instead of throwing an error.
     * Note: even synchronous values are returned as Promises. The union element type is `Promise<T> | null`.
     * @example
     * const service = await container.fetchOptional(SomeServiceIID); // type-safe, T | null
     * @see fetch()
     */
    fetchOptional<IID extends InterfaceId<any, any>>(iid: IID): Promise<IID extends InterfaceId<infer T, any> ? T : never | null>;
    fetchOptional<Args extends InterfaceId<any, any>[]>(...iids: Args): Promise<{
        [K in keyof Args]: Args[K] extends InterfaceId<infer T, any> ? T : never | null;
    }>;
    /**
     * Inspect a specific service — returns info about where it is defined and whether it is loaded.
     * Returns `null` if the service is not found in this container or any ancestor.
     */
    inspect(iid: InterfaceId<any>): ServiceInspectInfo | null;
    /**
     * List all services defined in this container and its ancestors with their status.
     */
    inspect(): ServiceInspectInfo[];
    /**
     * Returns true if the given IID is registered in this container or any ancestor.
     */
    has(iid: InterfaceId<any, any>): boolean;
    /**
     * Returns an iterator over the service entries defined directly on this container
     * (excluding parents). Each entry exposes the IID namespace and load status.
     */
    entries(): IterableIterator<ServiceInspectInfo>;
    /**
     * Returns human-readable string describing all services in this container
     * and their ancestors, their locations, and their load status.
     * @example
     * console.log(container.dump());
     */
    dump(): string;
    /**
     * Removes a loaded service instance from the cache so it can be re-loaded
     * on the next access. Does nothing if the service is not loaded or not registered.
     */
    dispose(iid: InterfaceId<any, any>): void;
}
export {};
