
mkdir -p ./dist/ext

# @asimojs/asimo module
cp ../../node_modules/@asimojs/asimo/dist/asimo.mjs ./dist/ext/

# preact module
cp ../../node_modules/preact/dist/preact.mjs ./dist/ext/
cp ../../node_modules/preact/dist/preact.module.js.map ./dist/ext/

# preact/hooks module
cp ../../node_modules/preact/hooks/dist/hooks.mjs ./dist/ext/
cp ../../node_modules/preact/hooks/dist/hooks.module.js.map ./dist/ext/

# react/jsx-runtime module
cp ../../node_modules/preact-jsx-runtime/jsx-runtime.js ./dist/ext/

# @traxjs/trax module
cp ../../node_modules/@traxjs/trax/dist/trax.mjs ./dist/ext/

# @traxjs/trax-preact module
cp ../../node_modules/@traxjs/trax-preact/dist/trax-preact.mjs ./dist/ext/

# copy dist-bundles to dist
mkdir -p ./dist/dist-bundles
cp ./dist-bundles/*.js ./dist/dist-bundles/

# copy secondary html pages to root - e.g. homer_simpson.html
cp ./dist/public/*.html ./dist
