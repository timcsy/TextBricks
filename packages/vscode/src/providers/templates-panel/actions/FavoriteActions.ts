import * as path from 'path';
import { TextBricksEngine, DataPathService } from '@textbricks/core';
import { Template, Card, ExtendedCard } from '@textbricks/shared';
import { VSCodePlatform } from '../../../adapters/vscode/VSCodePlatform';

type ItemWithPath = Template & { topicPath?: string };
type DisplayItem = ItemWithPath | Card | ExtendedCard;

interface PartialScopeConfig {
    languages?: any[];
    favorites?: string[];
    usage?: Record<string, number>;
}

/**
 * FavoriteActions - 收藏功能操作
 *
 * 負責處理模板和卡片的收藏管理
 */
export class FavoriteActions {
    private _scopeConfig: PartialScopeConfig | null = null;

    constructor(
        private readonly templateEngine: TextBricksEngine,
        private readonly dataPathService: DataPathService,
        private readonly platform: VSCodePlatform,
        private readonly currentTopicPath: () => string
    ) {}

    /**
     * 載入 Scope 配置
     */
    async loadScopeConfig(): Promise<void> {
        try {
            const fs = require('fs').promises;
            const localScopePath = await this.dataPathService.getScopePath('local');
            const scopePath = path.join(localScopePath, 'scope.json');
            const scopeData = await fs.readFile(scopePath, 'utf8');
            this._scopeConfig = JSON.parse(scopeData);
        } catch (error) {
            this.platform.logError(error as Error, 'FavoriteActions.loadScopeConfig');
            this._scopeConfig = { languages: [], favorites: [], usage: {} };
        }
    }

    /**
     * 保存 Scope 配置
     */
    async saveScopeConfig(): Promise<void> {
        try {
            const fs = require('fs').promises;
            const localScopePath = await this.dataPathService.getScopePath('local');
            const scopePath = path.join(localScopePath, 'scope.json');
            await fs.writeFile(scopePath, JSON.stringify(this._scopeConfig, null, 2), 'utf8');
        } catch (error) {
            this.platform.logError(error as Error, 'FavoriteActions.saveScopeConfig');
        }
    }

    /**
     * 獲取收藏列表
     */
    getFavorites(): string[] {
        return this._scopeConfig?.favorites || [];
    }

    /**
     * 檢查是否為收藏
     */
    isFavorite(itemId: string): boolean {
        const favorites = this.getFavorites();
        return favorites.includes(itemId);
    }

    /**
     * 切換收藏狀態
     */
    async toggleFavorite(itemId: string): Promise<void> {
        if (!this._scopeConfig) {
            await this.loadScopeConfig();
        }

        // Ensure favorites array exists
        if (!this._scopeConfig!.favorites) {
            this._scopeConfig!.favorites = [];
        }

        const favorites = this._scopeConfig!.favorites;
        const index = favorites.indexOf(itemId);

        if (index === -1) {
            favorites.push(itemId);
        } else {
            favorites.splice(index, 1);
        }

        await this.saveScopeConfig();
    }

    /**
     * 獲取收藏的模板項目
     */
    getFavoriteItems(items: ItemWithPath[]): ItemWithPath[] {
        const favorites = this.getFavorites();
        return items.filter(item => {
            const itemPath = item.topicPath ? `${item.topicPath}/templates/${item.name}` : item.name;
            return favorites.includes(itemPath);
        });
    }

    /**
     * 獲取收藏項目用於顯示
     */
    getFavoriteItemsForDisplay(): DisplayItem[] {
        // Get both templates and cards that are favorited
        const allTemplates = this.templateEngine.getAllTemplates();
        const allCards = this.templateEngine.getAllCards();
        const favorites = this.getFavorites();

        // Find favorited templates
        const favoriteTemplates = allTemplates.filter(template => {
            const templateWithPath = template as ItemWithPath;
            const templatePath = templateWithPath.topicPath ? `${templateWithPath.topicPath}/templates/${template.name}` : template.name;
            return favorites.includes(templatePath);
        });

        // Find favorited cards (topics and links)
        const favoriteCards = allCards.filter(card => {
            let cardPath: string;
            if (card.type === 'topic') {
                cardPath = card.target || card.name;
            } else if (card.type === 'link') {
                cardPath = card.topicPath ? `${card.topicPath}/links/${card.name}` : card.name;
            } else {
                cardPath = card.topicPath ? `${card.topicPath}/templates/${card.name}` : card.name;
            }
            return favorites.includes(cardPath);
        });

        // Find favorited main topics
        const allTopicConfigs = this.templateEngine.getAllTopicConfigs();
        const favoriteMainTopics = allTopicConfigs
            .filter(topic => favorites.includes(topic.name))
            .map(topic => ({
                type: 'topic' as const,
                name: topic.name,
                title: topic.title,
                description: topic.description,
                documentation: topic.documentation || '',
                topicPath: '',
                target: topic.name,
                language: topic.name
            }));

        // Combine items and remove duplicates based on path
        const seenPaths = new Set();
        const allFavoriteItems: DisplayItem[] = [];

        // Add templates first
        favoriteTemplates.forEach(template => {
            const pathStr = (template as any).topicPath ? `${(template as any).topicPath}/templates/${template.name}` : template.name;
            if (!seenPaths.has(pathStr)) {
                seenPaths.add(pathStr);
                allFavoriteItems.push(template);
            }
        });

        // Add cards, but check for duplicates
        favoriteCards.forEach(card => {
            let cardPath: string;
            if (card.type === 'topic') {
                cardPath = card.target || card.name;
            } else if (card.type === 'link') {
                cardPath = card.topicPath ? `${card.topicPath}/links/${card.name}` : card.name;
            } else {
                cardPath = card.topicPath ? `${card.topicPath}/templates/${card.name}` : card.name;
            }
            if (cardPath && !seenPaths.has(cardPath)) {
                seenPaths.add(cardPath);
                allFavoriteItems.push(card);
            }
        });

        // Add main topics, but check for duplicates
        favoriteMainTopics.forEach(mainTopic => {
            if (!seenPaths.has(mainTopic.name)) {
                seenPaths.add(mainTopic.name);
                allFavoriteItems.push(mainTopic);
            }
        });

        const currentPath = this.currentTopicPath();
        if (!currentPath) {
            // At root level, show all favorite items
            return allFavoriteItems;
        } else {
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

            // When in a specific topic, only show favorites under current topic
            return allFavoriteItems.filter(item => {
                if (!item.topicPath) { return true; } // Main topics have empty topic, show them at root
                return item.topicPath === currentPath || subtopicIds.has(item.topicPath);
            });
        }
    }
}
