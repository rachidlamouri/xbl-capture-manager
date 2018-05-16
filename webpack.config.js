const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')

module.exports = {
    mode: 'development',
    entry: {
        browser: 'browser/browser',
    },
    output: {
        path: path.resolve('client'),
        filename: '[name].bundle.js',
    },
    devtool: 'source-map',
    plugins: [
        new CopyWebpackPlugin([{
            from: 'src/fontawesome/fontawesome-all.js',
            to: 'fontawesome-all.js',
        }]),
        new HtmlWebpackPlugin({
            title: 'Browser',
            template: 'src/common/index.html',
            filename: 'index.html',
            chunks: ['browser'],
    	}),
    ],
    optimization: {
        minimize: false,
    },
    module: {
        rules: [
            {
                test: /\.(js|jsx)$/,
                exclude: /node_modules/,
                use: [
                    'babel-loader',
                ],
            },
            { 
                test: /\.scss$/,
                use: [
                    {loader: 'style-loader'},
                    {loader: 'css-loader'},
                    {loader: 'sass-loader'},
                ],
            }
        ],
    },
    target: 'electron-renderer',
    resolve: {
        alias: {
            browser: path.resolve('src/browser'),
            common: path.resolve('src/common'),
        },
        extensions: ['.js', '.jsx'],
    },
}
