# asimo - Inversion of Control for the browser

Asimo is a micro libray that helps managing **JS objects & modules dependencies** (e.g. to share/retrieve objects or modules in a JS/TS code base) through an _Inversion of Control_ ([IoC]) mechanism, that supports both synchronous and asynchronous retrieval possibilities. Asimo slightly differs from traditional IoC solutions that are frequently based on **Dependency Injection** ([DI]) as its principle is to retrieve most dependencies **on-demand** and **asynchronously** (which also allows to load the dependency module on-demand, thus the name ASYnchronous MOdule loader). In some respects asimo follows the same principle as the [lazy.nvim] package manager.

[lazy.nvim]: https://www.lazyvim.org/configuration/lazy.nvim
[IoC]: https://en.wikipedia.org/wiki/Inversion_of_control
[DI]: https://en.wikipedia.org/wiki/Dependency_injection

Asimo was built from the following realizations:

-   **Advanced testing requires a _generic_ mechanism to replace code dependencies in test environments** (e.g. to fake global services like _localStorage_ or _fetch_).
-   Strict **[Dependency Injection][DI] is not well suited to client-side applications** where large code bases cannot be loaded on application startup. With Dependency injection, all dependencies of a given entity needs to be loaded when the entity is created - which eventually results in large code packages (unless significant effort is made to prevent that issue). On the contrary, **asimo approach is to load dependencies on-demand**, which allows to easily reference frequently or rarely used functionalities in the same manner, without impacting the initial download. Besides, asimo allows to group JS modules into bundles independently from the code structure (in other words the code doesn't need special attention to support efficient progressive load)

## Why using IoC and asimo?

Asimo helps solving the following problems:

-   **client integration testing**: asimo can easily replace dependencies with mock dependencies (e.g. in the test enviroment, unit tests can call a fake _[fetch()][fetch]_ that will return stable data).
-   **development**: asimo simplifies the development of _mock environment_ solutions that
    simulate and synchronize multiple external dependencies (e.g. _fetch()_, _localStorage_, _SSE events_, etc.). The mock environment can define multiple profiles that will correspond to different datasets / behaviours. On top of that, the mock environment code can be loaded dynamically as an asimo bundle (i.e. through a dynamic import) and won't be packaged with the rest of the application. Last but not least this mock environment (mockenv) can be used for integration tests, development, demos and also for full client integration tests with tools like [Playwright] - more in the [asidemo] example
-   **application code splitting**: asimo allows to package the application into several bundles that will be downloaded on-demand, when one of its modules is required. This allows to improve the application startup by optimizing the initial application load. Besides, the application code does not need to be aware of the bundle configuration that can be changed without any code refactoring.
-   **application context**: asimo can be used to implement a React-like context outside any DOM-related environment (unlike React contexts). This allows to provide losely-coupled (but still typed) dependencies through a unique context object and comes in handy to reduce the number of variables to pass to the different parts of the code base.
-   easier code **refactoring** (like for any IoC solutions)

Live Demos: 🚀 [sample app architecture (asidemo)][asidemo] or [google search results][results]

Presentation [slides]

Other important features:

-   **design by interface**: depend on abstraction, not implementation - cf. [SOLID] design principles
-   full and transparent **typescript support**
-   **small library** (3kb gzipped)

[SOLID]: https://en.wikipedia.org/wiki/SOLID
[Playwright]: https://playwright.dev/
[results]: https://asimojs.github.io/dpademo/homer_simpson.html
[asidemo]: https://asimojs.github.io/asidemo/
[slides]: https://docs.google.com/presentation/d/1NfAnUP9j1HitSrCWxmEuJs3ATZnbHdN8N_q1GLW29hU
[fetch]: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API

## How does it work?

Like most dependency management systems, Asimo base principle is to create **dependency container** objects that will be called by the application to retrieve dependencies. A typical dependency retrieval will look like this:

```typescript
// retrieve the calculator service (asynchronous)
const calc = await asm.fetch(CalculatorIID);
//   CalculatorIID is the Calculator Interface ID with async retrieval
//   asm is an Asimo dependency container
//   calc is a Calculator service instance

// use it!
const result = calc.add(1, 2);
//   -> the service doesn't need to be async
```

The **Dependency containers** are objects on which **dependency factories** or **objects** can be registered - e.g.

```typescript
// Service registration
asm.registerService(CalculatorIID, () => new CalculatorService());
//   of course CalculatorService must implement the interface associated
//   to CalculatorIID --> typescript will help you there in case of error
```

Asimo supports 3 kinds of factories

-   **service factories** (cf. **_registerService()_**) that produce unique objects that will be shared by application modules - i.e. the service instance will be created on the first _fetch()_ call, and then asimo will always return this instance instead of creating a new one.
-   **object factories** (cf. **_registerFactory()_**) that produce new object instances everytime they are called.
-   **bundle factories** (cf. **_registerBundle()_**) that are used to declare bundles (i.e. multiple JS modules that will be packaged together and that will be loaded dynamically through dynamic imports).

On top of that, asimo also supports registering any kind of **objects** that can be retrieved **synchronously** throught the **_get()_** method.

```typescript
// Object registration
const calc = new CalculatorService();
asm.set(CalculatorSIID, calc);

const calc2 = asm.get(CalculatorSIID);
// calc2 is of type  Calculator (cf. below) and is equal to calc:
expect(calc2).toBe(calc);
```

Last but not least, and like with any dependency management systems, asimo allows to **chain dependency containers** by creating _sub-containers_ - e.g.

```typescript
// context2 is a name that will help differentiate context2 from asm in error messages
const context2 = createContainer({ name: "context2", parent: asm });
const context3 = createContainer({ name: "context3", parent: context2 });
```

Note: by default asimo creates a **root container** that is exposed as **asm** by the asimo module (i.e. _@asimojs/asimo_)

In this example, if an application module tries to retrieve a dependency on _context3_ asimo will first look at the dependencies directly registred on _context3_, then those registered at _context2_ and then finish with _asm_ if it hasn't found it before. Asimo offers 2 methods to manage cases where dependencies are not found (i.e. not registered):

-   either it **throws an exception** (if not default values are provided or if _get_ or _fetch_ are used to retrieve multiple dependencies in one call)
-   or it **returns a default value** and the caller will have to manage the case where the returned object is not available (typescript will show that the type can be null).

```typescript
const calc1 = asm.get(CalculatorSIID); // throws an error if not found
const calc2 = asm.get(CalculatorSIID, null); // returns null if not found
```

The last _special_ part that needs to be mentioned concerns **interface definition**. As typescript interfaces cannot be read at runtime, asimo exposes two special **asyncIID()** and **syncIID()** methods that allow to bind a typescript interface with a string (that should be unique - this is why we suggest to use namespaces) and tell if the dependency can be retrieved ssynchronously or synchronously (i.e. through _get()_ or through _fetch()_):

```typescript
// typescript interface
export interface Calculator {
    numberOfCalls: number;
    add(a: number, b: number): number;
}

// asynchronous interface id token associated to the Calculator interface
export const CalculatorIID = asyncIID<Calculator>("asimo.tests.Calculator");
// synchronous interface id token associated to the Calculator interface
export const CalculatorSIID = syncIID<Calculator>("asimo.tests.Calculator");
```

## Examples

In all use cases asimo involves at least 2 modules:

-   a **consumer** module that retrieves dependencies dynamically (the consumer can then keep a reference to its dependencies to avoid further calls if need be):

```typescript
// Consumer
import { asm } from "@asimojs/asimo";
import { CalculatorIID } from "./types";

async function doSomething() {
    const calc = await asm.fetch(CalculatorIID);
    // Typescript sees that calc is of type Calculator
    const result = calc.add(1, 2); // 3
}
```

-   a **producer** module that contains object or service factories that will be exposed to consumers. Producers are usually split in 2 files:

-- a _type_ file:

```typescript
// calculator.types.ts
import { asyncIID } from "@asimojs/asimo";

// typescript interface
export interface Calculator {
    numberOfCalls: number;
    add(a: number, b: number): number;
}

// interface id token that associates a string namespace
// (the runtime token) to the typescript interface
export const CalculatorIID = asyncIID<Calculator>("asimo.src.tests.Calculator");
```

-- and an _implementation_ file:

```typescript
// calculator.ts
import { asm } from "@asimojs/asimo";
import { Calculator, CalculatorIID } from "./types";

// Calculator implementation
export class CalculatorService implements Calculator {
    numberOfCalls = 0;

    add(a: number, b: number) {
        this.numberOfCalls++;
        return a + b;
    }
}

// Service registration
asm.registerService(CalculatorIID, () => new CalculatorService());
```

## Install

```bash
npm i @asimojs/asimo
# or
yarn add @asimojs/asimo
```

## APIs

Asimo core module exports 4 entities:

-   `asm` - the root `IoCContainer` that exposes most asimo APIs
-   `createContainer()` - that allows to create asimo containers (aka. contexts)
-   `asyncIID()` - to create interface id token for dependencies that can be retrieved asynchronously
-   `syncIID()` - to create interface id token for dependencies that can be retrieved synchronously

```typescript
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
```

Examples:

```typescript
export interface Multiplier {
    multiply(a: number, b?: number): number;
}
export const MultiplierIID = asyncIID<Multiplier>("asimo.src.tests.Multiplier");

interface Adder {
    (a: number, b: number): number;
}
export const AdderIID = asyncIID<Adder>("asimo.src.tests.Adder");
```

Note:

-   **asyncIID** must be used to support on-demand code load - this is why it should be the default choice
-   **syncIID** is meant to be used for object instances that must be shared and retrieved synchronously (e.g. to share global values / configuration data, etc.)
-   sync and async tokens can be created with the same interface and namespace as the
    synchronous and asynchrouns dependencies are managed independently

## `IoCContainer`

The IoCContainer is the object that contains the registered factories and objects and that exposes all asimo APIs (but `asyncIID()` / `syncIID()`):

### `fetch()`

Retrieve a service or an object instance asynchronously. For each AsyncIID id passed as argument, asimo will first look in the current container for services or object factories or groups (in this order) - if not found
it will then perform the same lookup in its parent container, recursively up to the root container.
This method allows to retrieve an indefinite list of dependencies in one call with type support.

Note: **if the dependency is not defined fetch will throw an exceptioin unless a default value is passed as 2nd argument**.

```typescript
// Get one dependency - throws if not found
const calc = await asm.fetch(CalculatorIID);
calc.add(1, 2); // calc type is Calculator

// Get one dependency - return the default value if not found
const calc2 = await asm.fetch(CalculatorIID, null);
calc2?.add(1, 2); // calc2 type is Calculator | null

// Retrieve multiple dependencies - also works with namespace strings:
const [m, c, a] = await asm.fetch(MultiplierIID, CalculatorIID, AdderIID);
//   m is of type Multiplier
//   c is of type Calculator
//   a is of type Adder
```

### `get()`

Get an object from an asimo container (or its parents). On the contrary to _fetch()_, _get()_ is **synchronous** and only returns objects that have been registered through _set()_ with a SyncIID token. This function will throw an error if no default value is passed as 2nd argument.

```typescript
// register an the object
asm.set(CalculatorSIID, new CalculatorService());

// Get one dependency - throws if not found
const calc = asm.get(CalculatorSIID);
calc.add(1, 2); // calc type is Calculator

// Get one dependency - return the default value if not found
const calc2 = asm.get(CalculatorSIID, null);
calc2?.add(1, 2); // calc2 type is Calculator | null

// Retrieve multiple dependencies - also works with namespace strings:
const [m, c, a] = asm.get(MultiplierSIID, CalculatorSIID, AdderSIID);
//   m is of type Multiplier
//   c is of type Calculator
//   a is of type Adder
```

### `set()`

Register any kind of object in the given container - these objects will be accessible synchronously through the _get()_ method

```typescript
interface SimpleObject {
    name: string;
    increment(value: number): number;
}
const SimpleObjectSIID = syncIID<SimpleObject>("asimo.test.objects.simple-object");

const o: SimpleObject = {
    name: "foo",
    increment(v) {
        return v + 1;
    },
};
container.set(SimpleObjectSIID, o);

// retrieval is synchronous for objects (no await)
const o2 = container.get(SimpleObjectSIID); // o2 type is SimpleObject
expect(o2).toBe(o);
```

### `registerService()`

Register a Service (i.e. a singleton object or function). The service doesn't need to be instantiated or loaded at registration time as we simply need to provide a factory function as parameter (synchronous or asynchronous). Note: **service factories are only called once** whereas object factories are called at each _fetch()_ in order to generate new object instances.

```typescript
registerService<T>(iid: AsyncIID<T>, factory: () => T | Promise<T>): void;
```

Examples:

```typescript
// Register an service - factory will only be called once
asm.registerService(CalculatorIID, () => new CalculatorService());
// Registration with async factory
asm.registerService(MultiplierIID, async () => new MultiplierService());
// Factory receive the calling container as argument
asm.registerService(SomeServiceIID, (c: IoCContainer) => new SomeService(c));

// Register a global function (dependencies don't need to be objects)
asm.registerService(AdderIID, () => add); // add is a function
```

### `registerFactory()`

Register an object factory. The factory will be called any time the _fetch()_ method is called
for the object's interface id. On the contrary to services, there is no restriction on the number
of objects that can be creatd. Besides asimo doesn't keep any reference to the object (no risks of memory leak)

```typescript
registerFactory<T>(iid: AsyncIID<T>, factory: () => T | Promise<T>): void;
```

Example:

```typescript
// Register an object factory
asm.registerFactory(MultiplierIID, () => new MultiplierImpl());
```

### `registerBundle()`

Register an interface bundle that will be used to asynchronously load multiple
service and object factories gathered in a same **deployment bundle**. The bundle code will be loaded on-demand, when
an explicit `fetch()` is done on one of its service or object interfaces.

Parameters:

-   **iids**: the list of interface ids that are packaged in this group
-   **loader**: an async factory that should dynamically import() the required modules

```typescript
registerBundle(iids:InterfaceId<any>[], loader: () => Promise<unknown>): void;
```

Example:

```typescript
// Register several interface implementations that will be loaded on-demand
// through a dynamic module import
asm.registerBundle([Service1IID, Object2IID], () => import("./groups/mybundlefile"));
```

where `mybundlefile` will contain code like:

```typescript
// mybundlefile.ts
import "./service1";
import "./object2";
```

and each imported file will load the dependency code and register the dependencies through `registerService()` or `registerFactory()`

```typescript
// service1.ts
import { asm } from "@asimojs/asimo";
import { Service1IID } from "./service1.types";

asm.registerService(Service1IID, () => ({
    doSomething() {
        return 42;
    },
}));
```

### `parent`

Return the parent container associated to the current container - or null if the container is a root container (no parents).

### `name`

Return the container name - helps differentiating multiple containers. A unique container name is created if no name is provided (cf. `createContainer()`). Note: the default root contex name is **asm**.

### `path`

Return a unique path identifier listing all container names from the top parent container - e.g. `"/asm/subContext1/subContext2"`. Useful to debug issues involving multiple containers.

### `definitions`

Return the list of interfaces defined in a given containe. Interfaces are described through `AsmInterfaceDefinition` objects:

```typescript
export interface AsmInterfaceDefinition {
    /** The interface id */
    iid: string;
    /** The type of of object the interface is going to produce */
    type: "service" | "object" | "group";
    /** Tell if the service associated to the interface has been loaded
     * (not defined for object or groups) */
    loaded?: boolean;
}
```

Example:

```typescript
const defs = asm.definitions;
// defs = [
//     { iid: "asimo.test.groups.Service1", type: "service", loaded: true },
//     { iid: "asimo.test.AsyncIncrementor", type: "service", loaded: false },
//     { iid: "asimo.test.Multiplier", type: "object" },
//     { iid: "asimo.test.groups.Service1", type: "group" },
// ]
```

### `logState`

Log a given container state (i.e. list of registered dependencies) into and array or to the `logger` (console by default) if not _output_ argument is provided.

```typescript
logState(output?: string[]): void;
```

Example:

```typescript
container.logState();
```

```bash
# console output:
Container /asm/test/mycontext:
+ asimo.src.tests.Calculator [service]: not loaded
+ asimo.src.tests.Multiplier [service]: loaded
Container /asm/test:
+ asimo.src.tests.Calculator [service]: loaded
Container /asm:
+ asimo.src.tests.Calculator [service]: not loaded
+ asimo.src.tests.Adder [service]: not loaded
+ asimo.src.tests.Multiplier [object]
```

### `logger`

Tell asimo where to log errors - default value is `console` but can also be `null` to avoid logging anything.

Note: this setting is global, even if set on a child container.
Example:

```typescript
asm.logger = null; // deactivate error logs
// [some code here ...]
asm.logger = console; // reactivate error logs
```
