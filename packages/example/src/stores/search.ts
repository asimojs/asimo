import { interfaceId, asm } from "@asimojs/asimo";
import { trax, Store } from "@traxjs/trax";
import { SearchApiIID } from "../api/search";
import { SearchResponse } from "../api/types";
import { NavServiceIID } from "./nav";

export interface SearchService {
    data: {
        query: SearchQuery;
        $lastResult: null | SearchResults | SearchError;
    },
    /** Perfom a search according to the query data - use the data query if no query provided */
    search(query?: SearchQuery, navigate?: boolean): Promise<boolean>;
}

interface SearchQuery {
    searchInput: string;
}

export interface SearchResults {
    type: "SearchResults"
    query: {
        searchInput: string;
    },
    results: SearchResponse;
}

interface SearchError {
    type: "Error";
    query: {
        searchInput: string;
    },
    message: string;
}

/**
 * The Search store exposes all view search apis and manage the search data
 * @returns a SearchService instance
 */
export function createSearchStore(): SearchService {
    return trax.createStore("SearchService", (store: Store<SearchService["data"]>) => {
        const data = store.init({
            query: {
                searchInput: ""
            },
            $lastResult: null
        });

        const srv = {
            data,
            async search(query?: SearchQuery, navigate = true) {
                const q = query || data.query;

                const search = (await asm.get(SearchApiIID))
                const results = await search(q);
                if (results.type === "SearchResponse") {

                    data.$lastResult = {
                        type: "SearchResults",
                        query: {
                            searchInput: q.searchInput
                        },
                        results
                    };

                    try {
                        console.log("BUNDLES A", results.bundles)
                        const p = results.bundles!["c"];
                        console.log("BUNDLES B", p)
                        const pr = import(p /* @vite-ignore */);
                        console.log("BUNDLES C", pr)
                        const mod = await pr;
                        console.log("NOW", mod.default)
                        if (navigate) {
                            await showResults(mod.default.counter);
                        }
                    } catch (ex) {
                        console.log("Module load error:", ex);
                    }

                    return true;
                }
                return false;
            },
        }
        return srv;

        async function showResults(w?: any) {
            const navs = await asm.get(NavServiceIID);
            navs.data.mainView = {
                name: "search",
                panel: "results",
                $store: srv,
                testWidget: w
            }
        }
    });
}


export const SearchServiceIID = interfaceId<SearchService>("asimo.doc.stores.SearchService");
asm.registerService(SearchServiceIID, createSearchStore);
