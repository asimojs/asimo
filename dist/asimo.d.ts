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
 * `provide` is an array of IIDs and `load` must return a single value that implements
 * all provided interfaces. For a single service, use `provide: [MY_IID]`.
 *
 * @example
 * // Single IID
 * factory({
 *     provide: [CALCULATOR],
 *     dependencies: [MULTIPLIER, ADDER, SUBTRACTER],
 *     load: (c) => createCalculator(c),
 * })
 *
 * // Multiple IIDs — one service implements several interfaces
 * factory({
 *     provide: [ADDER, MULTIPLIER],
 *     load: () => new Calculator(),
 * })
 */
export declare function factory<const IIDs extends InterfaceId<any, any>[], const Deps extends ServiceDeps = []>(params: {
    /** Interface IDs provided by this factory — must be an array, even for a single IID. */
    provide: IIDs;
    /** Interface IDs this service depends on — types the `load` context. Optional; when omitted, `load` receives `Container<never>` (no accessible services). */
    dependencies?: Deps;
    /** Factory invoked on first access. Receives a container exposing only the listed dependencies. Must return a single value that implements all provided interfaces. */
    load(context: Container<Deps[number]>): Extract<IIDs[number], AsyncIID<any, any>> extends never ? IIDs[number] extends InterfaceId<infer T, any> ? (T extends any ? (k: T) => void : never) extends (k: infer I) => void ? I : never : never : Promise<IIDs[number] extends InterfaceId<infer T, any> ? (T extends any ? (k: T) => void : never) extends (k: infer I) => void ? I : never : never>;
    /** Max number of retries on load failure for async IIDs (default: 2). Only meaningful when at least one IID is async. */
    maxRetries?: Extract<IIDs[number], AsyncIID<any, any>> extends never ? RetryNotSupportedForSyncIID : number;
    /** Base delay in ms between retries, doubled after each attempt (default: 1000). */
    retryDelayMs?: Extract<IIDs[number], AsyncIID<any, any>> extends never ? RetryNotSupportedForSyncIID : number;
}): ServiceFactory<IIDs, Deps>;
/**
 * Helper for declaring a lazy-loading bundle of services. Similar to `factory()` but:
 * - `provide` is an array of `AsyncIID`s (bundles cannot provide `SyncIID`s)
 * - `load` is async and returns an `Container` with sub-factories and sub-bundles
 * - The bundle is loaded on-demand when one of its provided IIDs is fetched
 * - Only services listed in `provide` are exposed to the parent — services in
 *   the sub-container that are not in `provide` are silently ignored
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
    provide: InterfaceId<any, any>[];
    dependencies?: ServiceDeps;
} | {
    readonly [__asimoServiceBundle]: true;
    provide: AsyncIID<any, any>[];
    dependencies?: ServiceDeps;
};
type ServiceIID<S> = S extends {
    readonly [__asimoServiceFactory]: true;
    provide: infer IIDs extends InterfaceId<any, any>[];
} ? IIDs[number] : S extends {
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
