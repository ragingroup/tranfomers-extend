import { PipelineType, PretrainedModelOptions } from "ragin-tsfm";
import { EncryptOptions } from "./encryptModelDir";
import { memFs, setModelFileFilter, vol, useExtenEnv } from "./useMemfs";
/**
 * 从加密目录加载模型到内存，然后同步到临时目录进行加载
 * @param encryptedFilePath 加密文件磁盘地址
 * @param decryptedFilePath 解密到虚拟磁盘的文件地址
 * @param task 任务类型（如 'text-classification'）
 * @param key 解密密钥（与加密密钥一致）
 * @returns {Promise<Pipeline>} 加载完成的pipeline实例
 */
declare const loadEncryptedFile: (encryptedFilePath: string, decryptedFilePath: string, key: Buffer) => void;
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
    modelName: string;
    encryptedDir: string;
    filePath: string;
}) => void | {
    enPath?: string;
    dePath?: string;
};
declare const loadEncryptedModel: (encryptedDir: string, modelName: string, key: Buffer, pathHandler?: PathHandler) => Promise<(<T extends PipelineType>(task: T, model: string, pretrainedModelOptions?: PretrainedModelOptions) => any)>;
declare const useDecryptModel: (encryptedDir: string, modelName: string, encryptOptions: EncryptOptions, pathHandler?: PathHandler) => {
    useTask: <T extends PipelineType>(task: T, pretrainedModelOptions?: PretrainedModelOptions) => Promise<any>;
    usePipeline: () => Promise<(<T extends PipelineType>(task: T, model: string, pretrainedModelOptions?: PretrainedModelOptions) => any)>;
};
export { type EncryptOptions, useExtenEnv, useDecryptModel, loadEncryptedModel, loadEncryptedFile, memFs, vol, setModelFileFilter };
//# sourceMappingURL=useDecryModel.d.ts.map