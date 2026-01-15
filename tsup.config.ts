import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['src/index.ts'],        // your library/app entry point(s)
    outDir: 'dist',                 // output directory
    format: ['cjs', 'esm'],         // CommonJS + ESModule
    target: 'es2020',               // compile target
    sourcemap: true,                // source maps for debugging
    clean: true,                    // rm dist/ on each build
    splitting: false,               // code-splitting (only works with esm)
    minify: false,                  // set to true for production bundles
    dts: true,                      // emit .d.ts declarations
    define: {                       // replace env vars at build time
        'process.env.NODE_ENV': '"production"',
    },
    legacyOutput: false,            // add .cjs extension for CJS files
    watch: false,
});
