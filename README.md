# APIStream SDK
(! 警告：此项目是APIStream开发套件的SDK部分，后端套件还在开发中，请勿使用！)
这是APISream(基于java的快速私有服务模块部署软件)的配套的js-SDK开发框架，可以帮助开发者快速部署自己的服务模块。

## 安装

``` bash
npm install apistream-sdk --save-dev
```

## 创建配置文件

以下操作会在当前目录下生成一个名为`apistream.config.js`的配置文件，请根据实际情况修改其中的配置项。

``` bash
npx apistream-init
```

## 自定义配置文件

``` js
import { defineAPIStreamConfig } from 'apistream-sdk'

export default defineAPIStreamConfig({
    projectName: 'myProject', // unique name for your project
    key: '', // your key to access your apistream server side service
    url: 'http://localhost:8080', // your apistream server side service url
    path: 'apistream/src/', // your apistream clound modules' code path
    output: 'src/apistream/' // path for the code that call your apistream clound modules
})

```

## 编写云函数

在你的配置的`path`目录下创建`.js`文件或者目录，我们将以每一个文件作为一个上下文隔离的`云模块`。

每个`云模块`可以包含多个云函数，工具函数，变量。但是`云模块`之间不能相互产生依赖关系。

``` js
// 编写云函数，或者云函数使用的工具函数、变量等
export default {
    const :{
        // 这里存放需要放在云端使用的变量，工具函数等只参与模块内的运算的变量
    },
    // 这里存放需要放在云端并部署的API云函数
}
```

## 部署云函数

在项目根目录执行以下命令，云函数会自动部署到APIStream软件中，并为您生成对应的调用函数到`output`目录。

``` bash
npx apistream
```

## 使用云函数

在`output`目录下你可以在相同位置找到对应的调用函数，您可以就像调用一个本地函数异步一样调用云函数，并传入必要的参数。

相比传统开发模式，我们APIStream自动部署套件可为您节省：

- 部署时间
- 网络请求
- 服务日志管理
- 序列化/反序列化
- 后端脚手架搭建
- 云端接受参数处理
- 云端接受结果处理

## 使用示例：

编写一个云函数`test.js`，并在`apistream.config.js`中配置`path`为`apistream/src/`，`output`为`src/apistream/`。

``` js
// apistream/src/test.js
const configFn =  () =>{
    return add(3,2)
}
const cloudV = 1
const add = (a,b) => {
    return a+b+cloudV+afterValue
}
const afterValue = 4
export default {
    configFn, // 云函数，可以导出并在本地项目中调用
    var:{
        add, // 云端工具函数，只能在云端使用，本地无法调用
        cloudV, // 云端变量，只能在云端使用，本地无法调用
        afterValue // 云端变量，只能在云端使用，本地无法调用
    },   
}
```

执行以下命令部署云函数：

``` bash
npx apistream
```

生成的调用函数`test.js`会自动生成到`src/apistream/`目录下。

然后你可以在你的项目中导入并调用`test.js`中的`configFn`函数。

``` js
// src/index.js
import {configFn} from './apistream/test.js'

configFn().then(res => {
    console.log(res.data) // 输出 10
})

```

## 注意事项

如果可以的话，请保证`package.json`设置`type`为`module`，以便于使用ES6模块语法和编译检查，尽管它不一定影响运行效果。
