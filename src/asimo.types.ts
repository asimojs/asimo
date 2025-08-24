/**
 * Asimo IoC Container that stores retrievable dependencies.
 *
 * The root container (aka. context) is exposed through the asm global object. Sub-contexts can be created through createContainer()
 */
export interface IoCContainer {
    /**
     * The container name - helps differentiating multiple contexts
     */
    readonly name: string;
    /**
     * The parent container where dependencies will be retrieved if not found in the current container
     */
    readonly parent: IoCContainer | null;
    /**
     * A unique path identifier listing all container names from the top parent container
     * e.g. "/asm/subContext1/subContext2"
     */
    readonly path: string;
    /**
     * The interface definitions that are currently loaded in the container
     */
    readonly definitions: AsmInterfaceDefinition[];
    /**
     * Register an object instance.
     * Object instances can be retrieved synchronously through the get() method
     * @param iid the (sync) interface id
     * @see get
     */
    set<T extends object>(iid: SyncIID<T>, o: T): void;
    /**
     * Register a service factory. Services are singleton objects that will be created only once
     * and stored in the IoC Container. Services will be created on-demand, when retrieved for the first time.
     *
     * Services can be retrieved asynchronoysly through the fetch() method.
     * @param iid the async interface id
     * @param factory a factory that will be called to instanciate the service
     * @see fetch
     */
    registerService<T>(iid: AsyncIID<T>, factory: (c: IoCContainer) => T | Promise<T>): void;
    /**
     * Register an object factory. The factory will be called any time the fetch method is called
     * for this interface id. On the contrary to services, there is no restriction on the number
     * of objects that can be created. Besides asimo doesn't keep any reference to the object
     * created.
     *
     * Objects produced by factories can be retrieved asynchronoysly through the fetch() method.
     * @param iid the async interface id
     * @param factory a factory that will be called to create an object instance
     * @see fetch
     */
    registerFactory<T>(iid: AsyncIID<T>, factory: (c: IoCContainer) => T | Promise<T>): void;
    /**
     * Register a group loader that will be used to asynchronously load the code of multiple
     * service and object factories on-demand (i.e. the group code will only be loaded when
     * an explicit get is done on one of its service or object interfaces).
     *
     * Services or objects produced by service or object factories can be retrieved through the fetch method.
     * @example asm.registerGroup([Service1IID, Object2IID], () => import("./groups/mybundlefile"));
     * @param iids the list of interface ids that are packaged in this group
     * @param loader an async factory that should dynamically import() the required modules
     * @see fetch
     */
    registerGroup(iids: InterfaceId<any>[], loader: () => Promise<unknown>): void;
    /**
     * Retrieve one or multiple values from the IoC container synchronously. Will recursively search
     * for the values in the parent containers if not found.
     *
     * Note: this method will throw an error if one of the values is not found. To prevent this behavior
     * you must retrieve the values one by one and pass a default value as 2nd argument.
     * @example
     * const service = container.get(SomeServiceIID); // throws if not found
     * const service = container.get(SomeServiceIID, null); // null is the default value
     * const [service, otherService] = container.get(SomeServiceIID, SomeOtherServiceIID); // throws if one is not found
     * @see fetch()
     */
    get<T>(iid: SyncIID<T>): T;
    get<T, D extends T | null>(iid: SyncIID<T>, defaultValue?: D): T | D;
    get<Args extends SyncIID<any>[]>(
        ...iids: Args
    ): { [K in keyof Args]: Args[K] extends SyncIID<infer T> ? T : never };
    /**
     * Retrieve one or multiple values from the IoC container asynchronously. Will recursively search
     * for the values in the parent containers if not found.
     *
     * Note: this method will throw an error if one of the values is not found. To prevent this behavior
     * you must retrieve the values one by one and pass a default value as 2nd argument.
     * @example
     * const service = await container.fetch(SomeServiceIID); // throws if not found
     * const service = await container.fetch(SomeServiceIID, null); // null is the default value
     * const [service, otherService] = await container.fetch(SomeServiceIID, SomeOtherServiceIID); // throws if one is not found
     * @see get()
     */
    fetch<T>(iid: AsyncIID<T>): Promise<T>;
    fetch<T, D extends T | null>(iid: AsyncIID<T>, defaultValue?: D): Promise<T | D>;
    fetch<Args extends AsyncIID<any>[]>(
        ...iids: Args
    ): Promise<{ [K in keyof Args]: Args[K] extends AsyncIID<infer T> ? T : never }>;
    /**
     * Define where logs should go - default = console
     */
    logger: Logger | null;
    /**
     * Log a given container state (i.e. list of registered dependencies) into and array or to the `logger`
     * (console by default) if not _output_ argument is provided.
     * @example
     * container.logState();
     *
     * // console output:
     * Container /asm/test/mycontext:
     * + asimo.src.tests.Calculator [service]: not loaded
     * + asimo.src.tests.Multiplier [service]: loaded
     * Container /asm/test:
     * + asimo.src.tests.Calculator [service]: loaded
     * Container /asm:
     * + asimo.src.tests.Calculator [service]: not loaded
     * + asimo.src.tests.Adder [service]: not loaded
     * + asimo.src.tests.Multiplier [object]
     * @param output where to output the state
     * @see logger
     */
    logState(output?: string[]): void;
}

export interface AsmInterfaceDefinition {
    /** The interface id */
    iid: string;
    /** The type of of object the interface is going to produce */
    type: "service" | "object" | "group";
    /** Tell if the service associated to the interface has been loaded (not used for object or groups) */
    loaded?: boolean;
}

/**
 * Object that will receive the logs (default: console)
 */
export interface Logger {
    log(...data: any[]): void;
}

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
    /** The interface unique name - e.g. "myapplication.services.Settings" */
    ns: InterfaceNamespace;
    /** Tell that the value associated to this interface can be retrieved synchronously */
    sync: true;
}

/**
 * Interface ID Token for asynchronous retrieval.
 * (Binds a type T with a namespace)
 */ export interface AsyncIID<T> {
    /** The interface unique name - e.g. "myapplication.services.Settings" */
    ns: InterfaceNamespace;
    /** Tell that the value associated to this interface can be retrieved asynchronously */
    sync: false;
}

/**
 * Interface ID token: binds an interface type T with an interface namespace (allows to get type continuation)
 */
export type InterfaceId<T> = SyncIID<T> | AsyncIID<T>;

/**
 * IoCContainer name before version 2.5
 * @deprecated
 */
export type AsmContext = IoCContainer;
