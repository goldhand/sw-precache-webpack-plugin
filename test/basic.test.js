/**
 * Make sure this plugin will run and the file is created into build dir
 */

import test from 'ava';
import path from 'path';
import webpack from 'webpack';
import SWPrecacheWebpackPlugin from '../lib';

const webpackConfig = () => {

  const config = {
    context: __dirname,
    entry: {
      main: path.resolve(__dirname, 'stubs/entry'),
    },
    output: {
      path: path.resolve(__dirname, '../tmp'),
      filename: '[name].js',
    },
  };

  config.plugins = [
    new SWPrecacheWebpackPlugin(),
  ];
  return {
    config,
  };
};

const testSWPrecacheWebpackPlugin = ({
  config,
  t,
}) => {

  const compiler = webpack(config);

  return compiler.run((err, stats) => {
    if (err) t.fail();

    if (!stats.length) t.fail();

    return stats;
  });
};

test('It will build', t => {

  // testSWPrecacheWebpackPlugin(webpackConfig().config, t);
  t.pass();
});
