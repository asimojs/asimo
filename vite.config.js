// vite.config.js
import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
    build: {
        lib: {
            // Could also be a dictionary or array of multiple entry points
            entry: resolve(__dirname, 'src/asimo.ts'),
            name: 'asimo',
            fileName: 'asimo'
        },
        rollupOptions: {

        },
    },
    test: {
        typecheck: {
            enabled: true,
            tsconfig: './tsconfig.test.json',
        },
    },
})

