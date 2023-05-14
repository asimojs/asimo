import { interfaceId, asm } from "@asimojs/asimo";
import { trax, Store } from "@traxjs/trax";
import { SearchService, SearchServiceIID } from "./search";

export const NavServiceIID = interfaceId<NavService>("asimo.doc.stores.NavService");
export interface NavService {
    data: {
        mainView: DocView | SearchView | LoadingView
    },
    /** Navigate to the home page */
    home(): void;
}

export interface LoadingView {
    name: "loading";
}

export interface DocView {
    name: "doc";
}

export interface SearchView {
    name: "search";
    panel: "search" | "results";
    $store: SearchService;
    testWidget?: any;
}


/**
 * The NavStore service maintains the navigation data
 * @returns a NavService instance
 */
export function createNavStore(): NavService {
    return trax.createStore("NavService", (store: Store<NavService["data"]>) => {
        let searchService: SearchService | null = null;
        const data = store.init({ mainView: { name: "loading" } }, {
            init: function* (d, cc) {
                cc.maxComputeCount = 1; // run only once
                searchService = yield asm.get(SearchServiceIID);
                d.mainView = {
                    name: "search",
                    panel: "search",
                    $store: searchService!
                }
            }
        });

        return {
            data,
            home() {
                data.mainView = {
                    name: "search",
                    panel: "search",
                    $store: searchService!
                }
            }
        }
    });
}

asm.registerService(NavServiceIID, createNavStore);

