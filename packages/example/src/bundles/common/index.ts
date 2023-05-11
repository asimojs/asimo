import { Hello } from "./hello";
import { Counter } from "./counter";

console.log("LOADED")

type Foo = string;
const blah: Foo = "abc";


export default {
    hello: Hello,
    counter: Counter
}
