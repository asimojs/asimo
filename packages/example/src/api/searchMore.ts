/**
 * This file should be generated from an OpenAPI definition file
 * Its goal is to generate typed API functions that map the server REST APIs
 */

import { asm, interfaceId } from "@asimojs/asimo";
import { ErrorResponse, SearchResponse } from "./types";


export interface SearchMoreQuery {
    searchInput: string;
    src: {
        /** the component triggering the query */
        key: string;
        /** the component type that triggered the query - if any */
        componentType?: string;
        /** the piece of content that triggered the query - if any */
        srcContentKey?: string;
        /** the first piece of content in the component - if any */
        firstContentKey?: string;
        /** the last piece of content in the component - if any */
        lastContentKey?: string;
    }
}

export interface SearchMoreAPI {
    (query: SearchMoreQuery): Promise<SearchResponse | ErrorResponse>;
}

/**
 * Search
 * @param query
 */
async function searchMore(query: SearchMoreQuery): Promise<SearchResponse | ErrorResponse> {
    // actual implementation should call fetch()
    if (query.searchInput === "Homer Simpson") {
        const lastContentKey = query.src.lastContentKey;

        if (lastContentKey === "2ahUKEwjczO7Zgub-AhUZVKQEHZ62Du0Qq7kBKAB6BAheEAA") {
            const m = await import("./data/homer-more-2ahUKEwjczO7Zgub-AhUZVKQEHZ62Du0Qq7kBKAB6BAheEAA");
            await delay(300); // network + server processing
            return m.default;
        }

        if (lastContentKey === "2ahUKEwjczO7Zgub-AhUZVKQEHZ62Du0Qq7kBKAB6BAhAAAB") {
            const m = await import("./data/homer-more-2ahUKEwjczO7Zgub-AhUZVKQEHZ62Du0Qq7kBKAB6BAhAAAB");
            await delay(300); // network + server processing
            return m.default;
        }
    }

    return {
        type: "Error",
        message: "Invalid query: " + query.searchInput
    };
}

function delay(timeMs: number): Promise<void> {
    return new Promise(r => {
        setTimeout(r, timeMs);
    })
}

export const SearchMoreApiIID = interfaceId<SearchMoreAPI>("asimo.doc.api.SearchMoreAPI");
asm.registerService(SearchMoreApiIID, () => searchMore);

