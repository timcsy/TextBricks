/**
 * TextBricks Scope 模型定義
 * 定義 Scope 相關的接口和類型
 */

import { Language } from './Template';

export interface ScopeConfig {
    /** Scope 唯一標識 */
    id: string;
    /** 顯示名稱 */
    name: string;
    /** 描述 */
    description: string;
    /** Scope 類型 */
    type: 'local' | 'project' | 'team' | 'custom';
    /** 支援的程式語言 */
    languages: Language[];
    /** 可用主題列表 */
    topics: string[];
    /** 用戶收藏項目 */
    favorites: string[];
    /** 使用統計 */
    usage: Record<string, number>;
    /** 設定選項 */
    settings: ScopeSettings;
    /** 元數據 */
    metadata: ScopeMetadata;
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
    /** 最常用的模板 */
    mostUsedTemplates: Array<{
        id: string;
        title: string;
        usage: number;
    }>;
    /** 最近使用的模板 */
    recentTemplates: Array<{
        id: string;
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
    | { type: 'favorite-added', itemId: string }
    | { type: 'favorite-removed', itemId: string }
    | { type: 'usage-updated', itemId: string, newCount: number };