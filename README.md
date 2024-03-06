# asimo

Asimo is a micro libray that allows to improve **JS module dependencies** management. Asimo approach is different from traditional **Dependency Injection (DI)** solutions as its principle is to retrieve dependencies **on-demand** and **asynchronously** (thus the name ASYnchronous MOdule loader).

Asimo was built from the following realizations:

-   **Advanced testing requires a _generic_ mechanism to replace code dependencies in test environments** (e.g. to use a fake _localStorage_ service to simulate different start state in an application).
-   **Dependency Injection is not adapted to client-side code**. Indeed, client applications cannot afford loading a large code base on application start. With Dependency injections, all dependencies are loaded when a given entity is created which eventually results in large code packages. On the contrary, **asimo approach is to load dependencies when needed**, which allows to reference rarely used functionalities anywhere in the application code without any impact on the initial download.

## Why should you use asimo?

Asimo helps solving 3 categories of problems:

-   **unit testing**: asimo can replace dependencies with mock dependencies (e.g. in the test enviroment, unit tests can call a fake _fetch()_ that will return stable data).
-   **development**: asimo allows to develop _mock environment_ solutions that
    can simulate and synchronize multiple external dependencies (e.g. _fetch()_, _localStorage_, _SSE events_, etc.). The mock environment can define multiple profiles that will correspond to different datasets / behaviours. Beside the mock environment code can be loaded dynamically as an asimo bundle (i.e. through a dynamic import) and won't be packaged with the rest of the application. Last but not least this mock environment (mockenv) can be used for unit tests, development, demos and also for full client integration tests with tools like [Playwright] - more in the [asidemo] example
-   **application code splitting**: asimo allows to package the application into several bundles that will be downloaded on-demand, when one of its modules is required. This allows to improve the application startup time by optimizing the initial application load. Besides the application code is not aware of the bundle configuration that can be changed without any code refactoring.

Live Demos: 🚀 [sample app architecture (asidemo)][asidemo] or [google search results][results]

Presentation [slides]

Other key features:

-   **design by interface**: depend on abstraction, not implementation - cf. [SOLID] design principles
-   full and transparent **typescript support**
-   **small library**: less than 200 lines of code.

[SOLID]: https://en.wikipedia.org/wiki/SOLID
[Playwright]: https://playwright.dev/
[results]: https://asimojs.github.io/dpademo/homer_simpson.html
[asidemo]: https://asimojs.github.io/asidemo/
[slides]: https://docs.google.com/presentation/d/1NfAnUP9j1HitSrCWxmEuJs3ATZnbHdN8N_q1GLW29hU

## How does it work?

Asimo core principle is to create **Dependency context** objects that will be called by the application to retrieve dependencies. A typical dependency retrieval will look like this:

```typescript
// retrieve the calculator service (asynchronous)
const calc = await asm.get(CalculatorIID);
//     CalculatorIID is the Calculator Interface Identifier
//     asm is an Asimo dependency context
//     calc is a Calculator service instance

// use it!
const result = calc.add(1, 2);
//     -> the service doesn't need to be async
```

The **Dependency contexts** are objects on which **dependency factories** can be registered - e.g.

```typescript
// Service registration
asm.registerService(CalculatorIID, () => new CalculatorService());
//     of course CalculatorService must implement the interface associated
//     to CalculatorIID --> typescript will help you there in case of error
```

Asimo supports 3 kinds of factories

-   **service factories** (cf. **_registerService()_**) that produce unique objects that will be shared by application modules - i.e. the service instance will be created on the first _get()_ call, and then asimo will always return this instance instead of creating a new one.
-   **object factories** (cf. **_registerFactory()_**) that produce new object instances everytime they are called.
-   **group factories** (cf. **_registerGroup()_**) that are used to declare bundles (i.e. multiple JS modules that will be packaged together).

On top of that, and like with any dependency management systems, asimo allows to **chain dependency contexts** by creating _sub-contexts_ - e.g.

```typescript
const asm2 = asm.createChildContext("context2");
// context2 is a name that will help differentiate asm2 from asm

// another method - equivalent to asm2.createChildContext("context3");
const asm3 = createContext({ name: "context3", parent: asm2 });
```

Note: by default asimo creates a **root context** that is exposed as **asm** by the asimo module (i.e. _@asimojs/asimo_)

In this example, if an application module tries to retrieve a dependency on _asm3_ asimo will first look in _asm3_, then in _asm2_ and then in _asm_ if it hasn't found it before. Asimo offers 2 methods to manage cases where dependency factories are not found (i.e. not registered):

