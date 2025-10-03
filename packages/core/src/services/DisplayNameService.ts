/**
 * DisplayNameService
 * 統一處理顯示名稱的獲取和格式化
 *
 * 職責：
 * - 根據語言 name 獲取顯示名稱（title）
 * - 根據主題 path 獲取顯示名稱
 * - 格式化各種標籤和顯示文字
 */

import { Language, TopicConfig } from '@textbricks/shared';

export interface DisplayNameOptions {
    /** 當找不到時的回退行為：'capitalize' | 'original' | 'empty' */
    fallback?: 'capitalize' | 'original' | 'empty';
    /** 是否使用完整路徑（包含父主題） */
    useFullPath?: boolean;
}

/**
 * 顯示名稱服務
 */
export class DisplayNameService {
    private languages: Map<string, Language>;
    private topics: Map<string, TopicConfig>;

    constructor(
        languages?: Language[] | Map<string, Language>,
        topics?: TopicConfig[] | Map<string, TopicConfig>
    ) {
        this.languages = new Map();
        this.topics = new Map();

        if (languages) {
            this.updateLanguages(languages);
        }

        if (topics) {
            this.updateTopics(topics);
        }
    }

    /**
     * 更新語言數據
     */
    updateLanguages(languages: Language[] | Map<string, Language>): void {
        if (Array.isArray(languages)) {
            this.languages = new Map(languages.map(lang => [lang.name, lang]));
        } else {
            this.languages = new Map(languages);
        }
    }

    /**
     * 更新主題數據
     */
    updateTopics(topics: TopicConfig[] | Map<string, TopicConfig> | Record<string, TopicConfig>): void {
        if (Array.isArray(topics)) {
            // 建立以 path 和 name 為鍵的映射
            for (const topic of topics) {
                const topicPath = this.getTopicPathKey(topic);
                if (topicPath) {
                    this.topics.set(topicPath, topic);
                }
                // 同時以 name 為鍵存儲
                if (topic.name) {
                    this.topics.set(topic.name, topic);
                }
            }
        } else if (topics instanceof Map) {
            this.topics = new Map(topics);
        } else {
            this.topics = new Map(Object.entries(topics));
        }
    }

    /**
     * 從主題物件中提取路徑鍵
     */
    private getTopicPathKey(topic: TopicConfig): string | null {
        // TopicConfig 本身沒有 path，但運行時可能被擴展
        const topicWithPath = topic as TopicConfig & { path?: string | string[] };
        if ('path' in topicWithPath && topicWithPath.path) {
            const path = topicWithPath.path;
            if (typeof path === 'string') {
                return path;
            }
            if (Array.isArray(path)) {
                return path.join('/');
            }
        }
        return topic.name || null;
    }

    /**
     * 獲取語言的顯示名稱
     *
     * @param languageName - 語言名稱（內部標識）
     * @param options - 選項
     * @returns 顯示名稱
     */
    getLanguageDisplayName(
        languageName: string,
        options: DisplayNameOptions = {}
    ): string {
        if (!languageName) return '';

        const language = this.languages.get(languageName);

        if (language?.title) {
            return language.title;
        }

        // Fallback 處理
        const fallback = options.fallback || 'capitalize';
        switch (fallback) {
            case 'capitalize':
                return this.capitalize(languageName);
            case 'original':
                return languageName;
            case 'empty':
                return '';
            default:
                return this.capitalize(languageName);
        }
    }

    /**
     * 獲取主題的顯示名稱
     *
     * @param topicPath - 主題路徑
     * @param options - 選項
     * @returns 顯示名稱
     */
    getTopicDisplayName(
        topicPath: string,
        options: DisplayNameOptions = {}
    ): string {
        if (!topicPath) return '';

        // 嘗試直接查找
        let topic = this.topics.get(topicPath);

        // 如果找不到，嘗試將陣列路徑轉換為字串
        if (!topic) {
            // 檢查是否有任何主題的 path 匹配
            for (const [_, t] of this.topics) {
                const tPath = this.getTopicPathKey(t);
                if (tPath === topicPath) {
                    topic = t;
                    break;
                }
            }
        }

        if (topic?.title) {
            return topic.title;
        }

        // Fallback 處理
        const fallback = options.fallback || 'original';
        switch (fallback) {
            case 'capitalize':
                return this.capitalize(this.getLastPathPart(topicPath));
            case 'original':
                return topicPath;
            case 'empty':
                return '';
            default:
                return topicPath;
        }
    }

