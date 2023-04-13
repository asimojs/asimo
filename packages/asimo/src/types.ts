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
    registerService<T>(iid: InterfaceId<T>, factory:()=>T | Promise<T>): void;
    /**
     * Retrieve a service object
     * @param iid the service interface id
     */
    get<T>(iid: InterfaceId<T>): Promise<T | null>;
    /**
     * Create a child context that can override some of the dependencies defined in its parent
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
