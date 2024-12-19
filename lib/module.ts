import { readdir } from "node:fs/promises";
import { readConfig } from "./config.js";
import { join } from "path";

const config = await readConfig()

export async function readModule(_path: string) {
    // 构建配置文件的完整路径
    try {
      // 使用动态导入来加载模块
      const url = new URL(_path, 'file://' + process.cwd()+'/').toString();
      const configModule = await import(url);
      // 检查导出是否为对象

      if (typeof configModule === 'object' && configModule !== null) {
        return (configModule.default || configModule)
      } else {
        throw new Error('The exported value from stream.config.js is not an object.');
      }
    } catch (error) {
      // 处理文件不存在或模块导出不是对象的情况
      console.error(error)
      throw Error('Error reading config file:');
    }
}
export async function readModules(_dir: string) {
  const modules = []
  // 遍历目录及其子目录
  const files = await readdir(_dir, { withFileTypes: true });
  for (const file of files) {
    const filePath = join(_dir, file.name);
    if (file.isDirectory()) {
      // 如果是目录，递归读取
      const subModules = (await readModules(filePath));
      modules.push(...subModules);
    } else 
    // 如果是js文件，读取模块
    if (file.name.endsWith('.js')||file.name.endsWith('.mjs')) {
      const module = (await readModule(filePath));
      if(Object.keys(module).length > 0 && typeof module === 'object' && module!== null)
      {
        const _m = Object.entries(module).map(([name,fn])=>
          [name,fn,_dir.replace(/\\/g,'/').replace(config.path,''), file.name.replace('.js','')]);
        modules.push(..._m);
      }
    }
  }
  return modules
}
