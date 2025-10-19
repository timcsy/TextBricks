/**
 * Scope 管理器 - 處理 TextBricks Scope 的核心邏輯
 * 提供 Scope 切換、配置管理、統計收集等功能
 */

import { IPlatform } from '../interfaces/IPlatform';
import {
    ScopeConfig,
    ScopeUsageStats,
    ScopeImportOptions,
    ScopeExportData,
    ScopeEvent,
    UsageEntry
} from '@textbricks/shared';
import { DataPathService } from '../services/DataPathService';

export class ScopeManager {
    private platform: IPlatform;
    private dataPathService: DataPathService;
    private currentScope: ScopeConfig | null = null;
    private availableScopes: Map<string, ScopeConfig> = new Map();
    private eventListeners: Array<(event: ScopeEvent) => void> = [];

    constructor(platform: IPlatform, dataPathService: DataPathService) {
        this.platform = platform;
        this.dataPathService = dataPathService;
    }

    // ==================== 初始化和載入 ====================

    async initialize(): Promise<void> {
        try {
            await this.loadAvailableScopes();
            await this.loadCurrentScope();
        } catch (error) {
            this.platform.logError(error as Error, 'ScopeManager.initialize');
            throw error;
        }
    }

    /**
     * 獲取資料根目錄路徑（scopes 目錄）
     */
    private async getDataRootPath(): Promise<string> {
        if (!this.dataPathService) {
            throw new Error('DataPathService is required but not provided');
        }
        const dataPath = await this.dataPathService.getDataPath();

        if (!dataPath) {
            this.platform.logError(new Error('DataPathService.getDataPath() returned undefined'), 'ScopeManager.getDataRootPath');
            throw new Error('DataPathService.getDataPath() returned undefined. DataPathService may not be initialized.');
        }

        const { join } = await import('path');
        const scopesPath = join(dataPath, 'scopes');

        this.platform.logInfo(`Data root path: ${dataPath}, scopes path: ${scopesPath}`, 'ScopeManager');

        return scopesPath;
    }

    private async loadAvailableScopes(): Promise<void> {
        try {
            // 從文件系統載入所有可用的 scope
            const { join } = await import('path');
            const { readdir, readFile, stat } = await import('fs/promises');

            const dataPath = await this.getDataRootPath();

            try {
                const entries = await readdir(dataPath, { withFileTypes: true });

                for (const entry of entries) {
                    if (entry.isDirectory()) {
                        const scopePath = join(dataPath, entry.name);
                        const scopeConfigPath = join(scopePath, 'scope.json');

                        try {
                            const scopeData = await readFile(scopeConfigPath, 'utf-8');
                            const scopeConfig: ScopeConfig = JSON.parse(scopeData);

                            // 使用 scope.name 作為識別符（新版本沒有 id 欄位）
                            const scopeId = scopeConfig.name || entry.name;
                            this.availableScopes.set(scopeId, scopeConfig);
                        } catch (error) {
                            this.platform.logWarning(`Failed to load scope config for ${entry.name}`, 'ScopeManager');
                        }
                    }
                }
            } catch (error) {
                this.platform.logWarning('Data directory not found, using default scope', 'ScopeManager');
                // 創建默認 local scope
                await this.createDefaultLocalScope();
            }
        } catch (error) {
            throw new Error(`Failed to load available scopes: ${error}`);
        }
    }

    private async loadCurrentScope(): Promise<void> {
        try {
            // 從 storage 載入當前選中的 scope
            const currentScopeId = await this.platform.storage.get<string>('current-scope', 'local');

            if (this.availableScopes.has(currentScopeId)) {
                this.currentScope = this.availableScopes.get(currentScopeId)!;
            } else {
                // 回退到第一個可用的 scope 或創建默認 scope
                const firstScope = Array.from(this.availableScopes.values())[0];
                if (firstScope) {
                    this.currentScope = firstScope;
                } else {
                    await this.createDefaultLocalScope();
                }
            }
        } catch (error) {
            throw new Error(`Failed to load current scope: ${error}`);
        }
    }

    private async createDefaultLocalScope(): Promise<void> {
        const defaultScope: ScopeConfig = {
            name: 'local',
            title: '本機範圍',
            description: '本機開發環境的程式語言模板和主題',
            languages: [],
            favorites: [],
            usage: {},
            settings: {
                autoSync: false,
                readOnly: false,
                shareMode: 'private',
                autoBackup: true
            },
            metadata: {
                version: '1.0.0',
                created: new Date().toISOString(),
                lastUpdated: new Date().toISOString(),
                author: 'TextBricks'
            }
        };

        this.availableScopes.set('local', defaultScope);
        this.currentScope = defaultScope;
    }

