import { Template, Card, ExtendedCard } from '@textbricks/shared';
import { TextBricksEngine } from '@textbricks/core';
import { VSCodePlatform } from '../../../adapters/vscode/VSCodePlatform';

type ItemWithPath = Template & { topicPath?: string };
type DisplayItem = ItemWithPath | Card | ExtendedCard;

/**
 * NavigationActions - 導航邏輯操作
 *
 * 負責處理主題導航、歷史記錄管理和項目篩選
 */
export class NavigationActions {
    private _browsingHistory: string[] = [''];
    private _historyIndex: number = 0;

    constructor(
        private readonly templateEngine: TextBricksEngine,
        private readonly platform: VSCodePlatform,
        private readonly getCurrentTopicPath: () => string,
        private readonly setCurrentTopicPath: (path: string) => void,
        private readonly refreshCallback: () => void
    ) {}

    /**
     * 獲取瀏覽歷史
     */
    getBrowsingHistory(): string[] {
        return this._browsingHistory;
    }

    /**
     * 獲取歷史索引
     */
    getHistoryIndex(): number {
        return this._historyIndex;
    }

    /**
     * 處理主題導航
     */
    handleTopicNavigation(topicPath: string): void {
        const currentPath = this.getCurrentTopicPath();

        // Only add to history if this is a new navigation (not back/forward)
        if (currentPath !== topicPath) {
            // Remove any forward history when navigating to a new page
            this._browsingHistory = this._browsingHistory.slice(0, this._historyIndex + 1);

            // Add new page to history
            this._browsingHistory.push(topicPath);
            this._historyIndex = this._browsingHistory.length - 1;

            this.platform.logInfo(`Navigation history updated: ${this._historyIndex}/${this._browsingHistory.length - 1}, path: ${topicPath}`, 'NavigationActions');
        }

        // Update the current topic path
        this.setCurrentTopicPath(topicPath);
        this.platform.logInfo(`Navigating to topic: "${topicPath}", current path set to: "${topicPath}"`, 'NavigationActions');

        // Refresh the webview to show the new topic context
        this.refreshCallback();
    }

    /**
     * 處理後退導航
     */
    handleBackNavigation(): void {
        if (this._historyIndex > 0) {
            this._historyIndex--;
            const newPath = this._browsingHistory[this._historyIndex];
            this.setCurrentTopicPath(newPath);

            this.platform.logInfo(`Navigating back to: ${newPath || 'root'}, index: ${this._historyIndex}`, 'NavigationActions');

            // Refresh the webview
            this.refreshCallback();
        }
    }

    /**
     * 處理前進導航
     */
    handleForwardNavigation(): void {
        if (this._historyIndex < this._browsingHistory.length - 1) {
            this._historyIndex++;
            const newPath = this._browsingHistory[this._historyIndex];
            this.setCurrentTopicPath(newPath);

            this.platform.logInfo(`Navigating forward to: ${newPath || 'root'}, index: ${this._historyIndex}`, 'NavigationActions');

            // Refresh the webview
            this.refreshCallback();
        }
    }

    /**
     * 篩選當前主題的項目
     */
    filterCurrentTopicItems(items: DisplayItem[]): DisplayItem[] {
        const currentPath = this.getCurrentTopicPath();

        if (!currentPath) {
            // 如果在根層級，顯示所有項目（不論層級）
            return items;
        }

        // 獲取當前主題的所有子主題
        const allCards = this.templateEngine.getAllCards();
        const subtopicIds = new Set<string>();

        // 收集當前主題的直接子主題 ID
        allCards
            .filter(card => card.type === 'topic' && card.topicPath === currentPath)
            .forEach(card => {
                if (card.target) {
                    subtopicIds.add(card.target);
                }
            });

        // 顯示當前主題及其子主題的項目
        return items.filter(item => {
            const itemTopicPath = 'topicPath' in item ? item.topicPath : undefined;
            if (!itemTopicPath) { return false; }
            return itemTopicPath === currentPath || subtopicIds.has(itemTopicPath);
        });
    }
}
