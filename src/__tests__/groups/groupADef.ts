import { asm } from "../../asimo";
import { Object2FactoryIID, Service1IID } from "./interfaces";

asm.registerBundle([Service1IID, Object2FactoryIID], () => import("./groupA"));
