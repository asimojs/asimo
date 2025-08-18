/**
 * Asimo context object used to asynchronously get or create dependencies
 * The root context is exposed through the asm global object. Sub-contexts can be created through asm.createChildContext()
 */
export interface AsmContext {
    /**
     * The context name - helps differentiating multiple contexts
     */
    readonly name: string;
    /**
     * The parent context where dependencies will be retrieved if not found in the current context
     */
    readonly parent: AsmContext | null;
    /**
     * A unique path identifier listing all context names from the top parent context
     * e.g. "/asm/subContext1/subContext2"
     */
    readonly path: string;
    /**
     * The interface definitions that are currently loaded in the context
     */
    readonly definitions: AsmInterfaceDefinition[];
    /**
     * Register an object instance.
     * Object instances can be retrieved synchronously through the get() method
     * @see get
     */
    registerObject<T extends object>(iid: SyncIID<T>, o: T): void;
    /**
     * Register a service factory. Services are singleton objects that will be created only once
     * and stored in the AsmContext. Services will be created on-demand, when retrieved for the first time
     * Services can be retrieved asynchronoysly through the fetch() method
     * @param iid the interface id
     * @param factory a factory that will be called to instanciate the service
     * @see fetch
     */
    registerService<T>(iid: AsyncIID<T>, factory: (c: AsmContext) => T | Promise<T>): void;
    /**
     * Register an object factory. The factory will be called any time the get method is called
     * for this interface id. On the contrary to services, there is no restriction on the number
     * of objects that can be created. Besides asimo doesn't keep any reference to the object
     * created.
     * Objects produced by factories can be retrieved asynchronoysly through the fetch() method
     * @param iid the interface id
     * @param factory a factory that will be called to create an object instance
     * @see fetch
     */
    registerFactory<T>(iid: AsyncIID<T>, factory: (c: AsmContext) => T | Promise<T>): void;
    /**
     * Register a group loader that will be used to asynchronously load multiple
     * service and object factories on-demand (i.e. the group code will only be loaded when
     * an explicit get is done on one of its service or object interfaces)
     * Services or objects produced by service or object factories can be retrieved through the fetch method.
     * @param iids the list of interface ids that are packaged in this group
     * @param loader an async factory that should dynamically import() the required modules
     * @see fetch
     */
    registerGroup(iids: InterfaceId<any>[], loader: () => Promise<unknown>): void;

    /**
     * Retrieve one or multiple values from the IoC container.
     * This method returns synchronously or asynchronously depending on the IID arguments:
     * - if they are all SyncIIDs, the response will be synchronous
     * - if they are all AsyncIIDs, the response will be asynchronou (i.e. a Promise)
     * Note: SyncIID and AsyncIID arguments cannot be mixed.
     * Note2: this method will throw an error if one of the values is not found. To prevent this behavior
     * you must retrieve the values one by one and pass a default value as 2nd argument.
     * Ex: const value = context.get(SomeServiceIID, null);
     * @see fetch
     */
    get2<T>(iid: SyncIID<T>): T;
    get2<T, D extends T | null>(iid: SyncIID<T>, defaultValue?: D): T | D;
    get2<Args extends SyncIID<any>[]>(
        ...iids: Args
    ): { [K in keyof Args]: Args[K] extends SyncIID<infer T> ? T : never };

    get2<T>(iid: AsyncIID<T>): Promise<T>;
    get2<T, D extends T | null>(iid: AsyncIID<T>, defaultValue?: D): Promise<T | D>;
    get2<Args extends AsyncIID<any>[]>(
        ...iids: Args
    ): Promise<{ [K in keyof Args]: Args[K] extends AsyncIID<infer T> ? T : never }>;

