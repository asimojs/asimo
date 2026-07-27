import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

export default defineConfig({
    integrations: [
        starlight({
            title: "asimo",
            description: "Type-safe asynchronous IoC for browser and server runtimes",
            social: {
                github: "https://github.com/asimojs/asimo",
            },
            editLink: {
                baseUrl: "https://github.com/asimojs/asimo/edit/main/",
            },
            sidebar: [
                {
                    label: "Home",
                    link: "/",
                },
                {
                    label: "Getting Started",
                    link: "/getting-started",
                },
                {
                    label: "Core Concepts",
                    items: [
                        { label: "IID Tokens", link: "/core-concepts/iids" },
                        { label: "Containers", link: "/core-concepts/containers" },
                        { label: "Factories", link: "/core-concepts/factories" },
                        { label: "Bundles", link: "/core-concepts/bundles" },
                        { label: "Retry & Errors", link: "/core-concepts/retry-and-errors" },
                    ],
                },
                {
                    label: "Guides",
                    items: [
                        { label: "Services", link: "/guides/services" },
                        { label: "Testing", link: "/guides/testing" },
                        { label: "Progressive Loading", link: "/guides/progressive-load" },
                        { label: "Type Safety", link: "/guides/type-safety" },
                        { label: "Server-Side Usage", link: "/guides/server-side-usage" },
                    ],
                },
                {
                    label: "API Reference",
                    items: [
                        { label: "syncIID / asyncIID", link: "/api-reference/iids" },
                        { label: "InferType", link: "/api-reference/infertype" },
                        { label: "Container Interface", link: "/api-reference/container" },
                        { label: "createContainer", link: "/api-reference/createcontainer" },
                        { label: "factory", link: "/api-reference/factory" },
                        { label: "bundle", link: "/api-reference/bundle" },
                        { label: "AsimoConfig", link: "/api-reference/config" },
                        { label: "Errors", link: "/api-reference/errors" },
                    ],
                },
                {
                    label: "Agent Documentation",
                    link: "/agent-docs",
                },
            ],
            defaultLocale: "root",
            locales: {
                root: {
                    label: "English",
                    lang: "en",
                },
            },
            head: [
                {
                    tag: "meta",
                    attrs: {
                        name: "keywords",
                        content: "dependency injection, DI, IoC, TypeScript, browser, server, Bun, Node, lazy loading, code splitting, testing",
                    },
                },
            ],
            customCss: ["/src/styles/tokyo-night.css"],
        }),
    ],
    outDir: "./docs-dist",
    site: "https://asimojs.github.io/asimo",
});
