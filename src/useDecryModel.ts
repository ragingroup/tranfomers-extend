// 文件名: decry.ts

import { pipeline, Pipeline, PipelineType,env ,PretrainedModelOptions} from "ragin-tsfm";
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { getDirFiles, jsonToArrayBuffer } from "./common";
import { EncryptOptions } from "./encryptModelDir";
import {
    memFs,
    setVirtualCache,
    setModelFileFilter,
    vol,
    useExtenEnv
} from "./useMemfs"

/**
 * 从加密目录加载模型到内存，然后同步到临时目录进行加载
 * @param encryptedFilePath 加密文件磁盘地址
 * @param decryptedFilePath 解密到虚拟磁盘的文件地址
 * @param task 任务类型（如 'text-classification'）
 * @param key 解密密钥（与加密密钥一致）
 * @returns {Promise<Pipeline>} 加载完成的pipeline实例
 */

const loadEncryptedFile = (encryptedFilePath: string, decryptedFilePath: string, key: Buffer) => {

    const encData = fs.readFileSync(encryptedFilePath);
    const iv = encData.subarray(0, 12);
    const tag = encData.subarray(12, 28);
    const ciphertext = encData.subarray(28);
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);

    decipher.setAuthTag(tag);
    let plaintext: Buffer;
    try {
        plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    } catch (error) {
        console.error(`解密文件失败: ${encryptedFilePath}`, error);
        throw new Error(`Decryption failed for ${encryptedFilePath}`);
    }


    // 根据文件扩展名判断内容类型
    const textFileExtensions = ['.json', '.txt', '.md', '.py', '.js', '.ts'];
    const ext = path.extname(decryptedFilePath).toLowerCase();

    if (textFileExtensions.includes(ext)) {
        // 如果是文本文件，将 Buffer 转换为 UTF-8 字符串再写入
        const contentAsString = plaintext.toString('utf8');
        const res = setVirtualCache(decryptedFilePath, contentAsString)
        console.log(`已解密文本文件到内存: ${res}`);
    } else {
        // 如果是二进制文件（如 .bin, .safetensors），直接写入 Buffer
        const res = setVirtualCache(decryptedFilePath, plaintext)
        console.log(`已解密二进制文件到内存: ${res}`);
    }



}

/**
 * 自定义加密文件加载函数 
 * + 该函数接收一个包含模型名、加密目录和文件路径的对象作为参数
 * + 无返回值或返回值不正确，则该文件不解密到内存中
 * @param {Object} params - 参数对象。
 * @param {string} params.modelName - 模型的名称。
 * @param {string} params.encryptedDir - 加密文件所在的目录路径。
 * @param {string} params.filePath - 文件的相对或绝对路径。
 * @returns {void | { enPath?: string, dePath?: string }} 可以无返回值，或者返回一个包含可选路径的对象。
 */
type PathHandler = (params: {
    modelName: string
    encryptedDir: string,
    filePath: string
}) => void | { enPath?: string, dePath?: string }

const loadEncryptedModel = async (
    encryptedDir: string,
    modelName: string,
    key: Buffer,
    pathHandler?: PathHandler
) => {

    const files = getDirFiles(encryptedDir).map(item => {

        if (typeof pathHandler === "function") return pathHandler({
            modelName,
            encryptedDir,
            filePath: item
        })
        return {
            enPath: path.join(encryptedDir, item),
            dePath: path.join(modelName, item.replace(/\.enc$/, ""))
        }
    })
    for (let file of files) {
        if (file && file.dePath && file.enPath) loadEncryptedFile(file.enPath, file.dePath, key)
    }
    const newPipeline = <T extends PipelineType>(task: T, model: string, pretrainedModelOptions?: PretrainedModelOptions) => {
        return pipeline<T>(task, path.join("/", model), pretrainedModelOptions)
    }
    return newPipeline
}


const useDecryptModel = (encryptedDir: string,
    modelName: string,
    encryptOptions: EncryptOptions, pathHandler?: PathHandler) => {

    const { password, salt } = encryptOptions;
    const SECRET_KEY = crypto.scryptSync(password, salt, 32);
    let pipeline: ReturnType<typeof loadEncryptedModel>
    
    const usePipeline = async () => {
        if (!pipeline) {
            pipeline = loadEncryptedModel(
                encryptedDir,
                modelName,
                SECRET_KEY,
                pathHandler
            );

        }
        return pipeline

    }
    const useTask = async <T extends PipelineType>(task: T, pretrainedModelOptions?: PretrainedModelOptions) => {

        const pipelineSync = await usePipeline()
        const taskHandler = pipelineSync(task, modelName, pretrainedModelOptions);
        return taskHandler

    }
    return {

        useTask,
        usePipeline

    }

}


// --- 使用示例 ---
const testDemo = async () => {
    try {
        useExtenEnv(env)
        const { useTask, usePipeline } = useDecryptModel('./models2/realasd222/punctuate-all',
            "realasd222/punctuate-all", { password: "your-strong-password", "salt": 'fixed-salt-for-demo' },
            (params) => {
                const { modelName, encryptedDir, filePath } = params;
                // 自定义文件过滤，返回undefined 则该文件不加载到内存中
                if (filePath.endsWith("model.onnx.enc")) {
                    return
                }
                return {
                    enPath: path.join(encryptedDir, filePath),
                    dePath: path.join(modelName, filePath.replace(/\.enc$/, ""))
                }

            })


        const normalizer = await useTask("token-classification", { dtype: "q8" })

        const res = await normalizer('I love using Hugging Face Transformers with memfs!')
        console.log('分类结果:', res);
    } catch (error) {
        console.error('运行失败:', error);
    }
}
testDemo()

export {
    type EncryptOptions,
    useExtenEnv,
    useDecryptModel,
    loadEncryptedModel,
    loadEncryptedFile,
    memFs,
    vol,
    setModelFileFilter

}