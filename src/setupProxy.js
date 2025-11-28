const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:3001',
      changeOrigin: true,
      pathRewrite: {
        '^/polars/api': '/api'
      }
    })
  );
};

// Note: The webpack dev server deprecation warnings about 'onAfterSetupMiddleware' and 
// 'onBeforeSetupMiddleware' are coming from react-scripts, not our code.
// These would require updating react-scripts, which might break compatibility.
