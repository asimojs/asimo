import { interfaceId, asm } from "@asimojs/asimo";
import { trax, Store } from "@traxjs/trax";
import { SearchService } from "./search";

export const NavServiceIID = interfaceId<NavService>("asimo.doc.stores.NavService");
export interface NavService {
    data: {
        mainView: DocView | ExampleView
    },
    /** Navigate to the home page */
    home(): void;
}

export interface DocView {
    name: "doc";
}

export interface ExampleView {
    name: "ex";
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
        const data = store.init({ mainView: { name: "doc" } });

        return {
            data,
            home() {
                data.mainView = {
                    name: "doc"
                }
            }
        }
    });
}

asm.registerService(NavServiceIID, createNavStore);

