const path = require("path");
const fs = require("fs");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

module.exports = {
    entry: './src/app.ts', //path to the main .ts file
    output: {
        path: path.resolve(__dirname, 'public'),
        filename: "bundle.js", //name for the js file that is created/compiled in memory
        clean: true,
    },
    resolve: {
        extensions: [".tsx", ".ts", ".js"],
    },
    devServer: {
        host: "0.0.0.0",
        port: 8080, //port that we're using for local host (localhost:8080)
        static: path.resolve(__dirname, "public"), //tells webpack to serve from the public folder
        hot: true,
        devMiddleware: {
            publicPath: "/",
        },
        historyApiFallback: true,
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: "ts-loader",
                exclude: /node_modules/,
            },
        ],
    },
    plugins: [
        new HtmlWebpackPlugin({
            inject: true,
            template: 'public/index.html',
        }),
        new BundleAnalyzerPlugin()
    ],
    devtool : 'inline-source-map',
    mode: "development",
};
