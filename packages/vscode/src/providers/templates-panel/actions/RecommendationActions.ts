import { Template } from '@textbricks/shared';

type ItemWithPath = Template & { topicPath?: string };

interface PartialScopeConfig {
    usage?: Record<string, number>;
}

/**
 * RecommendationActions - 推薦系統操作
 *
 * 負責處理基於使用頻率的模板推薦
 */
export class RecommendationActions {
    constructor(
        private readonly scopeConfig: () => PartialScopeConfig | null
    ) {}

    /**
     * 獲取使用次數
     */
    getUsageCount(itemId: string): number {
        const config = this.scopeConfig();
        return config?.usage?.[itemId] || 0;
    }

    /**
     * 根據使用頻率獲取推薦項目
     */
    getRecommendedByUsage(items: ItemWithPath[], limit: number = 6): Array<ItemWithPath & { usageCount: number }> {
        return items
            .map(item => {
                const itemPath = item.topicPath ? `${item.topicPath}/templates/${item.name}` : item.name;
                return {
                    ...item,
                    usageCount: this.getUsageCount(itemPath)
                };
            })
            .filter(item => item.usageCount > 0)
            .sort((a, b) => b.usageCount - a.usageCount)
            .slice(0, limit);
    }

    /**
     * 檢查模板是否為推薦項目
     */
    isTemplateRecommended(templatePath: string): boolean {
        const usage = this.getUsageCount(templatePath);
        return usage > 0;
    }
}
