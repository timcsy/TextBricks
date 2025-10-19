import { TextBricksEngine } from '@textbricks/core';
import { ExtendedCard } from '@textbricks/shared';

/**
 * NavigationRenderer - 導航元素渲染器
 *
 * 負責生成麵包屑導航和前後導航按鈕的 HTML
 */
export class NavigationRenderer {
    constructor(
        private readonly templateEngine: TextBricksEngine,
        private readonly getCurrentTopicPath: () => string,
        private readonly getBrowsingHistory: () => string[],
        private readonly getHistoryIndex: () => number
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
     * 生成麵包屑導航 HTML
     */
    generateBreadcrumbHtml(): string {
        const currentTopicPath = this.getCurrentTopicPath();

        // Start with the root "local" item (clickable to go home)
        let breadcrumbHtml = currentTopicPath
            ? '<span class="breadcrumb-item clickable" data-navigate-path="">local</span>'
            : '<span class="breadcrumb-item active">local</span>';

        // If we have a current topic path, build the breadcrumb trail
        if (currentTopicPath) {
            const pathParts = currentTopicPath.split('/');
            const allTopics = this.templateEngine.getAllTopicConfigs?.() || [];

            // Build breadcrumb for each path segment
            pathParts.forEach((segment, index) => {
                const isLast = index === pathParts.length - 1;
                const currentPath = pathParts.slice(0, index + 1).join('/');

                // Find the topic config for this segment
                const topic = allTopics.find(t => t.name === segment);
                const title = topic?.title || segment;

                breadcrumbHtml += ` <span class="breadcrumb-separator">></span> `;

                if (isLast) {
                    breadcrumbHtml += `<span class="breadcrumb-item active" data-current-topic-path="${currentPath}">${title}</span>`;

                    // Add documentation button if the current topic has documentation
                    if (topic && this.hasDocumentation(topic.documentation)) {
                        breadcrumbHtml += `<button class="breadcrumb-doc-btn topic-doc-btn"
                                                    data-topic-name="${topic.name}"
                                                    title="查看 ${title} 的詳細說明文件">
                                                📖
                                            </button>`;
                    }
                } else {
                    breadcrumbHtml += `<span class="breadcrumb-item clickable" data-navigate-path="${currentPath}">${title}</span>`;
                }
            });
        }

        return breadcrumbHtml;
    }

    /**
     * 生成展開/收合控制按鈕 HTML
     */
    generateCollapseControlsHtml(): string {
        return `
            <div class="collapse-controls">
                <button class="collapse-control-btn" data-action="expandAll" title="展開所有主題">
                    全部展開
                </button>
                <button class="collapse-control-btn" data-action="collapseAll" title="收合所有主題">
                    全部收合
                </button>
            </div>
        `;
    }

    /**
     * 生成前後導航按鈕 HTML
     */
    generateNavigationButtonsHtml(): string {
        const historyIndex = this.getHistoryIndex();
        const browsingHistory = this.getBrowsingHistory();

        const canGoBack = historyIndex > 0;
        const canGoForward = historyIndex < browsingHistory.length - 1;

        // Get previous and next page titles for tooltips
        const prevTitle = canGoBack
            ? this.getPageTitle(browsingHistory[historyIndex - 1])
            : '';
        const nextTitle = canGoForward
            ? this.getPageTitle(browsingHistory[historyIndex + 1])
            : '';

        const prevButton = canGoBack
            ? `<button class="nav-btn prev-btn" data-action="navigateBack" title="上一頁: ${prevTitle}">
                <span class="nav-icon">‹</span>
               </button>`
            : `<button class="nav-btn prev-btn disabled" disabled title="沒有上一頁">
                <span class="nav-icon">‹</span>
               </button>`;

        const nextButton = canGoForward
            ? `<button class="nav-btn next-btn" data-action="navigateForward" title="下一頁: ${nextTitle}">
                <span class="nav-icon">›</span>
               </button>`
            : `<button class="nav-btn next-btn disabled" disabled title="沒有下一頁">
                <span class="nav-icon">›</span>
               </button>`;

        return `${prevButton}${nextButton}`;
    }

    /**
     * 獲取頁面標題（用於導航提示）
     */
    private getPageTitle(topicPath: string): string {
        if (!topicPath) {
            return 'local'; // Root page title
        }

        // Try to get title from managed topics
        const allTopicConfigs = this.templateEngine.getAllTopicConfigs();
        const topicName = topicPath.split('/').pop() || topicPath;
        const managedTopic = allTopicConfigs.find(t => t.name === topicName);
        if (managedTopic?.title) {
            return managedTopic.title;
        }

        // Fall back to the last part of the path
        return topicPath.split('/').pop() || topicPath;
    }

    /**
     * 獲取頁面導航信息（前一頁/後一頁）
     */
    getPageNavigation(allCards: ExtendedCard[]): {
        prevPath: string | null,
        nextPath: string | null,
        prevTitle: string,
        nextTitle: string
    } {
        // Get all topics at the current level
        const currentPath = this.getCurrentTopicPath();

        // If we're at root level, get all root topics
        const siblingTopics = this.getSiblingTopics(allCards, currentPath);

        // Find current topic index in siblings
        const currentIndex = siblingTopics.findIndex(topic => topic.path === currentPath);

        const result = {
            prevPath: null as string | null,
            nextPath: null as string | null,
            prevTitle: '',
            nextTitle: ''
        };

        if (currentIndex > 0) {
            const prevTopic = siblingTopics[currentIndex - 1];
            result.prevPath = prevTopic.path;
            result.prevTitle = prevTopic.title;
        }

        if (currentIndex >= 0 && currentIndex < siblingTopics.length - 1) {
            const nextTopic = siblingTopics[currentIndex + 1];
            result.nextPath = nextTopic.path;
            result.nextTitle = nextTopic.title;
        }

        return result;
    }

    /**
     * 獲取同級主題列表
     */
    private getSiblingTopics(allCards: ExtendedCard[], currentPath: string): Array<{path: string, title: string}> {
        const topics: Array<{path: string, title: string}> = [];

        if (!currentPath) {
            // At root level - get all root topics
            const rootTopics = new Set<string>();
            allCards.forEach(card => {
                if (card.topicPath && !card.topicPath.includes('/')) {
                    rootTopics.add(card.topicPath);
                }
            });

            const allTopicConfigs = this.templateEngine.getAllTopicConfigs();
            rootTopics.forEach(topicPath => {
                const managedTopic = allTopicConfigs.find(t => t.name === topicPath);
                topics.push({
                    path: topicPath,
                    title: managedTopic?.title || topicPath
                });
            });
        } else {
            // Get sibling topics at the same level
            const pathParts = currentPath.split('/');
            const parentPath = pathParts.length > 1 ? pathParts.slice(0, -1).join('/') : '';
            const currentLevel = pathParts.length;

            const siblingTopics = new Set<string>();
            allCards.forEach(card => {
                if (card.topicPath) {
                    const cardPathParts = card.topicPath.split('/');
                    if (cardPathParts.length === currentLevel) {
                        if (parentPath === '') {
                            // Root level siblings
                            siblingTopics.add(card.topicPath);
                        } else {
                            // Check if it's a sibling (same parent)
                            const cardParentPath = cardPathParts.slice(0, -1).join('/');
                            if (cardParentPath === parentPath) {
                                siblingTopics.add(card.topicPath);
                            }
                        }
                    }
                }
            });

            const allTopicConfigs = this.templateEngine.getAllTopicConfigs();
            siblingTopics.forEach(topicPath => {
                const managedTopic = allTopicConfigs.find(t => t.name === topicPath);
                topics.push({
                    path: topicPath,
                    title: managedTopic?.title || topicPath.split('/').pop() || topicPath
                });
            });
        }

        // Sort topics by path for consistent ordering
        return topics.sort((a, b) => a.path.localeCompare(b.path));
    }
}
