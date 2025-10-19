import { Template, Card, ExtendedCard } from '@textbricks/shared';

type ItemWithPath = Template & { topicPath?: string; usageCount?: number };
type DisplayItem = ItemWithPath | Card | ExtendedCard;

/**
 * RecommendationRenderer - 推薦和最愛區域渲染器
 *
 * 負責生成推薦模板和最愛項目的 HTML
 */
export class RecommendationRenderer {
    constructor(
        private readonly generateTemplateCardHtml: (template: ItemWithPath & { usageCount?: number }, type: 'recommended' | 'favorite') => string,
        private readonly generateTopicCardHtml: (card: Card) => string,
        private readonly generateLinkCardHtml: (card: Card) => string
    ) {}

    /**
     * 生成推薦模板區域 HTML
     */
    generateRecommendedTemplatesHtml(
        recommendedTemplates: Array<ItemWithPath & { usageCount?: number }>,
        favoriteItems: DisplayItem[]
    ): string {
        // 始終顯示推薦和最愛區域（即使是空的）
        // 這樣用戶可以看到這個功能的存在

        const recommendedHtml = recommendedTemplates
            .map(template => this.generateTemplateCardHtml(template, 'recommended'))
            .join('');

        const favoriteHtml = favoriteItems
            .map(item => {
                // Check if item has type property (it's a card) or not (it's a template)
                if (item.type === 'topic') {
                    return this.generateTopicCardHtml(item as Card);
                } else if (item.type === 'link') {
                    return this.generateLinkCardHtml(item as Card);
                } else {
                    // It's a template
                    return this.generateTemplateCardHtml(item as ItemWithPath, 'favorite');
                }
            })
            .join('');

        return `
            <div class="topic-group recommended-topic" data-topic="recommended">
                <div class="tab-navigation">
                    <button class="tab-btn active" data-tab="recommended">
                        <span class="tab-icon">⭐</span> 推薦
                    </button>
                    <button class="tab-btn" data-tab="favorites">
                        <span class="tab-icon">❤️</span> 最愛
                    </button>
                </div>

                <div class="recommended-templates-container">
                    <div class="tab-content active" data-tab-content="recommended">
                        ${recommendedHtml || '<div class="empty-state">沒有推薦的模板</div>'}
                    </div>
                    <div class="tab-content" data-tab-content="favorites">
                        ${favoriteHtml || '<div class="empty-state">還沒有收藏任何模板</div>'}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 生成更新後的最愛內容 HTML（用於動態更新）
     */
    generateUpdatedFavoritesContent(favoriteItems: DisplayItem[]): string {
        const favoriteHtml = favoriteItems
            .map(item => {
                if (item.type === 'topic') {
                    return this.generateTopicCardHtml(item as Card);
                } else if (item.type === 'link') {
                    return this.generateLinkCardHtml(item as Card);
                } else {
                    return this.generateTemplateCardHtml(item as ItemWithPath, 'favorite');
                }
            })
            .join('');

        return favoriteHtml || '<div class="empty-state">還沒有收藏任何模板</div>';
    }
}
