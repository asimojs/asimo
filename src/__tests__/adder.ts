import { asm, interfaceId } from "../asimo";

export interface Adder {
    (a: number, b: number): number;
}
export const AdderIID = interfaceId<Adder>("asimo.src.tests.Adder");

export function _add(a: number, b: number) {
    return a + b;
}
asm.registerService(AdderIID, () => _add);

