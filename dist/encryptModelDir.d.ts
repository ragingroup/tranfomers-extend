import { getDirFiles } from './common';
type EncryptOptions = {
    password: string;
    salt: string;
};
/**
 * 递归加密模型目录中的所有文件
 * @param plainModelDir 原始模型目录路径
 * @param encryptedDir 加密后文件输出目录
 * @param encryptOptions 加密选项（包含密码和盐值）
 */
declare const encryptModelDir: (plainModelDir: string, encryptedDir: string, encryptOptions: EncryptOptions) => Promise<void>;
export { encryptModelDir, getDirFiles, type EncryptOptions };
//# sourceMappingURL=encryptModelDir.d.ts.map