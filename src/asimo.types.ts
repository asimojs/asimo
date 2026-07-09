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
 * Factory interface for creating services - will be called when a service is requested for the first time.
 */
export interface ServiceFactory<IID extends InterfaceId<any, any>> {
    interface: IID,
    load(): IID extends SyncIID<infer T, any> ? T : IID extends AsyncIID<infer T, any> ? Promise<T> : never;
}

/**
 * Asimo IoC Container that stores retrievable dependencies.
 *
 * The root container (aka. context) is exposed through the asm global object. Sub-contexts can be created through createContainer()
 */
export interface IoCContainer<IIDs extends InterfaceId<any, any> = InterfaceId<any, any>> {
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