    // ==================== Scope 管理 ====================

    getCurrentScope(): ScopeConfig | null {
        return this.currentScope;
    }

    getAvailableScopes(): ScopeConfig[] {
        return Array.from(this.availableScopes.values());
    }

    async switchScope(scopeId: string): Promise<void> {
        if (!this.availableScopes.has(scopeId)) {
            throw new Error(`Scope '${scopeId}' not found`);
        }

        const newScope = this.availableScopes.get(scopeId)!;
        this.currentScope = newScope;

        // 保存到 storage
        await this.platform.storage.set('current-scope', scopeId);

        // 觸發事件
        this.emitEvent({ type: 'scope-switched', scopeId });
    }

    async createScope(scopeData: Omit<ScopeConfig, 'metadata'>): Promise<ScopeConfig> {
        const scope: ScopeConfig = {
            ...scopeData,
            metadata: {
                version: '1.0.0',
                created: new Date().toISOString(),
                lastUpdated: new Date().toISOString(),
                author: 'User'
            }
        };

        // 檢查 ID 是否已存在
        if (this.availableScopes.has(scope.name)) {
            throw new Error(`Scope with ID '${scope.name}' already exists`);
        }

        this.availableScopes.set(scope.name, scope);

        // 保存到文件系統
        await this.saveScopeConfig(scope);

        // 觸發事件
        this.emitEvent({ type: 'scope-created', scope });

        return scope;
    }

    async updateScope(scopeId: string, updates: Partial<Omit<ScopeConfig, 'id' | 'metadata'>>): Promise<ScopeConfig> {
        const scope = this.availableScopes.get(scopeId);
        if (!scope) {
            throw new Error(`Scope '${scopeId}' not found`);
        }

        const updatedScope: ScopeConfig = {
            ...scope,
            ...updates,
            metadata: {
                ...scope.metadata,
                lastUpdated: new Date().toISOString()
            }
        };

        this.availableScopes.set(scopeId, updatedScope);

        // 如果是當前 scope，更新引用
        if (this.currentScope?.name === scopeId) {
            this.currentScope = updatedScope;
        }

        // 保存到文件系統
        await this.saveScopeConfig(updatedScope);

        // 觸發事件
        this.emitEvent({ type: 'scope-updated', scope: updatedScope });

        return updatedScope;
    }

    async deleteScope(scopeId: string): Promise<void> {
        if (scopeId === 'local') {
            throw new Error('Cannot delete the local scope');
        }

        if (!this.availableScopes.has(scopeId)) {
            throw new Error(`Scope '${scopeId}' not found`);
        }

        this.availableScopes.delete(scopeId);

        // 如果刪除的是當前 scope，切換到 local scope
        if (this.currentScope?.name === scopeId) {
            await this.switchScope('local');
        }

        // 從文件系統刪除
        await this.deleteScopeFromFileSystem(scopeId);

        // 觸發事件
        this.emitEvent({ type: 'scope-deleted', scopeId });
    }

    // ==================== 收藏管理（已廢棄，使用下方的集中式管理方法） ====================
    // 注意：這些舊方法已被下方的 addFavorite/removeFavorite/isFavorite 取代

    getFavorites(): string[] {
        return this.currentScope?.favorites || [];
    }

    getUsageStats(): ScopeUsageStats {
        if (!this.currentScope) {
            throw new Error('No current scope');
        }

        const usage = this.currentScope.usage;

        // 轉換為統一格式並排序（支援新舊格式）
        const usageEntries = Object.entries(usage).map(([path, entry]) => ({
            path,
            count: typeof entry === 'number' ? entry : entry.count,
            lastUsedAt: typeof entry === 'number' ? null : entry.lastUsedAt
        }));

        const sortedByUsage = usageEntries
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        const sortedByRecent = usageEntries
            .filter(e => e.lastUsedAt !== null)
            .sort((a, b) => {
                const dateA = a.lastUsedAt ? new Date(a.lastUsedAt).getTime() : 0;
                const dateB = b.lastUsedAt ? new Date(b.lastUsedAt).getTime() : 0;
                return dateB - dateA;
            })
            .slice(0, 10);

        return {
            totalTemplates: 0, // 這個需要從 TemplateManager 獲取
            totalTopics: 0, // 從檔案系統掃描取得，不再存於 scope
            mostUsedTemplates: sortedByUsage.map(e => ({
                path: e.path,
                title: e.path, // 這個需要從 TemplateManager 獲取實際標題
                usage: e.count
            })),
            recentTemplates: sortedByRecent.map(e => ({
                path: e.path,
                title: e.path, // 這個需要從 TemplateManager 獲取實際標題
                lastUsed: e.lastUsedAt!
            })),
            favoritesCount: this.currentScope.favorites.length,
            languageDistribution: {} // 這個需要從 TemplateManager 計算
        };
    }

