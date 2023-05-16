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
        ["#div", "Hello World"],
        ["*c:counter"],
    ],
    sidebar: [],
    // popoverbar: []
};

export default response;
