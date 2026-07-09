import { asyncIID, syncIID } from "../../asimo";

export interface Adder {
    (a: number, b: number): number;
}
export const ADDER = asyncIID<Adder>("asimo.src.test.Adder");

export interface Multiplier {
    (a: number, b: number): number;
}
export const MULTIPLIER = syncIID<Multiplier>("asimo.src.test.Multiplier");