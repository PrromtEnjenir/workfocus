import { resolve } from 'path'
import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  main: {
    // entry: src/main/index.ts (domyślnie)
    build: {
      rollupOptions: {
        external: ['better-sqlite3'],
      },
    },
    resolve: {
      alias: {
        '@electron': resolve('electron'),
      },
    },
  },
  preload: {
    // entry: src/preload/index.ts (domyślnie)
  },
  renderer: {
    // root: src/renderer (domyślnie)
    // input: src/renderer/index.html (domyślnie)
    resolve: {
      alias: {
        '@': resolve('src/renderer'),
      },
    },
    plugins: [react()],
  },
})
