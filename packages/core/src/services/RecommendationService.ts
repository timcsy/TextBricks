/**
 * 推薦服務
 * 負責模板推薦演算法
 *
 * 注意：使用次數和最後使用時間統一從 ScopeManager 的 scope.json 讀取，
 * 不再使用模板 metadata 中的 usage 和 lastUsedAt
 */

import { IPlatform } from '../interfaces/IPlatform';
import { ExtendedTemplate } from '@textbricks/shared';
import type { ScopeManager } from '../managers/ScopeManager';

/**
 * 帶分數的模板（用於排序）
 */
interface ScoredTemplate extends ExtendedTemplate {
    score: number;
}

export interface RecommendationConfig {
    usageWeight: number;        // 使用次數權重
    recencyWeight: number;      // 最近使用權重
    recentDays: number;         // 最近天數定義（用於推薦分數計算）
    recentBoost: number;        // 最近使用加成
    monthlyDecay: number;       // 月度衰減
    weeklyThreshold: number;    // 一週內門檻（7天）
    monthlyThreshold: number;   // 一個月門檻（30天）
    weeklyBoost: number;        // 一週內加成
    dailyBoost: number;         // 當日使用加成
    popularityUsageMultiplier: number; // 人氣計算的使用次數乘數
    defaultLimit: number;       // 預設推薦數量
}

export class RecommendationService {
    private platform: IPlatform;
    private config: RecommendationConfig;
    private scopeManager?: ScopeManager;

    constructor(platform: IPlatform, config?: Partial<RecommendationConfig>, scopeManager?: ScopeManager) {
        this.platform = platform;
        this.scopeManager = scopeManager;
        this.config = {
            usageWeight: 10,
            recencyWeight: 50,
            recentDays: 7,
            recentBoost: 1.2,
            monthlyDecay: 0.8,
            weeklyThreshold: 7,
            monthlyThreshold: 30,
            weeklyBoost: 1.1,
            dailyBoost: 1.2,
            popularityUsageMultiplier: 5,
            defaultLimit: 6,
            ...config
        };
    }

    /**
     * 設置 ScopeManager（用於延遲注入，避免循環依賴）
     */
    setScopeManager(scopeManager: ScopeManager): void {
        this.scopeManager = scopeManager;
    }

    /**
     * 獲取推薦模板
     * @param templates - 模板列表
     * @param limit - 返回數量限制（使用配置的預設值）
     * @returns 推薦的模板列表
     */
    getRecommendedTemplates(
        templates: ExtendedTemplate[],
        limit?: number
    ): ExtendedTemplate[] {
        const actualLimit = limit ?? this.config.defaultLimit;

        const scored: ScoredTemplate[] = templates.map(template => ({
            ...template,
            score: this.calculateScore(template)
        }));

        return scored
            .sort((a, b) => b.score - a.score)
            .slice(0, actualLimit)
            .map(({ score, ...template }) => template as ExtendedTemplate);
    }

    /**
     * 計算模板推薦分數
     * @param template - 模板
     * @returns 推薦分數
     *
     * 注意：使用次數從 scope.json 讀取，不再使用 template.metadata.usage
     */
    private calculateScore(template: ExtendedTemplate): number {
        // 從 ScopeManager 獲取 usage 資料
        const templatePath = template.topicPath
            ? `${template.topicPath}/templates/${template.name}`
            : `templates/${template.name}`;

        const usage = this.scopeManager?.getUsageCount(templatePath) || 0;
        const lastUsedAt = this.scopeManager?.getLastUsedAt(templatePath) || null;

        let score = usage * this.config.usageWeight;

        if (lastUsedAt) {
            const daysSinceLastUse =
                (Date.now() - lastUsedAt.getTime()) / (1000 * 60 * 60 * 24);

            if (daysSinceLastUse <= this.config.recentDays) {
                // 最近使用的模板
                const recencyFactor =
                    (this.config.recentDays - daysSinceLastUse) / this.config.recentDays;
                score += this.config.recencyWeight * recencyFactor;
                score *= this.config.recentBoost; // 最近使用加成
            } else if (daysSinceLastUse <= this.config.monthlyThreshold) {
                // 一個月內使用過
                const decayFactor = (this.config.monthlyThreshold - daysSinceLastUse) / this.config.monthlyThreshold;
                score += (this.config.recencyWeight / 2) * decayFactor;
            }

            // 時間衰減：超過一個月沒用的模板
            if (daysSinceLastUse > this.config.monthlyThreshold) {
                score *= this.config.monthlyDecay;
            }
        }

        return score;
    }

    /**
     * 更新推薦配置
     * @param config - 部分配置更新
     */
    updateConfig(config: Partial<RecommendationConfig>): void {
        this.config = { ...this.config, ...config };
    }

    /**
     * 獲取當前配置
     * @returns 當前推薦配置
     */
    getConfig(): RecommendationConfig {
        return { ...this.config };
    }

    /**
     * 更新模板的 popularity 分數
     * @param template - 模板
     * @returns 更新後的 popularity 值
     *
     * 注意：使用次數從 scope.json 讀取，不再使用 template.metadata.usage
     */
    updatePopularity(template: ExtendedTemplate): number {
        if (!template.metadata) { return 0; }

        // 從 ScopeManager 獲取 usage 資料
        const templatePath = template.topicPath
            ? `${template.topicPath}/templates/${template.name}`
            : `templates/${template.name}`;

        const usage = this.scopeManager?.getUsageCount(templatePath) || 0;
        const lastUsedAt = this.scopeManager?.getLastUsedAt(templatePath) || null;

        let popularity = Math.min(
            usage * this.config.popularityUsageMultiplier,
            100
        );

        if (lastUsedAt) {
            const daysSinceLastUse =
                (Date.now() - lastUsedAt.getTime()) / (1000 * 60 * 60 * 24);

            if (daysSinceLastUse <= 1) {
                // 當日使用
                popularity = Math.min(
                    popularity * this.config.dailyBoost,
                    100
                );
            } else if (daysSinceLastUse <= this.config.weeklyThreshold) {
                // 一週內使用
                popularity = Math.min(
                    popularity * this.config.weeklyBoost,
                    100
                );
            } else if (daysSinceLastUse > this.config.monthlyThreshold) {
                // 超過一個月沒用
                popularity = Math.max(
                    popularity * this.config.monthlyDecay,
                    0
                );
            }
        }

        return Math.round(popularity);
    }
}