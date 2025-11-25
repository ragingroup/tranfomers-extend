// 文件名: decry.ts

import path from 'node:path';
import { createFsFromVolume, Volume, memfs } from 'memfs';
import { getDirFiles, jsonToArrayBuffer } from "./common";


// 创建内存文件系统
const { fs: memFs, vol } = memfs()

type ModelFileFilter = {
    textFile?: string[],
    binaryFile?: string[]
}
const modelFileFilter: ModelFileFilter = {
    textFile: [],
    binaryFile: [".onnx"],
}
const setModelFileFilter = (params: ModelFileFilter) => {
    Object.assign(modelFileFilter, {
        textFile: params.textFile || [],
        binaryFile: params.binaryFile || [".onnx"]
    })


}

const setVirtualCache = (memPath: string, content: any) => {
    const filePath = path.join("/virtual", memPath)
    memFs.mkdirSync(path.dirname(filePath), { recursive: true });
    memFs.writeFileSync(filePath, content)
    return filePath

}


const getVirtualModelText = (memPath: string) => {
    const filePath = path.join("/virtual", memPath)

    return memFs.readFileSync(filePath, { encoding: "utf-8" }) as string

}

const getVirtualModelFile = (memPath: string) => {
    const filePath = path.join("/virtual", memPath)

    return memFs.readFileSync(filePath)

}


const useExtenEnv = (env:Record<string,any>) => {
    env.getModelFile = async (modelName: string, filePath: string) => {
        const { ext, name } = path.parse(filePath);
        const fp = path.join(modelName, filePath);
        const { binaryFile = [], textFile = [] } = modelFileFilter;

        if (!binaryFile?.length || binaryFile.includes(ext)) {
            return getVirtualModelFile(fp)
        }
        if (!textFile?.length || textFile.includes(ext)) return jsonToArrayBuffer(getVirtualModelText(fp)) as any

    }

}



export {
    memFs,
    vol,
    setModelFileFilter,
    setVirtualCache,
    useExtenEnv
}