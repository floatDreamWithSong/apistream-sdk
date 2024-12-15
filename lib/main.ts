import { readModules } from "./module.js";
import { readConfig } from "./config.js";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import axios from "axios";
import { join } from "node:path";


export const initApiStream = async () => {
    // 读取配置
    const config = await readConfig();
    // 读取模块
    const moduleList = await readModules(config.path);
    // 检查模块名是否重复
    const nameSet = new Set(moduleList.map(module => `${module[2]}/${module[3]}::${module[0]}`));
    if (nameSet.size !== moduleList.length)
        throw new Error("Duplicate module name found");
    const groupedModuleLsit = Object.entries(Object.groupBy(moduleList, module => `${module[2] ? `/${module[2]}` : ''}/${module[3]}`))
    const plmList = groupedModuleLsit.map(([mod, el]) => {
        // 处理单个模块
        let data = {
            postCode: '',
            localCode: 'import axios from "axios";\n',
            modPath: mod,
            modDir: el[0][2],
            functions: [] as ServiceFunction[]
        }
        el.forEach(([name, value]) => {
            if (name === 'var') {
                // 环境变量
                data.postCode += formatVariableCode(value)
            } else {
                data.postCode += formatFunctionCode(value, name)
                data.localCode += 'export ' + replaceFunctionBodyWithAxiosPostWithArgs(value, name, extractArgs(value), joinUrl(config.url, mod + `::${name}`))
                data.functions.push({
                    name: name,
                    code: formatFunctionCode(value, name),
                    args: extractArgs(value).map(arg => ({ name: arg, value: undefined }))
                })
            }
        });
        return data
    });
    // 清空输出目录
    rmDir(config.output);
    // 部署模块
    for (let plm of plmList) {
        const outputDir = join(config.output, plm.modDir);
        const outputPath = join(config.output, `${plm.modPath}.js`);
        // console.log(outputPath);
        await axios.post(config.url.endsWith('/') ? config.url + 'APIStreamModuleServiceSDK' : config.url + '/APIStreamModuleServiceSDK', {
            path: plm.modPath,
            initCode: plm.postCode,
            MaxConcurrency: 1,
            functions: plm.functions.map(fu => ({
                name: fu.name,
                code: fu.code,
                args: fu.args
            }))
        }).then(res => {
            if (res.data.code === 0)
                console.log(`module ${plm.modPath} deploy success`);
            else{
                console.log(`module ${plm.modPath} deploy fail: ${res.data.msg}`);
                return;
            }
            // 生成本地代码
            if (!existsSync(outputDir))
                mkdirSync(outputDir);
            writeFileSync(outputPath, plm.localCode)
            console.log(`module ${plm.modPath} generate success`);
        }).catch(console.error);
    };
};
const extractArgs = (fn: Function) => {
    const fnStr = fn.toString().trim();
    const fnArgs = fnStr.slice(fnStr.indexOf("(") + 1, fnStr.indexOf(")"));
    // 不允许有默认值
    if (fnArgs.includes("="))
        throw new Error("Default value is not allowed in function arguments");
    const args = fnArgs.split(",").map(arg => arg.trim());
    return args.filter(arg => arg !== "");
}
const formatFunctionCode = (fn: Function, name: string, insertBodyCode = undefined) => {
    const fnStr = fn.toString().trim();
    const args = extractArgs(fn);
    const fnBody = fnStr.slice(fnStr.indexOf("{") + 1, fnStr.lastIndexOf("}"));
    const formattedCode = `function ${name}(${args.join(", ")}) {${insertBodyCode ? insertBodyCode : fnBody}};\n`;
    return formattedCode;
}

const replaceFunctionBodyWithAxiosPostWithArgs = (fn: Function, name: string, args: string[], url: string) => {
    const axiosPostCode = `return axios.post("${url}", {${args.length > 0 ? args.map(arg => `${arg}: ${arg}`).join(",") : ""}})`;
    return formatFunctionCode(fn, name, axiosPostCode);
}
const joinUrl = (url: string, path: string) => {
    if (url.endsWith("/"))
        if (path.startsWith("/"))
            return `${url}${path.slice(1)}`;
        else
            return `${url}${path}`;
    else
        if (path.startsWith("/"))
            return `${url}${path}`;
        else
            return `${url}/${path}`;
}
const rmDir = (dirPath) => {
    if (existsSync(dirPath)) {
        rmSync(dirPath, { recursive: true, force: true });
    }
};
const formatVariableCode = (variablesObj: object) => {
    const variableCode = Object.entries(variablesObj).map(([key, value]) => {
        return typeof value === 'function' ? formatFunctionCode(value, key) : `var ${key} = ${JSON.stringify(value)};\n`;
    }).join("");
    return variableCode;
}
interface ServiceFunction {
    name: string,
    code: string,
    args: ServiceArg[]
}
interface ServiceArg {
    name: string,
    value?: any
}