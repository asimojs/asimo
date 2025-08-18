import { asm, asyncIID } from "../asimo";

export interface Adder {
    (a: number, b: number): number;
}
export const AdderIID = asyncIID<Adder>("asimo.src.tests.Adder");

export function _add(a: number, b: number) {
    return a + b;
}
asm.registerService(AdderIID, () => _add);
