/**
 * Test that plugin can accept arguments and methods work
 */

import test from 'ava';
import webpack from 'webpack';
import SWPrecacheWebpackPlugin from '../src';
import path from 'path';
import fs from 'fs';
import mkdirp from 'mkdirp';
import Template from 'webpack/lib/Template';

const outputPath = path.resolve(__dirname, 'tmp');

const DEFAULT_OPTIONS = {
  cacheId: 'sw-precache-webpack-plugin',
  filename: 'service-worker.js',
  importScripts: [],
  staticFileGlobsIgnorePatterns: [],
  mergeStaticsConfig: false,
  minify: false,
};

const webpackConfig = (hash = true) => {

  const config = {
    context: __dirname,
    entry: {
      main: path.resolve(__dirname, 'stubs/entry'),
    },
    output: {
      path: outputPath,
      filename: '[name].js',
      publicPath: 'http://localhost:3000/assets/',
    },
  };

  if (hash) {
    config.output.filename = '[name]-[hash].js';
  }

  return config;
};


/**
 * runCompiler promise
 * @param {object} compiler - webpack compiler instance
 * @returns {Promise} - resolves webpack stats
*/
const runCompiler = (compiler) => new Promise(
  resolve => compiler.run((err, stats) => resolve(stats))
);

/**
 * fsExists promise
 * @param {string} fp - filepath to check exists
 * @returns {Promise} fsExists
 */
const fsExists = (fp) => new Promise(
  resolve => fs.access(fp, err => resolve(!err))
);


test.before(() => {
  mkdirp.sync(outputPath);
});

/** SWPrecacheWebpackPlugin constructor paramaters */

test('will use default options', t => {

  const plugin = new SWPrecacheWebpackPlugin();

  t.deepEqual(plugin.options, DEFAULT_OPTIONS);

});

test('can set cacheId', t => {

  const altConfig = {
    cacheId: 'alt-cache-id',
  };

  const plugin = new SWPrecacheWebpackPlugin(altConfig);

  t.deepEqual(plugin.options, {
    ...DEFAULT_OPTIONS,
    ...altConfig,
  });

});

test('can set directoryIndex', t => {

  const altConfig = {
    directoryIndex: 'alt-value',
  };

  const plugin = new SWPrecacheWebpackPlugin(altConfig);

  t.deepEqual(plugin.options, {
    ...DEFAULT_OPTIONS,
    ...altConfig,
  });
});

test('can set dynamicUrlToDependencies', t => {

  const altConfig = {
    dynamicUrlToDependencies: {
      '/pages/home': ['layout.jade', 'home.jade'],
    },
  };

  const plugin = new SWPrecacheWebpackPlugin(altConfig);

  t.deepEqual(plugin.options, {
    ...DEFAULT_OPTIONS,
    ...altConfig,
  });
});

test('can set handleFetch', t => {

  const altConfig = {
    handleFetch: true,
  };

  const plugin = new SWPrecacheWebpackPlugin(altConfig);

  t.deepEqual(plugin.options, {
    ...DEFAULT_OPTIONS,
    ...altConfig,
  });
});

test('can set filename', t => {

  const altConfig = {
    filename: 'alt-sw.js',
  };

  const plugin = new SWPrecacheWebpackPlugin(altConfig);

  t.deepEqual(plugin.options, {
    ...DEFAULT_OPTIONS,
    ...altConfig,
  });
});

test('can set filepath', t => {

  const altConfig = {
    filepath: 'tmp/alt-sw.js',
  };

  const plugin = new SWPrecacheWebpackPlugin(altConfig);

  t.deepEqual(plugin.options, {
    ...DEFAULT_OPTIONS,
    ...altConfig,
  });
});

test('can set minify', t => {

  const altConfig = {
    minify: true,
  };

  const plugin = new SWPrecacheWebpackPlugin(altConfig);

  t.deepEqual(plugin.options, {
    ...DEFAULT_OPTIONS,
    ...altConfig,
  });
});



/** SWPrecacheWebpackPlugin methods */

test.skip('#configure()', async t => {
  // TODO: test configure() method
  t.pass();
});

test.serial('#createServiceWorker()', async t => {
  t.plan(1);

  const compiler = webpack(webpackConfig());
  const plugin = new SWPrecacheWebpackPlugin();

  compiler.plugin('after-emit', (compilation, callback) => {
    plugin.configure(compiler, compilation);
    return callback();
  });
  await runCompiler(compiler);
  t.truthy(await plugin.createServiceWorker(), 'generate something');
});

test.serial('#writeServiceWorker(serviceWorker, compiler)', async t => {
  t.plan(2);
  const filepath = path.resolve(__dirname, 'tmp/service-worker.js');
  const compiler = webpack(webpackConfig());
  const plugin = new SWPrecacheWebpackPlugin({filepath});
  const serviceWorker = 'foo';

  t.falsy(await fsExists(filepath), 'service-worker should not exist yet');

  plugin.apply(compiler);

  compiler.plugin('after-emit', (compilation, callback) => {
    plugin.writeServiceWorker(serviceWorker, compiler)
      .then(() => callback())
      .catch(err => callback(err));
  });

  await runCompiler(compiler);
  t.truthy(await fsExists(filepath), 'service-worker should exist');

});

