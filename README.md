sw-precache-webpack-plugin
==========================
[![NPM](https://nodei.co/npm/sw-precache-webpack-plugin.png)](https://nodei.co/npm/sw-precache-webpack-plugin/)


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
    new SWPrecacheWebpackPlugin(
      {
        cacheId: "my-project-name",
        maximumFileSizeToCacheInBytes: 4194304,
        runtimeCaching: [{
          handler: "cacheFirst",
          urlPattern: /[.]mp3$/,
        }],
        verbose: true,
      }
    ),
  ]
}
```

This will generate a new service worker at `src/bundles/my-service-worker.js`.
Then you would just register it in your application:

```javascript
(function() {
  if('serviceWorker' in navigator) {
    navigator.serviceWorker  
             .register('/service-worker.js')
             .then(function() {
               console.log('Service worker registered');
             })
             .catch(function(error) {
               console.error('Error registering service worker: ', error);
             });
  }
})();
```

Options
-------
All options as specified by [sw-precache][3] are able to be passed in to the plugin.

I recommend omitting the `staticFileGlobs` argument and letting the plugin automatically determine the files to cache based on your bundles being built. If you omit the `staticFileGlobs` argument will add `[name]` and `[hash]` of each bundle to `staticFileGlobs`.

*  // sw-precache options:
* @param {options: cacheId [String]},
* @param {options: directoryIndex [String]},
* @param {options: dynamicUrlToDependencies [Object<String,Array<String>]},
* @param {options: handleFetch [boolean]},
* @param {options: ignoreUrlParametersMatching [Array<Regex>]},
* @param {options: importScripts [Array<String>]},
* @param {options: logger [function]},
* @param {options: maximumFileSizeToCacheInBytes [Number]},
* @param {options: navigateFallbackWhitelist [Array<RegExp>]},
* @param {options: replacePrefix [String]},
* @param {options: runtimeCaching [Array<Object>]},
* @param {options: staticFileGlobs [Array<String>]},
* @param {options: stripPrefix [String}]
* @param {options: templateFilePath [String]},
* @param {options: verbose [boolean]},

You can configure the plugin with these options (passible in the same options object as `sw-precache` options)
*  // plugin options:
*  @param {string} [{options: filename}] - Service worker filename, default is 'service-worker.js'
*  @param {string} [{options: filepath}] - Service worker path and name, default is to use webpack.output.path + options.filename

Example:
```javascript
plugins: [
  new SWPrecacheWebpackPlugin(
    {
      filename: "my-project-service-worker.js",
      cacheId: "my-project-name",
    }
  ),
]
```

Examples
--------
See the [examples documentation][4]


<!--references-->
[1]: https://github.com/goldhand/notes/blob/master/notes/service_workers.md "Introduction to service workers"
[2]: https://github.com/GoogleChrome/sw-precache "SW-Precache"
[3]: https://github.com/GoogleChrome/sw-precache#options-parameter "SW-Precache Options"
[4]: /examples/README.md
