sw-precache-webpack-plugin
==========================
Webpack plugin for using service workers. Will generate a service worker file using `sw-precache` and add it to your build directory.


Install
-------
```bash
npm install --save-dev sw-precache-webpack-plugin
```

Usage
-----
```javascript
var path = require('path');
var SWPrecacheWebpackPlugin = require('./src/sw-precache-webpack-plugin')


module.exports = {
  context: __dirname,

  entry: {
    main: path.resolve(__dirname, 'src/index'),
  },

  output: {
    path: path.resolve(__dirname, 'src/bundles/'),
    filename: '[name]-[hash].js',
  },

  plugins: [
    new SWPrecacheWebpackPlugin({
      cacheId: 'my-project-name',
      filename: 'my-service-worker.js',
    }),
  ]
}
```

This will generate a new service worker at `src/bundles/my-service-worker.js`.
Then you would just register it in your application:

```javascript
(function() {
  if('serviceWorker' in navigator) {
    navigator.serviceWorker  
             .register('/my-service-worker.js')
             .then(function() { console.log('Service worker registered'); })
             .catch(function(error) {
               console.error('Error registering service worker: ', error);
             });
  }
})();
```
