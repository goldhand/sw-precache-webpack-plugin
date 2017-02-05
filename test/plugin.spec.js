/**
 * Test that plugin can accept arguments and methods work
 */

import test from 'ava';
import webpack from 'webpack';
import SWPrecacheWebpackPlugin from '../lib';
import path from 'path';
import fs from 'fs';
import sinon from 'sinon';
import UglifyJS from 'uglify-js';
import mkdirp from 'mkdirp';
import bluebirdPromise from 'bluebird';
bluebirdPromise.promisifyAll(fs);
bluebirdPromise.promisifyAll(mkdirp);

const outputPath = path.resolve(__dirname, 'tmp');

const DEFAULT_OPTIONS = {
  cacheId: 'sw-precache-webpack-plugin',
  filename: 'service-worker.js',
  importScripts: [],
  staticFileGlobsIgnorePatterns: [],
  forceDelete: false,
  mergeStaticsConfig: false,
  minify: false,
};

const webpackConfig = () => {

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


test.before(async () => {
  await mkdirp(outputPath);
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

test.serial('#writeServiceWorker(compiler, config)', async t => {
  t.plan(2);

  const filepath = path.resolve(__dirname, 'tmp/service-worker.js');
  const compiler = webpack(webpackConfig());
  const plugin = new SWPrecacheWebpackPlugin({filepath});

  plugin.apply(compiler);

  t.falsy(await fsExists(filepath), 'service-worker should not exist yet');
  await plugin.writeServiceWorker(compiler, plugin.options);
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

test.serial('should keep [hash] in importScripts after writing SW', async t => {
  t.plan(1);

  const filepath = path.resolve(__dirname, 'tmp/service-worker.js');
  const compiler = webpack(webpackConfig());
  const plugin = new SWPrecacheWebpackPlugin({filepath, importScripts: ['some_sw-[hash].js']});

  plugin.apply(compiler);

  await plugin.writeServiceWorker(compiler, plugin.options);
  t.truthy(plugin.options.importScripts[0] === 'some_sw-[hash].js', 'hash should be preserve after writing the sw');

});

test.serial('should not modify importScripts value when no hash is provided', async t => {
  t.plan(1);

  const filepath = path.resolve(__dirname, 'tmp/service-worker.js');
  const compiler = webpack(webpackConfig());
  const plugin = new SWPrecacheWebpackPlugin({filepath, importScripts: ['some_script.js']});

  plugin.apply(compiler);

  await plugin.writeServiceWorker(compiler, plugin.options);
  t.truthy(plugin.options.importScripts[0] === 'some_script.js', 'importScripts should not be modified');

});

test.serial('uses UglifyJS to minify code', async t => {
  const filepath = path.resolve(__dirname, 'tmp/service-worker.js');
  const compiler1 = webpack(webpackConfig());
  const withoutMinificationPlugin = new SWPrecacheWebpackPlugin({filepath, minify: false});
  withoutMinificationPlugin.apply(compiler1);
  await withoutMinificationPlugin.writeServiceWorker(compiler1, withoutMinificationPlugin.options);
  const withoutMinificationFileContents = await fs.readFileAsync(filepath);
  // spy on uglify
  const uglifyMock = sinon.mock(UglifyJS);
  const minifyExpectation = uglifyMock.expects('minify');
  minifyExpectation.once();
  minifyExpectation.returns({code: 'minified string', map: null});
  minifyExpectation.withExactArgs({
    'service-worker.js': withoutMinificationFileContents.toString(),
  }, {
    fromString: true,
  });
  const compiler2 = webpack(webpackConfig());
  const withMinificationPlugin = new SWPrecacheWebpackPlugin({filepath, minify: true});
  withMinificationPlugin.apply(compiler2);
  await withMinificationPlugin.writeServiceWorker(compiler2, withMinificationPlugin.options);
  // verify uglify js was called correctly
  minifyExpectation.verify();
  uglifyMock.restore();
  // check if minified code was written correctly
  const withMinificationFileContents = await fs.readFileAsync(filepath);
  t.deepEqual(withMinificationFileContents.toString(), 'minified string');
});


/** Test overriding behaviors */


test.serial('@staticFileGlobs generates default value', async t => {
  t.plan(1);

  const compiler = webpack(webpackConfig());
  const plugin = new SWPrecacheWebpackPlugin();

  plugin.apply(compiler);

  await runCompiler(compiler);

  const expected = [path.resolve(outputPath, 'main.js')];
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

  await runCompiler(compiler);
  const expected = [path.resolve(outputPath, 'main.js'), ...staticFileGlobs];
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
