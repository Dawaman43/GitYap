declare module '@mtproto/core' {
  export interface MTProtoOptions {
    apiId: number;
    apiHash: string;
    test?: boolean;
    serverAddress?: string;
    session?: string;
    storageOptions?: {
      path?: string;
    };
  }

  export class MTProto {
    constructor(options: MTProtoOptions);
    call<T>(method: string, params?: Record<string, any>, options?: Record<string, any>): Promise<T>;
    upload<T>(method: string, params?: Record<string, any>, options?: Record<string, any>): Promise<T>;
    getStorage(): Promise<Record<string, any>>;
    setStorage(key: string, value: any): Promise<void>;
    getStorageKey(key: string): Promise<any>;
    setStorageKey(key: string, value: any): Promise<void>;
    start(): Promise<void>;
    destroy(): Promise<void>;
  }
}
