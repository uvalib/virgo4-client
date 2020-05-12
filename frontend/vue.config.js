// NOTES on this are found here:
//    https://cli.vuejs.org/config/#devserver
//    https://github.com/chimurai/http-proxy-middleware#proxycontext-config
module.exports = {
   css: {
      loaderOptions: {
         scss: {
            prependData: `
               @use 'sass:math';
               @import "@/scss/_variables.scss";
               @import "@/scss/_mixins.scss";
            `
         }
      }
  },
  devServer: {
    // public: process.env.BASE_URL,
    host: '0.0.0.0',
    public: '0.0.0.0:8080',
    disableHostCheck: true,
    proxy: {
      '/api': {
        target: process.env.V4_CONFIG, // or 'http://localhost:8095',
        changeOrigin: true,
        logLevel: 'debug'
      },
      '/config': {
        target: process.env.V4_CONFIG, // or 'http://localhost:8095',
        changeOrigin: true,
        logLevel: 'debug'
      },
      '/version': {
        target: process.env.V4_CONFIG, // or 'http://localhost:8095',
        changeOrigin: true,
        logLevel: 'debug'
      },
      '/healthcheck': {
        target: process.env.V4_CONFIG, // or 'http://localhost:8095',
        changeOrigin: true,
        logLevel: 'debug'
      },
      '/metrics': {
        target: process.env.V4_CONFIG, // or 'http://localhost:8095',
        changeOrigin: true,
        logLevel: 'debug'
      },
      '/authorize': {
        target: process.env.V4_CONFIG, // or 'http://localhost:8095',
        changeOrigin: true,
        logLevel: 'debug'
      },
      '/authenticate/netbadge': {
        target: process.env.V4_CONFIG, // or 'http://localhost:8095',
        changeOrigin: true,
        logLevel: 'debug'
      },
      '/authenticate/public': {
        target: process.env.V4_CONFIG, // or 'http://localhost:8095',
        changeOrigin: true,
        logLevel: 'debug'
      },
    }
  },
  configureWebpack: {
    performance: {
      // bump max sizes to 1024
      maxEntrypointSize: 1024000,
      maxAssetSize: 1024000
    }
  }
}