    async clearUsageStats(): Promise<void> {
        if (!this.currentScope) {
            throw new Error('No current scope');
        }

        this.currentScope.usage = {};
        await this.saveScopeConfig(this.currentScope);
    }

    // ==================== 匯入匯出 ====================

    async exportScope(includeTemplates: boolean = true, includeStats: boolean = true): Promise<ScopeExportData> {
        if (!this.currentScope) {
            throw new Error('No current scope');
        }

        const exportData: ScopeExportData = {
            scope: { ...this.currentScope },
            exportedAt: new Date(),
            version: '1.0.0',
            exportedBy: 'TextBricks Manager',
            includeTemplates,
            includeStats
        };

        if (!includeStats) {
            exportData.scope.usage = {};
        }

        return exportData;
    }

    async importScope(exportData: ScopeExportData, options: ScopeImportOptions): Promise<void> {
        const { scope } = exportData;

        // 檢查是否已存在
        if (this.availableScopes.has(scope.name) && !options.overwriteExisting) {
            throw new Error(`Scope '${scope.name}' already exists`);
        }

        let targetScope = scope;

        // 如果是合併模式
        if (this.availableScopes.has(scope.name) && options.overwriteExisting) {
            const existingScope = this.availableScopes.get(scope.name)!;

            targetScope = {
                ...existingScope,
                ...scope,
                // topics 從檔案系統掃描，不再合併
                languages: options.mergeLanguages
                    ? [...new Set([...existingScope.languages, ...scope.languages])]
                    : scope.languages,
                favorites: options.preserveFavorites
                    ? [...new Set([...existingScope.favorites, ...scope.favorites])]
                    : scope.favorites,
                usage: options.preserveStats
                    ? { ...existingScope.usage, ...scope.usage }
                    : scope.usage,
                metadata: {
                    ...scope.metadata,
                    lastUpdated: new Date().toISOString()
                }
            };
        }

        this.availableScopes.set(targetScope.name, targetScope);
        await this.saveScopeConfig(targetScope);

        this.emitEvent({ type: 'scope-created', scope: targetScope });
    }

    // ==================== 私有方法 ====================

    private async saveScopeConfig(scope: ScopeConfig): Promise<void> {
        try {
            const { join } = await import('path');
            const { writeFile, mkdir } = await import('fs/promises');

            this.platform.logInfo(`Saving scope: ${JSON.stringify({ name: scope.name, title: scope.title })}`, 'ScopeManager');

            const dataRootPath = await this.getDataRootPath();

            if (!scope.name) {
                this.platform.logError(new Error(`Scope name is undefined! Scope: ${JSON.stringify(scope)}`), 'ScopeManager.saveScopeConfig');
                throw new Error('Scope name is undefined');
            }

            const scopePath = join(dataRootPath, scope.name);
            const scopeConfigPath = join(scopePath, 'scope.json');

            this.platform.logInfo(`Saving scope config to: ${scopeConfigPath}`, 'ScopeManager');

            // 確保目錄存在
            await mkdir(scopePath, { recursive: true });

            // 保存配置文件
            await writeFile(scopeConfigPath, JSON.stringify(scope, null, 2), 'utf-8');

            this.platform.logInfo(`Scope config written successfully`, 'ScopeManager');
        } catch (error) {
            this.platform.logError(error as Error, 'ScopeManager.saveScopeConfig');
            throw new Error(`Failed to save scope config: ${error}`);
        }
    }

    private async deleteScopeFromFileSystem(scopeId: string): Promise<void> {
        try {
            const { join } = await import('path');
            const { rm } = await import('fs/promises');

            const dataRootPath = await this.getDataRootPath();
            const scopePath = join(dataRootPath, scopeId);
            await rm(scopePath, { recursive: true, force: true });
        } catch (error) {
            throw new Error(`Failed to delete scope from filesystem: ${error}`);
        }
    }

