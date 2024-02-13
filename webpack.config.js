const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const TestPlugin = require("./plugins/test-plugin");
const BannerWebpackPlugin = require("./plugins/banner-webpack-plugin");
const CleanWebpackPlugin = require("./plugins/clean-webpack-plugin");
const AnalyzeWebpackPlugin = require("./plugins/analyze-webpack-plugin");
const InlineChunkWebpackPlugin = require("./plugins/inline-chunk-webpack-plugin");

module.exports = {
  entry: "./src/main.js",
  output: {
    path: path.resolve(__dirname, "./dist"),
    filename: "js/[name].js",
    clean: true, //打包之前清空dist目录
  },
  module: {
    rules: [
      {
        // enforce: "pre",//改变lodaer的优先级
        test: /\.js$/,
        loader: "./loaders/test-loader.js",
      },
      {
        test: /\.js$/,
        // 执行顺序：从右到左，从下到上
        // use: ["./loaders/demo/test1", "./loaders/demo/test2"],
        // use: ["./loaders/demo/test2", "./loaders/demo/test1"],
        loader: "./loaders/demo/test3.js",
        // use: ["./loaders/demo/test4", "./loaders/demo/test5", "./loaders/demo/test6"],
        // loader: "./loaders/clean-log-loader",
      },
      {
        test: /\.js$/,
        loader: "./loaders/banner-loader",
        options: {
          author: "wangyu",
          // age: 24, // 不能新增字段，不然会报错
        },
      },
      {
        test: /\.js$/,
        loader: "./loaders/babel-loader",
        options: {
          presets: ["@babel/preset-env"],
        },
      },
      {
        test: /\.(png|jpe?g|gif)$/,
        loader: "./loaders/file-loader",
        type: "javascript/auto", // 阻止webpack默认处理图片资源，只使用file-loader处理
      },
      {
        test: /\.css$/,
        // use: ["style-loader", "css-loader"],
        use: ["./loaders/style-loader", "css-loader"],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, "public/index.html"),
    }),
    // new TestPlugin(),
    // new BannerWebpackPlugin({
    //   author: "wangyu",
    // }),
    // new CleanWebpackPlugin(),
    // new AnalyzeWebpackPlugin(),
    // new InlineChunkWebpackPlugin([/runtime(.*)\.js/]),
  ],
  // optimization: {
  //   splitChunks: {
  //     chunks: "all",
  //   },
  //   runtimeChunk: {
  //     name: (entrypoint) => `runtime~${entrypoint.name}.js`,
  //   },
  // },
  // mode: "production",
  mode: "development",
  // devtool: "cheap-module-source-map",
  // 开发服务器: 不会输出资源，在内存中编译打包的
  devServer: {
    host: "localhost", // 启动服务器域名
    port: "3000", // 启动服务器端口号
    open: true, // 是否自动打开浏览器
  },
};
