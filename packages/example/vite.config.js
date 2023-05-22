// vite.config.js
import preact from "@preact/preset-vite";
import { defineConfig } from 'vite'

export default defineConfig({
    plugins: [preact()],
    test: {
        environment: 'jsdom'
    },
    build: {
        rollupOptions: {
            input: {
                "index": "index.html",
                "homer_simpson": "public/homer_simpson.html"
            },
            output: {
                strict: true,
                dir: "dist",
            },
            external: [
                '@asimojs/asimo',
                '@traxjs/trax',
                '@traxjs/trax-preact',
                'react/jsx-runtime',
                'preact',
                'preact/hooks'
            ]
        },
    }
})

