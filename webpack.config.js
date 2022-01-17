const path = require('path');
const webpack = require('webpack');

module.exports = (env, args) => ({
  mode: 'production',
  entry: {
    main: './src/index.js',
    'pdf.worker': 'pdfjs-dist/build/pdf.worker',
  },
  output: {
    path: path.resolve(__dirname, 'www', 'js')
  },
  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: /node_modules/,
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
      Config: ['./config', 'default'],
    }),
    new webpack.DefinePlugin(args.mode !== 'development' ? {} : {
      'Config.url': '"http://localhost:8080/Pokrywa_sniezna.pdf"',
    }),
  ],
});
