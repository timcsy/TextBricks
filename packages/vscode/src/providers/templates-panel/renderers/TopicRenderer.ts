import { TextBricksEngine } from '@textbricks/core';
import { ExtendedCard } from '@textbricks/shared';
import { VSCodePlatform } from '../../../adapters/vscode/VSCodePlatform';

/**
 * TopicRenderer - 主題視圖渲染器
 *
 * 負責生成主題列表和特定主題的 HTML
 */
export class TopicRenderer {
    constructor(
        private readonly templateEngine: TextBricksEngine,
        private readonly platform: VSCodePlatform,
        private readonly getCurrentTopicPath: () => string,
        private readonly isFavorite: (itemId: string) => boolean,
        private readonly generateTopicCardHtml: (card: ExtendedCard) => string,
        private readonly generateLinkCardHtml: (card: ExtendedCard) => string,
        private readonly generateTemplateCardFromCard: (card: ExtendedCard) => string,
        private readonly escapeHtml: (text: string | undefined | null) => string
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
            // Check if content exists and is non-empty
            if (documentation.content && typeof documentation.content === 'string') {
                return documentation.content.trim().length > 0;
            }
            // Also check for path or url
            return !!(documentation.path || documentation.url);
        }
        return false;
    }

    /**
     * 生成主題列表 HTML
     */
    generateTopicsHtml(topics: string[]): string {
        const currentTopicPath = this.getCurrentTopicPath();

        // 獲取所有卡片
        const allCards = this.templateEngine.getAllCards();
        this.platform.logInfo(`getAllCards() returned ${allCards.length} cards, currentTopicPath: ${currentTopicPath}`, 'TopicRenderer');

        // If we're in a specific topic, filter cards for that topic
        if (currentTopicPath) {
            return this.generateSpecificTopicHtml(allCards, currentTopicPath);
        }

        // Otherwise show top-level topics (原有的邏輯)
        const rootTopics = this.templateEngine.getRootTopics?.() || [];
        const rootTopicNames = new Set(rootTopics.map(t => t.name));

        this.platform.logInfo(`Root topics: ${Array.from(rootTopicNames).join(', ')}`, 'TopicRenderer');

        // 只保留屬於頂層主題的卡片
        const topLevelCards = allCards.filter(card => card.topicPath && rootTopicNames.has(card.topicPath));

        // 按主題分組
        const cardsByMainTopic = new Map<string, ExtendedCard[]>();
        topLevelCards.forEach(card => {
            const mainTopic = card.topicPath || '';
            if (!cardsByMainTopic.has(mainTopic)) {
                cardsByMainTopic.set(mainTopic, []);
            }
            cardsByMainTopic.get(mainTopic)!.push(card);
        });

        this.platform.logInfo(`Topics: ${Array.from(cardsByMainTopic.keys()).join(', ')}`, 'TopicRenderer');

        // 為每個頂層主題生成 HTML
        return Array.from(cardsByMainTopic.entries()).map(([mainTopicName, allCardsInTopic]) => {
            if (allCardsInTopic.length === 0) {
                return ''; // Don't show empty topics
            }

            // 所有卡片都是當前層級的
            const currentLevelCards = allCardsInTopic;

            // 將當前層級的卡片依類型分組
            const topicCards = currentLevelCards.filter(card => card.type === 'topic');
            const templateCards = currentLevelCards.filter(card => card.type === 'template');
            const linkCards = currentLevelCards.filter(card => card.type === 'link');

            this.platform.logInfo(`Topic "${mainTopicName}": currentLevel=${currentLevelCards.length}, topics=${topicCards.length}, templates=${templateCards.length}, links=${linkCards.length}`, 'TopicRenderer');

            const cardsHtml = [
                ...topicCards.map(card => this.generateTopicCardHtml(card)),
                ...templateCards.map(card => this.generateTemplateCardFromCard(card)),
                ...linkCards.map(card => this.generateLinkCardHtml(card))
            ].join('');

            // 獲取主題物件資訊
            const topicName = mainTopicName.split('/').pop() || mainTopicName;
            const allTopicConfigs = this.templateEngine.getAllTopicConfigs();
            const managedTopic = allTopicConfigs.find(t => t.name === topicName);

            // 計算主題下的卡片和子主題內容總數
            const currentLevelCount = currentLevelCards.length;
            const subtopicCounts = this.getSubtopicCounts(mainTopicName, allCardsInTopic);

            let topicDescription = managedTopic?.description || `${mainTopicName} 相關內容`;

            if (managedTopic && managedTopic.description) {
                topicDescription = managedTopic.description;
            }

            // Check if topic has documentation
            const hasDocumentation = managedTopic && this.hasDocumentation(managedTopic.documentation);

            // Check if main topic has navigable content
            const hasSubTopics = topicCards.length > 0;
            const hasTopicLinks = linkCards.filter(card =>
                card.target && !card.target.startsWith('http')
            ).length > 0;
            const hasNavigableContent = hasSubTopics || hasTopicLinks;

            const topicColor = managedTopic?.display?.color;
            const topicColorStyles = topicColor ?
                `data-topic-color style="--topic-color: ${topicColor}; --topic-color-light: ${topicColor}20; --topic-color-medium: ${topicColor}80;"` : '';

            // 計算不同類型的數量和子主題統計
            const countText = this.generateMainTopicCountText(topicCards.length, templateCards.length, linkCards.length, subtopicCounts);

            return `
                <div class="topic-group main-topic" data-topic="${mainTopicName}" ${topicColorStyles}>
                    <div class="topic-header">
                        <div class="topic-title-row">
                            <h3 class="topic-title">
                                <span class="topic-toggle"></span>
                                ${managedTopic?.display?.icon ? `<span class="topic-icon">${managedTopic.display.icon}</span>` : ''}
                                ${managedTopic?.title || mainTopicName}
                            </h3>
                            <div class="topic-actions">
                                <button class="action-btn favorite-btn"
                                        data-item-id="${mainTopicName}"
                                        title="${this.isFavorite(mainTopicName) ? '取消收藏' : '加入收藏'}">
                                    <span class="icon">${this.isFavorite(mainTopicName) ? '❤️' : '♡'}</span>
                                </button>
                                ${hasDocumentation ? `
                                    <button class="topic-doc-btn"
                                            data-topic-name="${topicName}"
                                            title="查看 ${mainTopicName} 的詳細說明文件">
                                        📖
                                    </button>
                                ` : ''}
                                ${hasNavigableContent ? `
                                    <button class="action-btn navigate-btn topic-navigate-btn"
                                            data-topic-path="${mainTopicName}"
                                            title="進入 ${mainTopicName} 主題">
                                        <span class="icon">></span>
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                        <p class="topic-description">${this.escapeHtml(topicDescription)}</p>
                        <p class="topic-count">${countText}</p>
                    </div>
                    <div class="templates-grid">
                        ${cardsHtml}
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * 生成特定主題的 HTML
     */
    generateSpecificTopicHtml(allCards: ExtendedCard[], topicPath: string): string {
        // Get all cards that belong to the current topic path
        const currentPathCards = allCards.filter(card => card.topicPath === topicPath);

        // Separate current level cards by type
        const currentTopicCards = currentPathCards.filter(card => card.type === 'topic');
        const currentTemplateCards = currentPathCards.filter(card => card.type === 'template');
        const currentLinkCards = currentPathCards.filter(card => card.type === 'link');

        let html = '';

        // 如果有子主題，將它們當作頂層主題顯示（展開顯示子主題的內容）
        if (currentTopicCards.length > 0) {
            html = currentTopicCards.map(topicCard => {
                // 獲取子主題的所有卡片
                const subtopicCards = allCards.filter(card => card.topicPath === topicCard.target);
                const subtopicTemplates = subtopicCards.filter(card => card.type === 'template');
                const subtopicLinks = subtopicCards.filter(card => card.type === 'link');
                const subtopicSubtopics = subtopicCards.filter(card => card.type === 'topic');

                const cardsHtml = [
                    ...subtopicSubtopics.map(card => this.generateTopicCardHtml(card)),
                    ...subtopicTemplates.map(card => this.generateTemplateCardFromCard(card)),
                    ...subtopicLinks.map(card => this.generateLinkCardHtml(card))
                ].join('');

                // 獲取子主題資訊
                const allTopics = this.templateEngine.getAllTopicConfigs?.() || [];
                // Extract topic name from target path (e.g., "c/00-beginner" -> "00-beginner")
                const topicName = topicCard.target?.split('/').pop() || topicCard.target;
                const managedTopic = allTopics.find(t => t.name === topicName);
                const topicDisplayName = topicCard.title;
                const topicDescription = topicCard.description;

                const topicCount = subtopicSubtopics.length;
                const templateCount = subtopicTemplates.length;
                const linkCount = subtopicLinks.length;
                const countText = this.generateCardCountText(topicCount, templateCount, linkCount);

                const hasDocumentation = managedTopic && this.hasDocumentation(managedTopic.documentation);
                const hasNavigableContent = subtopicSubtopics.length > 0 || subtopicLinks.some(card => card.target && !card.target.startsWith('http'));

                return `
                    <div class="topic-group main-topic" data-topic="${topicCard.target}">
                        <div class="topic-header">
                            <div class="topic-title-row">
                                <h3 class="topic-title">
                                    <span class="topic-toggle"></span>
                                    ${managedTopic?.display?.icon ? `<span class="topic-icon">${managedTopic.display.icon}</span>` : '<span class="topic-icon">📁</span>'}
                                    ${topicDisplayName}
                                </h3>
                                <div class="topic-actions">
                                    <button class="action-btn favorite-btn"
                                            data-item-id="${topicCard.target}"
                                            title="${this.isFavorite(topicCard.target || '') ? '取消收藏' : '加入收藏'}">
                                        <span class="icon">${this.isFavorite(topicCard.target || '') ? '❤️' : '♡'}</span>
                                    </button>
                                    ${hasDocumentation ? `
                                        <button class="topic-doc-btn"
                                                data-topic-name="${managedTopic?.name || topicCard.target}"
                                                title="查看詳細說明文件">
                                            📖
                                        </button>
                                    ` : ''}
                                    ${hasNavigableContent ? `
                                        <button class="action-btn navigate-btn topic-navigate-btn"
                                                data-topic-path="${topicCard.target}"
                                                title="進入 ${topicDisplayName} 主題">
                                            <span class="icon">></span>
                                        </button>
                                    ` : ''}
                                </div>
                            </div>
                            <p class="topic-description">${this.escapeHtml(topicDescription)}</p>
                            <p class="topic-count">${countText}</p>
                        </div>
                        <div class="templates-grid">
                            ${cardsHtml || '<p class="no-content">此主題暫無內容</p>'}
                        </div>
                    </div>
                `;
            }).join('');
        }

        // 如果當前層級有剩餘的模板或連結（不屬於子主題的），集中顯示
        if (currentTemplateCards.length > 0 || currentLinkCards.length > 0) {
            const allTopics = this.templateEngine.getAllTopicConfigs?.() || [];
            const topicName = topicPath.split('/').pop() || topicPath;
            const managedTopic = allTopics.find(t => t.name === topicName);
            const topicDisplayName = managedTopic?.title || topicPath;

            const templatesHtml = currentTemplateCards.map(card => this.generateTemplateCardFromCard(card)).join('');
            const linksHtml = currentLinkCards.map(card => this.generateLinkCardHtml(card)).join('');

            const templateCount = currentTemplateCards.length;
            const linkCount = currentLinkCards.length;
            const countText = this.generateCardCountText(0, templateCount, linkCount);

            const hasDocumentation = managedTopic && this.hasDocumentation(managedTopic.documentation);

            html += `
                <div class="topic-group main-topic" data-topic="${topicPath}">
                    <div class="topic-header">
                        <div class="topic-title-row">
                            <h3 class="topic-title">
                                <span class="topic-toggle"></span>
                                ${managedTopic?.display?.icon ? `<span class="topic-icon">${managedTopic.display.icon}</span>` : '<span class="topic-icon">📁</span>'}
                                ${topicDisplayName}
                            </h3>
                            <div class="topic-actions">
                                <button class="action-btn favorite-btn"
                                        data-item-id="${topicPath}"
                                        title="${this.isFavorite(topicPath) ? '取消收藏' : '加入收藏'}">
                                    <span class="icon">${this.isFavorite(topicPath) ? '❤️' : '♡'}</span>
                                </button>
                                ${hasDocumentation ? `
                                    <button class="topic-doc-btn"
                                            data-topic-name="${managedTopic?.name || topicPath}"
                                            title="查看詳細說明文件">
                                        📖
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                        <p class="topic-description">${managedTopic?.description || `${topicDisplayName} 的其他內容`}</p>
                        <p class="topic-count">${countText}</p>
                    </div>
                    <div class="templates-grid">
                        ${templatesHtml}
                        ${linksHtml}
                    </div>
                </div>
            `;
        }

        return html || '<div class="topic-group"><p>沒有找到相關內容</p></div>';
    }

    /**
     * 生成卡片計數文字
     */
    private generateCardCountText(topicCount: number, templateCount: number, linkCount: number): string {
        const counts = [];
        if (topicCount > 0) {counts.push(`${topicCount} 個主題`);}
        if (templateCount > 0) {counts.push(`${templateCount} 個模板`);}
        if (linkCount > 0) {counts.push(`${linkCount} 個連結`);}
        return counts.join('、');
    }

    /**
     * 獲取子主題計數
     */
    private getSubtopicCounts(mainTopic: string, allCards: ExtendedCard[]): {[key: string]: number} {
        const subtopicCounts: {[key: string]: number} = {};

        allCards.forEach(card => {
            if (card.topicPath && card.topicPath.startsWith(mainTopic + '/')) {
                const subtopic = card.topicPath.split('/')[1];
                if (subtopic) {
                    subtopicCounts[subtopic] = (subtopicCounts[subtopic] || 0) + 1;
                }
            }
        });

        return subtopicCounts;
    }

    /**
     * 生成主主題計數文字
     */
    private generateMainTopicCountText(topicCount: number, templateCount: number, linkCount: number, subtopicCounts: {[key: string]: number}): string {
        const counts = [];
        if (topicCount > 0) {counts.push(`${topicCount} 個主題`);}
        if (templateCount > 0) {counts.push(`${templateCount} 個模板`);}
        if (linkCount > 0) {counts.push(`${linkCount} 個連結`);}

        const subtopicTemplateCount = Object.values(subtopicCounts).reduce((sum, count) => sum + count, 0);
        if (subtopicTemplateCount > 0) {
            counts.push(`子主題 ${subtopicTemplateCount} 個項目`);
        }

        return counts.join('、') || '無內容';
    }
}
