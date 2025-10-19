import { Template, Card, ExtendedCard } from '@textbricks/shared';
import { TextBricksEngine } from '@textbricks/core';

type ItemWithPath = Template & { topicPath?: string; usageCount?: number };

/**
 * CardRenderer - 卡片渲染器
 *
 * 負責生成各種類型卡片的 HTML：主題卡片、連結卡片、模板卡片
 */
export class CardRenderer {
    constructor(
        private readonly templateEngine: TextBricksEngine,
        private readonly getLanguageTagName: (languageName: string) => string,
        private readonly isFavorite: (itemId: string) => boolean,
        private readonly getUsageCount: (itemId: string) => number,
        private readonly isTemplateRecommended: (templatePath: string) => boolean
    ) {}

    /**
     * 檢查文檔是否存在
     * 處理文檔可能是字串或物件的情況
     */
    private hasDocumentation(documentation: any): boolean {
        if (!documentation) return false;
        if (typeof documentation === 'string') {
            return documentation.trim().length > 0;
        }
        if (typeof documentation === 'object') {
            return !!(documentation.content || documentation.path || documentation.url);
        }
        return false;
    }

    /**
     * 生成推薦/最愛區域的模板卡片 HTML
     */
    generateRecommendedTemplateCardHtml(template: ItemWithPath & { usageCount?: number }, type: 'recommended' | 'favorite'): string {
        const templatePath = template.topicPath ? `${template.topicPath}/templates/${template.name}` : template.name;
        const usageCount = template.usageCount || this.getUsageCount(templatePath);
        const hasDocumentation = this.hasDocumentation(template.documentation);
        const isFavorite = this.isFavorite(templatePath);

        return `
            <div class="template-card recommended-template ${type === 'favorite' ? 'favorite-template' : ''}"
                 data-template-path="${templatePath}"
                 data-template-code="${this.escapeHtml(template.code)}"
                 data-has-documentation="${hasDocumentation}"
                 data-card-type="template"
                 draggable="true">
                <div class="card-header">
                    <h4 class="card-title">
                        <span class="card-icon">📄</span>
                        ${this.escapeHtml(template.title)}
                    </h4>
                    <div class="card-actions template-actions">
                        <span class="recommended-star">⭐</span>
                        <button class="action-btn favorite-btn"
                                data-item-id="${templatePath}"
                                title="${isFavorite ? '取消收藏' : '加入收藏'}">
                            <span class="icon">${isFavorite ? '❤️' : '♡'}</span>
                        </button>
                        <button class="action-btn preview-btn" title="預覽程式碼">
                            <span class="icon">👁️</span>
                        </button>
                        <button class="action-btn insert-btn" title="插入到遊標位置">
                            <span class="icon">＋</span>
                        </button>
                    </div>
                </div>
                <p class="card-description">${this.escapeHtml(template.description)}</p>
                <div class="card-footer">
                    <span class="card-type-label">模板</span>
                    ${usageCount > 0 ? `<span class="usage-count" style="opacity: 0.6;">已使用 ${usageCount} 次</span>` : '<span></span>'}
                    ${template.language ? `<span class="language-tag">${this.getLanguageTagName(template.language)}</span>` : '<span></span>'}
                </div>
            </div>
        `;
    }

