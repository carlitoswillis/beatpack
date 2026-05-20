const path = require('path');
const webpack = require('webpack');

module.exports = {
  target: 'electron-renderer',
  mode: 'production',
  entry: './app/beatpack.jsx',
  output: {
    filename: 'beatpack.js',
    path: path.resolve(__dirname /* 'public' */),
  },
  plugins: [
    new webpack.DefinePlugin({
      global: 'window',
    }),
  ],
  module: {
    rules: [
      {
        test: /\.m?js$|.m?jsx$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react'],
          },
        },
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  resolve: { extensions: ['.js', '.jsx'] },

}