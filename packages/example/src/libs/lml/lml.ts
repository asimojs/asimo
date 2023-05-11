import { h } from "preact";

// <span class="hello"> Hello <em> World! </em></span>
// ["#span.hello", "Hello", ["#em", "World!"]]

// <span class="hello" "title"="Greetings!"> Hello <em> World! </em></span>
// ["#span.hello", {"title": "Greetings"}, "Hello", ["#em", "World!"]]

export function lml2JSX(): JSX.Element {
    return h("div", { style: "color:red;font-weight:bold" }, "Hello")
}

export function foobar(): JSX.Element {
    return h("div", { style: "color:red;font-weight:bold" },
        "Hello",
        // h(Counter, { style: "color:red;font-weight:bold" },
        //     "Hello2"
        // )
    )
}
