/**
 * String representing an interface namespace - e.g. "myapplication.services.Settings"
 * Must be unique within the scope of an application
 */
export type InterfaceNamespace = string;

/**
 * Interface ID Token for synchronous retrieval.
 * (Binds a type T with a namespace)
 */
export interface SyncIID<T> {
    /** The interface unique name - e.g. "myapplication.services.Configuration" */
    ns: InterfaceNamespace;
    /** Tell that the value associated to this interface can be retrieved synchronously */
    sync: true;
    /** Phantom field to make T structural (never set at runtime) */
    readonly _type?: T;
}

/**
 * Interface ID Token for asynchronous retrieval.
 * (Binds a type T with a namespace)
 */
export interface AsyncIID<T> {
    /** The interface unique name - e.g. "myapplication.services.Settings" */
    ns: InterfaceNamespace;
    /** Tell that the value associated to this interface can be retrieved asynchronously */
    sync: false;
    /** Phantom field to make T structural (never set at runtime) */
    readonly _type?: T;
}

/**
 * Interface ID token: binds an interface type T with an interface namespace (allows to get type continuation)
 */
export type InterfaceId<T> = SyncIID<T> | AsyncIID<T>;

/**
 * Factory interface for creating services - will be called when a service is requested for the first time.
 */
export interface ServiceFactory<IID extends InterfaceId<any>> {
    interface: IID,
    load(): IID extends SyncIID<infer T> ? T : IID extends AsyncIID<infer T> ? Promise<T> : never;
}

/**
 * Asimo IoC Container that stores retrievable dependencies.
 *
 * The root container (aka. context) is exposed through the asm global object. Sub-contexts can be created through createContainer()
 */
export interface IoCContainer<IIDs extends InterfaceId<any> = InterfaceId<any>> {
    /**
     * The container name - helps differentiating multiple contexts - must not contain any slash character ("/"))
     */
    readonly name: string;
    /**
     * The parent container where dependencies will be retrieved if not found in the current container
     */
    // readonly parents: IoCContainer<any>[] | null;
    /**
     * A unique path identifier listing all container names from the top parent container
     * e.g. "/asm/subContext1/subContext2"
     */
    // readonly path: string;
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
    get<T>(iid: SyncIID<T>): SyncIID<T> extends IIDs ? T : never;
    get<Args extends SyncIID<any>[]>(
        ...iids: Args
    ): { [K in keyof Args]: Args[K] extends IIDs ? (Args[K] extends SyncIID<infer T> ? T : never) : never };
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
    fetch<T>(iid: InterfaceId<T>): Promise<T>;
    fetch<Args extends InterfaceId<any>[]>(
        ...iids: Args
    ): Promise<{ [K in keyof Args]: Args[K] extends IIDs ? (Args[K] extends InterfaceId<infer T> ? T : never) : never }>;
    /**
     * Define where logs should go - default = console
     */
    // logger: Logger | null;
}

/**
 * Object that will receive the logs (default: console)
 */
export interface Logger {
    log(message: string,...data: any[]): void;
}
