 /*global process */

import { fileURLToPath, URL } from 'url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
   plugins: [vue()],
   resolve: {
      alias: {
         '@': fileURLToPath(new URL('./src', import.meta.url))
      }
   },
   server: { // this is used in dev mode only
      port: 8080,
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
      preprocessorOptions: {
        scss: {
           // example : additionalData: `@import "./src/design/styles/variables";`
           // dont need include file extend .scss
           additionalData: `
             @use 'sass:math';
             @import "@/scss/_variables.scss";
             @import "@/scss/_mixins.scss";
          `
       },
      },
    },
   //  configureWebpack: {
   //    performance: {
   //      // bump max sizes to 1024
   //      maxEntrypointSize: 1024000,
   //      maxAssetSize: 1024000
   //    }
   //  },
})


