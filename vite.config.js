import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import { viteStaticCopy } from 'vite-plugin-static-copy'

export default defineConfig({
  plugins: [
    vue(),
    viteStaticCopy({
      targets: [
        { src: 'images', dest: '.' },
        { src: 'logo',   dest: '.' },
      ]
    }),
  ],
  base: '/vital-sign-ITRI/',
  server: {
    proxy: {
      '/hf-api': {
        target: 'https://www.sstcmedicare.com',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/hf-api/, '/imedical/division/api'),
      }
    }
  },
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) }
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: 'index.html',
      output: {
        manualChunks: {
          'vendor': ['vue', 'vue-router', 'pinia'],
          'supabase': ['@supabase/supabase-js'],
        }
      }
    }
  }
})
