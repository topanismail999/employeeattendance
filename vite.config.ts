import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000, // Menjalankan di localhost:3000 saat pengembangan
    open: true, // Membuka browser otomatis saat 'npm run dev'
  },
  build: {
    outDir: 'dist', // Folder hasil build untuk Vercel
    sourcemap: false, // Mempercepat proses build di Vercel
    rollupOptions: {
      output: {
        // Memecah kode menjadi bagian kecil agar load lebih cepat (Manual Chunking)
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          utils: ['@supabase/supabase-js', 'lucide-react'],
        },
      },
    },
  },
  resolve: {
    alias: {
      // Memudahkan import jika project semakin besar
      '@': '/src',
    },
  },
})
