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

/** A readonly array of interface IDs used in the `dependencies` property of a ServiceFactory. */
export type ServiceDeps = InterfaceId<any, any>[];

/**
 * Unique symbol brand marking objects produced by the `factory()` helper.
 * `createIocContainer` only accepts services carrying this brand — inline object
 * literals (missing the brand) are rejected at compile time.
 */
export const __asimoServiceFactory: unique symbol = Symbol("asimo.serviceFactory");

/**
 * Unique symbol brand marking objects produced by the `bundle()` helper.
 */
export const __asimoServiceBundle: unique symbol = Symbol("asimo.serviceBundle");

/**
 * Factory interface for creating services — called when a service is requested for the first time.
 *
 * `Deps` is inferred from the optional `dependencies` array literal. When present, `load`
 * receives an `IoCContainer` typed with exactly those IIDs. When omitted, `Deps` defaults
 * to `[]` and `load` receives `IoCContainer<never>` (no service accessible).
 *
 * The `__asimoServiceFactory` brand ensures only objects originating from the `factory()`
 * helper can be used as services in `createIocContainer`.
 */
export interface ServiceFactory<
    IID extends InterfaceId<any, any>,
    Deps extends ServiceDeps = []
> {
    /** Brand — ensures this object was produced by `factory()`. */
    readonly [__asimoServiceFactory]: true;
    interface: IID;
    /** Optional list of interface IDs this service depends on — used to type the load context. */
    dependencies?: Deps;
    load(context: IoCContainer<Deps[number]>): IID extends SyncIID<infer T, any> ? T : IID extends AsyncIID<infer T, any> ? Promise<T> : never;
}

/**
 * Bundle interface for lazily loading a group of related services.
 *
 * A bundle declares one or more `AsyncIID`s it provides via `provide`.
 * When one of those IIDs is fetched, the bundle's `load()` is called (once),
 * which returns an `IoCContainer` with the bundle's sub-factories and sub-bundles
 * already registered. The parent container then extracts and merges those entries.
 *
 * Bundles support optional `dependencies` to type the `load` context.
 * Bundles cannot be used with `SyncIID`s — only `AsyncIID`s.
 */
export interface ServiceBundle<
    IID extends AsyncIID<any, any> = AsyncIID<any, any>,
    Deps extends ServiceDeps = []
> {
    readonly [__asimoServiceBundle]: true;
    /** IIDs this bundle provides — all must be `AsyncIID`. */
    provide: IID[];
    /** Optional dependencies used to type the `load` context. */
    dependencies?: Deps;
    /**
     * Async factory invoked on first access to any provided IID.
     * Returns an `IoCContainer` with the sub-factories and sub-bundles registered.
     * Typically implemented as `createIocContainer({ name, services: [...] })`.
     */
    load(context: IoCContainer<Deps[number]>): Promise<IoCContainer<any>>;
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
 * Maps a service element (from `factory()`) to its typed ServiceFactory:
 * - Preserves the `__asimoServiceFactory` brand so `createIocContainer` accepts it.
 * - If the service declares `dependencies`, each listed dependency must be registered
 *   in the container (or its parents) — otherwise resolves to
 *   `ServiceDependencyNotRegistered<...>` (compile-time error with a descriptive message).
 *   The `load` context is typed as `IoCContainer<Deps[number]>` (only the listed IIDs).
 * - If no `dependencies` are declared, the `load` context is typed as the full
 *   `IoCContainer<AllIIDs>`.
 *
 * Matching is structural (`{ __asimoServiceFactory; interface; dependencies? }`) so mismatches
 * in `load` return types are caught by the reconstructed `ServiceFactory` rather than causing
 * the extension to fail.
 */
export type ValidService<S, AllIIDs extends InterfaceId<any, any>> =
    S extends { readonly [__asimoServiceFactory]: true; interface: infer IID extends InterfaceId<any, any>; dependencies?: infer Deps }
        ? Deps extends ServiceDeps
            ? [Deps[number]] extends [AllIIDs]
                ? ServiceFactory<IID, Deps>
                : ServiceDependencyNotRegistered<
                    Exclude<Deps[number], AllIIDs> extends InterfaceId<any, infer NS> ? NS : string
                >
            : ServiceFactory<IID, [AllIIDs]>
        : S extends { readonly [__asimoServiceBundle]: true; provide: infer IIDs extends AsyncIID<any, any>[]; dependencies?: infer Deps }
            ? Deps extends ServiceDeps
                ? [Deps[number]] extends [AllIIDs]
                    ? ServiceBundle<IIDs[number], Deps>
                    : ServiceDependencyNotRegistered<
                        Exclude<Deps[number], AllIIDs> extends InterfaceId<any, infer NS> ? NS : string
                    >
                : ServiceBundle<IIDs[number], []>
            : S;

/**
 * Info returned by `container.inspect()` / `container.inspect(iid)`.
 */
export interface ServiceInspectInfo {
    /** The IID namespace */
    ns: InterfaceNamespace;
    /** The container path where this service is defined */
    path: string;
    /** Whether the service instance has been created (factory already called) */
    loaded: boolean;
}

/**
 * Asimo IoC Container that stores retrievable dependencies.
 *
 * The root container (aka. context) is exposed through the asm global object. Sub-contexts can be created through createContainer()
 */
export interface IoCContainer<IIDs extends InterfaceId<any, any> = InterfaceId<any, any>> {
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
    readonly parents: readonly IoCContainer<any>[] | null;
    /**
     * A unique path identifier created by concatenating the 'first parent' container's path 
     * with the current container's name. This allows to identify a container in a hierarchy of containers.
     * e.g. "/asm/subContext1/subContext2"
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
    get<IID extends Extract<IIDs, AsyncIID<any, any>>>(iid: IID): IID extends AsyncIID<infer T, any> ? Promise<T> : never;
    get<Args extends IIDs[]>(
        ...iids: Args
    ): { [K in keyof Args]: Args[K] extends SyncIID<infer T, any> ? T : Args[K] extends AsyncIID<infer T, any> ? Promise<T> : never };
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
    fetch<Args extends IIDs[]>(
        ...iids: Args
    ): Promise<{ [K in keyof Args]: Args[K] extends InterfaceId<infer T, any> ? T : never }>;
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
    getOptional<Args extends InterfaceId<any, any>[]>(
        ...iids: Args
    ): { [K in keyof Args]: Args[K] extends SyncIID<infer T, any> ? T | null : Args[K] extends AsyncIID<infer T, any> ? Promise<T> | null : never };
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
    fetchOptional<Args extends InterfaceId<any, any>[]>(
        ...iids: Args
    ): Promise<{ [K in keyof Args]: Args[K] extends InterfaceId<infer T, any> ? T : never | null }>;
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
     * Returns a human-readable string describing all services in this container
     * and its ancestors, their locations, and their load status.
     * @example
     * console.log(container.dump());
     */
    dump(): string;
}

/**
 * Shorthand for `IoCContainer<typeof A | typeof B | ...>` where A, B, ... are InterfaceIds.
 * @example
 * // equivalent to IoCContainer<typeof MULTIPLIER | typeof DIVIDER>
 * type C = Container<[typeof MULTIPLIER, typeof DIVIDER]>;
 */
export type Container<IIDs extends InterfaceId<any, any>[]> = IoCContainer<IIDs[number]>;
