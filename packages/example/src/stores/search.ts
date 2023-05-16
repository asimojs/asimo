import { asm } from "@asimojs/asimo";
import { trax, Store } from "@traxjs/trax";
import { SearchApiIID } from "../api/search";
import { ComponentMap, NavServiceIID, SearchQuery, SearchService, SearchServiceIID } from "./types";

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
                    const components: ComponentMap = {};

                    data.$lastResult = {
                        type: "SearchResults",
                        query: {
                            searchInput: q.searchInput
                        },
                        results,
                        components
                    };

                    try {
                        const bundles = results.bundles;
                        if (bundles) {
                            const bndRefs: { name: string, ns: string, src: string, module?: any }[] = [];
                            const namespaces: string[] = [];

                            for (const name of Object.getOwnPropertyNames(results.bundles)) {
                                const ns = bundles[name].ns;
                                bndRefs.push({
                                    name,
                                    ns,
                                    src: bundles[name].src
                                });
                                namespaces.push(ns);
                            }

                            // retrieve modules from asimo cache
                            const r = await asm.get.apply(asm, namespaces);
                            let modules: any[] = Array.isArray(r) ? r : [r]; // when called with one arg get doesn't return an array

                            // check if all modules are already loaded, otherwise import them
                            const promises: Promise<any>[] = [];
                            const indices: number[] = [];
                            for (let i = 0; modules.length > i; i++) {
                                if (modules[i]) {
                                    bndRefs[i].module = modules[i];
                                } else {
                                    indices.push(i);
                                    promises.push(import(bndRefs[i].src /* @vite-ignore */));
                                }
                            }

                            // retrieve newly imported modules
                            if (indices.length) {
                                const mds = await Promise.all(promises);
                                for (let i = 0; mds.length > i; i++) {
                                    bndRefs[indices[i]].module = mds[i].default;
                                }
                            }

                            // push modules into the data model components
                            for (let bnd of bndRefs) {
                                components[bnd.name] = bnd.module;
                            }
                        }
                        if (navigate) {
                            // await showResults((bundle as any).counter);
                            await showResults();
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

        async function showResults() {
            const navs = await asm.get(NavServiceIID);
            navs.data.mainView = {
                name: "search",
                panel: "results",
                $store: srv
            }
        }
    });
}

asm.registerService(SearchServiceIID, createSearchStore);
