import { SearchResponse } from "../types";

const response: SearchResponse = {
    type: "SearchResponse",
    totalMatchCount: 31200000,
    processingTime: 0.38,
    bundles: {
        "c": {
            // c : common bundle
            "ns": "asimo.dpademo.bundles.common",
            "src": "/dist-bundles/bundle-common.js"
        }
    },
    lang: "en", // default language
    header: [],
    main: [
        ["*c:imgList", {
            "height": 144,
            "imgs": [{
                "src": "data:image/png;base64,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",
                "width": 89,
                "alt": "Homer Simpson | Wiki Héros | Fandom",
                "lpage": "https://heros.fandom.com/fr/wiki/Homer_Simpson",
                "docid": "tsBAvLbQ5U2k4M",
                "ved": "2ahUKEwjczO7Zgub-AhUZVKQEHZ62Du0Q_R16BAgkEAA"
            }, {
                "src": "data:image/png;base64,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",
                "width": 117,
                "alt": "Homer simpsons Banque de photographies et d'images à haute ...",
                "lpage": "https://www.alamyimages.fr/photos-images/homer-simpsons.html",
                "docid": "UC-29Bsu7q4SWM",
                "ved": "2ahUKEwjczO7Zgub-AhUZVKQEHZ62Du0Q_R16BAhHEAA"
            }, {
                "src": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBwgHBgkIBwgKCgkLDRYPDQwMDRsUFRAWIB0iIiAdHx8kKDQsJCYxJx8fLT0tMTU3Ojo6Iys/RD84QzQ5OjcBCgoKDQwNGg8PGjclHyU3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3N//AABEIAJAATQMBIgACEQEDEQH/xAAbAAACAgMBAAAAAAAAAAAAAAAABgMFAQQHAv/EAD0QAAIBAwIDBAYHBgcBAAAAAAECAwAEEQUhEjFBBhMiYRQyUXGBkQcVI0JiobFDUqLB0fAzU3KSk6PxFv/EABkBAAIDAQAAAAAAAAAAAAAAAAACAwQFAf/EACkRAAICAQMCAwkAAAAAAAAAAAABAgMRBCExBRIyM0EUIiNRkcHR8PH/2gAMAwEAAhEDEQA/AO20UUUAFFat3ex20TySMqIgJZieQHM0tS9rbibUWsrK0mjEYy8skIlKkjIBUOvDkYO5zvyFLKUYLMnhHUm+Bvoqi03tBxju9Ut3tZAxAlwO6ce3IJ4Pcx57ZO2b2uQsjNZi8oGmuQooopzgUVmjFAGKw54VJ9gzWaCMjBoAUO1kr/VEkKMVe6bueMc1yCxPyU488Vr2FvFBbr3KBeMBmx1OOdWHaW077TpSmGe3YTIOrY2IHmVLAeZpftr17i2jtbNuKcTCIsMDhHCXzvtjAxnf5isHrFdts4Qjw/38FzTSjFNsuNsEEAjkQeRFWfZm5KRyadK3ig8UHEcloTjHv4SSnU4Ck7mqW60nUYYLm4km9HFs64ZpC6zKQMkbj2ldwDkZHQ1NDZLp2rWktleWcjB1h7uLZnV28a8OTgAKHz+DoKbpuj1Gmm+7hi32wsW3I4UUUVuFUzRWKKACiiigCp1m0W7ikt5VHdyKBllyDvncdaQNAWHv2gVDGrcRVA3ii8XEEznOU9XOBgiul37DgVM+LPKkPXVS41e+S07tpvQwjiPHEWxJscdcEc/bVDqUc05zjBNQ/fJptVmukVO9lu4EIK96yojEHY+Fct5Z22BHQ170y9kTVrOe6SNII2I4Y8kqWHCCSfujJyMeefDg19tIHjDMMxFcqYj8tjUthb3Oq3ElraW/iVftWmcBEBxsSuTkg5A2yPZzqCqn4iny182TSa7WuDpFFR20bxW0UcsrSuiBWkYYLkDcn386krWKYUUUUAFRSXEcZwzb+wb1i6lEUfPxNsKUe0N3PJLFp9i/jY8VxnOyY2GQep/L3gFLLI1xc5vCR2MXJ4Rv6prVspuBby99cKrBUjRpOFgNg3CDjfHOq/s1YafqqTTQTvHPHhWKkLKGO7GRSDufaR7cVNpF3LpEX28Vu8KAZ7mIqyL1xvggDoAKuLiztbnWEYoGMtsXMiMVZSpUKysNwSGIyDuFHsqGq6nVwfbuh5QlW9xavtJhgvZBMnEneBGuLd3iXvGGQrKG5kEeLO5IHPapOzOrfVV0+n3HGLFpZe6JQuQ5Z2yCNyhAcEtuGRt8EU3LYQehPZyBpYn4i/eHJYsckk+89OXSq/UrC1tpNKuViwtnMsSgFtlfwDrvhih3z1patKqrXKL2xwErO6OGWttcwXcCz2s0c0LerJG4ZT7iKlpa1GVrXtCz2BWNxCrXKcI4ZiSccXXiAGxHLO+RtV3pt9HqFqJ4gyEEq8b+tGw5qf7wdiNjU0boSm4J7rkVxaSbNqiiipRTQvsmcA8sbUo6V9otxcP/AIs07s+eY32HwGB8BTtdxd5Hkesv6UmXKDStTfi8NnevxRt0SU7sp9+5HvPsFZfV6p2af3PTcsaaSjPcmmkljZBDCJWkYIq5x4jyyfZ5/rmr/s7p9xZWUfpzKbkQxxEJyVUGAPmST78b4qjkXjRl4ip6MOanofgcGmXS7706FiyBJY24ZFByM4zkeRz/AHiqnQ519skvF9iTVp5T9DcqG+tkvbOa2kLKsqFSy8x5jzFT0VvlMR7WC5tZrqHUHEl53peSUftQdlb3EDGOmCN8Zq47Nk+n36j1THCx/wBXjH6KvyFeu00IVrS7UYIcwufwsNv4gvzNS9mIx6DNcfenuJCcdAh7sfkmfeTWPp9NKvXzlnZrP1/hZnYpUpFxRRRWwVjDKGUqeRGKVO1Vuw06WUIsgtC0rROMiRQrAj5EnkeVNlaWoIpKkgHiBBz1oA53pWuxxwyJeyoixg8AZ8yc9lxzbbqPjTd2d1DSba1PHqtibqdu8lUXAHCcYCgE5wAPicnrSDdwDTNWurCDeJZAq55hcKw+WcfCpOfOuaXpNNcpWw5kV7dfPaElwdU+sLLh4vTLbh9verj9a15de0iL1tStWI+6kgc/IZNc0VCx8Kkkb7DJqMTRH1GEp/djIIz5sNh+vkau+ypcyIva2+Ijvf6umvo2m6NBJLJlJTNL9iiKrqeoLcR6eH271c6DZS6fpcNrOVLJnCqxZUBJIUE7kAbZpe+j/aXUMnLFIWOOXOQbfKnGqc61GbZbhJyimFFFFAwVqahyT3mtutPUP2fxoA5l2iA/+oucfvJn/jWo69a2eLtReeUoH/Ulea1NP5aMjUeYyG6h79Y0MYkHGGKlc8uv51MK8Su0bwFDglmUnyPDmvdPHxNiS4Q29gFImvm6GKEfxS/1pwpR7BDxXx/BEPzk/rTdWZb42a1PlozRiiioyQxWnqHrJ7jW5WnqGMp7d6AOX6sOPtLqDAjwSgtk4+6oH6VjB9la3aG+W17T6hDwNInGC2/UqrYx19atP0+06WW/miVoVWxUEsmbdVJzbwbl1NH3tqinibjckLuQPB0FSiZTySX4xsP5VUXF/NM0Jt40TuSx4SOItxcOccv3eX68qx9Z3bD14x5qn9SaFfFNnHRJpHTfo+Ja2vWKFMOijixk7E9D+KmyuTdiO0kum35gunL207DvC33Ty4h7uo5YBPMb9ZqjN5k2aFaxFIKKKKUcK8SRJKMOM17ooATtc+j+z1O/lv4b2e2nlxxgqHQkADONiNgOtUN99G2pREfV99bXK4GfSOKJh7eQYH8q6fRXcnHFM5Mv0e9ouIYOnrjcE3LfySmPTvo7082oOqmRrpmJY287Kg8h/wCCnaijJxRSFyz7DdnrOUSpZPK4/wA+d5F/2k8P5Ux0UVwYKKKKAP/Z",
                "width": 77,
                "alt": "Simpson homer Banque d'images détourées - Alamy",
                "lpage": "https://www.alamyimages.fr/photos-images/simpson-homer.html?cutout=1",
                "docid": "0ZWjWkpvTfV0VM",
                "ved": "2ahUKEwjczO7Zgub-AhUZVKQEHZ62Du0Q_R16BAhBEAA"
            }, {
                "src": "data:image/jpeg;base64,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",
                "width": 210,
                "alt": "Comment dessiner Homer Simpson [Tutoriel]",
                "lpage": "https://www.youtube.com/watch?v=77Rw0Y-kp18",
                "docid": "UgkWp3XhBEU0CM",
                "ved": "2ahUKEwjczO7Zgub-AhUZVKQEHZ62Du0Q_R16BAgxEAA"
            }, {
                "src": "data:image/png;base64,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",
                "width": 146,
                "alt": "Did Homer Simpson Actually Solve Fermat's Last Theorem? Take ...",
                "lpage": "https://www.npr.org/sections/krulwich/2014/05/08/310818693/did-homer-simpson-actually-solve-fermat-s-last-theorem-take-a-look",
                "docid": "T8Zu4QNEsW6SDM",
                "ved": "2ahUKEwjczO7Zgub-AhUZVKQEHZ62Du0Q_R16BAgrEAA"
            }],
            "button": {
                "text": "More images",
                "icon": ["*c:img", {
                    "height": 20, "width": 20,
                    "noalt": true, // non-content image -> aria-hidden:true
                    "svg": ["#svg",
                        { "focusable": false, "viewBox": "0 0 24 24" },
                        ["#path", { d: "M14 13l4 5H6l4-4 1.79 1.78L14 13zm-6.01-2.99A2 2 0 0 0 8 6a2 2 0 0 0-.01 4.01zM22 5v14a3 3 0 0 1-3 2.99H5c-1.64 0-3-1.36-3-3V5c0-1.64 1.36-3 3-3h14c1.65 0 3 1.36 3 3zm-2.01 0a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h7v-.01h7a1 1 0 0 0 1-1V5" }]
                    ]
                }],
                // note: should be JSON struct instead of href
                "action": "https://www.google.com/search?rlz=1C5CHFA_enFR857FR857&amp;sxsrf=APwXEdcYnZJlKJpHOrmzCBwe330HRQ8fMA:1683559185890&amp;q=homer+simpson&amp;tbm=isch&amp;source=univ&amp;fir=G4nDz9x21hzTLM%252CtsBAvLbQ5U2k4M%252C_%253BGZ2KL1SflFxScM%252CUC-29Bsu7q4SWM%252C_%253BbRpBjgg_IDUFnM%252C0ZWjWkpvTfV0VM%252C_%253BUgkWp3XhBEU0CM%252CHf6OBcpatRPtsM%252C_%253Bcg89si06cNwTWM%252CT8Zu4QNEsW6SDM%252C_&amp;usg=AI4_-kTZWNgwhri0dtTbp38CPKvAOKmsTg&amp;sa=X&amp;ved=2ahUKEwjczO7Zgub-AhUZVKQEHZ62Du0QiR56BAhLEAM"
            }
        }],

        // results card #1
        ["*c:rcard.div", {
            "lang": "fr",
            "header": {
                "title": "Homer Simpson",
                "href": "https://fr.wikipedia.org/wiki/Homer_Simpson",
                "src": {
                    "name": "Wikipedia",
                    "ref": "https://fr.wikipedia.org › wiki › Ho...",
                    "logo": ["*c:img", { "height": 18, "width": 18, "src": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAAAM1BMVEUAAAD+/v41NTUBAQEAAABZWVknJycWFhaZmZmIiIjp6ellZWXMzMzX19eurq54eHhHR0dExXFyAAAAAXRSTlMAQObYZgAAAPtJREFUeAG8kAWOBDAMA9d1Sin+/7XXbpZZdBaURlMrhx28ycGCD/n0bvkBwJf8C+AoIvRAWGtMyHGtCWkfxW+DRopuuIjUtTQJDStevNoXWaRjRSllLd1O8FFhgEZx2BmkAmHC8HwpOUyxSA50VqOjXgAl50URvNWPBRcAnmwnhbcduthqQCO9KYTFBG7eDWoK1T47AZX9DuiUYT/TuhX3MGpnD51kPprSA9Dl+BCKl7jWHHEHmHsLWhNZZMxPQCLTEuy+cYF6D9i8Q5e2Lcyz4AGwKdJbX0p7AegC2qnvxAsAxQRAYH8J6Dg1a/lvpKRJinMW4cxLMPsDAJjSCaG8cPmnAAAAAElFTkSuQmCC" }]
                },
                "misc": [
                    ["#a", { "lang": "en", "href": "https://translate.google.com/translate?hl=en&amp;sl=fr&amp;u=https://fr.wikipedia.org/wiki/Homer_Simpson&amp;prev=search&amp;pto=aue" }, "Translate this page"],
                    ["*c:about"]
                ]
            },
            "sideContent": ["*c:img", {
                "height": 92, "width": 92,
                "alt": "homer simpson from fr.wikipedia.org",
                "href": "https://fr.wikipedia.org/wiki/Homer_Simpson",
                "src": "data:image/jpeg;base64,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"
            }],
            "footerLinks": [
                ["#a.link", { "href": "https://fr.wikipedia.org/wiki/Homer_Simpson#Personnage" }, "Personnage"],
                ["#a.link", { "href": "https://fr.wikipedia.org/wiki/Homer_Simpson#Voix" }, "Voix"],
                ["#a.link", { "href": "https://fr.wikipedia.org/wiki/Homer_Simpson#Analyse" }, "Analyse"],
                ["#a.link", { "href": "https://fr.wikipedia.org/wiki/Homer_Simpson#Influence_culturelle" }, "Influence"]
            ]
        }, ["#div.p",
                ["#em", "Homer"], " est le mari maladroit de Marge et le père de Bart, Lisa et Maggie ",
                ["#em", "Simpson"], ". Il a été élevé par ses parents, Mona et Abraham ",
                ["#em", "Simpson"], "; dans l'épisode La ..."
            ],
            ["*c:facts.div", {
                "entries": [
                    { "name": "Naissance", "value": "12 mai 1956" },
                    {
                        "name": "Famille",
                        "value": [
                            "Père: ", ["#a.link", { "href": "https://fr.wikipedia.org/wiki/Abraham_Simpson" }, "Abraham Simpson "],
                            "Mère: ", ["#a.link", { "href": "https://fr.wikipedia.org/wiki/Mona_Simpson" }, "Mona ... "]
                        ]
                    }
                ]
            }]
        ],

        // ", ["#em", "Simpson"], "

        ["*c:accordion", {
            "title": "People also ask",
            "ved": "2ahUKEwjczO7Zgub-AhUZVKQEHZ62Du0Q2esEegQIdRAC",
            "sections": [
                {
                    "title": "What is Homer's IQ?", "key": "2ahUKEwjczO7Zgub-AhUZVKQEHZ62Du0Qq7kBKAB6BAhhEAA", "content": [
                        ["*c:rcard.div", {
                            "lang": "en",
                            "header": {
                                "title": "Homer Simpson - Wikipedia",
                                "pos": "last",
                                "href": "https://en.wikipedia.org/wiki/Homer_Simpson#:~:text=Homer%20has%20a%20low%20IQ,to%20radioactive%20waste%2C%20repetitive%20cranial",
                                "src": {
                                    "name": "Wikipedia",
                                    "ref": "https://en.wikipedia.org › wiki › Homer_Simpson",
                                    "logo": ["*c:img", { "height": 18, "width": 18, "src": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAAAM1BMVEUAAAD+/v41NTUBAQEAAABZWVknJycWFhaZmZmIiIjp6ellZWXMzMzX19eurq54eHhHR0dExXFyAAAAAXRSTlMAQObYZgAAAPtJREFUeAG8kAWOBDAMA9d1Sin+/7XXbpZZdBaURlMrhx28ycGCD/n0bvkBwJf8C+AoIvRAWGtMyHGtCWkfxW+DRopuuIjUtTQJDStevNoXWaRjRSllLd1O8FFhgEZx2BmkAmHC8HwpOUyxSA50VqOjXgAl50URvNWPBRcAnmwnhbcduthqQCO9KYTFBG7eDWoK1T47AZX9DuiUYT/TuhX3MGpnD51kPprSA9Dl+BCKl7jWHHEHmHsLWhNZZMxPQCLTEuy+cYF6D9i8Q5e2Lcyz4AGwKdJbX0p7AegC2qnvxAsAxQRAYH8J6Dg1a/lvpKRJinMW4cxLMPsDAJjSCaG8cPmnAAAAAElFTkSuQmCC" }]
                                }
                            }
                        },
                            ["#p.text-lg", "55"],
                            ["#p.pt-3", "Homer has a low IQ of ", ["#em", "55"], ", which would actually make him unable to speak or perform basic tasks, and has variously been attributed to the hereditary \"Simpson Gene\" (which eventually causes every male member of the family to become incredibly stupid), his alcohol problem, exposure to radioactive waste, repetitive cranial ..."]
                        ]
                    ]
                },
                {
                    "title": "What was Homer Simpson originally called", "key": "2ahUKEwjczO7Zgub-AhUZVKQEHZ62Du0Qq7kBKAB6BAhfEAA", "content": [
                        ["*c:rcard.div", {
                            "lang": "en",
                            "header": {
                                "title": "Homer Simpson - Wikisimpsons",
                                "pos": "last",
                                "href": "https://simpsonswiki.com/wiki/Homer_Simpson#:~:text=Homer%20Jay%20Simpson%2C%20formerly%20known,to%20his%20wife%20and%20children",
                                "src": {
                                    "name": "Wikisimpsons",
                                    "ref": "https://simpsonswiki.com › wiki › Homer_Simpson",
                                    "logo": ["*c:img", { "height": 18, "width": 18, "src": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAACWUlEQVR4AZ2NA3AdQQCGN7aN2rZt2xjbGdevwwxr27Zt312erdh85v3NthM7393yx5LuAlkkQUHdQT20a2HdVAIJ+V8A7eS6tk5DvfUFfN629Crh1NEoaMOYs6n5rU/ur2WZ5UwfnfJlr94k7/vsIl4T7qn43XND8/AdwI83HBwEwKfu/s4d+Lmk/VmUBMGjmrKBlPyeYkWRD2qYXqcbh0+fZkOrJEtvenJmWmu4/itIHYCPQ5j4FXkhcMsnriZFzKL9KAhB1c/Ya40Lsj8OvYzcMCCfwC6Kf0iDVNNoBJFe1QAjtP4wvE9YSNRP56bx8nDYmND7dQXGb1PnQBkDGHxqB4FdmFQq/CiIpppN1renSxhmhyoIJcy4aUQg+Ohv+RNX5pH2/kJfpsPGJT/jpeFFNi5uu40Lf8Mro/n834um0AK3dt5sryKE98rCebN8xTBCsWWlPLWL0nNpWPpqwCiow+AQhV+gWu77QVuRG4TSX8My6bn6z7DNyA2FVxolxcdZ/oRS+nPEHujC4ZSkHXcIw1joQ1AjSl3+T+PWzoQyABW/+pbmKI+musVRmSiOrPXGHyd1GL6vnemVRgLGYCDPF1YuTciybADVir4vSLSxYVXQBKNKseWkW5yigzYUdsXUhaQO2R1BYA2TIoWRANo4FIm2bqrTAPiamcTvMBC4pCmAJgwuYayhTLkygjSm9NeQXagIQfGPsQwRwL+xZvw8cSdyQgA9AYyBcEhHZZDmlHAr+pf+Gfvwz4ttE1poso/hNVmj7lkkkYaaP2kZpDtAO51A2Ys05y+gJ3hl6ACK/AAAAABJRU5ErkJggg==" }]
                                }
                            }
                        },
                            ["#p", "Homer Jay Simpson, formerly known as ", ["#em", "Max Power"], ", is the father of the Simpson family. He is overweight, lazy, and ignorant, but also strongly devoted to his wife and children."]
                        ]
                    ]
                },
                {
                    "title": "What does Homer Simpson always say?", "key": "2ahUKEwjczO7Zgub-AhUZVKQEHZ62Du0Qq7kBKAB6BAhkEAA", "content": [
                        ["*c:rcard.div", {
                            "lang": "en",
                            "header": {
                                "title": "\"D'oh!\" ( - d - Wikipedia",
                                "pos": "last",
                                "href": "https://en.wikipedia.org/wiki/D%27oh!#:~:text=%22D'oh!%22%20(,about%20to%20happen%20to%20him.",
                                "src": {
                                    "name": "Wikipedia",
                                    "ref": "https://en.wikipedia.org › wiki",
                                    "logo": ["*c:img", { "height": 18, "width": 18, "src": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAAAM1BMVEUAAAD+/v41NTUBAQEAAABZWVknJycWFhaZmZmIiIjp6ellZWXMzMzX19eurq54eHhHR0dExXFyAAAAAXRSTlMAQObYZgAAAPtJREFUeAG8kAWOBDAMA9d1Sin+/7XXbpZZdBaURlMrhx28ycGCD/n0bvkBwJf8C+AoIvRAWGtMyHGtCWkfxW+DRopuuIjUtTQJDStevNoXWaRjRSllLd1O8FFhgEZx2BmkAmHC8HwpOUyxSA50VqOjXgAl50URvNWPBRcAnmwnhbcduthqQCO9KYTFBG7eDWoK1T47AZX9DuiUYT/TuhX3MGpnD51kPprSA9Dl+BCKl7jWHHEHmHsLWhNZZMxPQCLTEuy+cYF6D9i8Q5e2Lcyz4AGwKdJbX0p7AegC2qnvxAsAxQRAYH8J6Dg1a/lvpKRJinMW4cxLMPsDAJjSCaG8cPmnAAAAAElFTkSuQmCC" }]
                                }
                            },
                            "sideContent": ["*c:img", {
                                // "height": 157, "width": 218,
                                "height": 79, "width": 109,
                                "alt": "homer simpson from en.wikipedia.org",
                                "href": "https://en.wikipedia.org/wiki/Homer_Simpson",
                                "src": "data:image/jpeg;base64,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"
                            }],
                        },
                            ["#p", ["#em", "\"D'oh!\" (/doʊʔ/)"], " is the most famous catchphrase used by the fictional character Homer Simpson, from The Simpsons, an animated sitcom. It is an exclamation typically used after Homer injures himself, realizes that he has done something foolish, or when something bad has happened or is about to happen to him."]
                        ]
                    ]
                },

                {
                    "title": "Has Homer Simpson got ADHD? ", "key": "2ahUKEwjczO7Zgub-AhUZVKQEHZ62Du0Qq7kBKAB6BAheEAA", "content": [
                        ["*c:rcard.div", {
                            "lang": "en",
                            "header": {
                                "title": "10 Book Characters Who Make Us Smile - Reviews – ADDitude",
                                "pos": "last",
                                "href": "https://www.additudemag.com/reviews/slideshow/fictional-characters-with-adhd-books-we-love#:~:text=There%20are%20so%20many%20examples,families%2C%20it's%20actually%20genetic).",
                                "date": "June 11, 2021",
                                "src": {
                                    "name": "ADDitude Magazine",
                                    "ref": "https://www.additudemag.com › reviews › slideshow › fi...",
                                    "logo": ["*c:img", { "height": 18, "width": 18, "src": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAAAYFBMVEXCNifMWEzSa2DOXlL24uD////78fDEPi/Vc2njpJ7qubT35uTQZlrWeG7lq6X56+r9+PjotK7swr3YfXTahXzISjzGQzTy1dLgmJHtxcDGRTf++/vvy8fcjITJTkHek4toeNAvAAAAyElEQVR4AaXRBZKEMABE0UYad3fuf8q1SKWGwNrD9SP4BcfVPNj41IIQVx4NEa5iGhJcpeRjIyNNOV4V5HOj5BdfLqvXhkshLm4aNYUssjfCgF9KhJW1oa4rgIZCC1NCwQU6Cg0M6r4BgJ6yMUBDTqEGgNHSaMx/NF0bg3ryfviQXRstbYzGTKsZ0rLSalWNjjc6CBv52Oh5Z13waaeU1NJmNIwv50MZVgobAByUYmiz2TgpZdA6s6EKJWBtHKkUw5DInf6Af3sHQ00QpBT47HIAAAAASUVORK5CYII=" }]
                                }
                            }
                        },
                            ["#p", "There are so many examples , especially in the first 9 seasons of The Simpsons where ", ["#em", "Homer exemplifies the ADHD spectrum"], ". His son Bart has the garden variety version of ADD , but his symptoms will probably get worse as an adult. (Daniel Amen says the disorder runs in families, it's actually genetic)."]
                        ]
                    ]
                },
            ]
        }],

        // results card #2
        ["*c:rcard.div", {
            "lang": "en",
            "header": {
                "title": "Homer Simpson",
                "href": "https://en.wikipedia.org/wiki/Homer_Simpson",
                "src": {
                    "name": "Wikipedia",
                    "ref": "https://en.wikipedia.org › wiki › Homer_Simpson",
                    "logo": ["*c:img", { "height": 18, "width": 18, "src": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAAAM1BMVEUAAAD+/v41NTUBAQEAAABZWVknJycWFhaZmZmIiIjp6ellZWXMzMzX19eurq54eHhHR0dExXFyAAAAAXRSTlMAQObYZgAAAPtJREFUeAG8kAWOBDAMA9d1Sin+/7XXbpZZdBaURlMrhx28ycGCD/n0bvkBwJf8C+AoIvRAWGtMyHGtCWkfxW+DRopuuIjUtTQJDStevNoXWaRjRSllLd1O8FFhgEZx2BmkAmHC8HwpOUyxSA50VqOjXgAl50URvNWPBRcAnmwnhbcduthqQCO9KYTFBG7eDWoK1T47AZX9DuiUYT/TuhX3MGpnD51kPprSA9Dl+BCKl7jWHHEHmHsLWhNZZMxPQCLTEuy+cYF6D9i8Q5e2Lcyz4AGwKdJbX0p7AegC2qnvxAsAxQRAYH8J6Dg1a/lvpKRJinMW4cxLMPsDAJjSCaG8cPmnAAAAAElFTkSuQmCC" }]
                }
            },
            "sideContent": ["*c:img", {
                "height": 92, "width": 92,
                "alt": "homer simpson from en.wikipedia.org",
                "href": "https://en.wikipedia.org/wiki/Homer_Simpson",
                "src": "data:image/jpeg;base64,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"
            }],
            "footerLinks": [
                ["#a.link", { "href": "https://en.wikipedia.org/wiki/Homer_Simpson#Role_in_The_Simpsons" }, "Role in The Simpsons"],
                ["#a.link", { "href": "https://en.wikipedia.org/wiki/Homer_Simpson#Character" }, "Character"],
                ["#a.link", { "href": "https://en.wikipedia.org/wiki/Homer_Simpson#Reception" }, "Reception"],
                ["#a.link", { "href": "https://en.wikipedia.org/wiki/Homer_Simpson#Cultural_influence" }, "Cultural influence"]
            ]
        }, ["#div.p",
                ["#em", "Homer"], " Jay  ",
                ["#em", "Simpson"], " is a fictional character and the main protagonist of the American animated sitcom The ",
                ["#em", "Simpsons"], ". He is voiced by Dan Castellaneta and first ..."
            ],
            ["*c:facts.div", {
                "entries": [
                    { "name": "Voiced by", "value": ["#a.link", { "href": "http://en.wikipedia.org/wiki/Dan_Castellaneta" }, "Dan Castellaneta"] },
                    {
                        "name": "First appearance", "value": [
                            ["#a.link", { "href": "http://en.wikipedia.org/wiki/Good_Night_(The_Simpsons)" }, "Good Night"], "; ",
                            ["#a.link", { "href": "http://en.wikipedia.org/wiki/The_Tracey_Ullman_Show" }, "The Tra"], "..."
                        ]
                    },
                    {
                        "name": "Home", "value": [
                            ["#a.link", { "href": "http://en.wikipedia.org/wiki/The_Simpsons_house" }, "742 Evergreen Terrace"], ", ",
                            ["#a.link", { "href": "http://en.wikipedia.org/wiki/Springfield_(The_Simpsons)" }, "Springfield"], "..."
                        ]
                    },
                    {
                        "name": "Family", "value": [
                            ["#a.link", { "href": "http://en.wikipedia.org/wiki/Abraham_Simpson" }, "Abraham Simpson"], " (father); ",
                            ["#a.link", { "href": "http://en.wikipedia.org/wiki/Mona_Simpson_(The_Simpsons)" }, "Mona"], "..."
                        ]
                    }
                ]
            }]
        ],

        // results card #3
        ["*c:rcard.div", {
            "lang": "en",
            "header": {
                "title": "Homer Simpson - Simpsons Wiki - Fandom",
                "href": "https://simpsons.fandom.com/wiki/Homer_Simpson › wiki › Homer_Simpson",
                "src": {
                    "name": "Fandom",
                    "ref": "https://simpsons.fandom.com ",
                    "logo": ["*c:img", { "height": 18, "width": 18, "src": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAASklEQVR4AWOAgv9Qmiz+/3+PwQL/SeVT0wAIhrIJ8zENIAXT34BRA4DyUIzJR0qWuDUjAax8pJSF1wAQG5OPMIC2LiBsABCTHYgAlfwb/kEd2zYAAAAASUVORK5CYII=" }]
                }
            },
            "sideContent": ["*c:img", {
                "height": 92, "width": 92,
                "alt": "homer simpson from simpsons.fandom.com",
                "href": "https://simpsons.fandom.com/wiki/Homer_Simpson",
                "src": "data:image/jpeg;base64,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"
            }],
            "footerLinks": [
                ["#a.link", { "href": "https://simpsons.fandom.com/wiki/Homer_Simpson#Biography" }, "Biography"],
                ["#a.link", { "href": "https://simpsons.fandom.com/wiki/Homer_Simpson#Personality" }, "Personality"],
                ["#a.link", { "href": "https://simpsons.fandom.com/wiki/Homer_Simpson#Relationships" }, "Relationships"],
                ["#a.link", { "href": "https://simpsons.fandom.com/wiki/Homer_Simpson#Non-Canon_Appearances" }, "Non-Canon Appearances"],
            ]
        }, ["#div.p",
                ["#em", "Homer"], " Jay ", ["#em", "Simpson"],
                " is a man from Springfield. He is the husband of Marge ", ["#em", "Simpson"],
                " and father of Bart, Lisa and Maggie ", ["#em", "Simpson"], ". ",
                ["#em", "Homer"], " is overweight(said to be ..."
            ],
            ["*c:facts.div", {
                "entries": [
                    { "name": "First episode appearance", "value": "\"Good Night\"" },
                    { "name": "Character played by", "value": "Dan Castellaneta; ..." },
                    { "name": "Hair Color", "value": "Bald; Brown (naturally)" },
                    { "name": "Occupation/Career", "value": "Currently: Safety in..." },
                ]
            }]
        ],

        ["*c:rcard.div", {
            "lang": "fr",
            "header": {
                "title": "Homer Simpson | Wiki Les Simpson | Fandom",
                "href": "https://simpsons.fandom.com/fr/wiki/Homer_Simpson",
                "src": {
                    "name": "Fandom",
                    "ref": "https://simpsons.fandom.com › wiki",
                    "logo": ["*c:img", { "height": 18, "width": 18, "src": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAASklEQVR4AWOAgv9Qmiz+/3+PwQL/SeVT0wAIhrIJ8zENIAXT34BRA4DyUIzJR0qWuDUjAax8pJSF1wAQG5OPMIC2LiBsABCTHYgAlfwb/kEd2zYAAAAASUVORK5CYII=" }]
                }
            },
            "sideContent": ["*c:img", {
                "height": 92, "width": 92,
                "alt": "homer simpson from simpsons.fandom.com",
                "href": "https://simpsons.fandom.com/fr/wiki/Homer_Simpson",
                "src": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQnv-jTrHvJP1vqKksElMApNWtKni3LHYZ_dtRA9bPCBHvMsvGW57Ix&amp;usqp=CAE&amp;s"
            }],
        }, ["#div.p",
                ["#em", "Homer"], " est le quelqu'un de plutôt gentil et d'amical, mais il est stupide, obèse, maladroit, gourmand, peu cultivé, un ivrogne et colérique. ... Il travaille dans ..."
            ],
            ["*c:facts.div", {
                "entries": [
                    { "name": "Date de naissance", "value": "12 mai 1956" },
                    { "name": "Date de décès", "value": "2015 (59 ans)(L'Échelle..." },
                    { "name": "Lieu d'origine", "value": "Maison de fermier" },
                    { "name": "Âge", "value": "39 ans (Tous les huit ans)" },
                ]
            }]
        ],

        ["*c:rcard.div", {
            "lang": "fr",
            "header": {
                "title": "Personnages - Homer Simpson",
                "href": "https://www.simpsonspark.com/personnages/homer-simpson",
                "src": {
                    "name": "The Simpsons Park",
                    "ref": "https://www.simpsonspark.com › ho...",
                    "logo": ["*c:img", { "height": 18, "width": 18, "src": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBwgBBgkIBwgKCgkLDRYPDQwMARsUFRAWIB0iIiAdHx8kKDQsJCYxJx8fLT0tMTU3Ojo6Iys/RD84QzQ5OjcBCgoKDQwBGg8PGjclHyU3NzU3Ny83Nzc1NzU3Nys3NzU3Nzc3LTU1Ky03LSsrLSs1Ky0sNS0rKy0rKys3KystK//AABEIABAAEAMBEQACEQEDEQH/xAAVAAEBAAAAAAAAAAAAAAAAAAAFBP/EACUQAAEDAgUEAwAAAAAAAAAAAAECAxEEEgAGITFRBwgyQRMiYv/EABcBAAMBAAAAAAAAAAAAAAAAAAMEBQL/xAAgEQABBAICAwEAAAAAAAAAAAACAAEDBAYREjIHEzEF/9oADAMBAAIRAxEAPwBjK9Q/m9pVAhx2FKFqU56tgazGsesN/qOY4A5Q9lOqAxZezH8T9IpXTJy1K6r4yhLiLM+yqDPJ2094jVbxReJ+Vt05PV3mbelEMMjuFtbpKRtpwgWoPSlSBMSR4/kjiTgFV5JsPJydNzC0ebi2lQlh/tYCnq5kMoV9jZlY+II325wOauT+K+u1sS5Zzpl//9k=" }]
                }
            },
            "sideContent": ["*c:img", {
                "height": 92, "width": 92,
                "alt": "homer simpson from www.simpsonspark.com",
                "href": "https://www.simpsonspark.com/personnages/homer-simpson",
                "src": "data:image/png;base64,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"
            }],
        }, ["#div.p",
                ["#em", "Homer"], " ", ["#em", "Simpson"], " est un père de famille de 39 ans qui travaille au poste d'inspecteur de la sécurité dans une centrale nucléaire. Fainéant et gras, ",
                ["#em", "Homer"], " passe ...",
            ],
        ],

        ["*c:rcard.div", {
            "lang": "en",
            "header": {
                "title": "Homer Simpson",
                "href": "https://simpsonswiki.com/wiki/Homer_Simpson",
                "src": {
                    "name": "Wikisimpsons",
                    "ref": "https://simpsonswiki.com › wiki › Homer_Simpson",
                    "logo": ["*c:img", { "height": 18, "width": 18, "src": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAACWUlEQVR4AZ2NA3AdQQCGN7aN2rZt2xjbGdevwwxr27Zt312erdh85v3NthM7393yx5LuAlkkQUHdQT20a2HdVAIJ+V8A7eS6tk5DvfUFfN629Crh1NEoaMOYs6n5rU/ur2WZ5UwfnfJlr94k7/vsIl4T7qn43XND8/AdwI83HBwEwKfu/s4d+Lmk/VmUBMGjmrKBlPyeYkWRD2qYXqcbh0+fZkOrJEtvenJmWmu4/itIHYCPQ5j4FXkhcMsnriZFzKL9KAhB1c/Ya40Lsj8OvYzcMCCfwC6Kf0iDVNNoBJFe1QAjtP4wvE9YSNRP56bx8nDYmND7dQXGb1PnQBkDGHxqB4FdmFQq/CiIpppN1renSxhmhyoIJcy4aUQg+Ohv+RNX5pH2/kJfpsPGJT/jpeFFNi5uu40Lf8Mro/n834um0AK3dt5sryKE98rCebN8xTBCsWWlPLWL0nNpWPpqwCiow+AQhV+gWu77QVuRG4TSX8My6bn6z7DNyA2FVxolxcdZ/oRS+nPEHujC4ZSkHXcIw1joQ1AjSl3+T+PWzoQyABW/+pbmKI+musVRmSiOrPXGHyd1GL6vnemVRgLGYCDPF1YuTciybADVir4vSLSxYVXQBKNKseWkW5yigzYUdsXUhaQO2R1BYA2TIoWRANo4FIm2bqrTAPiamcTvMBC4pCmAJgwuYayhTLkygjSm9NeQXagIQfGPsQwRwL+xZvw8cSdyQgA9AYyBcEhHZZDmlHAr+pf+Gfvwz4ttE1poso/hNVmj7lkkkYaaP2kZpDtAO51A2Ys05y+gJ3hl6ACK/AAAAABJRU5ErkJggg==" }]
                }
            },
            "sideContent": ["*c:img", {
                "height": 92, "width": 92,
                "alt": "homer simpson from simpsonswiki.com",
                "href": "https://simpsonswiki.com/wiki/Homer_Simpson",
                "src": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRseqE-ZQ_AxH6UHaR-loGrJdF_xH337ar4dmCkpOulzL5OwmhScR0N&amp;usqp=CAE&amp;s"
            }],
        }, ["#div.p",
                ["#em", "Homer"], " is the husband of Marge ", ["#em", "Simpson"], ". They met when they were younger without learning who each other was before meeting again properly in high ...",
            ],
            ["*c:facts.div", {
                "entries": [
                    { "name": "Age", "value": "36; 38; 39" },
                    { "name": "First appearance", "value": "\"Good Night\"" },
                    { "name": "Alias(es)", "value": "Homer Thompson; Pierman; ..." },
                    { "name": "Hair", "value": "None (formerly brown)" },
                ]
            }]
        ],

        ["*c:rcard.div", {
            "lang": "fr",
            "header": {
                "title": "425 photos et images de Homer Simpson",
                "href": "https://www.gettyimages.fr/photos/homer-simpson",
                "src": {
                    "name": "Getty Images",
                    "ref": "https://www.gettyimages.fr › photos",
                    "logo": ["*c:img", { "height": 18, "width": 18, "src": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAAAAABWESUoAAABE0lEQVR4AWIwJgAArZOtjoQwFIUfalUVCl9TwyoErqYOOaqSF0BNgkIhQY5EV/UBKkdVVd3tbZZ0t7czao4gJ7dfcn9O+CzA79aDPzX7kqcHCszwK7filwAbZNWAEYvhmB+AmuV3CdhYfopohhDdnQzZQpROFidwBOgRELkZKwGBVZnsVAWYj9UTXeNwGnqoBZBQXFk0GwUaC1mBV07dmvw+1rLQ/nreeS0sTMLO+jb21wKVNZs3cd8QeCjRvgI6uOTduSpWnyHLDXQL9fxLhK489YHVY1l2EwC1ZyBn3CbbTIi4AsAr6ZwLBSBqudoZXLkAbOo79oJ3OvmhABT810TWlA6ynKqkydRq8BTebPKjP+8P/Fi0zJneIpUAAAAASUVORK5CYII=" }]
                }
            }
        }, ["*c:imgList", {
            "height": 114,
            "href": "https://www.gettyimages.fr/photos/homer-simpson",
            "imgs": [
                {
                    "src": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTMt9L8xqVCOuY5Tnm-y2yBD4AlTK7OODHFNOaQgiSoye8vqEkL3PKvMiswhkDqlcOa0xw&amp;s",
                    "width": 92
                },
                {
                    "src": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQZ_R3_mwYLK_01X4ZrQT3XDem29i5VjWmONRXIKKG6mCRhacGmj2vngJfAPcXXXS7LIklL&amp;s",
                    "width": 138
                },
                {
                    "src": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTYEHoNMkTubu20O_OHjJ3wEjuKqIuqwFa5B3kKP1ML4-qq60v4Wl3qmM9k548UlJeAhhAz&amp;s",
                    "width": 138
                },
                {
                    "src": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQY29Lmq_FQkgQIxqVbK2cOn6mOVxufJLPUyG0GXS9L5QLsp6FZXu4lCzy-Qe6GsSwOWsZA&amp;s",
                    "width": 138
                },
                {
                    "src": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRdyDPLw4EGyyEzuFhX0Q8qj7ub_6QDA11eEYeWFp-vb1jJLsMREOHK-2Pqx87UOm-xJoja&amp;s",
                    "width": 138
                }
            ]
        }],
            ["#div", "Trouvez des images et des photos d'actualités de ", ["#em", "Homer"], " ", ["#em", "Simpson"], " sur Getty Images. Choisissez parmi 425 des contenus premium de ", ["#em", "Homer"], " ", ["#em", "Simpson"], " de qualité."]
        ],


        // ["*c:rcard.div", {
        //     "lang": "en",
        //     "header": {
        //         "title": "xx",
        //         "href": "",
        //         "src": {
        //             "name": "ABC",
        //             "ref": "abc",
        //             "logo": ["*c:img", { "height": 18, "width": 18, "src": "" }]
        //         }
        //     },
        //     "sideContent": ["*c:img", {
        //         "height": 92, "width": 92,
        //         "alt": "",
        //         "href": "",
        //         "src": ""
        //     }],
        //     "footerLinks": [
        //         ["#a.link", { "href": "" }, "x"],
        //         ["#a.link", { "href": "" }, "x"],
        //         ["#a.link", { "href": "" }, "x"],
        //     ]
        // }, ["#div.p",
        //         ["#em", "Homer"], "  ",
        //         ["#em", "Simpson"], "  ",
        //         ["#em", "Simpsons"], "..."
        //     ],
        //     ["*c:facts.div", {
        //         "entries": [
        //             { "name": "xx", "value": ["#a.link", { "href": "" }, ".."] },
        //             { "name": "xx", "value": ["#a.link", { "href": "" }, ".."] },
        //         ]
        //     }]
        // ],


        // legal notice
        ["*c:section", { "className": "italic" },
            "Some results may have been removed under data protection law in Europe.",
            ["#a.link", { "href": "https://www.google.com/policies/faq" }, "Learn more"]
        ],

        // pagination
        // ["*c:pages", { "current": 1 }] // TODO: action
    ],
    sidebar: [
        ["*c:section", { "title": "About" },
            ["#p", "Homer Jay Simpson is a fictional character and the main protagonist of the American animated sitcom The Simpsons. He is voiced by Dan Castellaneta and first appeared, along with the rest of his family, in The Tracey Ullman Show short \"Good Night\" on April 19, 1987. "],
            ["#p", ["#a.link", { "href": "https://en.wikipedia.org/wiki/Homer_Simpson" }, "Wikipedia"]]
        ],
        ["*c:facts.div", {
            "cols": 1,
            "entryClassName": "text-sm pt-1",
            "entries": [
                { "name": "Status", "value": "Alive" },
                { "name": "Age", "value": "39" },
                {
                    "name": "Occupation", "value": [
                        ["#a.link", { "href": "https://www.google.com/search?rlz=1C5CHFA_enFR857FR857&sxsrf=APwXEdcYnZJlKJpHOrmzCBwe330HRQ8fMA:1683559185890&q=Nuclear+Safety+Inspector&si=AMnBZoG3cRyxvViEiVWeqgrn-CuWcnxp6_6_G7EH225wAKYHQp_w0GOm6Lo5uctH41jXKv4puOmb2PIgtNe7ErjKwFd7QcoED6lbpNdh0c7zJCM2uwaG0GKEC1T9SCDEg30_CgDXJUyMcPd8WeyQ-SG4WQw4LSI8F1PJmCP5BbrGqK4r7gZEndZx1Vvv29V4Q5EammXwixTrNCu6WGHz4-l-7G9FSYAOPPz9CUf2sh2KDWAwWNH91r5eEesPTp_3MAE_OkXY7TGSyK2iV6B_h0J-lW1VNXSGUg%3D%3D&sa=X&ved=2ahUKEwjczO7Zgub-AhUZVKQEHZ62Du0QmxMoAHoECGsQAg" }, "Nuclear Safety Inspector"], ", ",
                        ["#a.link", { "href": "https://www.google.com/search?rlz=1C5CHFA_enFR857FR857&sxsrf=APwXEdcYnZJlKJpHOrmzCBwe330HRQ8fMA:1683559185890&q=Former+Technical+Supervisor&si=AMnBZoEZ8aFftZu792frFYrnK9KQYGXRL3UTeDeHB9-uc0sfFfrjlpFtIOkIat1VMCutduV0xx45JTtKGxL5PBnYPvDeZBZFhi64wZ40stYBVxuAHprY_IRE6KOoJjqcjMVGLgVienIxpq8FUDBXxaXAsqLgvQ_3ujPhwyQTjBa2RqD9g8LAJKQ4G4kV2WFFEEKhCfdJlfO443ZdkeD7YjEJlXuVpZKcJxVK_wLiwogp53nAg9NqTAj2Nikxe1Ydchct-0-_o_iqAH28fn7SdTDiPkY-xjcRd1vHETuipLWz-y74fl8B6oI%3D&sa=X&ved=2ahUKEwjczO7Zgub-AhUZVKQEHZ62Du0QmxMoAXoECGsQAw" }, "Former Technical Supervisor"]
                    ]
                },
                { "name": "Location", "value": "742 Evergreen Terrace, Springfield" },
                {
                    "name": "Parents", "value": [
                        ["#a.link", { "href": "https://www.google.com/search?rlz=1C5CHFA_enFR857FR857&sxsrf=APwXEdcYnZJlKJpHOrmzCBwe330HRQ8fMA:1683559185890&q=Grampa+Simpson&si=AMnBZoFk_ppfOKgdccwTD_PVhdkg37dbl-p8zEtOPijkCaIHMgBm2SUw-JTn3P1gl0WZgJFbdrQdeEKh2SeuXHyge5KUVc-plYMCdA5sH-AFjXstUaQolxSmlcXDbpMQK8RYr5EGO-XtTIaSpYK0R5iq1USIPLPwFkHPA7nKSI818qlVWitIRaz9d1OeTOVqnoB5uWFIZH884BeuAh2ecmkY72bVe3tZTy4MkNMlCpueyPXxsUyHeeCfr5Dsaa0zFbm2qtJNtx-I&sa=X&ved=2ahUKEwjczO7Zgub-AhUZVKQEHZ62Du0QmxMoAHoECG0QAg" }, "Grampa Simpson"], ", ",
                        ["#a.link", { "href": "https://www.google.com/search?rlz=1C5CHFA_enFR857FR857&sxsrf=APwXEdcYnZJlKJpHOrmzCBwe330HRQ8fMA:1683559185890&q=Mona+Simpson+(The+Simpsons)&si=AMnBZoFk_ppfOKgdccwTD_PVhdkg37dbl-p8zEtOPijkCaIHMnU7xGKBqQIsXQmG57xEhOyLwrKowe2zEA_nRTa99aZVflcdvh-KQyxlfSetUu3LV674M51Et7m4wxr-elFV2M_1I40_LyYMpR5_YAg9h-IO6KDpn9Qs7X2cnCLPSC-iVgQyJri--uI5w19vr7pyK0pjAgRz-URWwVtb7ZJlzDWBXywdVdigDeUeaKl-lG7dR9AGokJtcvxkKlmXEUVxypsdKT8gKCWj1afZZwHRPkDAdjGRWw%3D%3D&sa=X&ved=2ahUKEwjczO7Zgub-AhUZVKQEHZ62Du0QmxMoAXoECG0QAw" }, "Mona Simpson"]
                    ]
                },
                { "name": "Spouse", "value": [["#a.link", { "href": "https://www.google.com/search?rlz=1C5CHFA_enFR857FR857&sxsrf=APwXEdcYnZJlKJpHOrmzCBwe330HRQ8fMA:1683559185890&q=Marge+Simpson&si=AMnBZoFk_ppfOKgdccwTD_PVhdkg37dbl-p8zEtOPijkCaIHMoIDQPPiJdu8Z21CY-5JAGP-UWxzH7N9Yfk8kSLsV3aR2-3IkXeIrDysNvILBUALqBjSo7AE8xVl0yBm6Q_sQZzkJpZGSaCwIctvo-LJtHMs1_yPXimatDdY_0LS4Y4jrW6veryc1kfHYMmO6kRP_JInQXjw&sa=X&ved=2ahUKEwjczO7Zgub-AhUZVKQEHZ62Du0QmxMoAHoECGIQAg" }, "Marge Simpson"]] },
                {
                    "name": "Siblings", "value": [
                        ["#a.link", { "href": "https://www.google.com/search?rlz=1C5CHFA_enFR857FR857&sxsrf=APwXEdcYnZJlKJpHOrmzCBwe330HRQ8fMA:1683559185890&q=Abbie&si=AMnBZoEZ8aFftZu792frFYrnK9KQYGXRL3UTeDeHB9-uc0sfFbmg8F6pK9ti0QOooT_1dQgHaHsQyvugHNJOf_VfDflLZxXaKGRoKipxumzzUWTFgPGQZh8tSrabVeaRMl5pCo-B3EunRlNPGwnPkcQskIYU6GasZ6Sv8tdN-ZxmOI7Ns082JcHtw9NQQ6dk14Cl-jUpizfVX3Ix9Vo_rMt2ciC82RZfmmuQr8ut2orQRT0oJns0O_PsAiMSiwv7vwIvIFHTqayx&sa=X&ved=2ahUKEwjczO7Zgub-AhUZVKQEHZ62Du0QmxMoAHoECGAQAg" }, "Abbie"], ", ",
                        ["#a.link", { "href": "https://www.google.com/search?rlz=1C5CHFA_enFR857FR857&sxsrf=APwXEdcYnZJlKJpHOrmzCBwe330HRQ8fMA:1683559185890&q=Herbert+Powell&si=AMnBZoEZ8aFftZu792frFYrnK9KQYGXRL3UTeDeHB9-uc0sfFVtCKaY4c9PK6Lr5qZ3sZWsqVYqIxUSlU3Aq6uaiLRN40fCGKfw-QWXY6Lwr76YfWOimjW_jcIip1EqPVvY-AeEI_EvlgItSXlm393txmUuvxapFuSnXwqIUAqAY0z2yJMmJJV8-v5CCKNYOIjRBRVlRJPxgveKjHQ1Ksm2nwJTzbM6vdBCblHYvXikFE2Ra2Tzgqmevw1t52ro8ORFeSu_SggdmhVO4dIp0iAjnxG0WZreGKg%3D%3D&sa=X&ved=2ahUKEwjczO7Zgub-AhUZVKQEHZ62Du0QmxMoAXoECGAQAw" }, "Herbert Powell"]
                    ]
                },
            ]
        }],
        ["*c:accordion", {
            "ved": "2ahUKEwjczO7Zgub-AhUZVKQEHZ62Du0Q2esEegQIdRAC",
            "sectionClassName": "text-sm py-2",
            "sections": [
                { "title": "Birth year", "key": "2ahUKEwjczO7Zgub-AhUZVKQEHZ62Du0Qh_0CegQIGxAA", "content": ["Under construction..."] },
                { "title": "Catch phrases", "key": "2ahUKEwjczO7Zgub-AhUZVKQEHZ62Du0Qw5oDKAF6BAgdEAI", "content": ["Under construction..."] },
                { "title": "Personality", "key": "2ahUKEwjczO7Zgub-AhUZVKQEHZ62Du0Q_JoDKAB6BAhGEAE", "content": ["Under construction..."] },
            ]
        }],
    ],
    // popoverbar: []
};

export default response;