test.cb('#apply(compiler)', t => {
  t.plan(2);

  const compiler = webpack(webpackConfig());
  const plugin = new SWPrecacheWebpackPlugin();

  plugin.apply(compiler);

  compiler.run((err, stats) => {
    t.ifError(err, `compiler error: ${err}`);
    t.is(typeof stats, 'object');
    t.end();
  });

});

test.serial('importScripts[<index>] should support entry point & dynamically imported chunk names', async t => {
  t.plan(2);

  const filepath = path.resolve(__dirname, 'tmp/service-worker.js');
  const newWebpackConfig = Object.assign({}, webpackConfig());
  newWebpackConfig.entry.sw = path.resolve(
    __dirname, 'stubs/service-worker-imported-script.js'
  );
  newWebpackConfig.output.filename = '[name].[chunkhash].js';
  newWebpackConfig.output.chunkFilename = '[id].[name].[chunkhash].js';

  const compiler = webpack(newWebpackConfig);
  const plugin = new SWPrecacheWebpackPlugin({
    filepath,
    importScripts: [
      'some-script-path.js',
      {filename: 'some-script-path.[hash].js'},
      {chunkName: 'sw'},
      {chunkName: 'service-worker-imported-script-2'},
    ],
  });

  plugin.apply(compiler);

  // const {err, hash, chunkHash} = new Promise((resolve, reject) => {
  const resolved = await new Promise((resolve, reject) => {
    compiler.plugin('after-emit', (compilation) => {
      plugin.configure(compiler, compilation);

      const stats = compilation.getStats()
        .toJson({hash: true, chunks: true, namedChunks: true});

      const dynamicChunk = stats.chunks.find(chunk =>
        chunk.names.includes('service-worker-imported-script-2'));
      resolve({
        hash: compilation.hash,
        entryPointChunkHash:
          stats.chunks.find(chunk => chunk.names.includes('sw')).hash,
        dynamicChunkId: dynamicChunk.id,
        dynamicChunkHash: dynamicChunk.hash,
      });
    });
    runCompiler(compiler).catch((err) => reject({err}));
  });


  const {
    err,
    hash,
    entryPointChunkHash,
    dynamicChunkId,
    dynamicChunkHash,
  } = resolved;

  const actual = plugin.overrides.importScripts;
  const expected = [
    `${newWebpackConfig.output.publicPath}some-script-path.js`,
    `${newWebpackConfig.output.publicPath}some-script-path.${hash}.js`,
    `${newWebpackConfig.output.publicPath}sw.${entryPointChunkHash}.js`,
    `${newWebpackConfig.output.publicPath}${dynamicChunkId}.service-worker-imported-script-2.${dynamicChunkHash}.js`,
  ];
  //
  t.ifError(err, `compiler error: ${err}`);
  t.deepEqual(actual, expected);
});

test.serial('should keep [hash] in importScripts after configuring SW', async t => {
  t.plan(1);

  const filepath = path.resolve(__dirname, 'tmp/service-worker.js');
  const compiler = webpack(webpackConfig());
  const plugin = new SWPrecacheWebpackPlugin({filepath, importScripts: ['some_sw-[hash].js']});

  plugin.apply(compiler);
  compiler.plugin('after-emit', (compilation, callback) => {
    plugin.configure(compiler, compilation);
    callback();
  });

  await runCompiler(compiler);

  t.truthy(plugin.options.importScripts[0] === 'some_sw-[hash].js', 'hash should be preserve after writing the sw');
});

test.serial('should not modify importScripts value when no [hash] is provided', async t => {
  t.plan(1);

  const filepath = path.resolve(__dirname, 'tmp/service-worker.js');
  const compiler = webpack(webpackConfig());
  const plugin = new SWPrecacheWebpackPlugin({filepath, importScripts: ['some_script.js']});

  plugin.apply(compiler);
  compiler.plugin('after-emit', (compilation, callback) => {
    plugin.configure(compiler, compilation);
    callback();
  });
  await runCompiler(compiler);

  t.truthy(plugin.options.importScripts[0] === 'some_script.js', 'importScripts should not be modified');

});

test.serial('uses UglifyJS to minify code', async t => {
  t.plan(2);

  const compiler1 = webpack(webpackConfig(0));
  const withoutMinificationPlugin = new SWPrecacheWebpackPlugin({minify: false});
  withoutMinificationPlugin.apply(compiler1);
  const withoutMinificationFileContents = await new Promise(
    resolve => {
      runCompiler(compiler1);
      compiler1.plugin('after-emit', (compilation) => {
        withoutMinificationPlugin.configure(compiler1, compilation);
        resolve(withoutMinificationPlugin.createServiceWorker());
      });
    }
  );

  const compiler2 = webpack(webpackConfig(0));
  const withMinificationPlugin = new SWPrecacheWebpackPlugin({minify: true});
  withMinificationPlugin.apply(compiler2);
  const withMinificationFileContents = await new Promise(
    resolve => {
      compiler2.plugin('after-emit', (compilation) => {
        withMinificationPlugin.configure(compiler2, compilation);
        resolve(withMinificationPlugin.createServiceWorker());
      });
      runCompiler(compiler2);
    }
  );

  // Uglify should be at least 1/3 the size of non uglifyied
  const withMinBytes = Buffer.byteLength(withMinificationFileContents);
  const withoutMinBytes = Buffer.byteLength(withoutMinificationFileContents);

  t.true(withMinBytes < withoutMinBytes);

  // even 2x uglifyied size should be less than regular
  t.true(withMinBytes * 2 < withoutMinBytes, 'Uglified is more than half the size of non-uglified');
});


