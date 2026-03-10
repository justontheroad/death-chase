const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: './src/main.ts',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      // Handle SVG and other image files
      {
        test: /\.(svg|png|jpg|gif)$/,
        type: 'asset/resource',
        generator: {
          filename: 'assets/[name][ext]'
        }
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    alias: {
      phaser: path.join(__dirname, 'node_modules/phaser/dist/phaser.js')
    }
  },
  output: {
    filename: 'game.bundle.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: 'Death Chase - 夺命追击',
      template: './src/index.html'
    }),
    // Copy assets folder to dist
    new CopyWebpackPlugin({
      patterns: [
        { from: 'assets', to: 'assets' }
      ]
    })
  ]
};