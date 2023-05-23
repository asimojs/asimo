/**
 * Asimo context object used to asynchronously get or create dependencies
 * Root context is exposed through the asm global object. Sub-contexts can be created with the asm.createChildContext()
 * method
 */
export interface AsmContext {
    /**
     * Register a service factory. Services are singleton objects that will be created only once
     * and stored in the AsmContext. Services will be created on-demand, when retrieved for the first time
     * @param iid the interface id
     * @param factory a factory that will be called to instanciate the service
     */
    registerService<T>(iid: InterfaceId<T>, factory: () => T | Promise<T>): void;
    /**
     * Register an object factory. The factory will be called any time the get method is called
     * for this interface id. On the contrary to services, there is no restriction on the number
     * of objects that can be creatd. Besides asimo doesn't keep any reference to the object
     * created.
     * @param iid the interface id
     * @param factory a factory that will be called to create an object instance
     */
    registerFactory<T>(iid: InterfaceId<T>, factory: () => T | Promise<T>): void;
    /**
     * Register a group loader that will be used to asynchronously load multiple
     * service and object factories on-demand (i.e. the group code will only be loaded when
     * an explicit get is done on one of its service or object interfaces)
     * @param iids the list of interface ids that are packaged in this group
     * @param loader an async factory that should dynamically import() the required modules
     */
    registerGroup(iids: InterfaceId<any>[], loader: () => Promise<unknown>): void;
    /**
     * Retrieve a service or an object instance. For each interface id, asimo will first look in the current
     * context for services or object factories or groups registered for the interface (in this order) - if not found
     * it will then perform the same lookup in its parent context (recursively, up to the root context).
     * This method allows to retrieve up to 5 dependencies in one call with type support (more can be retrieved
     * without type inference).
     * Note: the parameters can be either InterfaceId objects or interface namespaces (strings).
     * When using InterfaceId typescript will automatically infer the right type - otherwise an explicit
     * type cast will be necessary
     * @param iid the service interface id
     */
    get<T>(iid: IidNs<T>): Promise<T>;
    get<T1, T2>(iid1: IidNs<T1>, iid2: IidNs<T2>): Promise<[T1, T2]>;
    get<T1, T2, T3>(iid1: IidNs<T1>, iid2: IidNs<T2>, iid3: IidNs<T3>): Promise<[T1, T2, T3]>;
    get<T1, T2, T3, T4>(iid1: IidNs<T1>, iid2: IidNs<T2>, iid3: IidNs<T3>, iid4: IidNs<T4>): Promise<[T1, T2, T3, T4]>;
    get<T1, T2, T3, T4, T5>(iid1: IidNs<T1>, iid2: IidNs<T2>, iid3: IidNs<T3>, iid4: IidNs<T4>, iid5: IidNs<T5>): Promise<[T1, T2, T3, T4, T5]>;
    get(...iids: (InterfaceId<any> | string)[]): Promise<any[]>;
    /**
     * Create a child context that can override some of the dependencies defined in its parent (cf. get behaviour)
     */
    createChildContext(): AsmContext;
}

/**
 * String representing an interface namespace - e.g. "myapplication.services.Settings"
 */
export type InterfaceNamespace = string;

/**
 * Object biding an interface type T with an interface namespace (allows to get typescript validation)
 */
export interface InterfaceId<T> {
    ns: InterfaceNamespace;
}

/**
 * IID or Namespace: parameter type used to retrieve an object from asimo
 */
export type IidNs<T> = InterfaceId<T> | string;
