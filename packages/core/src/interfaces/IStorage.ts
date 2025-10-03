/**
 * 存儲平台抽象接口
 * 定義所有平台必須實現的數據存儲功能
 */

export type StorageScope = 'global' | 'workspace' | 'user' | 'machine' | 'session';

export interface StorageOptions {
    scope?: StorageScope;
    encrypted?: boolean;
    compress?: boolean;
    ttl?: number; // Time to live in seconds
    version?: string; // 數據版本，用於遷移
}

export interface StorageMetadata {
    key: string;
    size: number;
    created: Date;
    modified: Date;
    accessed: Date;
    scope: StorageScope;
    encrypted: boolean;
    version?: string;
    checksum?: string;
}

export interface StorageQuery {
    prefix?: string;
    scope?: StorageScope;
    pattern?: RegExp;
    limit?: number;
    offset?: number;
    sortBy?: 'key' | 'size' | 'created' | 'modified' | 'accessed';
    sortOrder?: 'asc' | 'desc';
}

export interface StorageMigration {
    from: string;
    to: string;
    transform: (oldData: unknown) => unknown;
}

/**
 * 存儲接口
 * 抽象所有平台的數據存儲功能
 */
export interface IStorage {
    // ==================== 基本讀寫 ====================
    
    /**
     * 存儲數據
     */
    set<T>(key: string, value: T, options?: StorageOptions): Promise<void>;
    
    /**
     * 讀取數據
     */
    get<T>(key: string, defaultValue?: T, options?: StorageOptions): Promise<T | undefined>;
    
    /**
     * 檢查鍵是否存在
     */
    has(key: string, options?: StorageOptions): Promise<boolean>;
    
    /**
     * 刪除數據
     */
    delete(key: string, options?: StorageOptions): Promise<boolean>;
    
    /**
     * 清空所有數據
     */
    clear(scope?: StorageScope): Promise<void>;
    
    // ==================== 批量操作 ====================
    
    /**
     * 批量設置多個鍵值對
     */
    setMultiple<T>(items: Record<string, T>, options?: StorageOptions): Promise<void>;
    
    /**
     * 批量讀取多個鍵
     */
    getMultiple<T>(keys: string[], options?: StorageOptions): Promise<Record<string, T | undefined>>;
    
    /**
     * 批量刪除多個鍵
     */
    deleteMultiple(keys: string[], options?: StorageOptions): Promise<number>;
    
    // ==================== 查詢和遍歷 ====================
    
    /**
     * 獲取所有鍵
     */
    keys(query?: StorageQuery): Promise<string[]>;
    
    /**
     * 獲取所有值
     */
    values<T>(query?: StorageQuery): Promise<T[]>;
    
    /**
     * 獲取所有鍵值對
     */
    entries<T>(query?: StorageQuery): Promise<Array<[string, T]>>;
    
    /**
     * 迭代所有項目
     */
    forEach<T>(
        callback: (key: string, value: T, metadata: StorageMetadata) => void | Promise<void>,
        query?: StorageQuery
    ): Promise<void>;
    
    // ==================== 元數據和統計 ====================
    
    /**
     * 獲取鍵的元數據
     */
    getMetadata(key: string, options?: StorageOptions): Promise<StorageMetadata | undefined>;
    
    /**
     * 獲取存儲統計信息
     */
    getStats(scope?: StorageScope): Promise<{
        totalKeys: number;
        totalSize: number;
        usedSpace: number;
        freeSpace?: number;
        oldestItem: Date;
        newestItem: Date;
        scopeBreakdown: Record<StorageScope, {
            keys: number;
            size: number;
        }>;
    }>;
    
    /**
     * 獲取存儲容量限制
     */
    getQuota(scope?: StorageScope): Promise<{
        max: number;
        used: number;
        remaining: number;
        percentage: number;
    }>;
    
    // ==================== 搜索和過濾 ====================
    
    /**
     * 搜索鍵
     */
    search(query: string | RegExp, options?: StorageOptions): Promise<string[]>;
    
    /**
     * 根據條件過濾
     */
    filter<T>(
        predicate: (key: string, value: T, metadata: StorageMetadata) => boolean,
        query?: StorageQuery
    ): Promise<Array<[string, T]>>;
    
    // ==================== 事件監聽 ====================
    
    /**
     * 監聽存儲變更
     */
    onDidChange<T>(
        key: string | RegExp,
        listener: (key: string, newValue: T | undefined, oldValue: T | undefined) => void
    ): { dispose(): void };
    
    /**
     * 監聽存儲清理事件
     */
    onDidClear(
        listener: (scope?: StorageScope) => void
    ): { dispose(): void };
    
    // ==================== 數據遷移 ====================
    
    /**
     * 執行數據遷移
     */
    migrate(migrations: StorageMigration[]): Promise<{
        migrated: number;
        skipped: number;
        errors: Array<{ key: string; error: string }>;
    }>;
    
    /**
     * 備份數據
     */
    backup(scope?: StorageScope): Promise<string>; // 返回備份 ID
    
    /**
     * 恢復數據
     */
    restore(backupId: string, options?: {
        merge?: boolean;
        overwrite?: boolean;
        scope?: StorageScope;
    }): Promise<void>;
    
    // ==================== 事務支援 ====================
    
    /**
     * 執行事務
     */
    transaction<T>(
        operations: (transaction: IStorageTransaction) => Promise<T>
    ): Promise<T>;
    
    // ==================== 平台功能 ====================
    
    /**
     * 獲取平台名稱
     */
    getPlatformName(): string;
    
    /**
     * 檢查是否支援某個功能
     */
    supportsFeature(feature: 'encryption' | 'compression' | 'ttl' | 'transactions' | 'events' | 'migration'): boolean;
    
    /**
     * 同步到遠端（如果支援）
     */
    sync(options?: {
        force?: boolean;
        scope?: StorageScope;
    }): Promise<{
        uploaded: number;
        downloaded: number;
        conflicts: number;
    }>;
    
    // ==================== 維護操作 ====================
    
    /**
     * 清理過期數據
     */
    cleanup(): Promise<{
        expired: number;
        freed: number;
    }>;
    
    /**
     * 壓縮存儲空間
     */
    compact(): Promise<{
        before: number;
        after: number;
        saved: number;
    }>;
    
    /**
     * 驗證數據完整性
     */
    verify(): Promise<{
        valid: number;
        corrupted: string[];
        repaired: string[];
    }>;
}

/**
 * 存儲事務接口
 */
export interface IStorageTransaction {
    set<T>(key: string, value: T, options?: StorageOptions): void;
    get<T>(key: string, defaultValue?: T, options?: StorageOptions): Promise<T | undefined>;
    delete(key: string, options?: StorageOptions): void;
    commit(): Promise<void>;
    rollback(): Promise<void>;
    readonly isCommitted: boolean;
    readonly isRolledBack: boolean;
}

/**
 * 存儲工廠接口
 */
export interface IStorageFactory {
    createStorage(): IStorage;
    getPlatformName(): string;
    getSupportedScopes(): StorageScope[];
    getMaxQuota(scope: StorageScope): number;
}

/**
 * 存儲提供者介面（用於自定義存儲後端）
 */
export interface IStorageProvider {
    name: string;
    initialize(config?: unknown): Promise<void>;
    read(key: string): Promise<unknown>;
    write(key: string, value: unknown): Promise<void>;
    delete(key: string): Promise<boolean>;
    list(prefix?: string): Promise<string[]>;
    clear(): Promise<void>;
    close(): Promise<void>;
}