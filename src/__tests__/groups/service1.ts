import { asm } from "../../asimo";
import { Service1, Service1IID } from "./interfaces";

class Service implements Service1 {
    name = "Service1";

    add(a: number, b: number) {
        return a + b;
    }
}

// This service will be automatically registered when the module is loaded
asm.registerService(Service1IID, () => new Service());
