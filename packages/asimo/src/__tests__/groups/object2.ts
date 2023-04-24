import { asm } from "../../asimo";
import { Object2, Object2IID } from "./interfaces";

class Obj implements Object2 {
    name = "Object2";

    multiply(a: number, b: number) {
        return a * b;
    }
}

// This service will be automatically registered when the module is loaded
asm.registerFactory(Object2IID, () => new Obj());
