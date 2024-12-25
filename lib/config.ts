import { URL } from 'node:url';

export interface ApiStreamConfig {
    url: string,
    path: string,
    output: string,
    key: string,
    projectName: string
}

const config: ApiStreamConfig = {
    url: '',
    path: '',
    output: '',
    projectName: '',
    key: ''
}
let isFirstTime = true
export async function readConfig() {
    if (isFirstTime)
        try {
            isFirstTime = false
            // 使用动态导入来加载配置文件
            const url = new URL('./apistream.config.js', 'file://' + process.cwd() + '/').toString();
            const configModule = await import(url);
            // console.log(configModule)
            // 检查导出是否为对象
            if (typeof configModule === 'object' && configModule !== null) {
                Object.assign(config, configModule.default)
                return config
            } else {
                throw new Error('The exported value from stream.config.js is not an object.');
            }
        } catch (error) {
            // 处理文件不存在或模块导出不是对象的情况
            console.error(error)
            throw Error('Error reading config file:');
        }
    return config

}
export function defineAPIStreamConfig(config: ApiStreamConfig) {
    return config;
}