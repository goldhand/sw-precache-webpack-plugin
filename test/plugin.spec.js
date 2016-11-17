/**
 * Test that plugin can accept arguments and methods work
 */

import test from 'ava';
import webpack from 'webpack';
import SWPrecacheWebpackPlugin from '../lib';
import path from 'path';
import fs from 'fs';


const DEFAULT_OPTIONS = {
  cacheId: 'sw-precache-webpack-plugin',
  filename: 'service-worker.js',
};

const webpackConfig = () => {

  const config = {
    context: __dirname,
    entry: {
      main: path.resolve(__dirname, 'stubs/entry'),
    },
    output: {
      path: path.resolve(__dirname, 'tmp'),
      filename: '[name].js',
    },
  };

  return config;
};


/** SWPrecacheWebpackPlugin constructor paramaters */

test('will use defualt options', t => {

  const plugin = new SWPrecacheWebpackPlugin();

  t.deepEqual(plugin.options, DEFAULT_OPTIONS);

});

test('can set chacheId', t => {

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


/** SWPrecacheWebpackPlugin methods */

test.serial.cb('#writeServiceWorker(comiler, config)', t => {
  t.plan(2);

  const filepath = path.resolve(__dirname, 'tmp/service-worker.js');
  const compiler = webpack(webpackConfig());
  const plugin = new SWPrecacheWebpackPlugin({filepath});

  plugin.apply(compiler);

  fs.exists(
    filepath,
    shouldNotExist => {
      t.falsy(shouldNotExist, 'service-worker should not exist');
      plugin.writeServiceWorker(compiler, plugin.options).then(() => {
        fs.exists(
          filepath,
          shouldExist => {
            t.truthy(shouldExist, 'service-worker should exists');
            t.end();
          },
        );
      });
    }
  );

});

test.cb('#apply(compiler)', t => {
  t.plan(2);

  const compiler = webpack(webpackConfig());
  const plugin = new SWPrecacheWebpackPlugin({verbose: false});

  plugin.apply(compiler);

  compiler.run((err, stats) => {
    t.ifError(err, `compiler error: ${err}`);
    t.is(typeof stats, 'object');
    t.end();
  });

});
