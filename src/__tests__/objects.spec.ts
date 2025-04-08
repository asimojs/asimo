import { beforeEach, describe, expect, it } from "vitest";
import { asm as rsm, interfaceId, createContext, AsmContext } from "../asimo";
import { _CalculatorService } from "./calculator";
import { SyncIncrementorIID, _SyncIncrementorService } from "./syncincrementor";
import { AsyncIncrementorIID, _AsyncIncrementorService } from "./asyncincrementor";
import { Multiplier, MultiplierIID, _MultiplierImpl } from "./multiplier";
import { AdderIID, _add } from "./adder";
import { Calculator, CalculatorIID } from "./types";

interface SimpleObject {
    name: string;
    increment(value: number): number;
}
const SimpleObjectIID = interfaceId<SimpleObject>("asimo.test.objects.simple-object");
const SimpleObject2IID = interfaceId<SimpleObject>("asimo.test.objects.simple-object2");

describe("Asimo Objects", () => {
    let context: AsmContext;

    function createTestContext(name?: string) {
        const c = rsm.createChildContext(name || "object-test");
        return c;
    }

    beforeEach(() => {
        // run tests in an independent context
        context = createTestContext();
    });

    describe("get", () => {
        it("should return objects from the same context", async () => {
            const o: SimpleObject = {
                name: "foo",
                increment(v) {
                    return v + 1;
                },
            };

            context.registerObject(SimpleObjectIID, o);

            const o2 = context.get(SimpleObjectIID);
            expect(o2).toBe(o);
            expect(o2.name).toBe("foo");
            expect(o2.increment(41)).toBe(42);

            // overwrite
            const o3: SimpleObject = {
                name: "foobar",
                increment(v) {
                    return v + 10;
                },
            };
            context.registerObject(SimpleObjectIID, o3);
            const o4 = context.get(SimpleObjectIID);
            expect(o4).toBe(o3);
            expect(o4.name).toBe("foobar");
            expect(o4.increment(41)).toBe(51);
        });

        it("should return objects from the parent context", async () => {
            const o: SimpleObject = {
                name: "foo",
                increment(v) {
                    return v + 1;
                },
            };

            const context2 = context.createChildContext("child-context");

            context.registerObject(SimpleObjectIID, o);

            const o2 = context2.get(SimpleObjectIID);
            expect(o2).toBe(o);
            expect(o2.name).toBe("foo");
            expect(o2.increment(41)).toBe(42);

            // overwrite
            const o3: SimpleObject = {
                name: "foobar",
                increment(v) {
                    return v + 10;
                },
            };
            context.registerObject(SimpleObjectIID, o3);
            const o4 = context2.get(SimpleObjectIID);
            expect(o4).toBe(o3);
            expect(o4.name).toBe("foobar");
            expect(o4.increment(41)).toBe(51);
        });

        it("should get multiple objects", async () => {
            const context2 = context.createChildContext("child-context");
            const o1: SimpleObject = {
                name: "foo1",
                increment(v) {
                    return v + 1;
                },
            };
            const o2: SimpleObject = {
                name: "foo2",
                increment(v) {
                    return v + 2;
                },
            };
            context.registerObject(SimpleObjectIID, o1);
            context2.registerObject(SimpleObject2IID, o2);

            const [o21, o22] = context2.get(SimpleObjectIID, SimpleObject2IID);
            expect(o21.increment(1)).toBe(2);
            expect(o22.increment(1)).toBe(3);
        });

        it("should return a default value if not found", async () => {
            let err = "",
                o: SimpleObject | null;
            try {
                o = context.get(SimpleObjectIID, null);
            } catch (ex) {
                err = ex.message;
            }

            expect(o!).toBe(null);
            expect(err).toBe("");
        });

        it("should throw an error if not found", async () => {
            context.logger = null;
            let err = "";
            try {
                const o = context.get(SimpleObjectIID);
            } catch (ex) {
                err = ex.message;
            }
            expect(err).toBe(
                'ASM [/asm/object-test] Object not found: "asimo.test.objects.simple-object"',
            );
        });
    });
});
