const path = require('path');
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = (env, args) => ({
  mode: 'production',
  output: {
    path: path.resolve(__dirname, 'www', 'js')
  },
  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
            plugins: ['@babel/transform-runtime']
          }
        }
      }
    ]
  },
  plugins: [
    new webpack.ProvidePlugin({
      m: 'mithril',
      Stream: 'mithril/stream',
    })
  ],
  optimisation: {
    minimizer: [
      new TerserPlugin({
        extractComments: false,
      }),
    ]
  },
});
