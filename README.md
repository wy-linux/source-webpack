# Webpack中部分Loader与Plugin的理解

## loader 执行顺序

1. 分类

- pre： 前置 loader
- normal： 普通 loader
- inline： 内联 loader
- post： 后置 loader

2. 执行顺序

- 4 类 loader 的执行优级为：`pre > normal > inline > post` 。
- 相同优先级的 loader 执行顺序为：`从右到左，从下到上`。

例如：

```js
// 此时loader执行顺序：loader3 - loader2 - loader1
module: {
  rules: [
    {
      test: /\.js$/,
      loader: "loader1",
    },
    {
      test: /\.js$/,
      loader: "loader2",
    },
    {
      test: /\.js$/,
      loader: "loader3",
    },
  ],
},
```

```js
// 此时loader执行顺序：loader1 - loader2 - loader3
module: {
  rules: [
    {
      enforce: "pre",
      test: /\.js$/,
      loader: "loader1",
    },
    {
      // 没有enforce就是normal
      test: /\.js$/,
      loader: "loader2",
    },
    {
      enforce: "post",
      test: /\.js$/,
      loader: "loader3",
    },
  ],
},
```

3. 使用 loader 的方式

- 配置方式：在 `webpack.config.js` 文件中指定 loader。（pre、normal、post loader）
- 内联方式：在每个 `import` 语句中显式指定 loader。（inline loader）

4. inline loader

用法：`import Styles from 'style-loader!css-loader?modules!./styles.css';`

含义：

- 使用 `css-loader` 和 `style-loader` 处理 `styles.css` 文件
- 通过 `!` 将资源中的 loader 分开

`inline loader` 可以通过添加不同前缀，跳过其他类型 loader。

- `!` 跳过 normal loader。

`import Styles from '!style-loader!css-loader?modules!./styles.css';`

- `-!` 跳过 pre 和 normal loader。

`import Styles from '-!style-loader!css-loader?modules!./styles.css';`

- `!!` 跳过 pre、 normal 和 post loader。

`import Styles from '!!style-loader!css-loader?modules!./styles.css';`

## 开发一个 loader

### 1. 最简单的 loader

```js
// loaders/loader1.js
module.exports = function loader1(content) {
  console.log("hello loader");
  return content;
};
```

它接受要处理的源码作为参数，输出转换后的 js 代码。

### 2. loader 接受的参数

- `content` 源文件的内容
- `map` SourceMap 数据
- `meta` 数据，可以是任何内容

## loader 分类

### 1. 同步 loader

```js
module.exports = function (content, map, meta) {
  return content;
};
```

`this.callback` 方法则更灵活，因为它允许传递多个参数，而不仅仅是 `content`。

```js
module.exports = function (content, map, meta) {
  // 传递map，让source-map不中断
  // 传递meta，让下一个loader接收到其他参数
  this.callback(null, content, map, meta);
  return; // 当调用 callback() 函数时，总是返回 undefined
};
```

### 2. 异步 loader

```js
module.exports = function (content, map, meta) {
  const callback = this.async();
  // 进行异步操作
  setTimeout(() => {
    callback(null, result, map, meta);
  }, 1000);
};
```

> 由于同步计算过于耗时，在 Node.js 这样的单线程环境下进行此操作并不是好的方案，我们建议尽可能地使你的 loader 异步化。但如果计算量很小，同步 loader 也是可以的。

### 3. Raw Loader

默认情况下，资源文件会被转化为 UTF-8 字符串，然后传给 loader。通过设置 raw 为 true，loader 可以接收原始的 Buffer。

```js
module.exports = function (content) {
  // content是一个Buffer数据
  return content;
};
module.exports.raw = true; // 开启 Raw Loader
```

### 4. Pitching Loader

```js
module.exports = function (content) {
  return content;
};
module.exports.pitch = function (remainingRequest, precedingRequest, data) {
  console.log("do somethings");
};
```

webpack 会先从左到右执行 loader 链中的每个 loader 上的 pitch 方法（如果有），然后再从右到左执行 loader 链中的每个 loader 上的普通 loader 方法。

## Tapable

`Tapable` 为 webpack 提供了统一的插件接口（钩子）类型定义，它是 webpack 的核心功能库。webpack 中目前有十种 `hooks`，在 `Tapable` 源码中可以看到，他们是：

```js
// https://github.com/webpack/tapable/blob/master/lib/index.js
exports.SyncHook = require("./SyncHook");
exports.SyncBailHook = require("./SyncBailHook");
exports.SyncWaterfallHook = require("./SyncWaterfallHook");
exports.SyncLoopHook = require("./SyncLoopHook");
exports.AsyncParallelHook = require("./AsyncParallelHook");
exports.AsyncParallelBailHook = require("./AsyncParallelBailHook");
exports.AsyncSeriesHook = require("./AsyncSeriesHook");
exports.AsyncSeriesBailHook = require("./AsyncSeriesBailHook");
exports.AsyncSeriesLoopHook = require("./AsyncSeriesLoopHook");
exports.AsyncSeriesWaterfallHook = require("./AsyncSeriesWaterfallHook");
exports.HookMap = require("./HookMap");
exports.MultiHook = require("./MultiHook");
```

`Tapable` 还统一暴露了三个方法给插件，用于注入不同类型的自定义构建行为：

- `tap`：可以注册同步钩子和异步钩子。
- `tapAsync`：回调方式注册异步钩子。
- `tapPromise`：Promise 方式注册异步钩子。

## Plugin 构建对象

### Compiler

compiler 对象中保存着完整的 Webpack 环境配置，每次启动 webpack 构建时它都是一个独一无二，仅仅会创建一次的对象。

这个对象会在首次启动 Webpack 时创建，我们可以通过 compiler 对象上访问到 Webapck 的主环境配置，比如 loader 、 plugin 等等配置信息。

它有以下主要属性：

- `compiler.options` 可以访问本次启动 webpack 时候所有的配置文件，包括但不限于 loaders 、 entry 、 output 、 plugin 等等完整配置信息。
- `compiler.inputFileSystem` 和 `compiler.outputFileSystem` 可以进行文件操作，相当于 Nodejs 中 fs。
- `compiler.hooks` 可以注册 tapable 的不同种类 Hook，从而可以在 compiler 生命周期中植入不同的逻辑。

> [compiler hooks 文档](https://webpack.docschina.org/api/compiler-hooks/)

### Compilation

compilation 对象代表一次资源的构建，compilation 实例能够访问所有的模块和它们的依赖。

一个 compilation 对象会对构建依赖图中所有模块，进行编译。 在编译阶段，模块会被加载(load)、封存(seal)、优化(optimize)、 分块(chunk)、哈希(hash)和重新创建(restore)。

它有以下主要属性：

- `compilation.modules` 可以访问所有模块，打包的每一个文件都是一个模块。
- `compilation.chunks` chunk 即是多个 modules 组成而来的一个代码块。入口文件引入的资源组成一个 chunk，通过代码分割的模块又是另外的 chunk。
- `compilation.assets` 可以访问本次打包生成所有文件的结果。
- `compilation.hooks` 可以注册 tapable 的不同种类 Hook，用于在 compilation 编译模块阶段进行逻辑添加以及修改。

> [compilation hooks 文档](https://webpack.docschina.org/api/compilation-hooks/)
