import { LML } from "../libs/lml/types";

export interface ErrorResponse {
    type: "Error";
    message: string;
}

export interface SearchResponse {
    type: "SearchResponse",
    /** Approximate total number of results */
    totalMatchCount: number;
    /** Server processing time in s */
    processingTime: number;
    /** Default language - e.g. "en" */
    lang: string;
    /** Widget bundles used in the response */
    bundles?: {[id:string]: string}
    /** Header section */
    header: LML[],
    /** Main results set */
    main: LML[],
    /** Sidebar results set */
    sidebar: LML[],
}
