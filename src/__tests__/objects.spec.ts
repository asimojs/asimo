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

    describe("getObject", () => {
        it("should return objects from the same context", async () => {
            const o: SimpleObject = {
                name: "foo",
                increment(v) {
                    return v + 1;
                },
            };

            context.registerObject(SimpleObjectIID, o);

            const o2 = context.getObject(SimpleObjectIID);
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
            const o4 = context.getObject(SimpleObjectIID);
            expect(o4).toBe(o3);
            expect(o4.name).toBe("foobar");
            expect(o4.increment(41)).toBe(51);
        });

        it("should return objects from the same context", async () => {
            const o: SimpleObject = {
                name: "foo",
                increment(v) {
                    return v + 1;
                },
            };

            const context2 = context.createChildContext("child-context");

            context.registerObject(SimpleObjectIID, o);

            const o2 = context2.getObject(SimpleObjectIID);
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
            const o4 = context2.getObject(SimpleObjectIID);
            expect(o4).toBe(o3);
            expect(o4.name).toBe("foobar");
            expect(o4.increment(41)).toBe(51);
        });

        it("should throw an error if not found", async () => {
            let err = "";
            try {
                const o = context.getObject(SimpleObjectIID);
            } catch (ex) {
                err = ex.message;
            }
            expect(err).toBe(
                '[Dependency Context] Object "asimo.test.objects.simple-object" not found in /asm/object-test',
            );
        });
    });

    describe("fetchObject", () => {
        it("should return objects from the same context", async () => {
            const o: SimpleObject = {
                name: "foo",
                increment(v) {
                    return v + 1;
                },
            };

            context.registerObject(SimpleObjectIID, o);

            const o2 = context.fetchObject(SimpleObjectIID);
            expect(o2).toBe(o);
            expect(o2?.name).toBe("foo");
            expect(o2?.increment(41)).toBe(42);

            // overwrite
            const o3: SimpleObject = {
                name: "foobar",
                increment(v) {
                    return v + 10;
                },
            };
            context.registerObject(SimpleObjectIID, o3);
            const o4 = context.fetchObject(SimpleObjectIID);
            expect(o4).toBe(o3);
            expect(o4?.name).toBe("foobar");
            expect(o4?.increment(41)).toBe(51);
        });

        it("should return objects from the same context", async () => {
            const o: SimpleObject = {
                name: "foo",
                increment(v) {
                    return v + 1;
                },
            };

            const context2 = context.createChildContext("child-context");

            context.registerObject(SimpleObjectIID, o);

            const o2 = context2.fetchObject(SimpleObjectIID);
            expect(o2).toBe(o);
            expect(o2?.name).toBe("foo");
            expect(o2?.increment(41)).toBe(42);

            // overwrite
            const o3: SimpleObject = {
                name: "foobar",
                increment(v) {
                    return v + 10;
                },
            };
            context.registerObject(SimpleObjectIID, o3);
            const o4 = context2.fetchObject(SimpleObjectIID);
            expect(o4).toBe(o3);
            expect(o4?.name).toBe("foobar");
            expect(o4?.increment(41)).toBe(51);
        });

        it("should return null if not found", async () => {
            let err = "";
            let v: any = undefined;
            try {
                v = context.fetchObject(SimpleObjectIID);
            } catch (ex) {
                err = ex.message;
            }
            expect(err).toBe("");
            expect(v).toBe(null);
        });
    });
});
