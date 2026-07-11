import { asyncIID, syncIID } from "../../asimo";

export interface Adder {
    (a: number, b: number): number;
}
export const ADDER = asyncIID<Adder>()("asimo.src.test.Adder");

export interface Substracter {
    (a: number, b: number): number;
}
export const SUBSTRACTER = asyncIID<Substracter>()("asimo.src.test.Substracter");
export interface Multiplier {
    (a: number, b: number): number;
}
export const MULTIPLIER = syncIID<Multiplier>()("asimo.src.test.Multiplier");

export interface Divider {
    (a: number, b: number): number;
}
export const DIVIDER = syncIID<Divider>()("asimo.src.test.Divider");

export interface Unknown {
    (a: number, b: number): number;
}
export const UNKNOWN = syncIID<Unknown>()("asimo.src.test.Unknown");