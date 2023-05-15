import { asm, interfaceId } from "../asimo";

interface Adder {
    (a: number, b: number): number;
}
export const AdderIID = interfaceId<Adder>("asimo.src.tests.Adder");

export function add(a: number, b: number) {
    return a + b;
}
asm.registerService(AdderIID, () => add);

