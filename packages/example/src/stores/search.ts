import { asm } from "@asimojs/asimo";
import { trax, Store } from "@traxjs/trax";
import { SearchApiIID } from "../api/search";
import { NavServiceIID, SearchQuery, SearchService, SearchServiceIID } from "./types";

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

            /**
             * Make the server request, load the necessary components and update the store data
             * @param query the search query
             * @param navigate optinal boolean telling if the result should trigger a view navigation [default:true]
             */
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
                        const bundleDesc = results.bundles!["c"];
                        let bundle = await asm.get(bundleDesc.ns);
                        if (bundle) {
                            console.log("BUNDLE FOUND");
                        } else {
                            console.log("BUNDLE LOAD");
                            const pr = import(bundleDesc.src /* @vite-ignore */);
                            const mod = await pr;
                            bundle = mod.default;
                        }
                        if (navigate) {
                            await showResults((bundle as any).counter);
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

asm.registerService(SearchServiceIID, createSearchStore);
