/**
 * TextBricks Scope 模型定義
 * 定義 Scope 相關的接口和類型
 */

import { Language } from './Template';

/**
 * 使用統計項目
 */
export interface UsageEntry {
    /** 使用次數 */
    count: number;
    /** 最後使用時間 */
    lastUsedAt: string;
}

export interface ScopeConfig {
    /** Scope 唯一標識（同時作為目錄名稱） */
    name: string;
    /** 顯示標題 */
    title?: string;
    /** 描述 */
    description: string;
    /** 支援的程式語言 */
    languages: Language[];
    /** 用戶收藏項目（使用路徑格式，如 "python/templates/hello-world" 或 "c/basic"） */
    favorites: string[];
    /**
     * 集中式使用統計（key 為路徑格式，如 "python/templates/hello-world"）
     * 格式：{ count: number, lastUsedAt: string }
     */
    usage: Record<string, UsageEntry>;
    /** 設定選項 */
    settings: ScopeSettings;
    /** 元數據 */
    metadata: ScopeMetadata;
    // 注意：移除 topics 陣列，改為從檔案系統掃描
}

export interface ScopeSettings {
    /** 自動同步 */
    autoSync: boolean;
    /** 只讀模式 */
    readOnly: boolean;
    /** 分享模式 */
    shareMode: 'private' | 'team' | 'public';
    /** 自動備份 */
    autoBackup: boolean;
    /** 資料路徑 */
    dataPath?: string;
}

export interface ScopeMetadata {
    /** 版本 */
    version: string;
    /** 建立時間 */
    created: string;
    /** 最後更新時間 */
    lastUpdated: string;
    /** 作者 */
    author: string;
    /** 標籤 */
    tags?: string[];
    /** 自訂屬性 */
    customProperties?: Record<string, any>;
}

export interface ScopeUsageStats {
    /** 總模板數 */
    totalTemplates: number;
    /** 總主題數 */
    totalTopics: number;
    /** 最常用的模板（使用路徑識別） */
    mostUsedTemplates: Array<{
        path: string;  // 如 "python/templates/hello-world"
        title: string;
        usage: number;
    }>;
    /** 最近使用的模板（使用路徑識別） */
    recentTemplates: Array<{
        path: string;  // 如 "python/templates/hello-world"
        title: string;
        lastUsed: string;
    }>;
    /** 收藏統計 */
    favoritesCount: number;
    /** 語言分佈 */
    languageDistribution: Record<string, number>;
}

export interface ScopeImportOptions {
    /** 覆蓋現有項目 */
    overwriteExisting: boolean;
    /** 合併主題 */
    mergeTopics: boolean;
    /** 合併語言 */
    mergeLanguages: boolean;
    /** 保留統計資料 */
    preserveStats: boolean;
    /** 保留收藏 */
    preserveFavorites: boolean;
}

export interface ScopeExportData {
    /** Scope 配置 */
    scope: ScopeConfig;
    /** 匯出時間 */
    exportedAt: Date;
    /** 匯出版本 */
    version: string;
    /** 匯出者 */
    exportedBy: string;
    /** 是否包含模板資料 */
    includeTemplates: boolean;
    /** 是否包含統計資料 */
    includeStats: boolean;
}

export type ScopeEvent =
    | { type: 'scope-switched', scopeId: string }
    | { type: 'scope-created', scope: ScopeConfig }
    | { type: 'scope-updated', scope: ScopeConfig }
    | { type: 'scope-deleted', scopeId: string }
    | { type: 'favorite-added', itemPath: string }
    | { type: 'favorite-removed', itemPath: string }
    | { type: 'usage-updated', itemPath: string, newCount: number };