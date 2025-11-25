
import { fileURLToPath } from 'url';
import fg from "fast-glob"

const getDirFiles = (dir: string) => {
    return fg.sync(["**/*.*"], {
        absolute: false,
        cwd: dir,
        ignore: ["node_modules/**", ".git/**"], // 排除版本控制和依赖目录
    })

}


const isMain = (fileUrl: string) => {

    return fileURLToPath(fileUrl) === process.argv[1]
}
const jsonToArrayBuffer = (jsonData: Record<string, any> | string) => {
    // 1. 将 JSON 数据序列化为字符串
    const jsonString = typeof jsonData === "string" ? jsonData : JSON.stringify(jsonData);

    // 2. 使用 UTF-8 编码将字符串转换为 Uint8Array
    const encoder = new TextEncoder();
    const uint8Array = encoder.encode(jsonString);

    // 3. 获取 Uint8Array 底层的 ArrayBuffer
    return uint8Array.buffer;
}

const arrayBufferToJson = (arrayBuffer: ArrayBuffer) => {
    const decoder = new TextDecoder("utf-8");
    return JSON.parse(decoder.decode(arrayBuffer))

}
const getPromiseState =(promise:Promise<any>) => {
  // 创建唯一哨兵对象，避免与真实值冲突
  const sentinel = {};
  
  return Promise.race([
    // 原 Promise：若已完成则返回其结果/原因
    promise.then(
      () => 'fulfilled',  // 成功状态处理
      () => 'rejected'    // 失败状态处理
    ),
    // 辅助 Promise：立即返回哨兵对象
    new Promise(resolve => resolve(sentinel))
  ]).then(value => 
    // 通过比较结果判断状态
    value === sentinel ? 'pending' : value
  );
};


export {
    getPromiseState,
    arrayBufferToJson,
    jsonToArrayBuffer,
    getDirFiles,
    isMain

}

