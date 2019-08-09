// NOTES on this are found here:
//    https://cli.vuejs.org/config/#devserver
//    https://github.com/chimurai/http-proxy-middleware#proxycontext-config
module.exports = {
  devServer: {
    public: process.env.BASE_URL,
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
      // bump max sizes to 512k
      maxEntrypointSize: 512000,
      maxAssetSize: 512000
    }
  }
}