    /**
     * 將路徑轉換為完整的顯示路徑
     * 例如：'c/basic' → 'C 語言/基礎語法'
     *
     * @param pathString - 路徑字串
     * @param separator - 分隔符，默認為 '/'
     * @returns 完整顯示路徑
     */
    getFullDisplayPath(pathString: string, separator: string = '/'): string {
        if (!pathString) return '';

        const pathParts = pathString.split('/');
        const displayParts: string[] = [];

        for (let i = 0; i < pathParts.length; i++) {
            // 建立當前的部分路徑
            const partialPath = pathParts.slice(0, i + 1).join('/');
            const currentPart = pathParts[i];

            // 嘗試找到對應的主題
            const topic = this.topics.get(partialPath) || this.topics.get(currentPart);

            if (topic && topic.title) {
                displayParts.push(topic.title);
            } else {
                // 找不到則使用原始名稱
                displayParts.push(currentPart);
            }
        }

        return displayParts.join(separator);
    }

    /**
     * 獲取語言的標籤名稱（用於顯示在卡片上）
     *
     * @param languageName - 語言名稱
     * @returns 標籤名稱（通常是大寫或簡短形式）
     */
    getLanguageTagName(languageName: string): string {
        if (!languageName) return '';

        const language = this.languages.get(languageName);

        // 優先使用 tagName
        if (language?.tagName) {
            return language.tagName;
        }

        // 其次使用 title
        if (language?.title) {
            return language.title;
        }

        // 最後使用大寫的 name
        return languageName.toUpperCase();
    }

    /**
     * 格式化模板計數顯示
     *
     * @param count - 數量
     * @returns 格式化字串，如 "5 個模板"
     */
    formatTemplateCount(count: number): string {
        if (count === 0) return '無模板';
        if (count === 1) return '1 個模板';
        return `${count} 個模板`;
    }

    /**
     * 格式化主題計數顯示
     *
     * @param count - 數量
     * @returns 格式化字串，如 "3 個主題"
     */
    formatTopicCount(count: number): string {
        if (count === 0) return '無主題';
        if (count === 1) return '1 個主題';
        return `${count} 個主題`;
    }

    /**
     * 首字母大寫
     */
    private capitalize(str: string): string {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    /**
     * 獲取路徑的最後一部分
     */
    private getLastPathPart(path: string): string {
        if (!path) return '';
        const parts = path.split('/');
        return parts[parts.length - 1] || '';
    }

    /**
     * 獲取所有語言的顯示映射
     *
     * @returns 映射表 { [name]: displayName }
     */
    getAllLanguageDisplayNames(): Record<string, string> {
        const result: Record<string, string> = {};
        for (const [name, lang] of this.languages) {
            result[name] = lang.title || this.capitalize(name);
        }
        return result;
    }

    /**
     * 獲取所有主題的顯示映射
     *
     * @returns 映射表 { [path]: displayName }
     */
    getAllTopicDisplayNames(): Record<string, string> {
        const result: Record<string, string> = {};
        for (const [path, topic] of this.topics) {
            if (topic.title) {
                result[path] = topic.title;
            }
        }
        return result;
    }

    /**
     * 批量轉換路徑為顯示名稱
     *
     * @param paths - 路徑陣列
     * @returns 顯示名稱陣列
     */
    batchGetDisplayNames(paths: string[]): string[] {
        return paths.map(path => this.getFullDisplayPath(path));
    }
}

/**
 * 單例實例（可選）
 */
let instance: DisplayNameService | null = null;

export function getDisplayNameService(
    languages?: Language[] | Map<string, Language>,
    topics?: TopicConfig[] | Map<string, TopicConfig>
): DisplayNameService {
    if (!instance || languages || topics) {
        instance = new DisplayNameService(languages, topics);
    }
    return instance;
}
