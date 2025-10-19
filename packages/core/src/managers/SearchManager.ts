import { IPlatform } from '../interfaces/IPlatform';
import { ExtendedTemplate } from '@textbricks/shared';
import type { ScopeManager } from './ScopeManager';

/**
 * 搜尋過濾器介面
 */
export interface SearchFilters {
    language?: string;
    topic?: string;
    tags?: string[];
    dateRange?: {
        start?: Date;
        end?: Date;
    };
    usageRange?: {
        min?: number;
        max?: number;
    };
    popularityRange?: {
        min?: number;
        max?: number;
    };
}

export interface SearchOptions {
    sortBy?: 'relevance' | 'popularity' | 'usage' | 'recent' | 'alphabetical';
    sortOrder?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
}

export interface SearchResult {
    templates: ExtendedTemplate[];
    totalCount: number;
    hasMore: boolean;
}

/**
 * 搜尋管理器 - 平台無關的搜尋邏輯
 */
export class SearchManager {
    constructor(
        private platform: IPlatform,
        private scopeManager?: ScopeManager
    ) {}

    /**
     * 搜尋模板
     */
    async searchTemplates(
        templates: ExtendedTemplate[],
        query: string,
        filters?: SearchFilters,
        options: SearchOptions = {}
    ): Promise<SearchResult> {
        try {
            const {
                sortBy = 'relevance',
                sortOrder = 'desc',
                limit = 50,
                offset = 0
            } = options;

            let result = [...templates];

            // 應用篩選器
            if (filters) {
                result = this.applyFilters(result, filters);
            }

            // 應用搜尋查詢
            if (query && query.trim()) {
                result = this.performTextSearch(result, query.trim());
            }

            // 排序
            result = this.sortTemplates(result, sortBy, sortOrder);

            // 分頁
            const totalCount = result.length;
            const paginatedTemplates = result.slice(offset, offset + limit);
            const hasMore = offset + limit < totalCount;

            return {
                templates: paginatedTemplates,
                totalCount,
                hasMore
            };
        } catch (error) {
            this.platform.logError(error as Error, 'Search templates');
            throw error;
        }
    }

    /**
     * 根據主題搜尋模板
     */
    async searchByTopic(
        templates: ExtendedTemplate[],
        topic: string,
        options?: SearchOptions
    ): Promise<SearchResult> {
        return this.searchTemplates(templates, '', { topic }, options);
    }

    /**
     * 根據語言搜尋模板
     */
    async searchByLanguage(
        templates: ExtendedTemplate[],
        languageId: string,
        options?: SearchOptions
    ): Promise<SearchResult> {
        return this.searchTemplates(templates, '', { language: languageId }, options);
    }

    /**
     * 根據標籤搜尋模板
     */
    async searchByTags(
        templates: ExtendedTemplate[],
        tags: string[],
        options?: SearchOptions
    ): Promise<SearchResult> {
        return this.searchTemplates(templates, '', { tags }, options);
    }

    /**
     * 獲取熱門模板
     */
    async getPopularTemplates(
        templates: ExtendedTemplate[],
        limit: number = 10
    ): Promise<ExtendedTemplate[]> {
        const result = await this.searchTemplates(templates, '', {}, {
            sortBy: 'popularity',
            limit
        });
        return result.templates;
    }

    /**
     * 獲取最近使用的模板
     */
    async getRecentTemplates(
        templates: ExtendedTemplate[],
        limit: number = 10
    ): Promise<ExtendedTemplate[]> {
        const result = await this.searchTemplates(templates, '', {}, {
            sortBy: 'recent',
            limit
        });
        return result.templates;
    }

    /**
     * 獲取搜尋建議
     */
    async getSearchSuggestions(
        templates: ExtendedTemplate[],
        partialQuery: string,
        limit: number = 5
    ): Promise<string[]> {
        try {
            const suggestions = new Set<string>();
            const query = partialQuery.toLowerCase().trim();

            for (const template of templates) {
                // 從標題中提取建議
                if (template.title.toLowerCase().includes(query)) {
                    suggestions.add(template.title);
                }

                // 從描述中提取建議
                if (template.description?.toLowerCase().includes(query)) {
                    suggestions.add(template.description);
                }

                // 從標籤中提取建議
                if (template.metadata?.tags) {
                    for (const tag of template.metadata.tags) {
                        if (tag.toLowerCase().includes(query)) {
                            suggestions.add(tag);
                        }
                    }
                }

                if (suggestions.size >= limit) {
                    break;
                }
            }

            return Array.from(suggestions).slice(0, limit);
        } catch (error) {
            this.platform.logError(error as Error, 'Get search suggestions');
            throw error;
        }
    }