    /**
     * 生成主題卡片 HTML
     */
    generateTopicCardHtml(card: ExtendedCard): string {
        // Check for documentation from both the card and the managed topic
        const topicTarget = card.target || card.name;

        // 使用 TopicManager 直接查找主題配置（通過 name）
        const allTopics = this.templateEngine.getAllTopicConfigs?.() || [];
        const topicName = topicTarget.split('/').pop() || topicTarget;
        const managedTopic = allTopics.find(t => t.name === topicName);

        const hasDocumentation = this.hasDocumentation(card.documentation) ||
                                 (managedTopic && this.hasDocumentation(managedTopic.documentation));

        return `
            <div class="topic-card"
                 data-topic-path="${card.target || card.name}"
                 data-card-type="topic">
                <div class="card-header">
                    <h4 class="card-title">
                        <span class="card-icon">📁</span>
                        ${this.escapeHtml(card.title)}
                    </h4>
                    <div class="card-actions">
                        <button class="action-btn favorite-btn"
                                data-item-id="${card.target || card.name}"
                                title="${this.isFavorite(card.target || card.name) ? '取消收藏' : '加入收藏'}">
                            <span class="icon">${this.isFavorite(card.target || card.name) ? '❤️' : '♡'}</span>
                        </button>
                        ${hasDocumentation ? `
                            <button class="action-btn doc-btn"
                                    data-topic-name="${managedTopic?.name || topicName}"
                                    title="查看說明文件">
                                <span class="icon">📖</span>
                            </button>
                        ` : ''}
                        <button class="action-btn navigate-btn" title="進入主題">
                            <span class="icon">></span>
                        </button>
                    </div>
                </div>
                <p class="card-description">${this.escapeHtml(card.description)}</p>
                <div class="card-footer">
                    <span class="card-type-label">主題</span>
                    ${card.language ? `<span class="language-tag">${this.getLanguageTagName(card.language)}</span>` : ''}
                </div>
            </div>
        `;
    }

    /**
     * 生成連結卡片 HTML
     */
    generateLinkCardHtml(card: ExtendedCard): string {
        const hasDocumentation = this.hasDocumentation(card.documentation);
        const isTopicLink = card.target && !card.target.startsWith('http');

        // Check if this link points to a template
        const allTemplates = this.templateEngine.getAllTemplates();
        let targetTemplate = null;
        let isTemplateLink = false;

        if (card.target) {
            // Check if target includes 'templates/' path
            if (card.target.includes('/templates/') || card.target.includes('templates/')) {
                const templateName = card.target.split('/').pop();
                targetTemplate = allTemplates.find(t => t.name === templateName);
                isTemplateLink = !!targetTemplate;
            } else {
                // Try direct template name lookup
                targetTemplate = allTemplates.find(t => t.name === card.target);
                isTemplateLink = !!targetTemplate;
            }
        }

        if (isTemplateLink && targetTemplate) {
            // Display as template card with link context
            const templatePath = (targetTemplate as any).topicPath ? `${(targetTemplate as any).topicPath}/templates/${targetTemplate.name}` : targetTemplate.name;
            const isRecommended = this.isTemplateRecommended(templatePath);
            const templateClass = isRecommended ? 'template-card recommended-template' : 'template-card';
            const templateHasDocumentation = this.hasDocumentation(targetTemplate.documentation);
            const usageCount = this.getUsageCount(templatePath);

            return `
                <div class="${templateClass}"
                     data-template-path="${templatePath}"
                     data-template-code="${this.escapeHtml(targetTemplate.code)}"
                     data-has-documentation="${templateHasDocumentation}"
                     data-card-type="template"
                     draggable="true">
                    <div class="card-header">
                        <h4 class="card-title">
                            <span class="card-icon">🔗</span>
                            ${this.escapeHtml(card.title)}
                        </h4>
                        <div class="card-actions template-actions">
                            ${isRecommended ? '<span class="recommended-star">⭐</span>' : ''}
                            <button class="action-btn favorite-btn"
                                    data-item-id="${templatePath}"
                                    title="${this.isFavorite(templatePath) ? '取消收藏' : '加入收藏'}">
                                <span class="icon">${this.isFavorite(templatePath) ? '❤️' : '♡'}</span>
                            </button>
                            <button class="action-btn preview-btn" title="預覽程式碼">
                                <span class="icon">👁️</span>
                            </button>
                            <button class="action-btn insert-btn" title="插入到遊標位置">
                                <span class="icon">＋</span>
                            </button>
                        </div>
                    </div>
                    <p class="card-description">${this.escapeHtml(card.description || targetTemplate.description)}</p>
                    <div class="card-footer">
                        <span class="card-type-label">模板連結</span>
                        ${isRecommended && usageCount > 0 ? `<span class="usage-count" style="opacity: 0.6;">已使用 ${usageCount} 次</span>` : '<span></span>'}
                        ${targetTemplate.language ? `<span class="language-tag">${this.getLanguageTagName(targetTemplate.language)}</span>` : '<span></span>'}
                    </div>
                </div>
            `;
        }

        // Regular link display (for non-template links or when template not found)
        return `
            <div class="link-card ${isTopicLink ? 'topic-link' : 'external-link'}"
                 data-link-target="${card.target}"
                 data-card-type="link">
                <div class="card-header">
                    <h4 class="card-title">
                        <span class="card-icon">🔗</span>
                        ${this.escapeHtml(card.title)}
                    </h4>
                    <div class="card-actions">
                        <button class="action-btn favorite-btn"
                                data-item-id="${card.topicPath ? `${card.topicPath}/links/${card.name}` : card.name}"
                                title="${this.isFavorite(card.topicPath ? `${card.topicPath}/links/${card.name}` : card.name) ? '取消收藏' : '加入收藏'}">
                            <span class="icon">${this.isFavorite(card.topicPath ? `${card.topicPath}/links/${card.name}` : card.name) ? '❤️' : '♡'}</span>
                        </button>
                        ${hasDocumentation ? `
                            <button class="action-btn doc-btn"
                                    data-link-id="${card.topicPath ? `${card.topicPath}/links/${card.name}` : card.name}"
                                    title="查看說明文件">
                                <span class="icon">📖</span>
                            </button>
                        ` : ''}
                        <button class="action-btn navigate-btn" title="${isTopicLink ? '進入主題' : '開啟連結'}">
                            <span class="icon">${isTopicLink ? '>' : '↗️'}</span>
                        </button>
                    </div>
                </div>
                <p class="card-description">${this.escapeHtml(card.description)}</p>
                <div class="card-footer">
                    <span class="card-type-label">主題連結</span>
                    ${card.language ? `<span class="language-tag">${this.getLanguageTagName(card.language)}</span>` : ''}
                </div>
            </div>
        `;
    }

