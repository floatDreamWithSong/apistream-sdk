#!/usr/bin/env node
import { initApiStream, deleteProject } from "../dist/main.js";
import { readConfig } from "../dist/config.js";
import express, { static as expressStatic } from 'express';
import { join } from 'path';
import { fileURLToPath } from 'url';
import open from 'open';
import { writeFileSync } from 'fs';

// 解析命令行参数
const args = process.argv.slice(2);
let command = args[0];
if (!command) {
    command = '-h';
}
command = command.toLowerCase();

if (command === '-d' || command === '--deploy') {
    // apistream.js 的逻辑
    await initApiStream(await readConfig());
} else if (command === '-u' || command === '--ui') {
    // apistream-ui.js 的逻辑
    const config = await readConfig();
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = join(__filename, '..');
    const app = express();
    const port = 5174;
    app.use(expressStatic(join(__dirname, '../dist/ui')));
    app.get('/', (req, res) => {
        res.sendFile(join(__dirname, '../dist/ui/index.html'));
    });

    app.listen(port, () => {
        const url = `http://localhost:${port}?key=${config.key}`;
        console.log(`Server running at http://localhost:${port}`);
        open(url);
    });
} else if (command === '-i' || command === '--init') {
    // apistream-init.js 的逻辑
    writeFileSync('apistream.config.js', 
    `import { defineAPIStreamConfig } from 'apistream-sdk'
import { deleteProject } from './../lib/main';

export default defineAPIStreamConfig({
    projectName: 'myProject', // unique name for your project
    url: 'http://localhost:8080', // your apistream server side service url
    path: 'apistream/src/', // your apistream clound modules' code path
    output: 'src/apistream/', // path for the code that call your apistream clound modules
    key: '', /**
                key to access your apistream server side service,
                it should be the same with the key in your apistream
                server side service "java -jar apistream.jar --key <Key_value>"
            */
    disableOverwrite: false, // if you turn on the overwrite mode,
                            // the apistream will not overwrite the
                            // project that already exists in the server
                            // path, and will throw an error.
})
    `);
} else if(command === '-h' || command === '--help'){
console.log(
`
    -d  --deploy                部署
    -u  --ui                    启动后台监控界面
    -i  --init                  初始化配置文件
    -h  --help                  显示帮助信息
    -r  --remove <project>      删除项目

`)
} else if(command === '-r' || command === '--remove'){
    if(args[1]){
        const config = await readConfig();
        const projectName = args[1];
        await deleteProject(config, projectName);
    } else {
        console.error('缺少项目名称');
    }
} else {
    console.error('未知的命令:', command);
}