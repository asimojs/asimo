// Same as groupA (not needed in real use cases - test purpose only)
import "./service1";
import "./object2";

// the following is for test purpose only
if (globalThis && "notifyGroupALoad" in globalThis) {
    // allow to test that groupA is really loaded on demand
    (globalThis as any).notifyGroupALoad();
}
