Examples
===============================
(not-very) minimal example using `SWPrecacheWebpackPlugin` in a react / redux project.


Getting Started
---------------

Install npm packages

    $ npm install

Start the server

    $ npm start

Open __localhost:3000__ in your browser to see the example project.
---------------------------------

The service worker is registered in the [`register-service-worker.ejs` template](/examples/src/templates/register-service-worker.ejs)

The `SWPrecacheWebpackPlugin` is in the plugins of the [`webpack.config.js` file](/examples/webpack.config.js)


Production and Local Configurations
-----------------------------------
Although this example only has one `webpack.config.js` file, I highly suggest you separate your production and local configurations into separate files that import common configurations from a single base config file. You will only need `SWPrecacheWebpackPlugin` in production and it will get annoying to have all this caching while trying to develop. Here's an [example of the local / production separation][webpack-config].



[webpack-config]: https://github.com/hzdg/cookiecutter-webpack
