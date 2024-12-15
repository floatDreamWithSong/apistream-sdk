#!/usr/bin/env node
// 在项目根目录生成apisream.config.js配置文件
import { writeFileSync } from 'fs';
writeFileSync('apistream.config.js', 
`const config = {
    url: 'http://localhost:8080',
    path: 'apistream/src/',
    output: 'src/apistream/'
}
export default config
`);