/** Test overriding behaviors */


test.serial('@staticFileGlobs generates default value', async t => {
  t.plan(1);

  const compiler = webpack(webpackConfig());
  const plugin = new SWPrecacheWebpackPlugin();

  plugin.apply(compiler);

  await runCompiler(compiler);

  const {hash} = await runCompiler(compiler);
  const expected = [path.resolve(outputPath, `main-${hash}.js`)];
  const actual = plugin.workerOptions.staticFileGlobs;

  t.deepEqual(actual, expected);
});


test.serial('@staticFileGlobs can be overriden', async t => {
  t.plan(1);
  const staticFileGlobs = ['foo', 'bar'];

  const compiler = webpack(webpackConfig());
  const plugin = new SWPrecacheWebpackPlugin({
    staticFileGlobs,
  });

  plugin.apply(compiler);

  await runCompiler(compiler);
  const expected = staticFileGlobs;
  const actual = plugin.workerOptions.staticFileGlobs;

  t.deepEqual(actual, expected);
});

test.serial('@staticFileGlobs can be merged', async t => {
  t.plan(1);
  const staticFileGlobs = ['foo', 'bar'];

  const compiler = webpack(webpackConfig());
  const plugin = new SWPrecacheWebpackPlugin({
    staticFileGlobs,
    mergeStaticsConfig: 1,
  });

  plugin.apply(compiler);

  const {hash} = await runCompiler(compiler);
  const expected = [path.resolve(outputPath, `main-${hash}.js`), ...staticFileGlobs];
  const actual = plugin.workerOptions.staticFileGlobs;

  t.deepEqual(actual, expected);
});

test.serial('@stripPrefixMulti generates default value', async t => {
  t.plan(1);

  const compiler = webpack(webpackConfig());
  const plugin = new SWPrecacheWebpackPlugin();

  plugin.apply(compiler);

  await runCompiler(compiler);

  const expected = {
    [`${outputPath}${path.sep}`]: webpackConfig().output.publicPath,
    '': '',  // sw-precache will modify options object, adding the stripPrefix: replacePrefix: https://github.com/GoogleChrome/sw-precache/blob/3b816c030cf0fc8a9d6bbd32f97d993da642b4c3/lib/sw-precache.js#L154
  };
  const actual = plugin.workerOptions.stripPrefixMulti;

  t.deepEqual(actual, expected);
});

test.serial('@stripPrefixMulti can be overriden', async t => {
  t.plan(1);
  const stripPrefixMulti = {
    foo: 'bar',
  };

  const compiler = webpack(webpackConfig());
  const plugin = new SWPrecacheWebpackPlugin({
    stripPrefixMulti,
  });

  plugin.apply(compiler);

  await runCompiler(compiler);

  const expected = {
    ...stripPrefixMulti,
    '': '',  // sw-precache will modify options object, adding the stripPrefix: replacePrefix: https://github.com/GoogleChrome/sw-precache/blob/3b816c030cf0fc8a9d6bbd32f97d993da642b4c3/lib/sw-precache.js#L154
  };
  const actual = plugin.workerOptions.stripPrefixMulti;

  t.deepEqual(actual, expected);
});

test.serial('@stripPrefixMulti can be merged', async t => {
  t.plan(1);
  const stripPrefixMulti = {
    foo: 'bar',
  };

  const compiler = webpack(webpackConfig());
  const plugin = new SWPrecacheWebpackPlugin({
    stripPrefixMulti,
    mergeStaticsConfig: 1,
  });

  plugin.apply(compiler);

  await runCompiler(compiler);

  const expected = {
    [`${outputPath}${path.sep}`]: webpackConfig().output.publicPath,
    ...stripPrefixMulti,
    '': '',  // sw-precache will modify options object, adding the stripPrefix: replacePrefix: https://github.com/GoogleChrome/sw-precache/blob/3b816c030cf0fc8a9d6bbd32f97d993da642b4c3/lib/sw-precache.js#L154
  };
  const actual = plugin.workerOptions.stripPrefixMulti;

  t.deepEqual(actual, expected);
});

test.serial('@filepath will add warning', async t => {
  t.plan(2);

  const compiler = webpack(webpackConfig());
  const plugin = new SWPrecacheWebpackPlugin({
    filepath: path.resolve(outputPath, 'foo.js'),
  });

  plugin.apply(compiler);

  t.truthy(plugin.warnings.length === 0);

  await runCompiler(compiler);

  t.truthy(plugin.warnings.length === 1);

});
