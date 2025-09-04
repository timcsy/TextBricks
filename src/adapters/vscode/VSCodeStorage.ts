/**
 * VS Code 存儲適配器
 * 實現 IStorage 接口，提供 VS Code 特定的存儲功能
 */

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { 
    IStorage, 
    StorageScope, 
    StorageOptions, 
    StorageMetadata, 
    StorageQuery,
    StorageMigration,
    IStorageTransaction
} from '../../interfaces/IStorage';

export class VSCodeStorage implements IStorage {
    private context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    // ==================== 基本讀寫 ====================

    async set<T>(key: string, value: T, options?: StorageOptions): Promise<void> {
        const scope = options?.scope || 'global';
        const storage = this.getStorage(scope);
        
        await storage.update(key, value);
    }

    async get<T>(key: string, defaultValue?: T, options?: StorageOptions): Promise<T | undefined> {
        const scope = options?.scope || 'global';
        const storage = this.getStorage(scope);
        
        const value = storage.get<T>(key);
        return value !== undefined ? value : defaultValue;
    }

    async has(key: string, options?: StorageOptions): Promise<boolean> {
        const scope = options?.scope || 'global';
        const storage = this.getStorage(scope);
        
        return storage.get(key) !== undefined;
    }

    async delete(key: string, options?: StorageOptions): Promise<boolean> {
        const scope = options?.scope || 'global';
        const storage = this.getStorage(scope);
        
        const existed = storage.get(key) !== undefined;
        await storage.update(key, undefined);
        return existed;
    }

    async clear(scope?: StorageScope): Promise<void> {
        const targetScope = scope || 'global';
        const storage = this.getStorage(targetScope);
        
        const keys = await this.keys({ scope: targetScope });
        for (const key of keys) {
            await storage.update(key, undefined);
        }
    }

    // ==================== 批量操作 ====================

    async setMultiple<T>(items: Record<string, T>, options?: StorageOptions): Promise<void> {
        const scope = options?.scope || 'global';
        const storage = this.getStorage(scope);
        
        for (const [key, value] of Object.entries(items)) {
            await storage.update(key, value);
        }
    }

    async getMultiple<T>(keys: string[], options?: StorageOptions): Promise<Record<string, T | undefined>> {
        const scope = options?.scope || 'global';
        const storage = this.getStorage(scope);
        
        const result: Record<string, T | undefined> = {};
        for (const key of keys) {
            result[key] = storage.get<T>(key);
        }
        return result;
    }

    async deleteMultiple(keys: string[], options?: StorageOptions): Promise<number> {
        const scope = options?.scope || 'global';
        const storage = this.getStorage(scope);
        
        let deleted = 0;
        for (const key of keys) {
            const existed = storage.get(key) !== undefined;
            await storage.update(key, undefined);
            if (existed) deleted++;
        }
        return deleted;
    }

    // ==================== 查詢和遍歷 ====================

    async keys(query?: StorageQuery): Promise<string[]> {
        const scope = query?.scope || 'global';
        const storage = this.getStorage(scope);
        
        // VS Code 沒有直接獲取所有鍵的方法，使用內部追蹤
        const allKeys = await this.getAllKeysForScope(scope);
        
        let filteredKeys = allKeys;
        
        if (query?.prefix) {
            filteredKeys = filteredKeys.filter(key => key.startsWith(query.prefix!));
        }
        
        if (query?.pattern) {
            filteredKeys = filteredKeys.filter(key => query.pattern!.test(key));
        }
        
        // 排序
        if (query?.sortBy === 'key') {
            filteredKeys.sort((a, b) => 
                query.sortOrder === 'desc' ? b.localeCompare(a) : a.localeCompare(b)
            );
        }
        
        // 分頁
        const start = query?.offset || 0;
        const end = query?.limit ? start + query.limit : undefined;
        return filteredKeys.slice(start, end);
    }

    async values<T>(query?: StorageQuery): Promise<T[]> {
        const keys = await this.keys(query);
        const scope = query?.scope || 'global';
        const storage = this.getStorage(scope);
        
        const values: T[] = [];
        for (const key of keys) {
            const value = storage.get<T>(key);
            if (value !== undefined) {
                values.push(value);
            }
        }
        return values;
    }

    async entries<T>(query?: StorageQuery): Promise<Array<[string, T]>> {
        const keys = await this.keys(query);
        const scope = query?.scope || 'global';
        const storage = this.getStorage(scope);
        
        const entries: Array<[string, T]> = [];
        for (const key of keys) {
            const value = storage.get<T>(key);
            if (value !== undefined) {
                entries.push([key, value]);
            }
        }
        return entries;
    }

    async forEach<T>(
        callback: (key: string, value: T, metadata: StorageMetadata) => void | Promise<void>,
        query?: StorageQuery
    ): Promise<void> {
        const entries = await this.entries<T>(query);
        
        for (const [key, value] of entries) {
            const metadata = await this.getMetadata(key, { scope: query?.scope });
            if (metadata) {
                await callback(key, value, metadata);
            }
        }
    }

