import * as fse from 'fs-extra/esm';
import * as path from 'path';
import { createCipheriv, randomBytes, scryptSync } from 'crypto';
import fs from 'node:fs';
import { isMain, getDirFiles } from './common';


// 类型定义
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
const encryptModelDir = async (
  plainModelDir: string,
  encryptedDir: string,
  encryptOptions: EncryptOptions
) => {
  const { password, salt } = encryptOptions;
  const key = scryptSync(password, salt, 32); // 生成32字节AES密钥

  // 确保输出目录存在
  await fse.ensureDir(encryptedDir);

  /**
   * 处理单个文件的加密
   * @param filePath 相对于原始模型目录的文件路径
   */
  const encryptFile = async (filePath: string): Promise<void> => {
    const srcPath = path.join(plainModelDir, filePath);
    const destPath = path.join(encryptedDir, `${filePath}.enc`);

    try {
      // 读取文件原始二进制数据（支持文本和二进制文件）
      const plaintext = fs.readFileSync(srcPath);


      // AES-GCM加密流程
      const iv = randomBytes(12); // GCM模式推荐12字节IV（96位）
      const cipher = createCipheriv('aes-256-gcm', key, iv);
      const encryptedContent = Buffer.concat([cipher.update(plaintext), cipher.final()]);
      const authTag = cipher.getAuthTag(); // 获取认证标签（用于解密时验证完整性）

      // 组合 IV(12B) + Tag(16B) + 密文，写入输出文件
      const outputBuffer = Buffer.concat([iv, authTag, encryptedContent]);

      // 确保目标目录存在并写入文件
      await fse.ensureDir(path.dirname(destPath));
      fs.writeFileSync(destPath, outputBuffer);
      console.log(`✅ 已加密: ${filePath} → ${destPath}`);
    } catch (error) {
      console.error(`❌ 加密失败（${filePath}）:`, (error as Error).message);
      // 非致命错误：记录后继续处理其他文件
    }
  };

  // 获取原始目录下所有文件的相对路径（依赖 getDirFiles 实现）
  const allFiles = await getDirFiles(plainModelDir);
  if (allFiles.length === 0) {
    console.warn(`⚠️ 警告：原始目录 ${plainModelDir} 中未找到文件`);
    return;
  }

  // 并行加密所有文件（控制并发数避免资源耗尽）
  const concurrency = 4; // 根据系统性能调整并发数
  for (let i = 0; i < allFiles.length; i += concurrency) {
    const batch = allFiles.slice(i, i + concurrency);
    await Promise.all(batch.map(file => encryptFile(file)));
  }

  console.log(`\n📦 加密完成，共处理 ${allFiles.length} 个文件，输出目录：${encryptedDir}`);
}

const testDemo = async () => {
  // 加密配置（生产环境从环境变量或密钥管理服务获取）
  const DEFAULT_OPTIONS: EncryptOptions = {
    password: process.env.MODEL_ENCRYPTION_PASSWORD || 'your-strong-password',
    salt: process.env.MODEL_ENCRYPTION_SALT || 'fixed-salt-for-demo',
  };
  // 命令行调用入口
  if (isMain(import.meta.url)) {
    const [, , plainDir, encryptedDir] = process.argv;
    if (!plainDir || !encryptedDir) {
      console.error('用法: tsx encry.ts <原始模型目录> <加密输出目录>');
      process.exit(1);
    }

    // 验证原始目录是否存在
    if (!await fse.pathExists(plainDir)) {
      console.error(`错误：原始目录 ${plainDir} 不存在`);
      process.exit(1);
    }

    encryptModelDir(plainDir, encryptedDir, {
      ...DEFAULT_OPTIONS
    }).catch(err => {
      console.error('加密过程失败:', err);
      process.exit(1);
    });
  }
}


export {
  encryptModelDir,
  getDirFiles,
  type EncryptOptions
}