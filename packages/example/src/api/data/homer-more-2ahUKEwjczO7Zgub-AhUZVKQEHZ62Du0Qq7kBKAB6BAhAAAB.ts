import { SearchResponse } from "../types";

const response: SearchResponse = {
    type: "SearchResponse",
    bundles: {
        "c": {
            // c : common bundle
            "ns": "asimo.dpademo.bundles.common",
            "src": "/dist-bundles/bundle-common.js" // should be a verstioned URL
        }
    },
    mainUpdates: [
        {
            action: "append",
            node: "2ahUKEwjczO7Zgub-AhUZVKQEHZ62Du0Q2esEegQIdRAC",
            path: "sections",
            content: [
                {
                    "title": "Is Marge Simpson French?", "key": "2ahUKEwjczO7Zgub-AhUZVKQEHZ62Du0Qq7kBKAB6BAhAAAC", "content": [
                        ["*c:rcard.div", {
                            "lang": "en",
                            "header": {
                                "title": "Bouvier family | Simpsons Wiki - Fandom",
                                "pos": "last",
                                "href": "https://simpsons.fandom.com/wiki/Bouvier_family#:~:text=Advertisement-,History,kids%20are%20of%20French%20descent.",
                                "src": {
                                    "name": "fadom.com",
                                    "ref": "https://simpsons.fandom.com/wiki/Homer_Simpson › wiki › Bouvier_family",
                                    "logo": ["*c:img", { "height": 18, "width": 18, "src": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAASklEQVR4AWOAgv9Qmiz+/3+PwQL/SeVT0wAIhrIJ8zENIAXT34BRA4DyUIzJR0qWuDUjAax8pJSF1wAQG5OPMIC2LiBsABCTHYgAlfwb/kEd2zYAAAAASUVORK5CYII=" }]
                                }
                            },
                        },
                            ["#p", "History. Marge's parents are Clancy Bouvier and Jacqueline Bouvier (nee Gurney). It has been proven by Marge in the episode \"The Color Yellow,\" when she told Homer, \"You're not French, my dad is.\" This means that ", ["#em", "Marge and the kids are of French descent"], "."],
                        ]
                    ]
                }, {
                    "title": "Do The Simpsons ever go to Paris?", "key": "2ahUKEwjczO7Zgub-AhUZVKQEHZ62Du0Qq7kBKAB6BAhAAAD", "content": [
                        ["*c:rcard.div", {
                            "lang": "en",
                            "header": {
                                "title": "\"The Simpsons\" To Courier with Love (TV Episode 2016) - IMDb",
                                "pos": "last",
                                "href": "https://www.imdb.com/title/tt5222750/#:~:text=A%20Fun%20Episode%20as%20the,plenty%20of%20very%20funny%20scenes..",
                                "src": {
                                    "name": "imdb.com",
                                    "ref": "https://m.imdb.com › title ",
                                    "logo": ["*c:img", { "height": 18, "width": 18, "src": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAMAAAAoLQ9TAAAAY1BMVEX1xRj6yRj3xxj4xxj3xhi6lRLMpBSohxDbsBXPpxThtRaujBH+zBkwJwRzXAsAAACIbQ1CNQZfTAmigg/vwBc9MQV6YgwUEAGNcg2EaQ0aFQMnIAQ1KwVuWAorIwQODAEhGgMf9LeoAAAAX0lEQVR4Aa3IxQGAQBDF0PzBnf6r5ILLWg3klscPCSRnn33IZQ/kKFciMjn3Ivr4kfTmWh6DuqahpqarsxqDQAwArx1EaKrj20TZHdkMwkpzznDvVzi7HoGhCCj4wx95m+8igTaP5B0AAAAASUVORK5CYII=" }]
                                }
                            },
                            "sideContent": ["*c:img", {
                                // "height": 160, "width": 204,
                                "height": 110, "width": 200,
                                "alt": "The Simpsons&quot; To Courier with Love (TV Episode 2016) - IMDb",
                                "href": "https://en.wikipedia.org/wiki/Homer_Simpson",
                                "src":"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTH68--qKkZ1SIOu8JsUvk38nfcMut61L9QRrZgq52HYQ&s",
                            }],
                        },
                            ["#p", "A Fun Episode as the Family Head to Paris, ", ["#em", "To Courier with Love"], " is a great Simpsons episode with a well written plot and plenty of very funny scenes."]
                        ]
                    ]
                },
            ]
        }
    ]
}

export default response;
