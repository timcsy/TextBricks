/**
 * PathTransformService
 * 統一處理所有路徑轉換和識別邏輯
 *
 * 職責：
 * - 為不同類型的項目構建唯一識別路徑
 * - 在內部路徑和顯示路徑之間轉換
 * - 標準化路徑格式
 */

import { ExtendedTemplate, TopicConfig, Language } from '@textbricks/shared';
import { IPlatform } from '../interfaces/IPlatform';

export interface PathTransformOptions {
    /** 主題數據源（用於路徑到顯示名稱的轉換） */
    topicsMap?: Map<string, TopicConfig> | Record<string, TopicConfig>;
    /** 使用顯示名稱還是內部名稱 */
    useDisplayNames?: boolean;
}

export type ItemType = 'template' | 'topic' | 'link' | 'language';

export interface PathItem {
    type: ItemType;
    name?: string;
    path?: string | string[];
    topicPath?: string;
    title?: string;
}

/**
 * 路徑轉換服務
 */
export class PathTransformService {
    private topicsMap: Map<string, TopicConfig>;
    private platform: IPlatform;

    constructor(
        platform: IPlatform,
        topicsMap?: Map<string, TopicConfig> | Record<string, TopicConfig>
    ) {
        this.platform = platform;
        this.topicsMap = new Map();
        if (topicsMap) {
            this.updateTopicsMap(topicsMap);
        }
    }

    /**
     * 更新主題映射表
     */
    updateTopicsMap(topicsMap: Map<string, TopicConfig> | Record<string, TopicConfig>): void {
        if (topicsMap instanceof Map) {
            this.topicsMap = new Map(topicsMap);
        } else {
            this.topicsMap = new Map(Object.entries(topicsMap));
        }
    }

    /**
     * 獲取項目的唯一識別路徑
     *
     * @param item - 項目物件
     * @param type - 項目類型
     * @returns 唯一識別路徑
     */
    getItemIdentifier(item: PathItem, type: ItemType): string | null {
        if (!item) { return null; }

        switch (type) {
            case 'template':
                // Template 用 topicPath + name 組成完整路徑
                if (item.topicPath && item.name) {
                    return `${item.topicPath}/templates/${item.name}`;
                }
                return item.name || null;

            case 'topic':
                // Topic 用 path（字串格式）
                if (typeof item.path === 'string') { return item.path; }
                // 如果 path 是陣列，轉換為字串
                if (Array.isArray(item.path)) { return item.path.join('/'); }
                return item.name || null;

            case 'link':
                // Link 用 name
                return item.name || null;

            case 'language':
                // Language 用 name
                return item.name || null;

            default:
                this.platform.logWarning(`Unknown item type: ${type}`, 'PathTransformService');
                return null;
        }
    }

    /**
     * 建構 template 的完整路徑
     *
     * @param template - 模板物件
     * @returns 路徑格式: {topicPath}/templates/{name}
     */
    buildTemplatePath(template: Partial<ExtendedTemplate> & { topicPath?: string }): string {
        const topicPath = template.topicPath || '';
        const name = template.name ||
                     template.title?.toLowerCase()
                         .replace(/\s+/g, '-')
                         .replace(/[^a-z0-9\-]/g, '');

        return topicPath ? `${topicPath}/templates/${name}` : `templates/${name}`;
    }

    /**
     * 將內部路徑轉換為顯示路徑（使用 title）
     *
     * @param pathString - 內部路徑，如 "c/basic"
     * @returns 顯示路徑，如 "C 語言/基礎語法"
     */
    pathToDisplayPath(pathString: string): string {
        if (!pathString) { return ''; }

        const topics = Array.from(this.topicsMap.values());
        const pathParts = pathString.split('/');
        const displayParts: string[] = [];

        for (let i = 0; i < pathParts.length; i++) {
            const partialPath = pathParts.slice(0, i + 1).join('/');
            const currentPart = pathParts[i];

            // 嘗試找到對應的主題
            const topic = topics.find(t => {
                // TopicConfig 本身沒有 path，但運行時可能被擴展
                const topicWithPath = t as TopicConfig & { path?: string | string[] };
                const topicPath = Array.isArray(topicWithPath.path)
                    ? topicWithPath.path.join('/')
                    : topicWithPath.path;
                return topicPath === partialPath || t.name === currentPart;
            });

            if (topic && topic.title) {
                displayParts.push(topic.title);
            } else {
                // 如果找不到，使用原始名稱
                displayParts.push(currentPart);
            }
        }

        return displayParts.join('/');
    }

