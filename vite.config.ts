import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
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
