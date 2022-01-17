const path = require('path');
const webpack = require('webpack');

module.exports = {
  mode: 'development',
  entry: './src/app.js',
  output: {
    path: path.resolve(__dirname, 'www', 'js'),
    filename: 'app.js',
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
  ]
};
