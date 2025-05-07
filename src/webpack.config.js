module.exports = {
  // This file will be used by react-scripts to customize webpack configuration
  // without ejecting the create-react-app setup
  devServer: {
    setupMiddlewares: (middlewares, devServer) => {
      // Your custom middleware setup can go here if needed
      return middlewares;
    }
  }
};
