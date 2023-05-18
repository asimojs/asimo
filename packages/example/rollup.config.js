import typescript from '@rollup/plugin-typescript';

export default {
    input: 'src/bundles/common/index.ts',
    output: {
        file: 'dist-bundles/bundle-common.js',
        format: 'es'
    },
    external: [
        'typescript',
        '@asimojs/asimo',
        '@traxjs/trax',
        '@traxjs/trax-preact',
        'react/jsx-runtime',
        'preact',
        'preact/hooks'
    ],
    plugins: [typescript()],
    // plugins: [
    //     // typescript({
    //     //     tsconfig: "tsconfig.rollup.json"
    //     // })
    // ]
};