    // ==================== 事件系統 ====================

    addEventListener(listener: (event: ScopeEvent) => void): void {
        this.eventListeners.push(listener);
    }

    removeEventListener(listener: (event: ScopeEvent) => void): void {
        const index = this.eventListeners.indexOf(listener);
        if (index !== -1) {
            this.eventListeners.splice(index, 1);
        }
    }

    private emitEvent(event: ScopeEvent): void {
        this.eventListeners.forEach(listener => {
            try {
                listener(event);
            } catch (error) {
                this.platform.logError(error as Error, 'notifyListeners');
            }
        });
    }

    // ==================== 集中式 Usage 管理 ====================

    /**
     * 更新項目使用次數（集中式管理）
     * @param itemPath 項目路徑（如 "python/templates/hello-world" 或 "c/basic"）
     */
    async updateUsage(itemPath: string): Promise<void> {
        if (!this.currentScope) {
            this.platform.logWarning('No current scope to update usage', 'ScopeManager');
            return;
        }

        // 獲取舊的使用次數
        const oldEntry = this.currentScope.usage[itemPath];
        const oldCount = oldEntry?.count || 0;

        // 更新使用統計（包含 count 和 lastUsedAt）
        const newEntry: UsageEntry = {
            count: oldCount + 1,
            lastUsedAt: new Date().toISOString()
        };
        this.currentScope.usage[itemPath] = newEntry;

        this.platform.logInfo(`Updating usage for ${itemPath}: ${oldCount} -> ${newEntry.count}`, 'ScopeManager');

        // 保存到檔案系統
        try {
            await this.saveScopeConfig(this.currentScope);
            this.platform.logInfo(`Scope config saved successfully for ${this.currentScope.name}`, 'ScopeManager');
        } catch (error) {
            this.platform.logError(error as Error, 'ScopeManager.updateUsage');
            throw error;
        }

        // 觸發事件
        this.emitEvent({
            type: 'usage-updated',
            itemPath,
            newCount: newEntry.count
        });
    }

    /**
     * 獲取項目使用次數
     * @param itemPath 項目路徑
     * @deprecated 使用 getUsageCount 替代
     */
    getUsage(itemPath: string): number {
        return this.getUsageCount(itemPath);
    }

    /**
     * 獲取項目使用次數
     * @param itemPath 項目路徑
     */
    getUsageCount(itemPath: string): number {
        if (!this.currentScope) {
            return 0;
        }
        const entry = this.currentScope.usage[itemPath];
        return entry?.count || 0;
    }

    /**
     * 獲取項目最後使用時間
     * @param itemPath 項目路徑
     * @returns Date 物件或 null
     */
    getLastUsedAt(itemPath: string): Date | null {
        if (!this.currentScope) {
            return null;
        }
        const entry = this.currentScope.usage[itemPath];
        if (!entry) {
            return null;
        }
        return new Date(entry.lastUsedAt);
    }

    /**
     * 清除所有 usage 統計
     */
    async clearAllUsage(): Promise<void> {
        if (!this.currentScope) {
            return;
        }

        this.currentScope.usage = {};
        await this.saveScopeConfig(this.currentScope);
    }

    /**
     * 新增收藏項目
     * @param itemPath 項目路徑
     */
    async addFavorite(itemPath: string): Promise<void> {
        if (!this.currentScope) {
            return;
        }

        if (!this.currentScope.favorites.includes(itemPath)) {
            this.currentScope.favorites.push(itemPath);
            await this.saveScopeConfig(this.currentScope);
            this.emitEvent({ type: 'favorite-added', itemPath });
        }
    }

    /**
     * 移除收藏項目
     * @param itemPath 項目路徑
     */
    async removeFavorite(itemPath: string): Promise<void> {
        if (!this.currentScope) {
            return;
        }

        const index = this.currentScope.favorites.indexOf(itemPath);
        if (index !== -1) {
            this.currentScope.favorites.splice(index, 1);
            await this.saveScopeConfig(this.currentScope);
            this.emitEvent({ type: 'favorite-removed', itemPath });
        }
    }

    /**
     * 檢查是否為收藏項目
     * @param itemPath 項目路徑
     */
    isFavorite(itemPath: string): boolean {
        return this.currentScope?.favorites.includes(itemPath) || false;
    }
}