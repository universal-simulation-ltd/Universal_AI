import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { VitePWA } from 'vite-plugin-pwa'

// Note: we deliberately do NOT enable cross-origin isolation (COOP/COEP).
// Our heavy lifting runs on WebGPU (WebLLM) which does not need SharedArrayBuffer,
// and avoiding COEP keeps cross-origin model downloads from the HF CDN working.
export default defineConfig({
  plugins: [
    svelte(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/*.svg'],
      manifest: {
        name: 'Universal AI — Offline Chat',
        short_name: 'Universal AI',
        description: 'Offline LLM chatbot with pluggable RAG knowledge bases',
        theme_color: '#0b0d12',
        background_color: '#0b0d12',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: 'icons/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: 'icons/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Only precache the app shell. Model weights are large and are managed
        // by WebLLM / transformers.js in their own Cache Storage + IndexedDB.
        // Precache only the lightweight app shell. The heavy, backend-specific
        // chunks (WebLLM ~6MB, wllama, ONNX-runtime wasm) are runtime-cached on
        // first use, so each device caches only the backend it actually runs and
        // the SW installs fast.
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
        globIgnores: ['**/webllm*.js', '**/wllama*.js'],
        maximumFileSizeToCacheInBytes: 2 * 1024 * 1024,
        navigateFallbackDenylist: [/^\/api/],
        runtimeCaching: [
          {
            // Backend-specific .wasm binaries (wllama, ONNX runtime) — cache on
            // first use so the app is offline-capable afterwards.
            urlPattern: ({ url, sameOrigin }) =>
              sameOrigin && url.pathname.endsWith('.wasm'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'wasm-runtime',
              expiration: { maxEntries: 12 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // The dynamically-imported engine JS chunks (WebLLM / wllama).
            urlPattern: ({ url, sameOrigin }) =>
              sameOrigin && /\/(webllm|wllama)[^/]*\.js$/.test(url.pathname),
            handler: 'CacheFirst',
            options: {
              cacheName: 'engine-js',
              expiration: { maxEntries: 8 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Pre-built knowledge packs (Simple Wikipedia .bin + .json manifest).
            // Too large to precache; cached on download so they stay offline.
            urlPattern: ({ url, sameOrigin }) =>
              sameOrigin && url.pathname.startsWith('/knowledge/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'knowledge-packs',
              expiration: { maxEntries: 6, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  worker: { format: 'es' },
  optimizeDeps: {
    // These ship their own workers/wasm; let Vite leave them alone.
    exclude: ['@mlc-ai/web-llm', '@huggingface/transformers', '@wllama/wllama'],
  },
})
