SW Precache Webpack Plugin
==========================
[![NPM version][npm-img]][npm-url]
[![Dependency Status][daviddm-img]][daviddm-url]
[![devDependency Status][daviddmdev-img]][daviddmdev-url]
[![CircleCI][circleci-img]][circleci-url]

__`SWPrecacheWebpackPlugin`__ is a [webpack][webpack] plugin for using [service workers][sw-guide] to cache your external project dependencies. It will generate a service worker file using [sw-precache][sw-precache] and add it to your build directory.


Install
-------
```bash
npm install --save-dev sw-precache-webpack-plugin
```

Basic Usage
-----------
```javascript
var path = require('path');
var SWPrecacheWebpackPlugin = require('sw-precache-webpack-plugin');


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
        cacheId: 'my-project-name',
        filename: 'my-service-worker.js',
        maximumFileSizeToCacheInBytes: 4194304,
        runtimeCaching: [{
          handler: 'cacheFirst',
          urlPattern: /[.]mp3$/,
        }],
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
    navigator.serviceWorker.register('/my-service-worker.js');
  }
})();
```

[Another example of registering a service worker is provided by GoogleChrome/sw-precache][sw-precache-registration-example]

Configuration
-------------
You can pass a hash of configuration options to `SWPrecacheWebpackPlugin`:

__plugin options__:
*  `filename`: `[String]` - Service worker filename, default is `service-worker.js`
*  `filepath`: `[String]` - Service worker path and name, default is to use `webpack.output.path` + `options.filename`.
*  `staticFileGlobsIgnorePatterns`: `[RegExp]` - Define an optional array of regex patterns to filter out of staticFileGlobs (see below)

[__`sw-precache` options__][sw-precache-options]:
* `cacheId`: `[String]` - Not required but you should include this, it will give your service worker cache a unique name
* `directoryIndex`: `[String]`
* `dynamicUrlToDependencies`: `[Object<String,Array<String>]`
* `handleFetch`: `[boolean]`
* `ignoreUrlParametersMatching`: `[Array<Regex>]`
* `importScripts`: `[Array<String>]` - Add [hash] if you want to import a file generated with webpack [hash] ex. ['dist/some-[hash].js']
* `logger`: `[function]`
* `maximumFileSizeToCacheInBytes`: `[Number]`
* `navigateFallbackWhitelist`: `[Array<RegExp>]`
* `replacePrefix`: `[String]`
* `runtimeCaching`: `[Array<Object>]`
* `staticFileGlobs`: `[Array<String>]` - Omit this to allow the plugin to cache all your bundles' emitted assets.
* `stripPrefix`: `[String]` - Omit this to use your webpack config's `output.path + '/'` for stripping prefixes.
* `templateFilePath`: `[String]`
* `verbose`: `[boolean]`


_Note that all configuration options are optional. `SWPrecacheWebpackPlugin` will by default use all your assets emitted by webpack's compiler for the `staticFileGlobs` parameter and your webpack config's `output.path + '/'` as the `stripPrefix` parameter (see [#4](/../../issues/4/))._

Here's an example using one option from `sw-precache` (`cacheId`) with one option from `SWPrecacheWebpackPlugin` (`filename`) in a configuration hash:
```javascript
plugins: [
  new SWPrecacheWebpackPlugin(
    {
      cacheId: "my-project-name",
      filename: "my-project-service-worker.js",
    }
  ),
]
```

Examples
--------
See the [examples documentation][example-project]


Webpack Dev Server Support
--------------------------
Currently `SWPrecacheWebpackPlugin` will not work with `Webpack Dev Server`. If you wish to test the service worker locally, you can use simple a node server [see example project][example-project] or `python SimpleHTTPServer` from your build directory. I would suggest pointing your node server to a different port than your usual local development port and keeping the precache service worker out of your [local configuration (example)][webpack-local-config-example].


Contributing
------------

Install node dependencies:

```
  $ npm install
```

Add unit tests for your new feature in `./test/plugin.spec.js`


Testing
-------
Tests are located in `./test`

Run tests:
```
  $ npm t
```




<!--references-->
[sw-guide]: https://github.com/goldhand/notes/blob/master/notes/service_workers.md "Introduction to service workers"
[sw-precache]: https://github.com/GoogleChrome/sw-precache "SW-Precache"
[sw-precache-options]: https://github.com/GoogleChrome/sw-precache#options-parameter "SW-Precache Options"
[sw-precache-registration-example]: https://github.com/GoogleChrome/sw-precache/blob/5699e5d049235ef0f668e8e2aa3bf2646ba3872f/demo/app/js/service-worker-registration.js
[example-project]: /examples/
[webpack]: http://webpack.github.io/
[webpack-local-config-example]: https://github.com/goldhand/cookiecutter-webpack/blob/986151474b60dc19166eba18156a1f9dbceecb98/%7B%7Bcookiecutter.repo_name%7D%7D/webpack.local.config.js "Webpack local config example"

[npm-url]: https://npmjs.org/package/sw-precache-webpack-plugin
[npm-img]: https://badge.fury.io/js/sw-precache-webpack-plugin.svg
[daviddm-img]: https://david-dm.org/goldhand/sw-precache-webpack-plugin.svg
[daviddm-url]: https://david-dm.org/goldhand/sw-precache-webpack-plugin
[daviddmdev-img]: https://david-dm.org/goldhand/sw-precache-webpack-plugin/dev-status.svg
[daviddmdev-url]: https://david-dm.org/goldhand/sw-precache-webpack-plugin#info=devDependencies
[circleci-img]: https://circleci.com/gh/goldhand/sw-precache-webpack-plugin.svg?style=svg
[circleci-url]: https://circleci.com/gh/goldhand/sw-precache-webpack-plugin
