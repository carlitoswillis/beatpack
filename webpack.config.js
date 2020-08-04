const path = require('path');

module.exports = [{
  target: 'electron-main',
  mode: 'production',
  entry: './app/beatpack.jsx',
  output: {
    filename: 'beatpack.js',
    path: path.resolve(__dirname, 'public'),
  },
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
    ],
  },
  resolve: { extensions: ['.js', '.jsx'] },

}, {
  target: 'electron-main',
  mode: 'production',
  entry: './app/spotify.jsx',
  output: {
    filename: 'spotify.js',
    path: path.resolve(__dirname, 'public'),
  },
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
    ],
  },
  resolve: { extensions: ['.js', '.jsx'] },

}];
