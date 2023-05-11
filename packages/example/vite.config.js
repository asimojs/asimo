// vite.config.js
import preact from "@preact/preset-vite";
import { defineConfig, splitVendorChunkPlugin } from 'vite'

export default defineConfig({
    plugins: [preact()],
    test: {
        environment: 'jsdom'
    },
    build: {
        rollupOptions: {
            output: {
                strict: true
            },
            external: [
                '@asimojs/asimo',
                '@traxjs/trax',
                '@traxjs/trax-preact',
                'react/jsx-runtime',
                'preact',
                'preact/hook'
            ]
        },
    }
})