-   either it **throws an exception** as the error results from a configuration issue that can only occurs at
    development time because the factory registration is missing. The benefit is that the dependency user doesn't need to check the object returned by asimo. This behavior is implemented by the _get()_ method.
-   or it **returns null** and the dependency user will have to manage the case where the returned object is not available (typescript will show that the type can be null). This behavior is implemented by the _retrieve()_ method.

The last _special_ part that needs to be mentioned concerns the **interface definitions**. As typescript interfaces cannot be read at runtime, asimo exposes a special **interfaceId()** method that allows to bind a typescript interface with a string (that should be unique - this is why we suggest to use namespaces):

```typescript
// typescript interface
export interface Calculator {
    numberOfCalls: number;
    add(a: number, b: number): number;
}

// interface id token associated to the typescript interface
export const CalculatorIID = interfaceId<Calculator>("asimo.src.tests.Calculator");
// asimo.src.tests.Calculator -> unique namespace (by construction)
```

## Examples

In all use cases asimo involves at least 2 modules:

-   a **producer** module that contains services or object factories that will be exposed to consumers
-   a **consumer** module that retrieves the producers dynamically, on-demand (the consumer can then keep a reference to its dependencies to avoid further async calls if need be).

```typescript
// Type definition (should be in a separate file to avoid bundling the producer with the consumer)
import { interfaceId } from "@asimojs/asimo";

// typescript interface
export interface Calculator {
    numberOfCalls: number;
    add(a: number, b: number): number;
}

// interface id token associated to the typescript interface
export const CalculatorIID = interfaceId<Calculator>("asimo.src.tests.Calculator");
```

```typescript
// Producer (implementation file)
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

```typescript
// Consumer
import { asm } from "@asimojs/asimo";
import { CalculatorIID } from "./types";

async function doSomething() {
    const calc = await asm.get(CalculatorIID);
    // Typescript types found -> calc is of type Calculator
    const result = calc.add(1, 2); // 3
}
```

## Install

```bash
npm i @asimojs/asimo
# or
yarn add @asimojs/asimo
```

## APIs

Asimo core module exports 3 entities:

-   `asm` - the root `AsmContext` that exposes most asimo APIs
-   `createContext()` - that allows to create asimo contexts
-   `interfaceId()` - that allows to create interface id objects that associate interface namepsaces with typescript types:

```typescript
function interfaceId<T>(ns: InterfaceNamespace): InterfaceId<T> {...}

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
```

Examples:

```typescript
export interface Multiplier {
    multiply(a: number, b?: number): number;
}
export const MultiplierIID = interfaceId<Multiplier>("asimo.src.tests.Multiplier");

interface Adder {
    (a: number, b: number): number;
}
export const AdderIID = interfaceId<Adder>("asimo.src.tests.Adder");
```

## `AsmContext`

The AsmContext is the object that contains the registred factoris and that exposes all asimo APIs (but `interfaceId()`):

### `get()`

Retrieve a service or an object instance. For each interface id, asimo will first look in the current
context for services or object factories or groups (in this order) - if not found
it will then perform the same lookup in its parent context, recursively up to the root context).
This method allows to retrieve up to 5 dependencies in one call with type support (more can be retrieved
without type inference - cf. call signature).

Note: **get() will throw exceptions if the factory is not defined** for the expected interface. This is usually the preferred behavior as a missing factory generally results from an application configuration issue that is fixed at development time. Thanks to this behavior the dependency user doesn't need to check the type returned by asimo.

Note 2: the parameters can be either `InterfaceId` objects or interface namespaces (strings).
When using `InterfaceId` typescript will automatically infer the right type - otherwise an explicit
type cast will be necessary, as shown below

Examples:

```typescript
// Retrieve one dependency
const calc = await asm.get(CalculatorIID);
calc.add(1, 2); // calc2 type is Calculator

// Retrieve one dependency by namesapce
const calc2 = await asm.get("asimo.src.tests.Calculator");
(calc2 as Calculator).add(1, 2); // calc2 type is unknown

// Retrieve multiple dependencies - also works with namespace strings:
const [m, c, a] = await asm.get(MultiplierIID, CalculatorIID, AdderIID);
```

### `retrieve()`

This method is similar to _get()_ with the difference that it will return _null_ if the dependency is not found (instead of throwing an exception).

```typescript
// Retrieve one dependency
const calc = await asm.retrieve(CalculatorIID);
calc?.add(1, 2); // calc2 type is Calculator | null

