#!/usr/bin/env node
import { initApiStream, deleteProject } from "../dist/main.js";
import { readConfig } from "../dist/config.js";
import express, { static as expressStatic } from 'express';
import { join } from 'path';
import { fileURLToPath } from 'url';
import open from 'open';
import { writeFileSync } from 'fs';
import { exec } from "child_process";
console.log('apistream-sdk. version 1.0.0')
const port = 5375;
const args = process.argv.slice(2);
let command = args[0];
if (!command) {
    command = '-h';
}
command = command.toLowerCase();

if (command === '-i' || command === '--init') {
    writeFileSync('apistream.config.js', 
    `import { defineAPIStreamConfig } from 'apistream-sdk'

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
} else if (command === '-d' || command === '--deploy') {
    await initApiStream(await readConfig());
} else if (command === '-u' || command === '--ui') {
    const config = await readConfig();
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = join(__filename, '..');
    const app = express();
    app.use(expressStatic(join(__dirname, '../dist/ui')));
    app.use(express.json())
    app.get('/', (req, res) => {
        res.sendFile(join(__dirname, '../dist/ui/index.html'));
    });
    app.post('/', (req,res)=>{
        const { module_path } = req.body;

        if (!module_path) {
            return res.status(400).send('module_path is required');
        }
        const _path = join(process.cwd(), config.path ,module_path+'.js')
        exec(`code ${_path}`, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error opening file: ${error.message}`);
                return res.status(500).send('Error opening file'+_path);
            }
            if (stderr) {
                return res.status(500).send('Error opening file'+_path);
            }
            res.send('File opened successfully');
        });
    })
    app.listen(port, () => {
        const url = `http://localhost:${port}?key=${config.key}`;
        console.log(`Server running at http://localhost:${port}`);
        open(url);
    });
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