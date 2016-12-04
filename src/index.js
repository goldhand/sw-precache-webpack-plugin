import path from 'path';
import url from 'url';
import del from 'del';
import swPrecache from 'sw-precache';


const
  DEFAULT_CACHE_ID = 'sw-precache-webpack-plugin',
  DEFAULT_WORKER_FILENAME = 'service-worker.js',
  DEFAULT_OUTPUT_PATH = '',
  DEFAULT_PUBLIC_PATH = '',
  DEFAULT_IMPORT_SCRIPTS = [];

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
 * @param {RegExp} [options.staticFileGlobsIgnorePatterns[]] - Define an optional array of regex patterns to filter out of staticFileGlobs
 */
class SWPrecacheWebpackPlugin {

  constructor(options) {
    this.options = {
      ...DEFAULT_OPTIONS,
      ...options,
    };
    this.overrides = {};
  }

  apply(compiler) {

    compiler.plugin('done', (stats) => {

      // get the output path specified in webpack config
      const outputPath = compiler.options.output.path || DEFAULT_OUTPUT_PATH;

      // get the public path specified in webpack config
      const publicPath = compiler.options.output.publicPath || DEFAULT_PUBLIC_PATH;

      // get the importScripts value specified in the sw-precache config
      const importScripts = this.options.importScripts || DEFAULT_IMPORT_SCRIPTS;

      // get all assets outputted by webpack
      const assetGlobs = Object
        .keys(stats.compilation.assets)
        .map(f => path.join(outputPath, f));

      const ignorePatterns = this.options.staticFileGlobsIgnorePatterns || [];

      // filter staticFileGlobs from ignorePatterns
      const staticFileGlobs = assetGlobs.filter(text =>
        (!ignorePatterns.some((regex) => regex.test(text)))
      );

      const config = {
        staticFileGlobs,
        verbose: true,
      };

      if (outputPath) {
        // strip the webpack config's output.path
        config.stripPrefix = `${outputPath}${path.sep}`;
      }

      if (publicPath) {
        // prepend the public path to the resources
        config.replacePrefix = publicPath;
      }

      if (importScripts) {
        this.overrides.importScripts = importScripts
          .map(f => f.replace(/\[hash\]/g, stats.hash)) // need to override importScripts with stats.hash
          .map(f => url.resolve(publicPath, f));  // add publicPath to importScripts
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
        ...this.overrides,
      };

    return del(filepath).then(() => {
      return swPrecache.write(filepath, workerOptions);
    });
  }
}


module.exports = SWPrecacheWebpackPlugin;
