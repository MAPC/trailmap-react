const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const DotEnv = require('dotenv-webpack');

module.exports = {
  mode: process.env.NODE_ENV || 'development' || 'production',
  entry: './src/index.js',
  output: {
    path: path.join(__dirname, '/dist'),
    filename: 'index.bundle.js',
    publicPath: '/'
  },
  resolve: {
    modules: ["node_modules"],
    fallback: {
      buffer: require.resolve("buffer/"),
    },
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: ['babel-loader']
      },
      {
        test: /\.(js|css)$/,
        enforce: 'pre',
        use: ['source-map-loader'],
        exclude: /node_modules\/style-loader/,
      },
      {
        test: /\.svg$/,
        use: [
          {
            loader: 'svg-url-loader',
            options: {
              limit: 10000,
            },
          },
        ],
      },
      {
        test: /\.s[ac]ss$/i,
        use: [
          "style-loader",
          "css-loader",
          "sass-loader",
        ],
      },
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader"],
      },
      {
        test: /\.(woff|woff2)$/,
        use: {
          loader: 'url-loader',
        },
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({ template: './src/index.html', favicon: './src/favicon.png' }),
    new DotEnv(),
    // Required by wkx: it references global Buffer without importing it
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
    }),
  ],
  devServer: {
    historyApiFallback: {
      disableDotRule: true,
      htmlAcceptHeaders: ['text/html', 'application/xhtml+xml']
    },
    port: 8080,
    hot: true,
    open: false,
    proxy: [
      {
        context: ['/get-open-space'],
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    ],
    client: {
      overlay: {
        errors: true,
        warnings: false,
        runtimeErrors: true,
      },
    },
  }
};
