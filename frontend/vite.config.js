/*global process */

import { fileURLToPath, URL } from 'url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

const hash = Math.floor(Math.random() * 90000) + 10000

// https://vitejs.dev/config/
const proxyTarget = process.env.V4_CONFIG || 'http://localhost:8080'

export default defineConfig({
  define: {
    // enable hydration mismatch details in production build
    __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'true'
  },
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  build: {
    rollupOptions: {
      output: {
        entryFileNames: `[name]` + hash + `.js`,
        chunkFileNames: `[name]` + hash + `.js`,
        assetFileNames: `[name]` + hash + `.[ext]`
      }
    }
  },
  server: { // this is used in dev mode only
    proxy: {
      '/api': {
        target: proxyTarget, // export V4_CONFIG=http://localhost:8095
        changeOrigin: true,
        logLevel: 'debug'
      },
      '/authenticate/netbadge': {
        target: proxyTarget,
        changeOrigin: true,
        logLevel: 'debug'
      },
      '/authenticate/public': {
        target: proxyTarget,
        changeOrigin: true,
        logLevel: 'debug'
      },
      '/authorize': {
        target: proxyTarget,
        changeOrigin: true,
        logLevel: 'debug'
      },
      '/config': {
        target: proxyTarget,
        changeOrigin: true,
        logLevel: 'debug'
      },
      '/healthcheck': {
        target: proxyTarget,
        changeOrigin: true,
        logLevel: 'debug'
      },
      '/metrics': {
        target: proxyTarget,
        changeOrigin: true,
        logLevel: 'debug'
      },
      '/signout': {
        target: proxyTarget,
        changeOrigin: true,
        logLevel: 'debug'
      },
      '/version': {
        target: proxyTarget,
        changeOrigin: true,
        logLevel: 'debug'
      },
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: "modern-compiler",
        additionalData: `@use "@/assets/theme/colors.scss" as *;`
      },
    }
  },
})


