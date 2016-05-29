import path from 'path';
import del from 'del';
import swPrecache from 'sw-precache';


const
  DEFAULT_CACHE_ID = 'sw-precache-plugin',
  DEFAULT_WORKER_FILENAME = 'service-worker.js',
  DEFAULT_OUTPUT_FILENAME = '[name]-[hash].js';

const DEFAULT_OPTIONS = {
  cacheId: DEFAULT_CACHE_ID,
  filename: DEFAULT_WORKER_FILENAME,
  outputFilename: DEFAULT_OUTPUT_FILENAME,
};

/**
 * @param {object} options - cacheId, filename, options
 * @returns {undefined}
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

      const outputPath = this.options.path || compiler.options.output.path || '.';

      const staticFileGlobs = stats.compilation.chunks.reduce((files, chunk) => {
        return files.concat(chunk.files.map((f) => {
          return path.join(outputPath, f);
        }));
      }, []);
      staticFileGlobs.push(path.join(outputPath, 'index.html'));

      const config = {
        // cacheId: this.options.cacheId,
        root: outputPath,
        // staticFileGlobs: [outputPath + '/*'],
        staticFileGlobs: staticFileGlobs,
        stripPrefix: outputPath,
        verbose: true,
      };
      if (compiler.options.output.publicPath) {
        config.replacePrefix = compiler.options.output.publicPath;
      }
      this.writeServiceWorker(compiler, config);
    });
  }

  writeServiceWorker(compiler, config) {
    const
      workerDir = compiler.options.output.path || '.',
      workerFilename = path.join(workerDir, this.options.filename),
      workerOptions = {
        ...config,
        ...this.options.options,
      };

    return del(workerFilename).then(() => {
      return swPrecache.write(workerFilename, workerOptions);
    });
  }
}

module.exports = SWPrecacheWebpackPlugin;
