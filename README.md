# asimo

Asimo is a micro library that allows to transparently manage asynchronous dependency injection in Typescript projects.

[Live Demo][results] 🚀

Main benefits:
- **keep application startup fast**: as asimo decouples implementation from interfaces, application bundling can be changed
without impacting the application code. This allows to split the application in small bundles that will be loaded on-demand.
As such, new features that don't show on the very first display won't impact the intial load time.
- **easily build a test environment** by mocking and overriding the application services that interact with the browser data APIs (e.g.
server APIs, local storage, indexedDB, websockets...). This mocked services can also be loaded on-demand based on special URL parameters,
which comes in handy for developers or UI integration tests with e2e tools such as [Playwright].

Key features:
- **design by interface**: depend on abstraction, not implementation - cf. [SOLID] design principles
- simplify **Progressivle Web Application** development: application code doesn't need to know how modules are bundled (i.e. in the application core or as asynchronous package).
- **load what you need** at startup: asimo will pull and load packages on-demand depending on the initial view (no need to preload all possible modules in the *right* order)
- full **type support**: typescript interfaces exposed by service producers are immediately visible to the consumers
(no type cast required)
- easy module bundling: modules can be bundled without impacting the application code (i.e. no need to refactor code to insert dynamic imports)
- simplify **unit tests**: dependencies can be injected through the asimo context
- foster best practices: wrap browser APIs (e.g. fetch or local storeage access) into independent services that will be injected through asimo - and that can then be easily mocked
- allows to **embed mock engines** that can be loaded dynamically at application startup (no impact on application size)
and that will mock browser APIs responses (e.g. fetch) through simulators. This comes in handy to manage data
garphs containing many cross-references as these data will be generated through code (the mock simulator engine) and are thus easier to maintain.


[SOLID]: https://en.wikipedia.org/wiki/SOLID
[Playwright]: https://playwright.dev/
[results]: https://asimojs.github.io/dpademo/homer_simpson.html


## Usage

In most use cases asimo will involve at least 2 modules:
- a **producer** that contains services or object factories that will be exposed to consumers
- a **consumer** that retrieves the producers dynamically, when needed (the consumer can then keep a reference to its dependencies to avoid further async calls if need be).

```typescript
// Producer
import { asm, interfaceId } from "@asimojs/asimo";

// Interface declaration
interface Calculator {
    add(a: number, b: number): number;
}
// Interface ID that will be used by the consumer
export const CalculatorIID = interfaceId<Calculator>("asimo.src.tests.Calculator");

// Service implementing the interface
class CalculatorService implements Calculator {
    add(a: number, b: number) {
        return a + b;
    }
}
// Service registration - should be defined in separate files when using packagers
// that don't support tree-shaking (otherwise implementation will be packaged with the interface!)
asm.registerService(CalculatorIID, () => new CalculatorService());

```

```typescript
// Consumer
import { asm } from '@asimojs/asimo';
import { CalculatorIID } from './calculator';

async function doSomething() {
    const calc = await asm.get(CalculatorIID); // Typescript types found -> calc is of type Calculator
    const result = calc.add(1, 2);             // 3
}
```

## Install

```bash
npm i @asimojs/asimo
```

## APIs

Asimo core module exports 2 entities:
- ```asm``` - the root ```AsmContext``` that exposes most asimo APIs
- ```interfaceId()``` - that allows to create interface id objects that associate interface namepsaces with typescript types:

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

## ```AsmContext```

The AsmContext is the object that exposes all asimo APIs (but ```interfaceId()```):


### ```get```

Retrieve a service or an object instance. For each interface id, asimo will first look in the current
context for services or object factories or groups (in this order) - if not found
it will then perform the same lookup in its parent context, recursively up to the root context).
This method allows to retrieve up to 5 dependencies in one call with type support (more can be retrieved
without type inference - cf. call signature).

Note: the parameters can be either ```InterfaceId``` objects or interface namespaces (strings).
When using ```InterfaceId``` typescript will automatically infer the right type - otherwise an explicit
type cast will be necessary, as shown below

```typescript
get<T>(iid: IidNs<T>): Promise<T>;

get<T1, T2>(iid1: IidNs<T1>, iid2: IidNs<T2>): Promise<[T1, T2]>;

get<T1, T2, T3>(iid1: IidNs<T1>, iid2: IidNs<T2>, iid3: IidNs<T3>): Promise<[T1, T2, T3]>;

get<T1, T2, T3, T4>(iid1: IidNs<T1>, iid2: IidNs<T2>, iid3: IidNs<T3>, iid4: IidNs<T4>): Promise<[T1, T2, T3, T4]>;

get<T1, T2, T3, T4, T5>(iid1: IidNs<T1>, iid2: IidNs<T2>, iid3: IidNs<T3>, iid4: IidNs<T4>, iid5: IidNs<T5>): Promise<[T1, T2, T3, T4, T5]>;

get(...iids: (InterfaceId<any> | string)[]): Promise<any[]>;

/**
 * IID or Namespace: parameter type used to retrieve an object from asimo
 */
export type IidNs<T> = InterfaceId<T> | string;
```
Examples:
```typescript
// Retrieve one dependency
const calc = await asm.get(CalculatorIID);
calc.add(1, 2);  // calc2 type is Calculator

// Retrieve one dependency by namesapce
const calc2 = await asm.get("asimo.src.tests.Calculator");
(calc2 as Calculator).add(1, 2);  // calc2 type is unknown

// Retrieve multiple depdendencies - also works with namespace strings:
const [m, c, a] = await asm.get(MultiplierIID, CalculatorIID, AdderIID);
```

### ```registerService```

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
```


### ```registerFactory```

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


### ```registerGroup```

Register a group loader that will be used to asynchronously load multiple
services and object factories on-demand (i.e. the group code will only be loaded when
an explicit ```get()``` is done on one of its service or object interfaces). Parameters:
- **iids**: the list of interface ids that are packaged in this group
- **loader**: an async factory that should dynamically import() the required modules

```typescript
registerGroup(iids:InterfaceId<any>[], loader: () => Promise<unknown>): void;
```
Example:
```typescript
// Register several interface implementation that will be loaded on-demand through
// a dynamic module import (this assumes that the implementaion are defined in the module)
asm.registerGroup([Service1IID, Object2IID], () => import("./groups/groupA"));
```

### ```createChildContext```

Create a child context that can override some of the dependencies defined in its parent (cf. get behaviour)

```typescript
createChildContext(): AsmContext;
```
Example:
```typescript
import { asm as rootAsm } from '@asimojs/asimo';

function createContext() {
    const c = rootAsm.createChildContext();
    // override calculator service
    c.registerService(CalculatorIID, () => new CalculatorService());
    c.registerService(SyncIncrementorIID, () => new SyncIncrementorService());
    c.registerService(AsyncIncrementorIID, () => new AsyncIncrementorService());
    return c;
 }
```

