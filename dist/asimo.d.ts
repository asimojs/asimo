import { AsimoError, __asimoServiceBundle, __asimoServiceFactory } from "./asimo.types";
export { AsimoError };
export type { InferType, InterfaceId, AsyncIID, SyncIID, InterfaceNamespace, ServiceDeps, ServiceFactory, ServiceBundle, ValidService, AsimoConfig, ServiceInspectInfo, Container };
import type { AsimoConfig, AsyncIID, Container, InferType, InterfaceId, InterfaceNamespace, RetryNotSupportedForSyncIID, ServiceBundle, ServiceDeps, ServiceFactory, ServiceInspectInfo, SyncIID, ValidService } from "./asimo.types";
export declare class AsimoLoadError extends AsimoError {
    readonly cause: unknown;
    constructor(message: string, container: string, cause?: unknown);
}
/**
 * Create an interface token for values that can be retrieved synchronously
 * @param ns the interface namespace, e.g. "myapplication.services.Configuration"
 * @returns
 */
export declare function syncIID<T>(): <NS extends string>(ns: NS) => SyncIID<T, NS>;
/**
 * Create an interface token for values that can be retrieved asynchronously
 * @param ns the interface namespace, e.g. "common.utils.Fetch"
 * @returns
 */
export declare function asyncIID<T>(): <NS extends string>(ns: NS) => AsyncIID<T, NS>;
type ContainerIIDs<C> = C extends Container<infer IIDs> ? IIDs : never;
/**
 * Helper for declaring a service with explicit dependencies. Inference flows directly
 * from `dependencies` to `load`'s context, so the latter receives a
 * `Container<Deps[number]>` typed with exactly the listed IIDs.
 * When `dependencies` is omitted, the load context is `Container<never>` — no services
 * are accessible unless explicitly listed as dependencies.
 * The invariant phantom on `Container` catches mismatches between the declared
 * dependencies and what `load` actually uses — at compile time, with no manual annotation.
 *
 * @example
 * factory({
 *     provide: CALCULATOR,
 *     dependencies: [MULTIPLIER, ADDER, SUBTRACTER],
 *     load: (c) => createCalculator(c), // 'c' is Container<typeof MULTIPLIER | typeof ADDER | typeof SUBTRACTER>
 * })
 */
export declare function factory<const IID extends InterfaceId<any, any>, const Deps extends ServiceDeps = []>(params: {
    /** Interface identifier provided by this service. */
    provide: IID;
    /** Interface IDs this service depends on — types the `load` context. Optional; when omitted, `load` receives `Container<never>` (no accessible services). */
    dependencies?: Deps;
    /** Factory invoked on first access. Receives a container exposing only the listed dependencies. */
    load(context: Container<Deps[number]>): IID extends SyncIID<infer T, any> ? T : IID extends AsyncIID<infer T, any> ? Promise<T> : never;
    /** Max number of retries on load failure for async IIDs (default: 2). */
    maxRetries?: IID extends SyncIID<any, any> ? RetryNotSupportedForSyncIID : number;
    /** Base delay in ms between retries, doubled after each attempt (default: 1000). */
    retryDelayMs?: IID extends SyncIID<any, any> ? RetryNotSupportedForSyncIID : number;
}): ServiceFactory<IID, Deps>;
/**
 * Helper for declaring a lazy-loading bundle of services. Similar to `factory()` but:
 * - `provide` is an array of `AsyncIID`s (bundles cannot provide `SyncIID`s)
 * - `load` is async and returns sub-factories and sub-bundles
 * - The bundle is loaded on-demand when one of its provided IIDs is fetched
 *
 * @example
 * bundle({
 *     provide: [MULTIPLIER, DIVIDER],
 *     load: async () => {
 *         const mod = await import("./math-services");
 *         return [mod.multiplierFactory, mod.dividerFactory];
 *     },
 * })
 */
export declare function bundle<const IIDs extends AsyncIID<any, any>[], const Deps extends ServiceDeps = []>(params: {
    /** Interface IDs provided by this bundle — all must be `AsyncIID`. */
    provide: IIDs;
    /** Optional dependencies used to type the `load` context. */
    dependencies?: Deps;
    /** Async factory invoked on first access to any provided IID. Returns an `Container` with sub-services registered. */
    load(context: Container<Deps[number]>): Promise<Container<any>>;
    /** Max number of retries on load failure (default: 2). */
    maxRetries?: number;
    /** Base delay in ms between retries, doubled after each attempt (default: 1000). */
    retryDelayMs?: number;
}): ServiceBundle<IIDs[number], Deps>;
type ServiceEntry = {
    readonly [__asimoServiceFactory]: true;
    interface: InterfaceId<any, any>;
    dependencies?: ServiceDeps;
} | {
    readonly [__asimoServiceBundle]: true;
    provide: AsyncIID<any, any>[];
    dependencies?: ServiceDeps;
};
type ServiceIID<S> = S extends {
    readonly [__asimoServiceFactory]: true;
    interface: infer IID extends InterfaceId<any, any>;
} ? IID : S extends {
    readonly [__asimoServiceBundle]: true;
    provide: infer IIDs extends InterfaceId<any, any>[];
} ? IIDs[number] : never;
export declare function createContainer<const Services extends readonly ServiceEntry[], const Parents extends readonly Container<any>[] | null | undefined = undefined>(params: {
    name: string;
    extends?: Parents;
    config?: AsimoConfig;
    services?: [
        ...{
            [K in keyof Services]: ValidService<Services[K], ServiceIID<Services[number]> | (Parents extends readonly any[] ? ContainerIIDs<Parents[number]> : never)>;
        }
    ];
}): Container<ServiceIID<Services[number]> | (Parents extends readonly any[] ? ContainerIIDs<Parents[number]> : never)>;
