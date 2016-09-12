const
  path = require('path'),
  webpack = require('webpack'),
  SWPrecacheWebpackPlugin = require('../lib/index'),
  HtmlWebpackPlugin = require('html-webpack-plugin');

// sw-precache-webpack-plugin configurations
const SERVICE_WORKER_FILENAME = 'my-service-worker.js';
const SERVICE_WORKER_CACHEID = 'my-project-name';
const SERVICE_WORKER_IGONRE_PATTERNS = [/dist\/.*\.html/];
const SW_PRECACHE_CONFIG = {
  cacheId: SERVICE_WORKER_CACHEID,
  filename: SERVICE_WORKER_FILENAME,
  staticFileGlobsIgnorePatterns: SERVICE_WORKER_IGONRE_PATTERNS,
};

const HTML_WEBPACK_OPTIONS = {
  main: {
    title: 'examples',
    template: 'src/templates/default.ejs',
    inject: false,
    appMountId: 'main',
    serviceWorker: `/${SERVICE_WORKER_FILENAME}`,
  },
};

module.exports = {
  context: __dirname,

  entry: {
    main: path.resolve(__dirname, 'src/index'),
  },

  output: {
    path: path.resolve(__dirname, 'dist/'),
    filename: '[name]-[hash].js',
  },

  plugins: [
    new HtmlWebpackPlugin(HTML_WEBPACK_OPTIONS.main),
    // shared stuff between chuncks
    new webpack.optimize.CommonsChunkPlugin({
      name: 'vendor',
      minChunks: Infinity,
      filename: 'vendor-[hash].js',
      chuncks: ['react', 'redux'],
    }),
    new SWPrecacheWebpackPlugin(SW_PRECACHE_CONFIG),
  ], // add all common plugins here

  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        loaders: ['babel-loader'],
      },
      {
        test: /\.ejs$/,
        loader: 'ejs',
        query: {
          includePaths: [
            path.resolve(__dirname, 'src/templates/'),
          ],
        },
      },
      {test: /\.less$/, loader: 'style-loader!css-loader!less-loader'},
      {test: /\.css$/, loader: 'style-loader!css-loader'},
      {test: /\.(png|jpg|gif)$/, loader: 'url-loader', query: {limit: 8192}},  // inline base64 URLs <=8k
      {test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/, loader: 'file-loader'},
    ], // add all common loaders here
  },

  resolve: {
    extensions: ['', '.js', '.jsx'],
    modules: [
      path.resolve(__dirname, 'src'),
      'node_modules',
    ],
  },
};
