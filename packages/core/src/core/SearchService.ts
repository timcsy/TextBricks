/**
 * 平台無關的搜尋服務
 * 提供模板搜尋、過濾、排序等功能
 */

import { ExtendedTemplate } from '@textbricks/shared';
import { TextBricksEngine } from './TextBricksEngine';

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

export class SearchService {
    constructor(private readonly engine: TextBricksEngine) {}

    /**
     * 搜尋模板
     */
    async searchTemplates(
        query: string,
        filters?: SearchFilters,
        options: SearchOptions = {}
    ): Promise<SearchResult> {
        const {
            sortBy = 'relevance',
            sortOrder = 'desc',
            limit = 50,
            offset = 0
        } = options;

        let templates = this.engine.getAllTemplates();

        // 應用篩選器
        if (filters) {
            templates = this.applyFilters(templates, filters);
        }

        // 應用搜尋查詢
        if (query && query.trim()) {
            templates = this.performTextSearch(templates, query.trim());
        }

        // 排序
        templates = this.sortTemplates(templates, sortBy, sortOrder);

        // 分頁
        const totalCount = templates.length;
        const paginatedTemplates = templates.slice(offset, offset + limit);
        const hasMore = offset + limit < totalCount;

        return {
            templates: paginatedTemplates,
            totalCount,
            hasMore
        };
    }

    /**
     * 根據主題搜尋模板
     */
    async searchByTopic(topic: string, options?: SearchOptions): Promise<SearchResult> {
        return this.searchTemplates('', { topic: topic }, options);
    }

    /**
     * 根據語言搜尋模板
     */
    async searchByLanguage(languageId: string, options?: SearchOptions): Promise<SearchResult> {
        return this.searchTemplates('', { language: languageId }, options);
    }

    /**
     * 根據標籤搜尋模板
     */
    async searchByTags(tags: string[], options?: SearchOptions): Promise<SearchResult> {
        return this.searchTemplates('', { tags }, options);
    }

    /**
     * 獲取熱門模板
     */
    async getPopularTemplates(limit: number = 10): Promise<ExtendedTemplate[]> {
        const result = await this.searchTemplates('', {}, { 
            sortBy: 'popularity', 
            limit 
        });
        return result.templates;
    }

    /**
     * 獲取最近使用的模板
     */
    async getRecentTemplates(limit: number = 10): Promise<ExtendedTemplate[]> {
        const result = await this.searchTemplates('', {}, { 
            sortBy: 'recent', 
            limit 
        });
        return result.templates;
    }

    /**
     * 獲取推薦模板
     */
    async getRecommendedTemplates(limit: number = 6): Promise<ExtendedTemplate[]> {
        return this.engine.getRecommendedTemplates(limit);
    }

    /**
     * 獲取搜尋建議
     */
    async getSearchSuggestions(partialQuery: string, limit: number = 5): Promise<string[]> {
        const templates = this.engine.getAllTemplates();
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
    }

    // ==================== 私有方法 ====================

    private applyFilters(templates: ExtendedTemplate[], filters: SearchFilters): ExtendedTemplate[] {
        let result = templates;

        if (filters.language) {
            result = result.filter(t => t.language === filters.language);
        }

        if (filters.topic) {
            // Filter by topicPath (supports nested paths like "c/basic")
            result = result.filter(t => {
                return t.topicPath === filters.topic ||
                       t.topicPath?.startsWith(filters.topic + '/');
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
                const usage = t.metadata?.usage || 0;

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
                    const aUsage = a.metadata?.usage || 0;
                    const bUsage = b.metadata?.usage || 0;
                    return bUsage - aUsage;
                });
                break;

            case 'recent':
                sorted.sort((a, b) => {
                    const aDate = a.metadata?.lastUsedAt ? new Date(a.metadata.lastUsedAt) : new Date(0);
                    const bDate = b.metadata?.lastUsedAt ? new Date(b.metadata.lastUsedAt) : new Date(0);
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