    /**
     * 從 ExtendedCard 生成模板卡片 HTML
     */
    generateTemplateCardFromCard(card: ExtendedCard): string {
        // Check if this template is recommended
        const cardPath = card.topicPath ? `${card.topicPath}/templates/${card.name}` : card.name;
        const isRecommended = this.isTemplateRecommended(cardPath);
        const templateClass = isRecommended ? 'template-card recommended-template' : 'template-card';
        const hasDocumentation = this.hasDocumentation(card.documentation);
        const usageCount = this.getUsageCount(cardPath);

        return `
            <div class="${templateClass}"
                 data-template-path="${cardPath}"
                 data-template-code="${this.escapeHtml(card.code || '')}"
                 data-has-documentation="${hasDocumentation}"
                 data-card-type="template"
                 draggable="true">
                <div class="card-header">
                    <h4 class="card-title">
                        <span class="card-icon">📄</span>
                        ${this.escapeHtml(card.title)}
                    </h4>
                    <div class="card-actions template-actions">
                        ${isRecommended ? '<span class="recommended-star">⭐</span>' : ''}
                        <button class="action-btn favorite-btn"
                                data-item-id="${cardPath}"
                                title="${this.isFavorite(cardPath) ? '取消收藏' : '加入收藏'}">
                            <span class="icon">${this.isFavorite(cardPath) ? '❤️' : '♡'}</span>
                        </button>
                        <button class="action-btn preview-btn" title="預覽程式碼">
                            <span class="icon">👁️</span>
                        </button>
                        <button class="action-btn insert-btn" title="插入到遊標位置">
                            <span class="icon">＋</span>
                        </button>
                    </div>
                </div>
                <p class="card-description">${this.escapeHtml(card.description)}</p>
                <div class="card-footer">
                    <span class="card-type-label">模板</span>
                    ${isRecommended && usageCount > 0 ? `<span class="usage-count" style="opacity: 0.6;">已使用 ${usageCount} 次</span>` : '<span></span>'}
                    ${card.language ? `<span class="language-tag">${this.getLanguageTagName(card.language)}</span>` : '<span></span>'}
                </div>
            </div>
        `;
    }

    /**
     * HTML 轉義輔助方法
     */
    escapeHtml(text: string | undefined | null): string {
        if (!text) {
            return '';
        }
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
}
