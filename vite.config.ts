import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    react(), 
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons.svg'],
      manifest: {
        name: 'HRSH - Play. Challenge. Repeat.',
        short_name: 'HRSH',
        description: 'Next-generation browser gaming platform',
        theme_color: '#0f172a', // Tailwind slate-900
        background_color: '#020617', // Tailwind slate-950
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': resolve(import.meta.dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Code splitting: each game is a separate chunk
        manualChunks: (id) => {
          if (id.includes('games/snake/')) return 'game-snake';
          if (id.includes('games/twenty48/')) return 'game-2048';
          if (id.includes('games/reaction/')) return 'game-reaction';
          if (id.includes('games/minesweeper/')) return 'game-minesweeper';
          if (id.includes('games/sudoku/')) return 'game-sudoku';
          if (id.includes('games/typing/')) return 'game-typing';
          if (id.includes('node_modules/react-router')) return 'vendor-router';
          if (id.includes('node_modules/dexie')) return 'vendor-dexie';
        },
      },
    },
  },
});
