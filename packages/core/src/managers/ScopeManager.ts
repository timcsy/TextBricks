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
    ScopeEvent
} from '@textbricks/shared';

export class ScopeManager {
    private platform: IPlatform;
    private currentScope: ScopeConfig | null = null;
    private availableScopes: Map<string, ScopeConfig> = new Map();
    private eventListeners: Array<(event: ScopeEvent) => void> = [];

    constructor(platform: IPlatform) {
        this.platform = platform;
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

    private async loadAvailableScopes(): Promise<void> {
        try {
            // 從文件系統載入所有可用的 scope
            const { join } = await import('path');
            const { readdir, readFile, stat } = await import('fs/promises');

            const extensionPath = (this.platform as any).getExtensionPath?.() ||
                                (this.platform as any).getExtensionContext?.()?.extensionPath;

            if (!extensionPath) {
                throw new Error('Extension path not found');
            }

            const dataPath = join(extensionPath, 'data');

            try {
                const entries = await readdir(dataPath, { withFileTypes: true });

                for (const entry of entries) {
                    if (entry.isDirectory()) {
                        const scopePath = join(dataPath, entry.name);
                        const scopeConfigPath = join(scopePath, 'scope.json');

                        try {
                            const scopeData = await readFile(scopeConfigPath, 'utf-8');
                            const scopeConfig: ScopeConfig = JSON.parse(scopeData);
                            this.availableScopes.set(scopeConfig.id, scopeConfig);
                        } catch (error) {
                            console.warn(`Failed to load scope config for ${entry.name}:`, error);
                        }
                    }
                }
            } catch (error) {
                console.warn('Data directory not found, using default scope');
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
            id: 'local',
            name: '本機範圍',
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
        if (this.availableScopes.has(scope.id)) {
            throw new Error(`Scope with ID '${scope.id}' already exists`);
        }

        this.availableScopes.set(scope.id, scope);

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
        if (this.currentScope?.id === scopeId) {
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
        if (this.currentScope?.id === scopeId) {
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
        const sortedUsage = Object.entries(usage)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10);

        return {
            totalTemplates: 0, // 這個需要從 TemplateManager 獲取
            totalTopics: 0, // 從檔案系統掃描取得，不再存於 scope
            mostUsedTemplates: sortedUsage.map(([path, count]) => ({
                path,
                title: path, // 這個需要從 TemplateManager 獲取實際標題
                usage: count
            })),
            recentTemplates: [], // 需要額外的時間戳記錄
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
        if (this.availableScopes.has(scope.id) && !options.overwriteExisting) {
            throw new Error(`Scope '${scope.id}' already exists`);
        }

        let targetScope = scope;

        // 如果是合併模式
        if (this.availableScopes.has(scope.id) && options.overwriteExisting) {
            const existingScope = this.availableScopes.get(scope.id)!;

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

        this.availableScopes.set(targetScope.id, targetScope);
        await this.saveScopeConfig(targetScope);

        this.emitEvent({ type: 'scope-created', scope: targetScope });
    }

    // ==================== 私有方法 ====================

    private async saveScopeConfig(scope: ScopeConfig): Promise<void> {
        try {
            const { join } = await import('path');
            const { writeFile, mkdir } = await import('fs/promises');

            const extensionPath = (this.platform as any).getExtensionPath?.() ||
                                (this.platform as any).getExtensionContext?.()?.extensionPath;

            if (!extensionPath) {
                throw new Error('Extension path not found');
            }

            const scopePath = join(extensionPath, 'data', scope.id);
            const scopeConfigPath = join(scopePath, 'scope.json');

            // 確保目錄存在
            await mkdir(scopePath, { recursive: true });

            // 保存配置文件
            await writeFile(scopeConfigPath, JSON.stringify(scope, null, 2), 'utf-8');
        } catch (error) {
            throw new Error(`Failed to save scope config: ${error}`);
        }
    }

    private async deleteScopeFromFileSystem(scopeId: string): Promise<void> {
        try {
            const { join } = await import('path');
            const { rm } = await import('fs/promises');

            const extensionPath = (this.platform as any).getExtensionPath?.() ||
                                (this.platform as any).getExtensionContext?.()?.extensionPath;

            if (!extensionPath) {
                throw new Error('Extension path not found');
            }

            const scopePath = join(extensionPath, 'data', scopeId);
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
                console.error('Error in scope event listener:', error);
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
            console.warn('[ScopeManager] No current scope to update usage');
            return;
        }

        // 更新 usage 統計
        this.currentScope.usage[itemPath] = (this.currentScope.usage[itemPath] || 0) + 1;

        // 保存到檔案系統
        await this.saveScopeConfig(this.currentScope);

        // 觸發事件
        this.emitEvent({
            type: 'usage-updated',
            itemPath,
            newCount: this.currentScope.usage[itemPath]
        });
    }

    /**
     * 獲取項目使用次數
     * @param itemPath 項目路徑
     */
    getUsage(itemPath: string): number {
        return this.currentScope?.usage[itemPath] || 0;
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