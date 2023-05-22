import { asm } from "@asimojs/asimo";
import { trax, Store } from "@traxjs/trax";
import { SearchApiIID } from "../api/search";
import { ComponentMap, NavServiceIID, SearchQuery, SearchService, SearchServiceIID } from "./types";
import { LML } from "../libs/lml/types";
import { lml2jsx, updateLML } from "../libs/lml/lml";
import { h } from "preact";
import { SearchMoreApiIID, SearchMoreQuery } from "../api/searchMore";
import { BundleRef, SearchResponse } from "../api/types";

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
            lastResult: null
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
                    await srv.loadSearchResponse(results, q, navigate);
                    return true;
                }
                return false;
            },

            async loadSearchResponse(r: SearchResponse, q: SearchQuery, navigate = true) {
                const components: ComponentMap = {};

                try {
                    await loadBundles(r.bundles, components);
                    if (navigate) {
                        await notifyNavManager();
                    }
                } catch (ex) {
                    console.log("Module load error:", ex);
                }

                // replace last Result
                data.lastResult = {
                    type: "SearchResults",
                    query: {
                        searchInput: q.searchInput
                    },
                    results: r,
                    lml2jsx: (lml: LML) => lml2jsx(lml, h, (name, ns) => {
                        if (components && components[ns]) {
                            return components[ns][name] || null;
                        }
                        return null;
                    })
                };
            },

            async getMoreResults(query: SearchMoreQuery, navigate = true) {
                if (!data.lastResult || data.lastResult.type !== "SearchResults") return false; // can't get more results if there is no results

                const search = (await asm.get(SearchMoreApiIID))
                const results = await search(query);

                if (results.type === "SearchResponse") {
                    const components: ComponentMap = {};

                    try {
                        await loadBundles(results.bundles, components);
                        if (navigate) {
                            await notifyNavManager();
                        }
                    } catch (ex) {
                        console.log("Module load error:", ex);
                    }

                    if (results.mainUpdates || results.sidebarUpdates) {
                        // update last Result
                        const res = data.lastResult.results;
                        if (results.main) {
                            res.main = results.main;
                        } else if (results.mainUpdates) {
                            updateLML(res.main!, results.mainUpdates);
                        }
                    }
                }

                return true;
            }
        }
        return srv;

        async function notifyNavManager() {
            const navs = await asm.get(NavServiceIID);
            navs.data.mainView = {
                name: "search",
                panel: "results",
                $store: srv
            }
        }
    });
}

const RX_RELATIVE_PATH = /^(\/)|(.\/)/i;

async function loadBundles(bundles?: { [name: string]: BundleRef }, components?: ComponentMap) {
    if (bundles) {
        const bndRefs: { name: string, ns: string, src: string, module?: any }[] = [];
        const namespaces: string[] = [];

        for (const name of Object.getOwnPropertyNames(bundles)) {
            const ns = bundles[name].ns;

            const src = bundles[name].src;
            if (src.match(RX_RELATIVE_PATH)) {
                // Security: only authorize bundles served from the same origin (relative path)
                bndRefs.push({
                    name,
                    ns,
                    src: bundles[name].src
                });
                namespaces.push(ns);
            }
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
        if (components) {
            for (let bnd of bndRefs) {
                components[bnd.name] = bnd.module;
            }
        }
    }
}

asm.registerService(SearchServiceIID, createSearchStore);
