const
  path = require('path'),
  del = require('del'),
  swPrecache = require('sw-precache'),
  fs = require('fs'),
  mkdirp = require('mkdirp');

var DEFAULT_CACHE_ID = 'sw-precache-plugin';
var DEFAULT_WORKER_FILENAME = 'service-worker.js';
var DEFAULT_OUTPUT_FILENAME = '[name]-[hash].js';

/**
 * @param {object} options - cacheId, filename, options
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
    self.writeOutput(compiler, config);
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

SWPrecacheWebpackPlugin.prototype.writeOutput = function(compiler, contents) {
  var outputDir = '.';
  var outputFilename = path.join(outputDir, 'sw-prefeth-config.json');
  if (compiler.options.output.publicPath) {
    contents.publicPath = compiler.options.output.publicPath;
  }
  mkdirp.sync(path.dirname(outputFilename));
  fs.writeFileSync(outputFilename, JSON.stringify(contents, null, this.options.indent));
};

module.exports = SWPrecacheWebpackPlugin;
