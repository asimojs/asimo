/**
 * This file should be generated from an OpenAPI definition file
 * Its goal is to generate typed API functions that map the server REST APIs
 */

import { asm, interfaceId } from "@asimojs/asimo";
import { ErrorResponse, SearchResponse } from "./types";

export interface SearchAPI {
    (query: { searchInput: string }): Promise<SearchResponse | ErrorResponse>;
}

/**
 * Search
 * @param query
 */
async function search(query: { searchInput: string }): Promise<SearchResponse | ErrorResponse> {
    // actual implementation should call fetch()
    if (query.searchInput === "Homer Simpson") {
        console.log("HERE")
        const m = await import("./data/testdata");
        return m.default;
    }

    return {
        type: "Error",
        message: "Invalid query: " + query.searchInput
    };
}


export const SearchApiIID = interfaceId<SearchAPI>("asimo.doc.api.SearchAPI");
asm.registerService(SearchApiIID, () => search);



