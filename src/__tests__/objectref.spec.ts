import { describe, expect, it, beforeEach, afterEach } from "vitest";

import { asm as rsm, interfaceId, createContext, AsmContext } from "../asimo";

class TestObject {
    type = "TestObject";

    constructor(public name: string) {}
}

describe("Asimo Object Refs", () => {
    let asm: AsmContext;

    function createTestContext(name?: string) {
        const c = rsm.createChildContext(name || "test");

        return c;
    }

    beforeEach(() => {
        // run tests in an independent context
        asm = createTestContext("asm.object.ids");
    });

    it("should return null for an unkonwn reference", async () => {
        expect(asm.getObject("foobar")).toBe(null);
    });

    it("should work for objects", async () => {
        const objA = {
            foo: 123,
            bar: "abc",
            concat() {
                this.bar += this.foo;
            },
        };

        const objB = {
            value1: "abc",
            value2: "def",
        };

        const refA = asm.createObjectRef(objA);
        const refA2 = asm.createObjectRef(objA);
        const refB = asm.createObjectRef(objB);
        expect(refA).not.toBe(refA2);
        expect(refA).not.toBe(refB);

        const a = asm.getObject(refA);
        const a2 = asm.getObject(refA2);
        const a3 = asm.getObject(refA);

        expect(a).toBe(objA);
        expect(a2).toBe(a); // different id but same object
        expect(a3).toBe(a);

        expect(typeof a?.foo).toBe("number");
        expect(typeof a?.bar).toBe("string");
        expect(a?.foo).toBe(123);
        expect(a?.bar).toBe("abc");
        a?.concat();
        expect(a?.bar).toBe("abc123");

        const b = asm.getObject(refB);
        expect(b).not.toBe(a);
        expect(b?.value1).toBe("abc");

        // remove ref
        expect(asm.removeObjectRef(refB)).toBe(true);
        expect(asm.removeObjectRef(refB)).toBe(false); // already done

        const b2 = asm.getObject(refB);
        expect(b2).toBe(null);
    });

    it("should work for primitive type wrappers", async () => {
        const refA = asm.createObjectRef(new Boolean(true));
        expect(refA).not.toBe("");

        const a = asm.getObject(refA);
        expect(a?.valueOf()).toBe(true);
    });

    it("should work for Arrays", async () => {
        const arrA = [1, 2, 3];
        const refA = asm.createObjectRef(arrA);

        const a = asm.getObject(refA);
        expect(a).toBe(arrA);
        a?.push(4);
        expect(arrA[3]).toBe(4);
    });

    it("should retrieve objects in parent contexts if not found in the current one", async () => {
        const asm2 = asm.createChildContext("asm.object.ids.2");
        const asm3 = asm2.createChildContext("asm.object.ids.3");

        const o = new TestObject("TEST_NAME");
        const ref = asm.createObjectRef(o);

        const o3 = asm3.getObject(ref);
        expect(o3).toBe(o);
        expect(o3?.name).toBe("TEST_NAME");
        expect(o3?.type).toBe("TestObject");
    });

    it("should generate global unique ref ids", async () => {
        const asm2 = asm.createChildContext("asm.object.ids.2");

        const o = new TestObject("TEST_NAME");
        const ref = asm.createObjectRef(o);
        const ref2 = asm2.createObjectRef(o);
        expect(ref).not.toBe(ref2);
    });
});
