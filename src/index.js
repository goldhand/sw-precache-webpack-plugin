import path from 'path';
import url from 'url';
import del from 'del';
import swPrecache from 'sw-precache';
import UglifyJS from 'uglify-js';
import fs from 'fs';

const FILEPATH_WARNING = 'sw-prechache-webpack-plugin filepath: You are using a custom path for your service worker, this may prevent the service worker from working correctly if it is not available in the same path as your application.';

const
  DEFAULT_CACHE_ID = 'sw-precache-webpack-plugin',
  DEFAULT_WORKER_FILENAME = 'service-worker.js',
  DEFAULT_OUTPUT_PATH = '',
  DEFAULT_PUBLIC_PATH = '',
  DEFAULT_IMPORT_SCRIPTS = [];

const DEFAULT_OPTIONS = {
  cacheId: DEFAULT_CACHE_ID,
  filename: DEFAULT_WORKER_FILENAME,
  forceDelete: false,
  mergeStaticsConfig: false,
  minify: false,
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
 * @param {string} [options.stripPrefixMulti]
 * @param {string} [options.templateFilePath]
 * @param {boolean} [options.verbose]
 *
 * // plugin options:
 * @param {string} [options.filename] - Service worker filename, default is 'service-worker.js'
 * @param {string} [options.filepath] - Service worker path and name, default is to use webpack.output.path + options.filename
 * @param {RegExp} [options.staticFileGlobsIgnorePatterns[]] - Define an optional array of regex patterns to filter out of staticFileGlobs
 * @param {boolean} [options.forceDelete=false] - Pass force option to del
 * @param {boolean} [options.mergeStaticsConfig=false] - Merge provided staticFileGlobs and stripPrefix(Multi) with webpack's config, rather than having those take precedence
 * @param {boolean} [options.minify=false] - Minify the generated Service worker file using UglifyJS
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

    compiler.plugin('after-emit', (compilation, callback) => {

      // get the output path specified in webpack config
      const outputPath = compiler.options.output.path || DEFAULT_OUTPUT_PATH;

      // get the public path specified in webpack config
      const {publicPath = DEFAULT_PUBLIC_PATH} = compiler.options.output;

      // get the importScripts value specified in the sw-precache config
      const {importScripts = DEFAULT_IMPORT_SCRIPTS} = this.options;

      if (this.options.filepath) {
        // warn about changing filepath
        compilation.warnings.push(new Error(FILEPATH_WARNING));
      }

      // get all assets outputted by webpack
      const assetGlobs = Object
        .keys(compilation.assets)
        .map(f => path.join(outputPath, f));

      const ignorePatterns = this.options.staticFileGlobsIgnorePatterns || [];

      // merge assetGlobs with provided staticFileGlobs and filter using ignorePatterns
      const staticFileGlobs = assetGlobs.concat(this.options.staticFileGlobs || []).filter(text =>
        (!ignorePatterns.some((regex) => regex.test(text)))
      );

      const config = {
        staticFileGlobs,
        // use provided stripPrefixMulti if there is one, then work from there
        stripPrefixMulti: this.options.mergeStaticsConfig ? {...this.options.stripPrefixMulti} : {},
        verbose: true,
      };

      if (this.options.mergeStaticsConfig && this.options.stripPrefix) {
        // add stripPrefix to stripPrefixMulti and delete it so we make sure only stripPrefixMulti is used
        config.stripPrefixMulti[this.options.stripPrefix] = this.options.replacePrefix || '';
      }

      if (outputPath) {
        // strip the webpack config's output.path
        config.stripPrefixMulti[`${outputPath}${path.sep}`] = publicPath || '';
      }

      if (importScripts) {
        this.overrides.importScripts = importScripts
          .map(f => f.replace(/\[hash\]/g, compilation.hash)) // need to override importScripts with stats.hash
          .map(f => url.resolve(publicPath, f));  // add publicPath to importScripts
      }

      const done = () => callback();
      const error = (err) => callback(err);

      this.writeServiceWorker(compiler, config).then(done, error);
    });
  }

  writeServiceWorker(compiler, config) {
    const
      fileDir = compiler.options.output.path || DEFAULT_OUTPUT_PATH,
      // default to options.filepath for writing service worker location
      {filepath = path.join(fileDir, this.options.filename)} = this.options,
      workerOptions = {
        ...config,
        ...this.options,
        ...this.overrides,
      };

    if (this.options.mergeStaticsConfig) {
      workerOptions.staticFileGlobs = config.staticFileGlobs;
      workerOptions.stripPrefixMulti = config.stripPrefixMulti;
      delete workerOptions.stripPrefix;
      delete workerOptions.replacePrefix;
    }

    return del(filepath, {force: this.options.forceDelete})
      .then(() => swPrecache.generate(workerOptions))
      .then((serviceWorkerFileContents) => {
        if (this.options.minify) {
          const uglifyFiles = {};
          uglifyFiles[this.options.filename] = serviceWorkerFileContents;
          const minifedCodeObj = UglifyJS.minify(uglifyFiles, {fromString: true});
          return minifedCodeObj.code;
        }
        return serviceWorkerFileContents;
      })
      .then((possiblyMinifiedServiceWorkerFileContents) => fs.writeFileSync(filepath, possiblyMinifiedServiceWorkerFileContents));
  }
}


module.exports = SWPrecacheWebpackPlugin;
