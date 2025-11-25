// 文件名: decry.ts
import { pipeline, env } from "ragin-tsfm";
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { getDirFiles } from "./common";
import { memFs, setVirtualCache, setModelFileFilter, vol, useExtenEnv } from "./useMemfs";
/**
 * 从加密目录加载模型到内存，然后同步到临时目录进行加载
 * @param encryptedFilePath 加密文件磁盘地址
 * @param decryptedFilePath 解密到虚拟磁盘的文件地址
 * @param task 任务类型（如 'text-classification'）
 * @param key 解密密钥（与加密密钥一致）
 * @returns {Promise<Pipeline>} 加载完成的pipeline实例
 */
const loadEncryptedFile = (encryptedFilePath, decryptedFilePath, key) => {
    const encData = fs.readFileSync(encryptedFilePath);
    const iv = encData.subarray(0, 12);
    const tag = encData.subarray(12, 28);
    const ciphertext = encData.subarray(28);
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    let plaintext;
    try {
        plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    }
    catch (error) {
        console.error(`解密文件失败: ${encryptedFilePath}`, error);
        throw new Error(`Decryption failed for ${encryptedFilePath}`);
    }
    // 根据文件扩展名判断内容类型
    const textFileExtensions = ['.json', '.txt', '.md', '.py', '.js', '.ts'];
    const ext = path.extname(decryptedFilePath).toLowerCase();
    if (textFileExtensions.includes(ext)) {
        // 如果是文本文件，将 Buffer 转换为 UTF-8 字符串再写入
        const contentAsString = plaintext.toString('utf8');
        const res = setVirtualCache(decryptedFilePath, contentAsString);
        console.log(`已解密文本文件到内存: ${res}`);
    }
    else {
        // 如果是二进制文件（如 .bin, .safetensors），直接写入 Buffer
        const res = setVirtualCache(decryptedFilePath, plaintext);
        console.log(`已解密二进制文件到内存: ${res}`);
    }
};
const loadEncryptedModel = async (encryptedDir, modelName, key, pathHandler) => {
    const files = getDirFiles(encryptedDir).map(item => {
        if (typeof pathHandler === "function")
            return pathHandler({
                modelName,
                encryptedDir,
                filePath: item
            });
        return {
            enPath: path.join(encryptedDir, item),
            dePath: path.join(modelName, item.replace(/\.enc$/, ""))
        };
    });
    for (let file of files) {
        if (file && file.dePath && file.enPath)
            loadEncryptedFile(file.enPath, file.dePath, key);
    }
    const newPipeline = (task, model, pretrainedModelOptions) => {
        return pipeline(task, path.join("/", model), pretrainedModelOptions);
    };
    return newPipeline;
};
const useDecryptModel = (encryptedDir, modelName, encryptOptions, pathHandler) => {
    const { password, salt } = encryptOptions;
    const SECRET_KEY = crypto.scryptSync(password, salt, 32);
    let pipeline;
    const usePipeline = async () => {
        if (!pipeline) {
            pipeline = loadEncryptedModel(encryptedDir, modelName, SECRET_KEY, pathHandler);
        }
        return pipeline;
    };
    const useTask = async (task, pretrainedModelOptions) => {
        const pipelineSync = await usePipeline();
        const taskHandler = pipelineSync(task, modelName, pretrainedModelOptions);
        return taskHandler;
    };
    return {
        useTask,
        usePipeline
    };
};
// --- 使用示例 ---
const testDemo = async () => {
    try {
        useExtenEnv(env);
        const { useTask, usePipeline } = useDecryptModel('./models2/realasd222/punctuate-all', "realasd222/punctuate-all", { password: "your-strong-password", "salt": 'fixed-salt-for-demo' }, (params) => {
            const { modelName, encryptedDir, filePath } = params;
            // 自定义文件过滤，返回undefined 则该文件不加载到内存中
            if (filePath.endsWith("model.onnx.enc")) {
                return;
            }
            return {
                enPath: path.join(encryptedDir, filePath),
                dePath: path.join(modelName, filePath.replace(/\.enc$/, ""))
            };
        });
        const normalizer = await useTask("token-classification", { dtype: "q8" });
        const res = await normalizer('I love using Hugging Face Transformers with memfs!');
        console.log('分类结果:', res);
    }
    catch (error) {
        console.error('运行失败:', error);
    }
};
testDemo();
export { useExtenEnv, useDecryptModel, loadEncryptedModel, loadEncryptedFile, memFs, vol, setModelFileFilter };
