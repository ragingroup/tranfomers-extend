declare const getDirFiles: (dir: string) => any;
declare const isMain: (fileUrl: string) => boolean;
declare const jsonToArrayBuffer: (jsonData: Record<string, any> | string) => ArrayBuffer;
declare const arrayBufferToJson: (arrayBuffer: ArrayBuffer) => any;
declare const getPromiseState: (promise: Promise<any>) => Promise<unknown>;
export { getPromiseState, arrayBufferToJson, jsonToArrayBuffer, getDirFiles, isMain };
//# sourceMappingURL=common.d.ts.map