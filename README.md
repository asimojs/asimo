# asimo - asynchronous Inversion of Control for the browser

Asimo is a micro libray that helps managing **JS objects & modules dependencies** (e.g. to share/retrieve objects or modules in a JS/TS code base) through an asynchronous _Inversion of Control_ ([IoC]) mechanism. Asimo slightly differs from traditional **Dependency Injection** ([DI]) libraries as its principle is to retrieve dependencies **on-demand** and **asynchronously** (which also allows to load the dependency module on-demand, thus the name ASYnchronous MOdule loader). In some respects asimo follows the same principle as the [lazy.nvim] package manager.

[lazy.nvim]: https://www.lazyvim.org/configuration/lazy.nvim
[IoC]: https://en.wikipedia.org/wiki/Inversion_of_control
[DI]: https://en.wikipedia.org/wiki/Dependency_injection

Asimo was built from the following realizations:

-   **Advanced testing requires a _generic_ mechanism to replace code dependencies in test environments** (e.g. to fake global services like _localStorage_ or _fetch_).
-   Strict **[Dependency Injection][DI] is not well suited to client-side applications** where large code bases cannot be loaded on application startup. With Dependency injections, all dependencies of a given entity needs to be loaded when the entity is created - which eventually results in large code packages (unless significant effort is made to prevent that issue). On the contrary, **asimo approach is to load dependencies on-demand**, which allows to easily reference frequently or rarely used functionalities in the same manner, without impacting the initial download. Besides, asimo allows to group JS modules into bundles independently from the code structure (in other words the code doesn't need special attention to support efficient progressive load)

## What problem does it solve?

Asimo helps solving 4 types of problems:

-   **client integration testing**: asimo can easily replace dependencies with mock dependencies (e.g. in the test enviroment, unit tests can call a fake _fetch()_ that will return stable data).
-   **development**: asimo simplifies the development of _mock environment_ solutions that
    simulate and synchronize multiple external dependencies (e.g. _fetch()_, _localStorage_, _SSE events_, etc.). The mock environment can define multiple profiles that will correspond to different datasets / behaviours. On top of that, the mock environment code can be loaded dynamically as an asimo bundle (i.e. through a dynamic import) and won't be packaged with the rest of the application. Last but not least this mock environment (mockenv) can be used for integration tests, development, demos and also for full client integration tests with tools like [Playwright] - more in the [asidemo] example
-   **application code splitting**: asimo allows to package the application into several bundles that will be downloaded on-demand, when one of its modules is required. This allows to improve the application startup by optimizing the initial application load. Besides, the application code does not need to be aware of the bundle configuration that can be changed without any code refactoring.
-   **application context**: asimo can be used to implement a React-like context outside any DOM-related environment (unlike React contexts). This allows to provide losely-coupled (but still typed) dependencies through a unique context object and comes in handy to reduce the number of variables to pass to the different parts of the code base.

Live Demos: 🚀 [sample app architecture (asidemo)][asidemo] or [google search results][results]

Presentation [slides]

Other important features:

-   **design by interface**: depend on abstraction, not implementation - cf. [SOLID] design principles
-   full and transparent **typescript support**
-   **small library**: less than 200 lines of code.

[SOLID]: https://en.wikipedia.org/wiki/SOLID
[Playwright]: https://playwright.dev/
[results]: https://asimojs.github.io/dpademo/homer_simpson.html
[asidemo]: https://asimojs.github.io/asidemo/
[slides]: https://docs.google.com/presentation/d/1NfAnUP9j1HitSrCWxmEuJs3ATZnbHdN8N_q1GLW29hU

## How does it work?

Like most dependency management systems, Asimo base principle is to create **dependency context** objects that will be called by the application to retrieve dependencies. A typical dependency retrieval will look like this:

```typescript
// retrieve the calculator service (asynchronous)
const calc = await asm.fetch(CalculatorIID);
//   CalculatorIID is the Calculator Interface ID
//   asm is an Asimo dependency context
//   calc is a Calculator service instance

// use it!
const result = calc.add(1, 2);
//   -> the service doesn't need to be async
```

The **Dependency contexts** are objects on which **dependency factories** can be registered - e.g.

```typescript
// Service registration
asm.registerService(CalculatorIID, () => new CalculatorService());
//   of course CalculatorService must implement the interface associated
//   to CalculatorIID --> typescript will help you there in case of error
```

Asimo supports 3 kinds of factories

-   **service factories** (cf. **_registerService()_**) that produce unique objects that will be shared by application modules - i.e. the service instance will be created on the first _fetch()_ call, and then asimo will always return this instance instead of creating a new one.
-   **object factories** (cf. **_registerFactory()_**) that produce new object instances everytime they are called.
-   **group factories** (cf. **_registerGroup()_**) that are used to declare bundles (i.e. multiple JS modules that will be packaged together and that will be loaded dynamically through dynamic imports).

On top of that, asimo also supports registering any kind of **objects** that can be retrieved **synchronously** throught the **_get()_** method.

```typescript
// Object registration
const calc = new CalculatorService();
asm.registerObject(CalculatorIID, calc);

const calc2 = asm.get(CalculatorIID);
// calc2 is of type  Calculator (cf. below) and is equal to calc:
expect(calc2).toBe(calc);
```

Last but not least, and like with any dependency management systems, asimo allows to **chain dependency contexts** by creating _sub-contexts_ - e.g.

```typescript
const context2 = asm.createChildContext("context2");
// context2 is a name that will help differentiate context2 from asm in error messages

// another method - equivalent to context2.createChildContext("context3");
const context3 = createContext({ name: "context3", parent: context2 });
```

Note: by default asimo creates a **root context** that is exposed as **asm** by the asimo module (i.e. _@asimojs/asimo_)

In this example, if an application module tries to retrieve a dependency on _context3_ asimo will first look in _context3_, then in _context2_ and then in _asm_ if it hasn't found it before. Asimo offers 2 methods to manage cases where dependency factories are not found (i.e. not registered):

-   either it **throws an exception** (if not default values are provided or if _get_ or _fetch_ are used to retrieve multiple dependencies in one call)
-   or it **returns a default value** and the caller will have to manage the case where the returned object is not available (typescript will show that the type can be null).

The last _special_ part that needs to be mentioned concerns the **interface definitions**. As typescript interfaces cannot be read at runtime, asimo exposes a special **interfaceId()** method that allows to bind a typescript interface with a string (that should be unique - this is why we suggest to use namespaces):

```typescript
// typescript interface
export interface Calculator {
    numberOfCalls: number;
    add(a: number, b: number): number;
}

// interface id token associated to the typescript interface
export const CalculatorIID = interfaceId<Calculator>("asimo.tests.Calculator");
// asimo.tests.Calculator -> unique namespace
```

## Examples

In all use cases asimo involves at least 2 modules:

-   a **consumer** module that retrieves dependencies dynamically (the consumer can then keep a reference to its dependencies to avoid further async calls if need be):

```typescript
// Consumer
import { asm } from "@asimojs/asimo";
import { CalculatorIID } from "./types";

async function doSomething() {
    const calc = await asm.get(CalculatorIID);
    // Typescript sees that calc is of type Calculator
    const result = calc.add(1, 2); // 3
}
```

-   a **producer** module that contains object or service factories that will be exposed to consumers. Producers are usually split in 2 files:

-- a _type_ file:

```typescript
import { interfaceId } from "@asimojs/asimo";

// typescript interface
export interface Calculator {
    numberOfCalls: number;
    add(a: number, b: number): number;
}

// interface id token that associates a string namespace
// (the runtime token) to the typescript interface
export const CalculatorIID = interfaceId<Calculator>("asimo.src.tests.Calculator");
```

-- and an _implementation_ file:

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

The AsmContext is the object that contains the registered factories and that exposes all asimo APIs (but `interfaceId()`):

### `fetch()`

Retrieve a service or an object instance asynchronously. For each interface id passed as argument, asimo will first look in the current context for services or object factories or groups (in this order) - if not found
it will then perform the same lookup in its parent context, recursively up to the root context.
This method allows to retrieve up to 5 dependencies in one call with type support (more can be retrieved
without type inference - cf. call signature).

Note: **if the factory is not defined fetch will throw an exceptioin unless a default value is passed as 2nd argument**.

```typescript
// Get one dependency - throws if not found
const calc = await asm.fetch(CalculatorIID);
calc.add(1, 2); // calc type is Calculator

// Get one dependency - return the default value if not found
const calc2 = await asm.fetch(CalculatorIID, null);
calc2?.add(1, 2); // calc2 type is Calculator | null

// Retrieve one dependency by namesapce
const calc3 = await asm.fetch("asimo.tests.Calculator");
(calc3 as Calculator)!.add(1, 2); // calc3 type is unknown

// Retrieve multiple dependencies - also works with namespace strings:
const [m, c, a] = await asm.fetch(MultiplierIID, CalculatorIID, AdderIID);
//   m is of type Multiplier
//   c is of type Calculator
//   a is of type Adder
```

### `get()`

Get an object from an asimo context (or its parents). On the contrary to _fetch()_, _get()_ is **synchronous** and only returns objects that have been registered through _registerObject()_. This function will throw an error if no default value is passed as 2nd argument.

```typescript
// register an the object
asm.registerObject(CalculatorIID, new CalculatorService());

// Get one dependency - throws if not found
const calc = asm.get(CalculatorIID);
calc.add(1, 2); // calc type is Calculator

// Get one dependency - return the default value if not found
const calc2 = asm.get(CalculatorIID, null);
calc2?.add(1, 2); // calc2 type is Calculator | null

// Retrieve multiple dependencies - also works with namespace strings:
const [m, c, a] = asm.get(MultiplierIID, CalculatorIID, AdderIID);
//   m is of type Multiplier
//   c is of type Calculator
//   a is of type Adder
```

### `registerService()`

Register a Service (i.e. a singleton object or function). The service doesn't need to be instantiated at registration time as we need to provide a factory function as parameter (synchronous or asynchronous). Note: **service factories are only called once** whereas object factories are called at each _fetch()_ in order to generate new object instances.

```typescript
registerService<T>(iid: InterfaceId<T>, factory: () => T | Promise<T>): void;
```

Examples:

```typescript
// Register an service - factory will only be called once
asm.registerService(CalculatorIID, () => new CalculatorService());
// Registration with async factory
asm.registerService(MultiplierIID, async () => new MultiplierService());
// Factory receive the calling context as argument
asm.registerService(SomeServiceIID, (c: AsmContext) => new SomeService(c));

// Register a function (as a service)
asm.registerService(AdderIID, () => add); // add is a function
```

### `registerFactory()`

Register an object factory. The factory will be called any time the _fetch()_ method is called
for the object's interface id. On the contrary to services, there is no restriction on the number
of objects that can be creatd. Besides asimo doesn't keep any reference to the object (no risks of memory leak)

```typescript
registerFactory<T>(iid: InterfaceId<T>, factory: () => T | Promise<T>): void;
```

Example:

```typescript
// Register an object factory
asm.registerFactory(MultiplierIID, () => new MultiplierImpl());
```

### `registerObject()`

Register any kind of object in the given context - these objects will be accessible synchronously through the _get()_ method

```typescript
interface SimpleObject {
    name: string;
    increment(value: number): number;
}
const SimpleObjectIID = interfaceId<SimpleObject>("asimo.test.objects.simple-object");

const o: SimpleObject = {
    name: "foo",
    increment(v) {
        return v + 1;
    },
};
context.registerObject(SimpleObjectIID, o);

// retrieval is synchronous for objects (no await)
const o2 = context.get(SimpleObjectIID); // o2 type is SimpleObject
expect(o2).toBe(o);
```

### `registerGroup()`

Register a group loader that will be used to asynchronously load multiple
services and object factories gathered in a same **deployment bundle**. The bundle code will be loaded on-demand, when
an explicit `fetch()` is done on one of its service or object interfaces.

Parameters:

-   **iids**: the list of interface ids that are packaged in this group
-   **loader**: an async factory that should dynamically import() the required modules

```typescript
registerGroup(iids:InterfaceId<any>[], loader: () => Promise<unknown>): void;
```

Example:

```typescript
// Register several interface implementation that will be loaded on-demand through
// a dynamic module import (this assumes that the implementaion are defined in the module)
asm.registerGroup([Service1IID, Object2IID], () => import("./groups/mybundlefiile"));
```

### `createChildContext()`

Create a child context that can override some of the dependencies defined in its parent (cf. _fetch()_ and _get()_)

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

### `logState`

Log a given context state (i.e. list of registered dependencies) into and array or to the `logger` (console by default) if not _output_ argument is provided.

```typescript
logState(output?: string[]): void;
```

Example:

```typescript
mycontext.logState();
```

```bash
# console output:
Context /asm/test/mycontext:
+ asimo.src.tests.Calculator [service]: not loaded
+ asimo.src.tests.Multiplier [service]: loaded
Context /asm/test:
+ asimo.src.tests.Calculator [service]: loaded
Context /asm:
+ asimo.src.tests.Calculator [service]: not loaded
+ asimo.src.tests.Adder [service]: not loaded
+ asimo.src.tests.Multiplier [object]
```

### `logger`

Tell asimo where to log errors - default value is `console` but can also be `null` to avoid logging anything

Note: this setting is global, even if set on a child context.
Example:

```typescript
asm.logger = null; // deactivate error logs
// [some code here ...]
asm.logger = console; // reactivate error logs
```