// Retrieve one dependency by namesapce
const calc2 = await asm.get("asimo.src.tests.Calculator");
(calc2 as Calculator)!.add(1, 2); // calc2 type is unknown

// Retrieve multiple dependencies - also works with namespace strings:
const [m, c, a] = await asm.get(MultiplierIID, CalculatorIID, AdderIID);
//     m is of type Multiplier
//     c is of type Calculator
//     a is of type Adder
```

### `registerService()`

Register a Service (i.e. a singleton object or function). The service doesn't need to be instantiated at registration time as we need to provide a factory function (synchronous or asynchronous). Note: **service factories are only called once**

```typescript
registerService<T>(iid: InterfaceId<T>, factory: () => T | Promise<T>): void;
```

Examples:

```typescript
// Register an object - factory will only be called once
asm.registerService(CalculatorIID, () => new CalculatorService());
// Registration with async factory
asm.registerService(MultiplierIID, async () => new MultiplierService());
// Register a function - cf. above
asm.registerService(AdderIID, () => add);
//     m is of type Multiplier | null
//     c is of type Calculator | null
//     a is of type Adder | null
```

### `registerFactory()`

Register an object factory. The factory will be called any time the get method is called
for the object's interface id. On the contrary to services, there is no restriction on the number
of objects that can be creatd. Besides asimo doesn't keep any reference to the object

```typescript
registerFactory<T>(iid: InterfaceId<T>, factory: () => T | Promise<T>): void;
```

Example:

```typescript
// Register an object factory
asm.registerFactory(MultiplierIID, () => new MultiplierImpl());
```

### `registerGroup()`

Register a group loader that will be used to asynchronously load multiple
services and object factories on-demand (i.e. the group code will only be loaded when
an explicit `get()` is done on one of its service or object interfaces). Parameters:

-   **iids**: the list of interface ids that are packaged in this group
-   **loader**: an async factory that should dynamically import() the required modules

```typescript
registerGroup(iids:InterfaceId<any>[], loader: () => Promise<unknown>): void;
```

Example:

```typescript
// Register several interface implementation that will be loaded on-demand through
// a dynamic module import (this assumes that the implementaion are defined in the module)
asm.registerGroup([Service1IID, Object2IID], () => import("./groups/groupA"));
```

### `createChildContext()`

Create a child context that can override some of the dependencies defined in its parent (cf. get behaviour)

```typescript
createChildContext(name?:string): AsmContext;
```

Example:

```typescript
import { asm as rootAsm } from "@asimojs/asimo";

function createContext() {
    const c = rootAsm.createChildContext();
    // override calculator service
    c.registerService(CalculatorIID, () => new CalculatorService());
    c.registerService(SyncIncrementorIID, () => new SyncIncrementorService());
    c.registerService(AsyncIncrementorIID, () => new AsyncIncrementorService());
    return c;
}
```

### `parent`

Return the parent context associated to the current context - or null if the context is a root context (no parents).

### `name`

Return the context name - helps differentiating multiple contexts. A unique context name is created if none is profided when creating the context through `createContext()` or `createChildContext()`. Note: the default root contex name is **asm**.

### `path`

Return a unique path identifier listing all context names from the top parent context - e.g. `"/asm/subContext1/subContext2"`. Useful to debug cases involving multiple contexts.

### `definitions`

Return the list of interfaces defined in a given context. Interfaces are described through `AsmInterfaceDefinition` objects:

```typescript
export interface AsmInterfaceDefinition {
    /** The interface id */
    iid: string;
    /** The type of of object the interface is going to produce */
    type: "service" | "object" | "group";
    /** Tell if the service associated to the interface has been loaded (not used for object or groups) */
    loaded?: boolean;
}
```

Example:

```typescript
const defs = asm.definitions;
// defs = [
//     { iid: "asimo.src.tests.groups.Service1", type: "service", loaded: true },
//     { iid: "asimo.src.tests.AsyncIncrementor", type: "service", loaded: false },
//     { iid: "asimo.src.tests.Multiplier", type: "object" },
//     { iid: "asimo.src.tests.groups.Service1", type: "group" },
// ]
```

### `consoleOutput`

Tell asimo how console logs should be handled - 2 possible values: `""` or `"Errors"`

-   `""`: no logs
-   `"Errors"`: log errors (e.g. invalid arguments or invalid resolution) [**default**]

Note: this setting is global, even if set on a child context.
Example:

```typescript
asm.consoleOutput = ""; // deactivate error logs
// [...]
asm.consoleOutput = "Errors"; // reactivate error logs
```
