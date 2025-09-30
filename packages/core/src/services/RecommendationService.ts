/**
 * 推薦服務
 * 負責模板推薦演算法
 */

import { IPlatform } from '../interfaces/IPlatform';
import { ExtendedTemplate } from '@textbricks/shared';

export interface RecommendationConfig {
    usageWeight: number;        // 使用次數權重
    recencyWeight: number;      // 最近使用權重
    recentDays: number;         // 最近天數定義
    recentBoost: number;        // 最近使用加成
    monthlyDecay: number;       // 月度衰減
}

export class RecommendationService {
    private platform: IPlatform;
    private config: RecommendationConfig;

    constructor(platform: IPlatform, config?: Partial<RecommendationConfig>) {
        this.platform = platform;
        this.config = {
            usageWeight: 10,
            recencyWeight: 50,
            recentDays: 7,
            recentBoost: 1.2,
            monthlyDecay: 0.8,
            ...config
        };
    }

    /**
     * 獲取推薦模板
     * @param templates - 模板列表
     * @param limit - 返回數量限制
     * @returns 推薦的模板列表
     */
    getRecommendedTemplates(
        templates: ExtendedTemplate[],
        limit: number = 6
    ): ExtendedTemplate[] {
        const scored = templates.map(template => ({
            ...template,
            score: this.calculateScore(template)
        }));

        return scored
            .sort((a, b) => (b as any).score - (a as any).score)
            .slice(0, limit);
    }

    /**
     * 計算模板推薦分數
     * @param template - 模板
     * @returns 推薦分數
     */
    private calculateScore(template: ExtendedTemplate): number {
        const usage = template.metadata?.usage || 0;
        const lastUsedAt = template.metadata?.lastUsedAt
            ? new Date(template.metadata.lastUsedAt)
            : null;

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
            } else if (daysSinceLastUse <= 30) {
                // 一個月內使用過
                const decayFactor = (30 - daysSinceLastUse) / 30;
                score += (this.config.recencyWeight / 2) * decayFactor;
            }

            // 時間衰減：超過一個月沒用的模板
            if (daysSinceLastUse > 30) {
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
}