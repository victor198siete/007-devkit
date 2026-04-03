import { defineConfig } from 'tsup';

export default defineConfig([
  // CLI entry — shebang, ESM only
  {
    entry: { cli: 'src/cli.ts' },
    format: ['esm'],
    target: 'node18',
    shims: true,
    dts: true,
    splitting: false,
    sourcemap: false,
    clean: true,
    banner: { js: '#!/usr/bin/env node' },
    outDir: 'dist',
  },
  // Library entry — no shebang, ESM + CJS dual output for VS Code extension
  {
    entry: { index: 'src/index.ts' },
    format: ['esm', 'cjs'],
    target: 'node18',
    shims: true,
    dts: true,
    splitting: false,
    sourcemap: false,
    clean: false, // do not wipe cli output
    outDir: 'dist',
  },
]);