    /**
     * Synchrounsly retrieve an object instance registered with registerObject
     * For each interface id, asimo will first look in the current context objects - if not found
     * it will then perform the same lookup in its parent context (recursively, up to the root context).
     * This method allows to get up to 5 dependencies in one call with type support (more can be retrieved without type inference).
     * Note: When retrieving 1 resource, the parameters can be either InterfaceId objects or interface namespaces (strings).
     * When using InterfaceId typescript will automatically infer the right type - otherwise an explicit
     * type cast will be necessary
     * Note: this method will throw an error if the targeted object is not found - unless a default value is passed as 2nd argument
     * (this only works when fetching a single resource - e.g. asm.get(AppModuleIID, null) )
     * @see fetch
     */
    get<T>(iid: InterfaceId<T>): T;
    get<T, D extends T | null>(iid: InterfaceId<T>, defaultValue?: D): T | D;
    get<T1, T2>(iid1: InterfaceId<T1>, iid2: InterfaceId<T2>): [T1, T2];
    get<T1, T2, T3>(
        iid1: InterfaceId<T1>,
        iid2: InterfaceId<T2>,
        iid3: InterfaceId<T3>,
    ): [T1, T2, T3];
    get<T1, T2, T3, T4>(
        iid1: InterfaceId<T1>,
        iid2: InterfaceId<T2>,
        iid3: InterfaceId<T3>,
        iid4: InterfaceId<T4>,
    ): [T1, T2, T3, T4];
    get<T1, T2, T3, T4, T5>(
        iid1: InterfaceId<T1>,
        iid2: InterfaceId<T2>,
        iid3: InterfaceId<T3>,
        iid4: InterfaceId<T4>,
        iid5: InterfaceId<T5>,
    ): [T1, T2, T3, T4, T5];
    get(...iids: (InterfaceId<any> | string)[]): Promise<any[]>;

    /**
     * Asynchronously fetch a service or an object produced by a registered factory. For each interface id, asimo will first look in the current
     * context for services or object factories or groups registered for the interface (in this order) - if not found
     * it will then perform the same lookup in its parent context (recursively, up to the root context).
     * This method allows to get up to 5 dependencies in one call with type support (more can be fetched
     * without type inference).
     * Note: When fetcing 1 resource, the parameters can be either InterfaceId objects or interface namespaces (strings).
     * When using InterfaceId typescript will automatically infer the right type - otherwise an explicit
     * type cast will be necessary
     * Note: this method will throw an error if the targeted service or object cannot be found/loaded - unless a default value is passed
     * (this only works when fetching a single resource - e.g. asm.fetch(CalculatorIID, null) )
     */
    fetch<T>(iid: InterfaceId<T>): Promise<T>;
    fetch<T, D extends T | null>(iid: InterfaceId<T>, defaultValue?: D): Promise<T | D>;
    fetch<T1, T2>(iid1: InterfaceId<T1>, InterfaceId: InterfaceId<T2>): Promise<[T1, T2]>;
    fetch<T1, T2, T3>(
        iid1: InterfaceId<T1>,
        iid2: InterfaceId<T2>,
        iid3: InterfaceId<T3>,
    ): Promise<[T1, T2, T3]>;
    fetch<T1, T2, T3, T4>(
        iid1: InterfaceId<T1>,
        iid2: InterfaceId<T2>,
        iid3: InterfaceId<T3>,
        iid4: InterfaceId<T4>,
    ): Promise<[T1, T2, T3, T4]>;
    fetch<T1, T2, T3, T4, T5>(
        iid1: InterfaceId<T1>,
        iid2: InterfaceId<T2>,
        iid3: InterfaceId<T3>,
        iid4: InterfaceId<T4>,
        iid5: InterfaceId<T5>,
    ): Promise<[T1, T2, T3, T4, T5]>;
    fetch(...iids: (InterfaceId<any> | string)[]): Promise<any[]>;
    /**
     * Create a child context that can override some of the dependencies defined in its parent (cf. get behaviour)
     * @param name a name to identifiy and differentiate this context from other contexts
     */
    createChildContext(name?: string): AsmContext;
    /**
     * Define where logs should go - default = console
     */
    logger: Logger | null;
    /**
     * Log the asimo state into an array or in the console if no output argument is provided
     * @param output
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
 * Object that will receive the logs
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
