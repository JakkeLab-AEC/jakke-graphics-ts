import {defineConfig} from 'vite';
import {resolve} from 'path';

export default defineConfig({
    base: './',
    build: {
      sourcemap: false,
      outDir: '.vite/',
      minify: 'esbuild',
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'src/main.ts'),  // main.ts 파일
          preload: resolve(__dirname, 'src/preload.ts'),
          index: resolve(__dirname, 'index.html'),  // index.html 파일
        },
        output: {
          entryFileNames: '[name].js',
          format: 'cjs',
        },
      },
    },
    server: {
      port: 3000,
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
      },
    },
    json: {
      stringify: true,
    },
    esbuild: {
      keepNames: true,
      minifyIdentifiers: false,
      minifySyntax: true,
      minifyWhitespace: true,
    },
  });