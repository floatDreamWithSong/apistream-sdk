# APIStream SDK

[简体中文](README.md)

This is the JS-SDK development framework for APISream (a Java-based rapid private service module deployment software), which helps developers quickly deploy their service modules.

## Installation

``` bash
npm install apistream-sdk --save-dev
```

## Usage

``` bash
npx apistream --help
# Output:
#    -d  --deploy                Deploy
#    -u  --ui                    Start the background monitoring interface
#    -i  --init                  Initialize the configuration file
#    -h  --help                  Show help information
#    -r  --remove <project>      Remove cloud project
```

> If you need to use it multiple times, it is recommended to use `npm exec apistream -h`, `pnpm apistream -h`, or add the command to package.json for use. This document only uses npx as an example.

## Create Configuration File

The following operation will generate a configuration file named `apistream.config.js` in the current directory. Please modify the configuration items according to your actual situation.

``` bash
npx apistream --init
```

## Custom Configuration File

``` js
import { defineAPIStreamConfig } from 'apistream-sdk'

export default defineAPIStreamConfig({
    projectName: 'myProject', // unique name for your project
    url: 'http://localhost:8080', // your apistream server side service url
    path: 'apistream/src/', // your apistream cloud modules' code path
    output: 'src/apistream/', // path for the code that calls your apistream cloud modules
    key: '', /**
                key to access your apistream server side service,
                it should be the same with the key in your apistream
                server side service "java -jar apistream.jar --key <Key_value>"
            */
    disableOverwrite: true, // if you turn on the overwrite mode,
                            // the apistream will not overwrite the
                            // project that already exists in the server
                            // path, and will throw an error.
})

```

## Writing Cloud Modules

Create `.js` files or directories in the configured `path` directory. Each file will be treated as a context-isolated `cloud module`.
Each `cloud module` can contain multiple API functions, regular functions, and variables. Modules can call each other a limited number of times.
`Cloud modules` cannot have interdependencies.

``` js
// Write cloud functions or utility functions, variables, etc.
export default {
    const :{
        // Variables to be used in the cloud, utility functions, etc. that only participate in module internal calculations
    },
    var: {
        // Fill in module configuration variables, such as the number of parallel executions
    }
    // Functions to be deployed in the cloud
}
```

If you only need to export multiple API functions without other variables or configurations, you can export like this:

``` js
export const a = () => {

}

export function b (){

}

```

### Using SQL

We provide you with a flexible and simple SQL system call, as shown below:

``` js

import { DataBase } from 'apistream-sdk';
export const testfn=()=>{
    console.log(DataBase.selectList('select * from user where id=1'))
}
```

Return example:

``` js
{
  consoleOutput: '{"sql":"select * from user where id\\u003d1","result":[{"name":"小李","id":1,"age":18,"email":"admin1@baomidou.com"}]}\n' +
    '1\n',
  result: 'test name'
}
```

## Deploying Cloud Modules

Run the following command in the project root directory, and the cloud functions will be automatically deployed to the APIStream software, generating the corresponding calling functions in the `output` directory.

``` bash
npx apistream -d
```

## Using Cloud Functions

In the `output` directory, you can find the corresponding calling functions in the same location. You can call the cloud module service asynchronously just like calling a local function and pass in the necessary parameters.

Compared to traditional development models, our APIStream automatic deployment suite can save you:

- Time for multiple rapid deployments
- Network request writing and management
- Automatic service logging
- Serialization/Deserialization
- Backend scaffolding setup
- Cloud-side parameter handling
- Cloud-side result handling

## Usage Example:

Write a cloud module `test.js`, and configure `path` as `apistream/src/` and `output` as `src/apistream/` in `apistream.config.js`.

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
    configFn, // Cloud function, can be exported and called in the local project
    const :{
        add, // Cloud utility function, can only be used in the cloud, not callable locally
        cloudV, // Cloud variable, can only be used in the cloud, not callable locally
        afterValue // Cloud variable, can only be used in the cloud, not callable locally
    },
    var: {
        // Fill in module configuration variables, such as the number of parallel executions
        MaxConcurrency: 10, // Maximum concurrency
    }
}
// If you want to get intelligent prompts, please import the defineModule function
export default defineModule({
    // 
})
```

Run the following command to deploy the cloud module:

``` bash
npx apistream -d
```

The generated calling function `test.js` will be automatically created in the `src/apistream/` directory.

Then you can import and call the `configFn` function in your project from `test.js`.

``` js
// src/index.js
import {configFn} from './apistream/test.js'

configFn().then(res => {
    console.log(res.data) // Output 10
})

```

## Starting the Visualization Backend

``` bash
npx apistream --ui
```

## Notes

If possible, please ensure that `package.json` is set to `type` as `module` to facilitate the use of ES6 module syntax and compile checks, although it may not necessarily affect the running effect.