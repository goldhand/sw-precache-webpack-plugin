sw-precache-webpack-plugin
==========================
Webpack plugin for using service workers. Will generate a [service worker][1] file using [sw-precache][2] and add it to your build directory.


Install
-------
```bash
npm install --save-dev sw-precache-webpack-plugin
```

Usage
-----
```javascript
var path = require('path');
var SWPrecacheWebpackPlugin = require('sw-precache-webpack-plugin')


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
             .then(function() {
               console.log('Service worker registered');
             })
             .catch(function(error) {
               console.error('Error registering service worker: ', error);
             });
  }
})();
```


<!--references-->
[1]: https://github.com/goldhand/notes/blob/master/notes/service_workers.md "Introduction to service workers"
[2]: https://github.com/GoogleChrome/sw-precache "SW-Precache"
