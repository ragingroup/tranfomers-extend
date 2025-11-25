declare const memFs: any, vol: any;
type ModelFileFilter = {
    textFile?: string[];
    binaryFile?: string[];
};
declare const setModelFileFilter: (params: ModelFileFilter) => void;
declare const setVirtualCache: (memPath: string, content: any) => any;
declare const useExtenEnv: (env: Record<string, any>) => void;
export { memFs, vol, setModelFileFilter, setVirtualCache, useExtenEnv };
//# sourceMappingURL=useMemfs.d.ts.map