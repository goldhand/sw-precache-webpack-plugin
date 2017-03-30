import path from 'path';
import url from 'url';
import swPrecache from 'sw-precache';
import UglifyJS from 'uglify-js';

const FILEPATH_WARNING = 'sw-prechache-webpack-plugin filepath: You are using a custom path for your service worker, this may prevent the service worker from working correctly if it is not available in the same path as your application.';


const
  DEFAULT_CACHE_ID = 'sw-precache-webpack-plugin',
  DEFAULT_WORKER_FILENAME = 'service-worker.js',
  DEFAULT_PUBLIC_PATH = '',
  DEFAULT_IMPORT_SCRIPTS = [],
  DEFAULT_IGNORE_PATTERNS = [];

const DEFAULT_OPTIONS = {
  cacheId: DEFAULT_CACHE_ID,
  filename: DEFAULT_WORKER_FILENAME,
  importScripts: DEFAULT_IMPORT_SCRIPTS,
  staticFileGlobsIgnorePatterns: DEFAULT_IGNORE_PATTERNS,
  forceDelete: false,
  mergeStaticsConfig: false,
  minify: false,
};


class SWPrecacheWebpackPlugin {

  /**
   * SWPrecacheWebpackPlugin - A wrapper for sw-precache to use with webpack
   * @constructor
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
  constructor(options) {
    // generated configuration options
    this.config = {};
    // configuration options passed by user
    this.options = {
      ...DEFAULT_OPTIONS,
      ...options,
    };
    // generated configuration that will override user options
    this.overrides = {};
  }

  /**
   * @returns {object} - plugin configuration
   */
  get workerOptions() {
    return {
      ...this.config,
      ...this.options,
      ...this.overrides,
    };
  }

  apply(compiler) {
    // sw-precache needs physical files to reference so we MUST wait until after assets are emitted before generating the service-worker.
    compiler.plugin('after-emit', (compilation, callback) => {
      this.configure(compiler, compilation);  // configure the serviceworker options

      const done = () => callback();
      const error = (err) => callback(err);

      // generate service worker then write to file system
      this.createServiceWorker()
        .then(serviceWorker => this.writeServiceWorker(serviceWorker, compiler, callback))
        .then(done, error);
    });
  }

  configure(compiler, compilation) {

      // get the defaults from options
    const {
        importScripts,
        staticFileGlobsIgnorePatterns,
        mergeStaticsConfig,
      } = this.options;

    // get the output path used by webpack
    const {outputPath} = compiler;

    // outputPath + filename or the user option
    const {filepath = path.resolve(outputPath, this.options.filename)} = this.options;

    // get the public path specified in webpack config
    const {publicPath = DEFAULT_PUBLIC_PATH} = compiler.options.output;

    if (this.options.filepath) {
        // warn about changing filepath
      compilation.warnings.push(new Error(FILEPATH_WARNING));
    }

    // get all assets outputted by webpack
    const assetGlobs = Object
      .keys(compilation.assets)
      .map(f => path.join(outputPath, f));

    // merge assetGlobs with provided staticFileGlobs and filter using staticFileGlobsIgnorePatterns
    const staticFileGlobs = assetGlobs.concat(this.options.staticFileGlobs || []).filter(text =>
      (!staticFileGlobsIgnorePatterns.some((regex) => regex.test(text)))
    );

    const stripPrefixMulti = {
      ...this.options.stripPrefixMulti,
    };

    if (outputPath) {
      // strip the webpack config's output.path
      stripPrefixMulti[`${outputPath}${path.sep}`] = publicPath;
    }

    this.config = {
      ...this.config,
      staticFileGlobs,
      stripPrefixMulti,
    };

    // set the actual filepath
    this.overrides.filepath = filepath;

    // resolve [hash] used in importScripts
    if (importScripts) {
      this.overrides.importScripts = importScripts
        .map(f => f.replace(/\[hash\]/g, compilation.hash)) // need to override importScripts with stats.hash
        .map(f => url.resolve(publicPath, f));  // add publicPath to importScripts
    }

    if (mergeStaticsConfig) {
      // merge generated and user provided options
      this.overrides = {
        ...this.overrides,
        staticFileGlobs,
        stripPrefixMulti,
      };
    }
  }

  createServiceWorker() {
    return swPrecache.generate(this.workerOptions)
      .then((serviceWorkerFileContents) => {
        if (this.options.minify) {
          const uglifyFiles = {};
          uglifyFiles[this.options.filename] = serviceWorkerFileContents;
          const minifedCodeObj = UglifyJS.minify(uglifyFiles, {fromString: true});
          return minifedCodeObj.code;
        }
        return serviceWorkerFileContents;
      });
  }

  writeServiceWorker(serviceWorker, compiler, callback) {
    const {filepath} = this.workerOptions;

    // use the outputFileSystem api to manually write service workers rather than adding to the compilation assets
    return compiler.outputFileSystem.mkdirp(path.resolve(filepath, '..'),
      () => compiler.outputFileSystem.writeFile(filepath, serviceWorker, callback));
  }
}


module.exports = SWPrecacheWebpackPlugin;
