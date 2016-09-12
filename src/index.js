import path from 'path';
import del from 'del';
import swPrecache from 'sw-precache';


const
  DEFAULT_CACHE_ID = 'sw-precache-webpack-plugin',
  DEFAULT_WORKER_FILENAME = 'service-worker.js',
  DEFAULT_OUTPUT_PATH = '';

const DEFAULT_OPTIONS = {
  cacheId: DEFAULT_CACHE_ID,
  filename: DEFAULT_WORKER_FILENAME,
};

/**
 * SWPrecacheWebpackPlugin - A wrapper for sw-precache to use with webpack
 * @param {object} options - All parameters should be passed as a single options object
 *
 * // sw-precache options:
 * @param {string} [options.cacheId]
 * @param {string} [options.directoryIndex]
 * @param {object|array} [options.dynamicUrlToDependencies]
 * @param {boolean} [options.handleFetch]
 * @param {array} [options.ignoreUrlParametersMatching]
 * @param {array} [options.importScripts]
 * @param {function} [options.logger]
 * @param {number} [options.maximumFileSizeToCacheInBytes]
 * @param {array} [options.navigateFallbackWhitelist]
 * @param {string} [options.replacePrefix]
 * @param {array} [options.runtimeCaching]
 * @param {array} [options.staticFileGlobs]
 * @param {string} [options.stripPrefix]
 * @param {string} [options.templateFilePath]
 * @param {boolean} [options.verbose]
 *
 * // plugin options:
 * @param {string} [options.filename] - Service worker filename, default is 'service-worker.js'
 * @param {string} [options.filepath] - Service worker path and name, default is to use webpack.output.path + options.filename
 */
class SWPrecacheWebpackPlugin {

  constructor(options) {
    this.options = {
      ...DEFAULT_OPTIONS,
      ...options,
    };
  }

  apply(compiler) {

    compiler.plugin('done', (stats) => {

      // get the output path specified in webpack config
      const outputPath = compiler.options.output.path || DEFAULT_OUTPUT_PATH;

      // get all assets outputted by webpack
      const assetGlobs = getAssetGlobs(stats.compilation).map(f => path.join(outputPath, f));

      const ignorePatterns = this.options.staticFileGlobsIgnorePatterns || []

      // filter staticFileGlobs from ignorePatterns
      const staticFileGlobs = assetGlobs.filter(text =>
        (!ignorePatterns.some((regex) => regex.test(text)))
      )

      const config = {
        staticFileGlobs,
        verbose: true,
      };

      if (outputPath) {
        // strip the webpack config's output.path
        config.stripPrefix = `${outputPath}/`;
      }

      if (compiler.options.output.publicPath) {
        // prepend the public path to the resources
        config.replacePrefix = compiler.options.output.publicPath;
      }

      this.writeServiceWorker(compiler, config);
    });
  }

  writeServiceWorker(compiler, config) {
    const
      fileDir = compiler.options.output.path || DEFAULT_OUTPUT_PATH,
      // default to options.filepath for writing service worker location
      filepath = this.options.filepath || path.join(fileDir, this.options.filename),
      workerOptions = {
        ...config,
        ...this.options,
      };

    return del(filepath).then(() => {
      return swPrecache.write(filepath, workerOptions);
    });
  }
}

function getAssetGlobs(compilation) {
  const assets = [];
  for (const asset in compilation.assets) {
    assets.push(asset);
  }
  return assets;
}


module.exports = SWPrecacheWebpackPlugin;