    /**
     * 將顯示路徑轉換為內部路徑
     *
     * @param displayPath - 顯示路徑，如 "C 語言/基礎語法"
     * @returns 內部路徑，如 "c/basic"
     */
    displayPathToPath(displayPath: string): string {
        if (!displayPath) { return ''; }

        const topics = Array.from(this.topicsMap.values());
        const displayParts = displayPath.split('/');
        const pathParts: string[] = [];

        for (const displayPart of displayParts) {
            // 找到 title 匹配的主題
            const topic = topics.find(t => t.title === displayPart);
            if (topic) {
                pathParts.push(topic.name);
            } else {
                // 如果找不到，使用原始值
                pathParts.push(displayPart);
            }
        }

        return pathParts.join('/');
    }

    /**
     * 標準化路徑格式（統一為字串格式）
     *
     * @param path - 路徑（可能是字串或陣列）
     * @returns 標準化的字串路徑
     */
    normalizePath(path: string | string[] | undefined): string {
        if (!path) { return ''; }
        if (typeof path === 'string') { return path; }
        if (Array.isArray(path)) { return path.join('/'); }
        return '';
    }

    /**
     * 拆分路徑為部分
     *
     * @param path - 路徑字串
     * @returns 路徑部分陣列
     */
    splitPath(path: string): string[] {
        if (!path) { return []; }
        return path.split('/').filter(part => part.length > 0);
    }

    /**
     * 組合路徑部分
     *
     * @param parts - 路徑部分
     * @returns 組合後的路徑
     */
    joinPath(...parts: (string | undefined)[]): string {
        return parts
            .filter(part => part && part.length > 0)
            .join('/');
    }

    /**
     * 檢查路徑是否為子路徑
     *
     * @param path - 要檢查的路徑
     * @param parentPath - 父路徑
     * @returns 是否為子路徑
     */
    isSubPath(path: string, parentPath: string): boolean {
        if (!path || !parentPath) { return false; }
        return path.startsWith(parentPath + '/') || path === parentPath;
    }

    /**
     * 獲取父路徑
     *
     * @param path - 路徑
     * @returns 父路徑，如果沒有則返回 null
     */
    getParentPath(path: string): string | null {
        if (!path) { return null; }
        const parts = this.splitPath(path);
        if (parts.length <= 1) { return null; }
        return this.joinPath(...parts.slice(0, -1));
    }

    /**
     * 獲取路徑的最後一部分（名稱）
     *
     * @param path - 路徑
     * @returns 最後一部分
     */
    getPathName(path: string): string {
        if (!path) { return ''; }
        const parts = this.splitPath(path);
        return parts[parts.length - 1] || '';
    }

    /**
     * 從完整路徑中提取主題路徑
     * 例如：從 "c/basic/templates/hello-world" 提取 "c/basic"
     *
     * @param fullPath - 完整路徑
     * @returns 主題路徑
     */
    extractTopicPath(fullPath: string): string {
        if (!fullPath) { return ''; }

        // 移除 /templates/* 部分
        const templatesIndex = fullPath.indexOf('/templates/');
        if (templatesIndex !== -1) {
            return fullPath.substring(0, templatesIndex);
        }

        // 移除 /links/* 部分
        const linksIndex = fullPath.indexOf('/links/');
        if (linksIndex !== -1) {
            return fullPath.substring(0, linksIndex);
        }

        return fullPath;
    }

    /**
     * 清理並標準化路徑
     * - 移除前後空白
     * - 移除重複的斜線
     * - 移除前後的斜線
     *
     * @param path - 原始路徑
     * @returns 清理後的路徑
     */
    sanitizePath(path: string): string {
        if (!path) { return ''; }

        return path
            .trim()
            .replace(/\/+/g, '/')  // 移除重複斜線
            .replace(/^\/|\/$/g, '');  // 移除前後斜線
    }
}

/**
 * 單例實例（可選）
 */
let instance: PathTransformService | null = null;

export function getPathTransformService(
    platform: IPlatform,
    topicsMap?: Map<string, TopicConfig> | Record<string, TopicConfig>
): PathTransformService {
    if (!instance || topicsMap) {
        instance = new PathTransformService(platform, topicsMap);
    }
    return instance;
}
