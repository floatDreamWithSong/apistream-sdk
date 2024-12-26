import { readModules } from "./module.js";
import { ApiStreamConfig } from "./config.js";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import axios from "axios";
import { join } from "node:path";

export const deleteProject = async (config: ApiStreamConfig, projectName: string) => {
    const res = await axios.delete(joinUrl(config.url,`/APIStreamProjectServiceSDK?project=${projectName}`),{
        headers:{'Authorization':config.key}
    })
    if(res.data.code === 0){
        console.log(`project ${config.projectName} delete success`);
    }else{
        console.error(`project ${config.projectName} delete fail: ${res.data.message}`);
    }
}

export const initApiStream = async (config: ApiStreamConfig) => {

    const res = await axios.get(joinUrl(config.url,`/APIStreamProjectServiceSDK?project=${config.projectName}`),{
        headers:{'Authorization':config.key}
    })
    if(res.data.code === 0){
        if(config.disableOverwrite)
            throw new Error(`project ${config.projectName} already exist`);
        else{
            const res = await axios.post(joinUrl(config.url,`/APIStreamProjectServiceSDK?project=${config.projectName}`),{
                headers:{'Authorization':config.key}
            })
            if(res.data.code === 0)
                console.log(`project ${config.projectName} create success`);
        }

    }else{
        const res = await axios.put(joinUrl(config.url,`/APIStreamProjectServiceSDK?project=${config.projectName}`),{
            headers:{'Authorization':config.key}
        })
        if(res.data.code === 0)
            console.log(`project ${config.projectName} create success`);
    }
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
            functions: [] as ServiceFunction[],
            options:{
                MaxConcurrency:1
            }
        }
        el.forEach(([name, value]) => {
            if (name === 'const') {
                // 环境变量
                data.postCode += formatVariableCode(value)
            } else if(name === 'var') {
                // 模块配置
                data.options = Object.assign(data.options, value)
            } else {
                data.postCode += formatFunctionCode(value, name)
                data.localCode += 'export ' + replaceFunctionBodyWithAxiosPostWithArgs(value, name, extractArgs(value), joinUrl(config.url, joinUrl(`/${config.projectName}`, mod + `::${name}`)), config.key)
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
        await axios({
            url: config.url.endsWith('/') ? config.url + 'APIStreamModuleServiceSDK' : config.url + '/APIStreamModuleServiceSDK',
            method: 'post',
            headers:{'Authorization':config.key},
            data: {
                path: joinUrl(`/${config.projectName}`, plm.modPath),
                initCode: plm.postCode,
                functions: plm.functions.map(fu => ({
                    name: fu.name,
                    code: fu.code,
                    args: fu.args
                })),
                options: plm.options
            }
        }).then(res => {
            if (res.data.code === 0)
                console.log(`module ${plm.modPath} deploy success`);
            else {
                console.error(`module ${plm.modPath} deploy fail: ${res.data.message}`);
                return;
            }
            // 生成本地代码
            if (!existsSync(outputDir))
                mkdirSync(outputDir);
            writeFileSync(outputPath, plm.localCode)
            console.log(`module ${plm.modPath} generate success`);
        }).catch(err => {
            console.error(`module ${plm.modPath} deploy fail: ${err}`);
        });
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
// axios({url: '',method: 'post',headers: {'Authorization': 'Basic YWRtaW46YWRtaW4='},data:{}})
const replaceFunctionBodyWithAxiosPostWithArgs = (fn: Function, name: string, args: string[], url: string, token: string) => {
    token;
    const axiosPostCode = `return axios({url:'${url}',method:'post',data:{${args.length > 0 ? args.map(arg => `${arg}: ${arg}`).join(",") : ""} }})`;
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
        if (value === null || value === undefined)
            throw Error(`unexpected empty value ${value} of constant ${key}.`)
        if (typeof value === 'object')
            return `const ${key} = Object.freeze(${JSON.stringify(value)})`
        return typeof value === 'function' ? formatFunctionCode(value, key) : `const ${key} = ${JSON.stringify(value)};\n`;
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