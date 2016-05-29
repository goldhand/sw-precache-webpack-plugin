const
  path = require('path'),
  del = require('del'),
  swPrecache = require('sw-precache');


const
  DEFAULT_CACHE_ID = 'sw-precache-plugin',
  DEFAULT_WORKER_FILENAME = 'service-worker.js',
  DEFAULT_OUTPUT_FILENAME = '[name]-[hash].js';

/**
 * @param {object} options - cacheId, filename, options
 * @returns {undefined}
 */
function SWPrecacheWebpackPlugin(options) {
  this.options = options || {};
  this.options.cacheId = this.options.cacheId || DEFAULT_CACHE_ID;
  this.options.filename = this.options.filename || DEFAULT_WORKER_FILENAME;
  this.options.outputFilename = this.options.outputFilename || DEFAULT_OUTPUT_FILENAME;
  this.options.options = this.options.options || {};
}

SWPrecacheWebpackPlugin.prototype.apply = function(compiler) {
  var self = this;

  compiler.plugin('done', function(stats) {

    const outputPath = self.options.path || compiler.options.output.path || '.';

    var staticFileGlobs = stats.compilation.chunks.reduce(function(files, chunk) {
      return files.concat(chunk.files.map(function(f) {
        return path.join(outputPath, f);
      }));
    }, []);
    staticFileGlobs.push(path.join(outputPath, 'index.html'));

    const config = {
      cacheId: self.options.cacheId,
      verbose: true,
      root: outputPath,
      // staticFileGlobs: [outputPath + '/*'],
      staticFileGlobs: staticFileGlobs,
      stripPrefix: outputPath,
    };
    if (compiler.options.output.publicPath) {
      config.replacePrefix = compiler.options.output.publicPath;
    }
    self.writeServiceWorker(compiler, config);
  });
};

SWPrecacheWebpackPlugin.prototype.writeServiceWorker = function(compiler, config) {
  const
    workerDir = compiler.options.output.path || '.',
    workerFilename = path.join(workerDir, this.options.filename || DEFAULT_WORKER_FILENAME),
    workerOptions = config;  // TODO: make this overridable with options.options

  return del(workerFilename).then(function() {
    return swPrecache.write(workerFilename, workerOptions);
  });
};

module.exports = SWPrecacheWebpackPlugin;
