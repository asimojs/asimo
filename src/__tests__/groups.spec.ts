import { beforeEach, describe, expect, it } from "vitest";
import { asm as rsm } from "../asimo";
import { CalculatorIID } from "./calculator.types";
import { AsmContext } from "../asimo.types";
import { SyncIncrementorIID, _SyncIncrementorService } from "./syncincrementor";
import { AsyncIncrementorIID, _AsyncIncrementorService } from "./asyncincrementor";
import { Object2IID, Service1IID } from "./groups/interfaces";
import "./groups/groupADef"; // register groupA on asm root context
import { _CalculatorService } from "./calculator";

describe("Groups", () => {
    let asm: AsmContext;
    let groupALoadCount = 0;

    function createContext() {
        const c = rsm.createChildContext();

        // override calculator service
        c.registerService(CalculatorIID, () => new _CalculatorService());
        c.registerService(SyncIncrementorIID, () => new _SyncIncrementorService());
        c.registerService(AsyncIncrementorIID, () => new _AsyncIncrementorService());

        return c;
    }

    beforeEach(() => {
        // run tests in an independent context
        asm = createContext();
    });

    globalThis.notifyGroupALoad = () => {
        groupALoadCount++;
    };

    it("should support group loaders (root)", async () => {
        expect(groupALoadCount).toBe(0);

        expect(rsm.definitions.filter((d) => d.iid === Service1IID.ns)).toMatchObject([
            { iid: "asimo.src.tests.groups.Service1", type: "group" }, // service is not loaded yet
        ]);

        expect(rsm.definitions.filter((d) => d.iid === Object2IID.ns)).toMatchObject([
            { iid: "asimo.src.tests.groups.Object2", type: "group" }, // factory not loaded
        ]);

        const s1 = await asm.fetch(Service1IID);
        expect(groupALoadCount).toBe(1);
        expect(s1.name).toBe("Service1");
        expect(s1.add(40, 2)).toBe(42);
        const s1bis = await asm.fetch(Service1IID);
        expect(groupALoadCount).toBe(1);
        expect(s1).toBe(s1bis);

        expect(rsm.definitions.filter((d) => d.iid === Service1IID.ns)).toMatchObject([
            { iid: "asimo.src.tests.groups.Service1", type: "service", loaded: true }, // loaded!
        ]);

        expect(rsm.definitions.filter((d) => d.iid === Object2IID.ns)).toMatchObject([
            { iid: "asimo.src.tests.groups.Object2", type: "object" }, // factory loaded
        ]);

        const o2 = await asm.fetch(Object2IID);
        expect(o2.name).toBe("Object2");
        expect(o2.multiply(3, 2)).toBe(6);

        const o2bis = await asm.fetch(Object2IID);
        expect(o2bis.name).toBe("Object2");
        expect(o2bis.multiply(3, 2)).toBe(6);
        expect(o2bis).not.toBe(o2);
        expect(groupALoadCount).toBe(1);
    });

    it("should support group loaders (subcontext)", async () => {
        asm.registerGroup([Service1IID, Object2IID], () => import("./groups/groupAbis"));
        groupALoadCount = 0;
        const s1 = await asm.fetch(Service1IID);
        expect(groupALoadCount).toBe(1);
        expect(s1.name).toBe("Service1");
        expect(s1.add(40, 2)).toBe(42);
        const s1bis = await asm.fetch(Service1IID);
        expect(groupALoadCount).toBe(1);
        expect(s1).toBe(s1bis);

        const o2 = await asm.fetch(Object2IID);
        expect(groupALoadCount).toBe(1);
        expect(o2.name).toBe("Object2");
        expect(o2.multiply(3, 2)).toBe(6);

        const o2bis = await asm.fetch(Object2IID);
        expect(groupALoadCount).toBe(1);
        expect(o2bis.name).toBe("Object2");
        expect(o2bis.multiply(3, 2)).toBe(6);
        expect(o2bis).not.toBe(o2);
    });

    it("should only load group once in case of parallel requests", async () => {
        asm.registerGroup([Service1IID, Object2IID], () => import("./groups/groupAter"));
        groupALoadCount = 0;
        const [s1, o2] = await asm.fetch(Service1IID, Object2IID);
        expect(groupALoadCount).toBe(1);
        expect(s1.name).toBe("Service1");
        expect(s1.add(40, 2)).toBe(42);
        const s1bis = await asm.fetch(Service1IID);
        expect(groupALoadCount).toBe(1);
        expect(s1).toBe(s1bis);
        expect(o2.name).toBe("Object2");
        expect(o2.multiply(3, 2)).toBe(6);

        const o2bis = await asm.fetch(Object2IID);
        expect(groupALoadCount).toBe(1);
        expect(o2bis.name).toBe("Object2");
        expect(o2bis.multiply(3, 2)).toBe(6);
        expect(o2bis).not.toBe(o2);
    });
});
