 /*global process */

import { fileURLToPath, URL } from 'url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

const hash = Math.floor(Math.random() * 90000) + 10000

// https://vitejs.dev/config/
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
            target: process.env.V4_CONFIG, // export V4_CONFIG=http://localhost:8095
            changeOrigin: true,
            logLevel: 'debug'
          },
          '/authenticate/netbadge': {
            target: process.env.V4_CONFIG,
            changeOrigin: true,
            logLevel: 'debug'
          },
          '/authenticate/public': {
            target: process.env.V4_CONFIG,
            changeOrigin: true,
            logLevel: 'debug'
          },
          '/authorize': {
            target: process.env.V4_CONFIG,
            changeOrigin: true,
            logLevel: 'debug'
          },
          '/config': {
            target: process.env.V4_CONFIG,
            changeOrigin: true,
            logLevel: 'debug'
          },
          '/healthcheck': {
            target: process.env.V4_CONFIG,
            changeOrigin: true,
            logLevel: 'debug'
          },
          '/metrics': {
            target: process.env.V4_CONFIG,
            changeOrigin: true,
            logLevel: 'debug'
          },
          '/signout': {
            target: process.env.V4_CONFIG,
            changeOrigin: true,
            logLevel: 'debug'
          },
          '/version': {
            target: process.env.V4_CONFIG,
            changeOrigin: true,
            logLevel: 'debug'
          },
      }
   },
   css: {
      preprocessorOptions : {
          scss: {
              api: "modern-compiler",
              additionalData: `@use "@/assets/theme/colors.scss" as *;`
          },
      }
   },
})