    // ==================== 元數據和統計 ====================

    async getMetadata(key: string, options?: StorageOptions): Promise<StorageMetadata | undefined> {
        const scope = options?.scope || 'global';
        const storage = this.getStorage(scope);
        
        const value = storage.get(key);
        if (value === undefined) {
            return undefined;
        }
        
        // VS Code 不提供詳細元數據，返回基本信息
        const valueStr = JSON.stringify(value);
        const now = new Date();
        
        return {
            key,
            size: valueStr.length,
            created: now, // 無法獲取實際創建時間
            modified: now, // 無法獲取實際修改時間
            accessed: now,
            scope,
            encrypted: false,
            version: '1.0.0'
        };
    }

    async getStats(scope?: StorageScope): Promise<{
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
    }> {
        const targetScope = scope || 'global';
        const keys = await this.keys({ scope: targetScope });
        const values = await this.values({ scope: targetScope });
        
        const totalSize = values.reduce((acc: number, value) => {
            return acc + JSON.stringify(value).length;
        }, 0);
        
        const now = new Date();
        
        const scopeBreakdown: Record<StorageScope, { keys: number; size: number }> = {} as any;
        scopeBreakdown[targetScope] = {
            keys: keys.length,
            size: totalSize
        };

        return {
            totalKeys: keys.length,
            totalSize,
            usedSpace: totalSize,
            freeSpace: undefined, // VS Code 不提供限制信息
            oldestItem: now,
            newestItem: now,
            scopeBreakdown
        };
    }

    async getQuota(scope?: StorageScope): Promise<{
        max: number;
        used: number;
        remaining: number;
        percentage: number;
    }> {
        // VS Code 沒有明確的存儲限制
        const stats = await this.getStats(scope);
        const used = stats.usedSpace;
        const max = 10 * 1024 * 1024; // 假設 10MB 限制
        
        return {
            max,
            used,
            remaining: max - used,
            percentage: (used / max) * 100
        };
    }

    // ==================== 搜索和過濾 ====================

    async search(query: string | RegExp, options?: StorageOptions): Promise<string[]> {
        const keys = await this.keys({ scope: options?.scope });
        
        if (typeof query === 'string') {
            return keys.filter(key => key.includes(query));
        } else {
            return keys.filter(key => query.test(key));
        }
    }

    async filter<T>(
        predicate: (key: string, value: T, metadata: StorageMetadata) => boolean,
        query?: StorageQuery
    ): Promise<Array<[string, T]>> {
        const entries = await this.entries<T>(query);
        const filtered: Array<[string, T]> = [];
        
        for (const [key, value] of entries) {
            const metadata = await this.getMetadata(key, { scope: query?.scope });
            if (metadata && predicate(key, value, metadata)) {
                filtered.push([key, value]);
            }
        }
        
        return filtered;
    }

    // ==================== 事件監聽 ====================

    onDidChange<T>(
        key: string | RegExp,
        listener: (key: string, newValue: T | undefined, oldValue: T | undefined) => void
    ): { dispose(): void } {
        // VS Code 不提供存儲變更事件，返回空的 disposable
        return {
            dispose: () => {}
        };
    }

    onDidClear(
        listener: (scope?: StorageScope) => void
    ): { dispose(): void } {
        // VS Code 不提供存儲清理事件，返回空的 disposable
        return {
            dispose: () => {}
        };
    }

    // ==================== 數據遷移 ====================

    async migrate(migrations: StorageMigration[]): Promise<{
        migrated: number;
        skipped: number;
        errors: Array<{ key: string; error: string }>;
    }> {
        const result = { migrated: 0, skipped: 0, errors: [] as Array<{ key: string; error: string }> };
        
        for (const migration of migrations) {
            try {
                const keys = await this.keys();
                for (const key of keys) {
                    if (key.startsWith(migration.from)) {
                        const value = await this.get(key);
                        if (value !== undefined) {
                            const transformedValue = migration.transform(value);
                            const newKey = key.replace(migration.from, migration.to);
                            
                            await this.set(newKey, transformedValue);
                            await this.delete(key);
                            result.migrated++;
                        }
                    }
                }
            } catch (error) {
                result.errors.push({
                    key: migration.from,
                    error: error instanceof Error ? error.message : String(error)
                });
            }
        }
        
        return result;
    }

    async backup(scope?: StorageScope): Promise<string> {
        const targetScope = scope || 'global';
        const entries = await this.entries({ scope: targetScope });
        const backupId = `backup-${Date.now()}`;
        
        const backupData = {
            id: backupId,
            scope: targetScope,
            timestamp: new Date(),
            data: entries
        };
        
        await this.set(`backup:${backupId}`, backupData);
        return backupId;
    }