    /**
     * 應用搜尋篩選器
     */
    private applyFilters(templates: ExtendedTemplate[], filters: SearchFilters): ExtendedTemplate[] {
        let result = templates;

        if (filters.language) {
            result = result.filter(t => t.language === filters.language);
        }

        if (filters.topic) {
            // Filter by topicPath (supports nested paths like "c/basic")
            result = result.filter(t => {
                const topicPath = t.topicPath;
                return topicPath === filters.topic ||
                       topicPath?.startsWith(filters.topic + '/');
            });
        }

        if (filters.tags && filters.tags.length > 0) {
            result = result.filter(t =>
                t.metadata?.tags && filters.tags!.some(tag => t.metadata?.tags!.includes(tag))
            );
        }

        if (filters.dateRange) {
            const { start, end } = filters.dateRange;
            result = result.filter(t => {
                if (!t.metadata?.createdAt) { return true; }
                const createdAt = new Date(t.metadata.createdAt);

                if (start && createdAt < start) { return false; }
                if (end && createdAt > end) { return false; }

                return true;
            });
        }

        if (filters.usageRange) {
            const { min, max } = filters.usageRange;
            result = result.filter(t => {
                // 從 ScopeManager 讀取使用次數
                const templatePath = t.topicPath ? `${t.topicPath}/templates/${t.name}` : `templates/${t.name}`;
                const usage = this.scopeManager?.getUsageCount(templatePath) || 0;

                if (min !== undefined && usage < min) { return false; }
                if (max !== undefined && usage > max) { return false; }

                return true;
            });
        }

        if (filters.popularityRange) {
            const { min, max } = filters.popularityRange;
            result = result.filter(t => {
                const popularity = t.metadata?.popularity || 0;

                if (min !== undefined && popularity < min) { return false; }
                if (max !== undefined && popularity > max) { return false; }

                return true;
            });
        }

        return result;
    }

    /**
     * 執行文字搜尋
     */
    private performTextSearch(templates: ExtendedTemplate[], query: string): ExtendedTemplate[] {
        const queryLower = query.toLowerCase();
        const words = queryLower.split(/\s+/).filter(word => word.length > 0);

        return templates
            .map(template => ({
                template,
                score: this.calculateRelevanceScore(template, query, words)
            }))
            .filter(({ score }) => score > 0)
            .sort((a, b) => b.score - a.score)
            .map(({ template }) => template);
    }

    /**
     * 計算相關性分數
     */
    private calculateRelevanceScore(template: ExtendedTemplate, query: string, words: string[]): number {
        let score = 0;
        const queryLower = query.toLowerCase();

        // 標題匹配（權重最高）
        const titleLower = template.title.toLowerCase();
        if (titleLower.includes(queryLower)) {
            score += 100;
        }

        words.forEach(word => {
            if (titleLower.includes(word)) {
                score += 50;
            }
        });

        // 描述匹配
        if (template.description) {
            const descLower = template.description.toLowerCase();
            if (descLower.includes(queryLower)) {
                score += 30;
            }

            words.forEach(word => {
                if (descLower.includes(word)) {
                    score += 15;
                }
            });
        }

        // 標籤匹配
        if (template.metadata?.tags) {
            template.metadata.tags.forEach((tag: string) => {
                const tagLower = tag.toLowerCase();
                if (tagLower.includes(queryLower)) {
                    score += 40;
                }

                words.forEach(word => {
                    if (tagLower.includes(word)) {
                        score += 20;
                    }
                });
            });
        }

        // 程式碼匹配（權重較低）
        const codeLower = template.code.toLowerCase();
        if (codeLower.includes(queryLower)) {
            score += 10;
        }

        words.forEach(word => {
            if (codeLower.includes(word)) {
                score += 5;
            }
        });

        return score;
    }

    /**
     * 排序模板
     */
    private sortTemplates(
        templates: ExtendedTemplate[],
        sortBy: SearchOptions['sortBy'],
        sortOrder: SearchOptions['sortOrder']
    ): ExtendedTemplate[] {
        const sorted = [...templates];

        switch (sortBy) {
            case 'popularity':
                sorted.sort((a, b) => {
                    const aScore = a.metadata?.popularity || 0;
                    const bScore = b.metadata?.popularity || 0;
                    return bScore - aScore;
                });
                break;

            case 'usage':
                sorted.sort((a, b) => {
                    // 從 ScopeManager 讀取使用次數
                    const aPath = a.topicPath ? `${a.topicPath}/templates/${a.name}` : `templates/${a.name}`;
                    const bPath = b.topicPath ? `${b.topicPath}/templates/${b.name}` : `templates/${b.name}`;
                    const aUsage = this.scopeManager?.getUsageCount(aPath) || 0;
                    const bUsage = this.scopeManager?.getUsageCount(bPath) || 0;
                    return bUsage - aUsage;
                });
                break;

            case 'recent':
                sorted.sort((a, b) => {
                    // 從 ScopeManager 讀取最後使用時間
                    const aPath = a.topicPath ? `${a.topicPath}/templates/${a.name}` : `templates/${a.name}`;
                    const bPath = b.topicPath ? `${b.topicPath}/templates/${b.name}` : `templates/${b.name}`;
                    const aDate = this.scopeManager?.getLastUsedAt(aPath) || new Date(0);
                    const bDate = this.scopeManager?.getLastUsedAt(bPath) || new Date(0);
                    return bDate.getTime() - aDate.getTime();
                });
                break;

            case 'alphabetical':
                sorted.sort((a, b) => a.title.localeCompare(b.title));
                break;

            case 'relevance':
            default:
                // 已經在搜尋時排序
                break;
        }

        return sortOrder === 'asc' ? sorted.reverse() : sorted;
    }
}