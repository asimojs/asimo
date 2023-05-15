# asimo

Asimo is a micro library that allows to transparently manage asynchronous dependency injection in Typescript projects.

Key features:
- **design by interface**: depend on abstraction, not implementation - cf. [SOLID] design principles
- simplify **Progressivle Web Application** developments: application code doesn't need to know which modules are loaded
after the page load.
- full **type support**: typescript interfaces exposed by service producers are immediately visible to the consumers
(no type cast required)
- easy module bundling: modules can be bundled in muliple manners without impacting the application code
- simplify **unit tests**: dependencies can be injected through the asimo context
- foster best practices: wrap access to browser apis (e.g. fetch or local storeage access) into independent services that will be injected through asimo and that can then be easily mocked
- allows to **embed mock engines** that can be loaded dynamically at application startup (no impact on application size)
and that will mock browser APIs responses (e.g. fetch) through simulators. This comes in handy to manage data
structure with heavy cross-references as these data will be generated through code and are thus easier to maintain.


[SOLID]: https://en.wikipedia.org/wiki/SOLID

## Usage

In most use cases asimo will involve at least 2 modules:
- a **producer** that contains services or object factories to expose
- a **consumer** that retrieves the service dynamically and use it (the consumer can then keep a reference to the
service to avoid further async calls if need be).

```typescript
// Producer
import { asm, interfaceId } from "../asimo";

// Interface declaration
export interface Calculator {
    numberOfCalls: number;
    add(a: number, b: number): number;
}
// Interface ID that will be used by the consumer
export const CalculatorIID = interfaceId<Calculator>("asimo.src.tests.Calculator");

// Service implementing the interface
export class CalculatorService implements Calculator {
    add(a: number, b: number) {
        return a + b;
    }
}
// Service registration - should be defined in separate files when using packagers that don't support tree-shaking
asm.registerService(CalculatorIID, () => new CalculatorService());

```

```typescript
// Consumer
import { asm } from '../asimo';
import { CalculatorIID } from './calculator';

async function process() {
    const calc = await asm.get(CalculatorIID); // Typescript types found -> calc is of type Calculator
    const result = calc.add(1, 2);             // 3
}
```

## APIs

Asimo exports 2 entities:
- ```asm``` - the root ```AsmContext``` (cf. below) where all resolutions will be defaulted if interface factories cannot be found in sub-context (cf. ```createChildContext()```)
- ```interfaceId``` - the function that allows to create interface id objects that associate interface namepsaces with typescript types. Parameters:
    - **ns** the interface namespace - e.g. "myapplication.services.Settings"
    - **returns** an InterfaceId object

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

## AsmContext

The AsmContext is the object that exposes all asimo APIs (but interfaceId):


### get

Retrieve a service or an object instance. For each interface id, asimo will first look in the current
context for services or object factories or groups registered for the interface (in this order) - if not found
it will then perform the same lookup in its parent context (recursively, up to the root context).
This method allows to retrieve up to 5 dependencies in one call.

```typescript
get<T>(iid: InterfaceId<T>): Promise<T>;
get<T1, T2>(iid1: InterfaceId<T1>, iid2: InterfaceId<T2>): Promise<[T1, T2]>;
get<T1, T2, T3>(iid1: InterfaceId<T1>, iid2: InterfaceId<T2>, iid3: InterfaceId<T3>): Promise<[T1, T2, T3]>;
get<T1, T2, T3, T4>(iid1: InterfaceId<T1>, iid2: InterfaceId<T2>, iid3: InterfaceId<T3>, iid4: InterfaceId<T4>)Promise<[T1, T2, T3, T4]>;
get<T1, T2, T3, T4, T5>(iid1: InterfaceId<T1>, iid2: InterfaceId<T2>, iid3: InterfaceId<T3>, iid4InterfaceId<T4>, iid5: InterfaceId<T5>): Promise<[T1, T2, T3, T4, T5]>;
```
Examples:
```typescript
// Retrive one dependency
const calc = await asm.get(CalculatorIID);
// Retrieve multiple depdendencies
const [m, c, a] = await asm.get(MultiplierIID, CalculatorIID, AdderIID);

```

### registerService

Register a Service (i.e. a singleton object or function). The service doesn't need to be instantiated at registration time as we need to provide a factory function, that can be synchronous or asynchronous. Note: **service factories are only called once**

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


### registerFactory

Register an object factory. The factory will be called any time the get method is called
for this interface id. On the contrary to services, there is no restriction on the number
of objects that can be creatd. Besides asimo doesn't keep any reference to the object

```typescript
registerFactory<T>(iid: InterfaceId<T>, factory: () => T | Promise<T>): void;
```
Examples:
```typescript
// Register an object factory
asm.registerFactory(MultiplierIID, () => new MultiplierImpl());
```


### registerGroup

Register a group loader that will be used to asynchronously load multiple
service and object factories on-demand (i.e. the group code will only be loaded when
an explicit get is done on one of its service or object interfaces). Parameters:
- **iids**: the list of interface ids that are packaged in this group
- **loader**: an async factory that should dynamically import() the required modules

```typescript
registerGroup(iids:InterfaceId<any>[], loader: () => Promise<unknown>): void;
```
Examples:
```typescript
// Register several interface implementation that will be loaded on-demand through
// a dynamic module import (this assumes that the implementaion are defined in the module)
asm.registerGroup([Service1IID, Object2IID], () => import("./groups/groupA"));
```

### createChildContext

Create a child context that can override some of the dependencies defined in its parent (cf. get behaviour)

```typescript
createChildContext(): AsmContext;
```
Examples:
```typescript
import { asm as rootAsm } from '../asimo';

function createContext() {
    const c = rootAsm.createChildContext();
    // override calculator service
    c.registerService(CalculatorIID, () => new CalculatorService());
    c.registerService(SyncIncrementorIID, () => new SyncIncrementorService());
    c.registerService(AsyncIncrementorIID, () => new AsyncIncrementorService());
    return c;
 }
```

