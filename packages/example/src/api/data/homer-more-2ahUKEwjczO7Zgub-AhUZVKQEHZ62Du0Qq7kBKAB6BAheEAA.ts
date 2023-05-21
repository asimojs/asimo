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
                    "title": "What is Bart's IQ?", "key": "2ahUKEwjczO7Zgub-AhUZVKQEHZ62Du0Qq7kBKAB6BAhAAAA", "content": [
                        ["*c:rcard.div", {
                            "lang": "en",
                            "header": {
                                "title": "\"The Simpsons\" Bart the Genius (TV Episode 1990) - Plot - IMDb",
                                "pos": "last",
                                "href": "https://m.imdb.com/title/tt0756593/synopsis#:~:text=to%20see%20him.-,Dr.,Dr.",
                                "src": {
                                    "name": "imdb.com",
                                    "ref": "https://m.imdb.com › title › synopsis",
                                    "logo": ["*c:img", { "height": 18, "width": 18, "src": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAMAAAAoLQ9TAAAAY1BMVEX1xRj6yRj3xxj4xxj3xhi6lRLMpBSohxDbsBXPpxThtRaujBH+zBkwJwRzXAsAAACIbQ1CNQZfTAmigg/vwBc9MQV6YgwUEAGNcg2EaQ0aFQMnIAQ1KwVuWAorIwQODAEhGgMf9LeoAAAAX0lEQVR4Aa3IxQGAQBDF0PzBnf6r5ILLWg3klscPCSRnn33IZQ/kKFciMjn3Ivr4kfTmWh6DuqahpqarsxqDQAwArx1EaKrj20TZHdkMwkpzznDvVzi7HoGhCCj4wx95m+8igTaP5B0AAAAASUVORK5CYII=" }]
                                }
                            }
                        },
                            ["#p.text-lg", "216"],
                            ["#p", "Dr. Pryor walks in on the meeting, and surprises everyone when he tells them that Bart is a gifted child, and according to the aptitude test from earlier, Bart has an I.Q. of ", ["#em", "216"], ". Dr."]
                        ]
                    ]
                }, {
                    "title": "What was Homer Simpson known for?", "key": "2ahUKEwjczO7Zgub-AhUZVKQEHZ62Du0Qq7kBKAB6BAhAAAB", "content": [
                        ["*c:rcard.div", {
                            "lang": "en",
                            "header": {
                                "title": "Homer Simpson",
                                "href": "https://fr.wikipedia.org/wiki/Homer_Simpson",
                                "pos": "last",
                                "src": {
                                    "name": "Wikipedia",
                                    "ref": "https://fr.wikipedia.org › wiki › Ho...",
                                    "logo": ["*c:img", { "height": 18, "width": 18, "src": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAAAM1BMVEUAAAD+/v41NTUBAQEAAABZWVknJycWFhaZmZmIiIjp6ellZWXMzMzX19eurq54eHhHR0dExXFyAAAAAXRSTlMAQObYZgAAAPtJREFUeAG8kAWOBDAMA9d1Sin+/7XXbpZZdBaURlMrhx28ycGCD/n0bvkBwJf8C+AoIvRAWGtMyHGtCWkfxW+DRopuuIjUtTQJDStevNoXWaRjRSllLd1O8FFhgEZx2BmkAmHC8HwpOUyxSA50VqOjXgAl50URvNWPBRcAnmwnhbcduthqQCO9KYTFBG7eDWoK1T47AZX9DuiUYT/TuhX3MGpnD51kPprSA9Dl+BCKl7jWHHEHmHsLWhNZZMxPQCLTEuy+cYF6D9i8Q5e2Lcyz4AGwKdJbX0p7AegC2qnvxAsAxQRAYH8J6Dg1a/lvpKRJinMW4cxLMPsDAJjSCaG8cPmnAAAAAElFTkSuQmCC" }]
                                }
                            },
                        },
                            ["#p", "Homer is clumsy, fat and very lazy. He is also an alcoholic, and is not very intelligent. He works as a Safety Inspector at the Springfield Nuclear Power Plant. Homer is one of the most popular and famous fictional characters and is thought of as ", ["#em", "one of the greatest comedic animated characters of modern times"], "."]
                        ]
                    ]
                },
            ]
        }
    ]
}

export default response;
