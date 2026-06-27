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
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
        // The WebLLM runtime + worker are several MB each and must be precached
        // so the app shell works fully offline. (Model *weights* are far larger
        // and are cached separately by WebLLM itself, not here.)
        maximumFileSizeToCacheInBytes: 12 * 1024 * 1024,
        navigateFallbackDenylist: [/^\/api/],
        // Never let Workbox try to handle the multi-GB model fetches.
        runtimeCaching: [],
      },
      devOptions: { enabled: false },
    }),
  ],
  worker: { format: 'es' },
  optimizeDeps: {
    // These ship their own workers/wasm; let Vite leave them alone.
    exclude: ['@mlc-ai/web-llm', '@huggingface/transformers'],
  },
})
