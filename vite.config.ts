import { defineConfig } from 'vite'
import react from '@vitejs/react-dev-react' // или используемый плагин
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3001,
    open: true,
    // Самое важное: эта строка исправляет ошибку 404 при обновлении страниц
    historyApiFallback: true, 
  },
})