    async restore(backupId: string, options?: {
        merge?: boolean;
        overwrite?: boolean;
        scope?: StorageScope;
    }): Promise<void> {
        const backupData = await this.get(`backup:${backupId}`);
        if (!backupData || typeof backupData !== 'object') {
            throw new Error(`Backup not found: ${backupId}`);
        }
        
        const data = (backupData as any).data;
        if (!Array.isArray(data)) {
            throw new Error(`Invalid backup data: ${backupId}`);
        }
        
        const targetScope = options?.scope || 'global';
        
        if (!options?.merge) {
            await this.clear(targetScope);
        }
        
        for (const [key, value] of data) {
            if (!options?.overwrite && await this.has(key, { scope: targetScope })) {
                continue;
            }
            
            await this.set(key, value, { scope: targetScope });
        }
    }

    // ==================== 事務支援 ====================

    async transaction<T>(
        operations: (transaction: IStorageTransaction) => Promise<T>
    ): Promise<T> {
        // VS Code 不支持事務，創建一個簡單的實現
        const transaction = new VSCodeStorageTransaction(this);
        
        try {
            const result = await operations(transaction);
            await transaction.commit();
            return result;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    // ==================== 平台功能 ====================

    getPlatformName(): string {
        return 'VSCode';
    }

    supportsFeature(feature: 'encryption' | 'compression' | 'ttl' | 'transactions' | 'events' | 'migration'): boolean {
        switch (feature) {
            case 'migration':
                return true; // 基本支持
            case 'encryption':
            case 'compression':
            case 'ttl':
            case 'transactions':
            case 'events':
                return false;
            default:
                return false;
        }
    }

    async sync(options?: {
        force?: boolean;
        scope?: StorageScope;
    }): Promise<{
        uploaded: number;
        downloaded: number;
        conflicts: number;
    }> {
        // VS Code 不支持遠程同步
        return {
            uploaded: 0,
            downloaded: 0,
            conflicts: 0
        };
    }

    // ==================== 維護操作 ====================

    async cleanup(): Promise<{
        expired: number;
        freed: number;
    }> {
        // VS Code 不支持 TTL，沒有過期數據
        return {
            expired: 0,
            freed: 0
        };
    }

    async compact(): Promise<{
        before: number;
        after: number;
        saved: number;
    }> {
        // VS Code 自動管理存儲壓縮
        const stats = await this.getStats();
        return {
            before: stats.usedSpace,
            after: stats.usedSpace,
            saved: 0
        };
    }

    async verify(): Promise<{
        valid: number;
        corrupted: string[];
        repaired: string[];
    }> {
        const keys = await this.keys();
        const corrupted: string[] = [];
        let valid = 0;
        
        for (const key of keys) {
            try {
                await this.get(key);
                valid++;
            } catch {
                corrupted.push(key);
            }
        }
        
        return {
            valid,
            corrupted,
            repaired: [] // VS Code 不支持自動修復
        };
    }

    // ==================== 私有方法 ====================

    private getStorage(scope: StorageScope): vscode.Memento {
        switch (scope) {
            case 'workspace':
                return this.context.workspaceState;
            case 'global':
            case 'user':
            case 'machine':
            default:
                return this.context.globalState;
        }
    }

    private async getAllKeysForScope(scope: StorageScope): Promise<string[]> {
        // VS Code 不提供直接獲取所有鍵的方法
        // 這裡返回一個空數組，實際使用中需要在應用層維護鍵列表
        const keyListKey = `__textbricks_keys_${scope}__`;
        const keyList = await this.get<string[]>(keyListKey, []);
        return keyList || [];
    }
}

/**
 * 簡單的 VS Code 存儲事務實現
 */
class VSCodeStorageTransaction implements IStorageTransaction {
    private operations: Array<{ type: 'set' | 'delete'; key: string; value?: any; options?: StorageOptions }> = [];
    private _isCommitted = false;
    private _isRolledBack = false;

    constructor(private storage: VSCodeStorage) {}

    set<T>(key: string, value: T, options?: StorageOptions): void {
        this.operations.push({ type: 'set', key, value, options });
    }

    async get<T>(key: string, defaultValue?: T, options?: StorageOptions): Promise<T | undefined> {
        // 先檢查待提交的操作
        const lastOp = this.operations.slice().reverse().find(op => op.key === key);
        if (lastOp) {
            return lastOp.type === 'set' ? lastOp.value : defaultValue;
        }
        
        return await this.storage.get(key, defaultValue, options);
    }

    delete(key: string, options?: StorageOptions): void {
        this.operations.push({ type: 'delete', key, options });
    }

    async commit(): Promise<void> {
        if (this._isCommitted || this._isRolledBack) {
            throw new Error('Transaction already finalized');
        }
        
        for (const op of this.operations) {
            if (op.type === 'set') {
                await this.storage.set(op.key, op.value, op.options);
            } else {
                await this.storage.delete(op.key, op.options);
            }
        }
        
        this._isCommitted = true;
    }

    async rollback(): Promise<void> {
        if (this._isCommitted || this._isRolledBack) {
            throw new Error('Transaction already finalized');
        }
        
        this.operations = [];
        this._isRolledBack = true;
    }

    get isCommitted(): boolean {
        return this._isCommitted;
    }

    get isRolledBack(): boolean {
        return this._isRolledBack;
    }
}