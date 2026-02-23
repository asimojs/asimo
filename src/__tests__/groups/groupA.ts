// Group A gathers Service1 and Object2 together
// Interface implementations defined in the following modules will self register once loaded
import "./service1";
import "./object2";

// note: this file should be generated in a future asimo version

// the following is for test purpose only
if (globalThis && "notifyGroupALoad" in globalThis) {
    // allow to test that groupA is really loaded on demand
    (globalThis as any).notifyGroupALoad();
}
