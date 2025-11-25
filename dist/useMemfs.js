// 文件名: decry.ts
import path from 'node:path';
import { memfs } from 'memfs';
import { jsonToArrayBuffer } from "./common";
// 创建内存文件系统
const { fs: memFs, vol } = memfs();
const modelFileFilter = {
    textFile: [],
    binaryFile: [".onnx"],
};
const setModelFileFilter = (params) => {
    Object.assign(modelFileFilter, {
        textFile: params.textFile || [],
        binaryFile: params.binaryFile || [".onnx"]
    });
};
const setVirtualCache = (memPath, content) => {
    const filePath = path.join("/virtual", memPath);
    memFs.mkdirSync(path.dirname(filePath), { recursive: true });
    memFs.writeFileSync(filePath, content);
    return filePath;
};
const getVirtualModelText = (memPath) => {
    const filePath = path.join("/virtual", memPath);
    return memFs.readFileSync(filePath, { encoding: "utf-8" });
};
const getVirtualModelFile = (memPath) => {
    const filePath = path.join("/virtual", memPath);
    return memFs.readFileSync(filePath);
};
const useExtenEnv = (env) => {
    env.getModelFile = async (modelName, filePath) => {
        const { ext, name } = path.parse(filePath);
        const fp = path.join(modelName, filePath);
        const { binaryFile = [], textFile = [] } = modelFileFilter;
        if (!binaryFile?.length || binaryFile.includes(ext)) {
            return getVirtualModelFile(fp);
        }
        if (!textFile?.length || textFile.includes(ext))
            return jsonToArrayBuffer(getVirtualModelText(fp));
    };
};
export { memFs, vol, setModelFileFilter, setVirtualCache, useExtenEnv };
