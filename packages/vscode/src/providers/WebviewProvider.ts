import * as vscode from 'vscode';
import * as path from 'path';
import { TextBricksEngine, DataPathService } from '@textbricks/core';
import { DocumentationProvider } from './DocumentationProvider';
import { DocumentationService } from '@textbricks/core';
import { CodeOperationService } from '@textbricks/core';
import { Template, Language, Card, ExtendedCard } from '@textbricks/shared';

export class WebviewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'textbricks-webview';

    private _view?: vscode.WebviewView;
    private _documentationProvider?: DocumentationProvider;
    private _currentTopicPath: string = ''; // Current navigation path
    private _scopeConfig: any = null; // Cached scope configuration
    private _browsingHistory: string[] = ['']; // Browsing history array, start with root
    private _historyIndex: number = 0; // Current position in history

    constructor(
        private readonly _extensionUri: vscode.Uri,
        private readonly templateEngine: TextBricksEngine,
        private readonly _context: vscode.ExtensionContext,
        private readonly codeOperationService: CodeOperationService,
        private readonly documentationService: DocumentationService,
        private readonly dataPathService: DataPathService,
        private readonly managementService?: TextBricksEngine
    ) {
        // Initialize documentation provider
        this._documentationProvider = new DocumentationProvider(this._extensionUri, this.templateEngine, this.documentationService, this.codeOperationService);

    }

    private async _loadScopeConfig(): Promise<void> {
        try {
            const fs = require('fs').promises;
            const localScopePath = await this.dataPathService.getScopePath('local');
            const scopePath = path.join(localScopePath, 'scope.json');
            const scopeData = await fs.readFile(scopePath, 'utf8');
            this._scopeConfig = JSON.parse(scopeData);
        } catch (error) {
            console.error('Failed to load scope config:', error);
            this._scopeConfig = { languages: [], favorites: [], usage: {} };
        }
    }

    private _getLanguageTagName(languageId: string): string {
        if (!this._scopeConfig) {
            return languageId.toUpperCase();
        }

        const language = this._scopeConfig.languages?.find((lang: any) => lang.id === languageId);
        return language?.tagName || languageId.toUpperCase();
    }

    private _getFavorites(): string[] {
        return this._scopeConfig?.favorites || [];
    }

    private _getUsageCount(itemId: string): number {
        return this._scopeConfig?.usage?.[itemId] || 0;
    }

    private _isFavorite(itemId: string): boolean {
        const favorites = this._getFavorites();
        return favorites.includes(itemId);
    }

    private async _saveScopeConfig(): Promise<void> {
        try {
            const fs = require('fs').promises;
            const localScopePath = await this.dataPathService.getScopePath('local');
            const scopePath = path.join(localScopePath, 'scope.json');
            await fs.writeFile(scopePath, JSON.stringify(this._scopeConfig, null, 2), 'utf8');
        } catch (error) {
            console.error('Failed to save scope config:', error);
        }
    }

    private async _toggleFavorite(itemId: string): Promise<void> {
        if (!this._scopeConfig) {
            await this._loadScopeConfig();
        }

        const favorites = this._getFavorites();
        const index = favorites.indexOf(itemId);

        if (index === -1) {
            favorites.push(itemId);
        } else {
            favorites.splice(index, 1);
        }

        await this._saveScopeConfig();
    }

    private _filterCurrentTopicItems(items: any[]): any[] {
        if (!this._currentTopicPath) {
            // 如果在根層級，顯示所有項目（不論層級）
            return items;
        }

        // 顯示當前主題及其子主題的項目
        return items.filter(item => {
            if (!item.topic) return false;
            return item.topic === this._currentTopicPath ||
                   item.topic.startsWith(this._currentTopicPath + '/');
        });
    }

    private _getRecommendedByUsage(items: any[], limit: number = 6): any[] {
        return items
            .map(item => ({
                ...item,
                usageCount: this._getUsageCount(item.id)
            }))
            .filter(item => item.usageCount > 0) // 只顯示有使用記錄的
            .sort((a, b) => b.usageCount - a.usageCount) // 按使用次數降序排列
            .slice(0, limit);
    }

    private _getFavoriteItems(items: any[]): any[] {
        const favorites = this._getFavorites();
        return items.filter(item => favorites.includes(item.id));
    }

    private _getFavoriteItemsForDisplay(): any[] {
        // Get both templates and cards that are favorited
        const allTemplates = this.templateEngine.getAllTemplates();
        const allCards = this.templateEngine.getAllCards();
        const favorites = this._getFavorites();

        // Find favorited templates
        const favoriteTemplates = allTemplates.filter(template => favorites.includes(template.id));

        // Find favorited cards (topics and links)
        // Note: For topic cards, we check both card.id and card.target because card.target is the topic path
        // For link cards, we only check card.id
        const favoriteCards = allCards.filter(card => {
            if (card.type === 'topic') {
                // For topic cards, check both id and target (topic path)
                return favorites.includes(card.id) || favorites.includes(card.target);
            } else {
                // For link cards and others, only check id
                return favorites.includes(card.id);
            }
        });

        // Find favorited main topics (like "c", "python", "javascript")
        // Get all possible topic names from scope configuration
        const allPossibleTopics = this._scopeConfig?.topics || [];
        const favoriteMainTopics = allPossibleTopics
            .filter(topicName => favorites.includes(topicName))
            .map(topicName => {
                const managedTopic = this.templateEngine.getTopicByName?.(topicName);
                return {
                    type: 'topic',
                    id: topicName,
                    title: managedTopic?.displayName || topicName,
                    description: managedTopic?.description || `${topicName} 相關內容`,
                    documentation: managedTopic?.documentation || '', // Include documentation field
                    topic: '', // Main topics are at root level
                    target: topicName,
                    language: topicName
                };
            });

        // Combine items and remove duplicates based on ID
        const seenIds = new Set();
        const allFavoriteItems = [];

        // Add templates first
        favoriteTemplates.forEach(template => {
            if (!seenIds.has(template.id)) {
                seenIds.add(template.id);
                allFavoriteItems.push(template);
            }
        });

        // Add cards, but check for duplicates
        favoriteCards.forEach(card => {
            const cardId = card.id || card.target;
            if (cardId && !seenIds.has(cardId)) {
                seenIds.add(cardId);
                allFavoriteItems.push(card);
            }
        });

        // Add main topics, but check for duplicates
        favoriteMainTopics.forEach(mainTopic => {
            if (!seenIds.has(mainTopic.id)) {
                seenIds.add(mainTopic.id);
                allFavoriteItems.push(mainTopic);
            }
        });

        if (!this._currentTopicPath) {
            // At root level, show all favorite items
            return allFavoriteItems;
        } else {
            // When in a specific topic, only show favorites under current topic
            return allFavoriteItems.filter(item => {
                if (!item.topic) return true; // Main topics have empty topic, show them at root
                return item.topic === this._currentTopicPath ||
                       item.topic.startsWith(this._currentTopicPath + '/');
            });
        }
    }

    public async resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;

        // Load scope configuration
        await this._loadScopeConfig();

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                this._extensionUri
            ]
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        // Handle messages from the webview
        webviewView.webview.onDidReceiveMessage(
            message => {
                switch (message.type) {
                    case 'copyTemplate':
                        this.codeOperationService.copyTemplate(message.templateId);
                        break;
                    case 'insertTemplate':
                        this.codeOperationService.insertTemplate(message.templateId);
                        break;
                    case 'copyCodeSnippet':
                        this.codeOperationService.copyCodeSnippet(message.code, message.templateId);
                        break;
                    case 'insertCodeSnippet':
                        this.codeOperationService.insertCodeSnippet(message.code, message.templateId);
                        break;
                    case 'dragTemplate':
                        this._handleDragTemplate(message.templateId, message.text);
                        break;
                    case 'showDocumentation':
                        this._showDocumentation(message.templateId);
                        break;
                    case 'showTopicDocumentation':
                        this._showTopicDocumentation(message.topicName);
                        break;
                    case 'navigateToTopic':
                        this._handleTopicNavigation(message.topicPath);
                        break;
                    case 'navigateBack':
                        this._handleBackNavigation();
                        break;
                    case 'navigateForward':
                        this._handleForwardNavigation();
                        break;
                    case 'toggleFavorite':
                        this._handleToggleFavorite(message.itemId);
                        break;
                    case 'refreshFavoritesTab':
                        this._handleRefreshFavoritesTab();
                        break;
                }
            },
            undefined,
            []
        );
    }

    public async refresh(preserveNavigationState: boolean = false) {
        if (this._view) {
            console.log('[WebviewProvider.refresh] Starting refresh...', preserveNavigationState ? '(preserving navigation state)' : '(normal refresh)');

            // 保存當前導航狀態
            const savedNavState = {
                currentTopicPath: this._currentTopicPath,
                browsingHistory: [...this._browsingHistory],
                historyIndex: this._historyIndex
            };

            console.log('[WebviewProvider.refresh] Current state before operation:', savedNavState);

            // 強制重新載入模板數據，清除緩存
            await this.templateEngine.forceReloadTemplates();

            // 如果需要保持導航狀態，恢復之前的狀態
            if (preserveNavigationState) {
                this._currentTopicPath = savedNavState.currentTopicPath;
                this._browsingHistory = savedNavState.browsingHistory;
                this._historyIndex = savedNavState.historyIndex;
                console.log('[WebviewProvider.refresh] Navigation state preserved and restored:', {
                    currentTopicPath: this._currentTopicPath,
                    browsingHistory: this._browsingHistory,
                    historyIndex: this._historyIndex
                });
            } else {
                console.log('[WebviewProvider.refresh] Normal refresh - navigation state may change based on HTML generation');
            }

            // 重新生成 HTML（現在會包含恢復的導航狀態）
            this._view.webview.html = this._getHtmlForWebview(this._view.webview);

            console.log('[WebviewProvider.refresh] Templates refreshed successfully. Final currentTopicPath:', this._currentTopicPath);
        }
    }





    private async _handleDragTemplate(templateId: string, text: string) {
        // This method is called during drag start - just log for now
        console.log(`Dragging template ${templateId}: ${text.substring(0, 50)}...`);
    }


    private _showDocumentation(templateId: string) {
        if (this._documentationProvider) {
            this._documentationProvider.showDocumentation(templateId);
        } else {
            vscode.window.showErrorMessage('說明文檔服務未初始化');
        }
    }

    private _showTopicDocumentation(topicName: string) {
        const managedTopic = this.templateEngine.getTopicByName?.(topicName);
        if (managedTopic && managedTopic.documentation) {
            if (this._documentationProvider) {
                this._documentationProvider.showTopicDocumentation(managedTopic);
            } else {
                vscode.window.showErrorMessage('說明文檔服務未初始化');
            }
        }
    }

    private async _handleToggleFavorite(itemId: string) {
        await this._toggleFavorite(itemId);

        // 發送更新訊息給前端，讓前端決定是否需要從favorites標籤中移除項目
        if (this._view) {
            this._view.webview.postMessage({
                type: 'favoriteToggled',
                itemId: itemId,
                isFavorite: this._isFavorite(itemId)
            });
        }
    }

    private async _handleRefreshFavoritesTab() {
        // Generate updated favorites content
        const favoriteItems = this._getFavoriteItemsForDisplay();
        const favoriteHtml = favoriteItems
            .map(item => {
                // Check if item has type property (it's a card) or not (it's a template)
                if (item.type === 'topic') {
                    return this._generateTopicCardHtml(item);
                } else if (item.type === 'link') {
                    return this._generateLinkCardHtml(item);
                } else {
                    // It's a template
                    return this._generateRecommendedTemplateCardHtml(item, 'favorite');
                }
            })
            .join('');

        // Send updated content to frontend
        if (this._view) {
            this._view.webview.postMessage({
                type: 'updateFavoritesContent',
                content: favoriteHtml || '<div class="empty-state">還沒有收藏任何模板</div>'
            });
        }
    }

    private _handleTopicNavigation(topicPath: string) {
        // Only add to history if this is a new navigation (not back/forward)
        if (this._currentTopicPath !== topicPath) {
            // Remove any forward history when navigating to a new page
            this._browsingHistory = this._browsingHistory.slice(0, this._historyIndex + 1);

            // Add new page to history
            this._browsingHistory.push(topicPath);
            this._historyIndex = this._browsingHistory.length - 1;

            console.log(`Navigation history updated:`, {
                history: this._browsingHistory,
                currentIndex: this._historyIndex,
                currentPath: topicPath
            });
        }

        // Update the current topic path
        this._currentTopicPath = topicPath;
        console.log(`[_handleTopicNavigation] Navigating to topic: "${topicPath}"`);
        console.log(`[_handleTopicNavigation] Current topic path set to: "${this._currentTopicPath}"`);

        // Refresh the webview to show the new topic context
        this.refresh();
    }

    private _handleBackNavigation() {
        if (this._historyIndex > 0) {
            this._historyIndex--;
            this._currentTopicPath = this._browsingHistory[this._historyIndex];

            console.log(`Navigating back to: ${this._currentTopicPath || 'root'}`);
            console.log(`History state:`, {
                history: this._browsingHistory,
                currentIndex: this._historyIndex
            });

            // Refresh the webview
            this.refresh();
        }
    }

    private _handleForwardNavigation() {
        if (this._historyIndex < this._browsingHistory.length - 1) {
            this._historyIndex++;
            this._currentTopicPath = this._browsingHistory[this._historyIndex];

            console.log(`Navigating forward to: ${this._currentTopicPath || 'root'}`);
            console.log(`History state:`, {
                history: this._browsingHistory,
                currentIndex: this._historyIndex
            });

            // Refresh the webview
            this.refresh();
        }
    }




    private _getHtmlForWebview(webview: vscode.Webview): string {
        const topics = this.templateEngine.getTopics();
        const languages = this.templateEngine.getLanguages();
        
        // Get CSS and JS URIs
        const variablesUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'assets', 'css', 'common', 'variables.css'));
        const componentsUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'assets', 'css', 'common', 'components.css'));
        const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'assets', 'css', 'style.css'));
        const utilsUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'assets', 'js', 'common', 'utils.js'));
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'assets', 'js', 'main.js'));

        const nonce = this.getNonce();

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}'; img-src ${webview.cspSource} data:;">
    <link href="${variablesUri}" rel="stylesheet">
    <link href="${componentsUri}" rel="stylesheet">
    <link href="${styleUri}" rel="stylesheet">
    <title>TextBricks Templates</title>
</head>
<body>
    <div class="header">
        <div class="header-top">
            <div class="title-section">
                <h2><span class="logo"><img src="${webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'assets', 'icons', 'TextBricks.svg'))}" alt="TextBricks"></span>TextBricks</h2>
                <p class="subtitle">點擊複製 • 拖曳插入</p>
            </div>
            <div class="breadcrumb-nav">
                <div class="navigation-controls">
                    ${this._generateNavigationButtonsHtml()}
                </div>
                <nav class="breadcrumb">
                    ${this._generateBreadcrumbHtml()}
                </nav>
            </div>
        </div>
    </div>
    
    <div class="container">
        ${this._generateRecommendedTemplatesHtml()}
        ${this._generateTopicsHtml(topics)}
    </div>

    <script nonce="${nonce}" src="${utilsUri}"></script>
    <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
    }

    private _generateBreadcrumbHtml(): string {
        const allCards = this.templateEngine.getAllCards();

        // Start with the root "local" item (clickable to go home)
        let breadcrumbHtml = this._currentTopicPath
            ? '<span class="breadcrumb-item clickable" data-navigate-path="">local</span>'
            : '<span class="breadcrumb-item active">local</span>';

        // If we have a current topic path, build the breadcrumb trail
        if (this._currentTopicPath) {
            const pathParts = this._currentTopicPath.split('/');
            let currentPath = '';

            pathParts.forEach((part, index) => {
                currentPath = index === 0 ? part : `${currentPath}/${part}`;
                const isLast = index === pathParts.length - 1;

                // Get display name for this topic - try multiple sources
                let displayName = part; // fallback

                // 1. Try managed topic
                const managedTopic = this.templateEngine.getTopicByName?.(currentPath);
                if (managedTopic?.displayName) {
                    displayName = managedTopic.displayName;
                } else {
                    // 2. Try to find from topic cards
                    const matchingTopicCard = allCards.find(card =>
                        card.type === 'topic' && (card.target === currentPath || card.id === currentPath)
                    );
                    if (matchingTopicCard) {
                        displayName = matchingTopicCard.title;
                    }
                }

                breadcrumbHtml += ` <span class="breadcrumb-separator">></span> `;

                if (isLast) {
                    // Last item is not clickable (current page)
                    breadcrumbHtml += `<span class="breadcrumb-item active">${displayName}</span>`;
                } else {
                    // Previous items are clickable
                    breadcrumbHtml += `<span class="breadcrumb-item clickable" data-navigate-path="${currentPath}">${displayName}</span>`;
                }
            });
        }

        return breadcrumbHtml;
    }

    private _generateNavigationButtonsHtml(): string {
        const canGoBack = this._historyIndex > 0;
        const canGoForward = this._historyIndex < this._browsingHistory.length - 1;

        // Get previous and next page titles for tooltips
        const prevTitle = canGoBack
            ? this._getPageTitle(this._browsingHistory[this._historyIndex - 1])
            : '';
        const nextTitle = canGoForward
            ? this._getPageTitle(this._browsingHistory[this._historyIndex + 1])
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

    private _getPageTitle(topicPath: string): string {
        if (!topicPath) {
            return 'local'; // Root page title
        }

        // Try to get title from managed topics
        const managedTopic = this.templateEngine.getTopicByName?.(topicPath);
        if (managedTopic?.displayName) {
            return managedTopic.displayName;
        }

        // Fall back to the last part of the path
        return topicPath.split('/').pop() || topicPath;
    }

    private _getPageNavigation(allCards: ExtendedCard[]): {
        prevPath: string | null,
        nextPath: string | null,
        prevTitle: string,
        nextTitle: string
    } {
        // Get all topics at the current level
        const currentPath = this._currentTopicPath;

        // If we're at root level, get all root topics
        const siblingTopics = this._getSiblingTopics(allCards, currentPath);

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

    private _getSiblingTopics(allCards: ExtendedCard[], currentPath: string): Array<{path: string, title: string}> {
        const topics: Array<{path: string, title: string}> = [];

        if (!currentPath) {
            // At root level - get all root topics
            const rootTopics = new Set<string>();
            allCards.forEach(card => {
                if (card.topic && !card.topic.includes('/')) {
                    rootTopics.add(card.topic);
                }
            });

            rootTopics.forEach(topicPath => {
                const managedTopic = this.templateEngine.getTopicByName?.(topicPath);
                topics.push({
                    path: topicPath,
                    title: managedTopic?.displayName || topicPath
                });
            });
        } else {
            // Get sibling topics at the same level
            const pathParts = currentPath.split('/');
            const parentPath = pathParts.length > 1 ? pathParts.slice(0, -1).join('/') : '';
            const currentLevel = pathParts.length;

            const siblingTopics = new Set<string>();
            allCards.forEach(card => {
                if (card.topic) {
                    const cardPathParts = card.topic.split('/');
                    if (cardPathParts.length === currentLevel) {
                        if (parentPath === '') {
                            // Root level siblings
                            siblingTopics.add(card.topic);
                        } else {
                            // Check if it's a sibling (same parent)
                            const cardParentPath = cardPathParts.slice(0, -1).join('/');
                            if (cardParentPath === parentPath) {
                                siblingTopics.add(card.topic);
                            }
                        }
                    }
                }
            });

            siblingTopics.forEach(topicPath => {
                const managedTopic = this.templateEngine.getTopicByName?.(topicPath);
                topics.push({
                    path: topicPath,
                    title: managedTopic?.displayName || topicPath.split('/').pop() || topicPath
                });
            });
        }

        // Sort topics by path for consistent ordering
        return topics.sort((a, b) => a.path.localeCompare(b.path));
    }

    private _generateRecommendedTemplatesHtml(): string {
        // 獲取所有模板並基於使用次數排序推薦
        const allTemplates = this.templateEngine.getAllTemplates();

        // 過濾當前主題下的模板
        const currentTopicTemplates = this._filterCurrentTopicItems(allTemplates);

        // 基於使用次數排序獲取推薦模板（取前6個）
        const recommendedTemplates = this._getRecommendedByUsage(currentTopicTemplates, 6);

        // 獲取最愛項目（使用特殊的顯示邏輯）
        const favoriteItems = this._getFavoriteItemsForDisplay();

        // 如果沒有推薦也沒有最愛，不顯示區域
        if (recommendedTemplates.length === 0 && favoriteItems.length === 0) {
            return '';
        }

        const recommendedHtml = recommendedTemplates
            .map(template => this._generateRecommendedTemplateCardHtml(template, 'recommended'))
            .join('');

        const favoriteHtml = favoriteItems
            .map(item => {
                // Check if item has type property (it's a card) or not (it's a template)
                if (item.type === 'topic') {
                    return this._generateTopicCardHtml(item);
                } else if (item.type === 'link') {
                    return this._generateLinkCardHtml(item);
                } else {
                    // It's a template
                    return this._generateRecommendedTemplateCardHtml(item, 'favorite');
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

    private _generateRecommendedTemplateCardHtml(template: any, type: 'recommended' | 'favorite'): string {
        const usageCount = template.usageCount || this._getUsageCount(template.id);
        const hasDocumentation = template.documentation && template.documentation.trim().length > 0;
        const isFavorite = this._isFavorite(template.id);

        return `
            <div class="template-card recommended-template ${type === 'favorite' ? 'favorite-template' : ''}"
                 data-template-id="${template.id}"
                 data-template-code="${this._escapeHtml(template.code)}"
                 data-has-documentation="${hasDocumentation}"
                 data-card-type="template"
                 draggable="true">
                <div class="card-header">
                    <h4 class="card-title">
                        <span class="card-icon">📄</span>
                        ${this._escapeHtml(template.title)}
                    </h4>
                    <div class="card-actions template-actions">
                        <span class="recommended-star">⭐</span>
                        <button class="action-btn favorite-btn"
                                data-item-id="${template.id}"
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
                <p class="card-description">${this._escapeHtml(template.description)}</p>
                <div class="card-footer">
                    <span class="card-type-label">模板</span>
                    ${usageCount > 0 ? `<span class="usage-count" style="opacity: 0.6;">已使用 ${usageCount} 次</span>` : ''}
                    <span class="language-tag">${this._getLanguageTagName(template.language)}</span>
                </div>
            </div>
        `;
    }

    private _generateTopicsHtml(topics: string[]): string {
        // 獲取所有卡片
        const allCards = this.templateEngine.getAllCards();
        console.log(`[WebviewProvider] getAllCards() returned ${allCards.length} cards, currentTopicPath: ${this._currentTopicPath}`);

        // If we're in a specific topic, filter cards for that topic
        if (this._currentTopicPath) {
            return this._generateSpecificTopicHtml(allCards, this._currentTopicPath);
        }

        // Otherwise show top-level topics (原有的邏輯)
        // 按照主要主題（語言級別）分組
        const cardsByMainTopic = new Map<string, ExtendedCard[]>();

        allCards.forEach(card => {
            // 取主題路徑的第一部分作為主要主題
            const mainTopic = card.topic.split('/')[0];
            if (!cardsByMainTopic.has(mainTopic)) {
                cardsByMainTopic.set(mainTopic, []);
            }
            cardsByMainTopic.get(mainTopic)!.push(card);
        });

        // 為每個主要主題生成 HTML
        return Array.from(cardsByMainTopic.entries()).map(([mainTopicName, allCardsInTopic]) => {
            if (allCardsInTopic.length === 0) {
                return ''; // Don't show empty topics
            }

            // 分離出屬於當前主要主題層級的卡片和子主題的卡片
            const currentLevelCards = allCardsInTopic.filter(card => card.topic === mainTopicName);

            // 將當前層級的卡片依類型分組
            const topicCards = currentLevelCards.filter(card => card.type === 'topic');
            const templateCards = currentLevelCards.filter(card => card.type === 'template');
            const linkCards = currentLevelCards.filter(card => card.type === 'link');

            const cardsHtml = [
                ...topicCards.map(card => this._generateTopicCardHtml(card)),
                ...templateCards.map(card => this._generateTemplateCardFromCard(card)),
                ...linkCards.map(card => this._generateLinkCardHtml(card))
            ].join('');

            // 獲取主題物件資訊
            // Extract topic name from path - for c/advanced, we need "advanced"
            const topicName = mainTopicName.split('/').pop() || mainTopicName;
            const managedTopic = this.templateEngine.getTopicByName?.(topicName);


            // 計算主題下的卡片和子主題內容總數
            const currentLevelCount = currentLevelCards.length;
            const subtopicCounts = this._getSubtopicCounts(mainTopicName, allCardsInTopic);

            let topicDescription = managedTopic?.description || `${mainTopicName} 相關內容`;

            if (managedTopic && managedTopic.description) {
                topicDescription = managedTopic.description;
            }

            // Check if topic has documentation
            const hasDocumentation = managedTopic && managedTopic.documentation && managedTopic.documentation.trim().length > 0;

            // Debug logging for specific topics
            if (mainTopicName.includes('advanced') || mainTopicName.includes('basic')) {
                console.log('DEBUG main topic group generation:', {
                    mainTopicName,
                    topicName,
                    hasDocumentation,
                    managedTopicId: managedTopic?.id,
                    documentation: managedTopic?.documentation?.substring(0, 50) + '...'
                });
            }

            // Check if main topic has navigable content (sub-topics or topic links)
            const hasSubTopics = topicCards.length > 0;
            const hasTopicLinks = linkCards.filter(card =>
                card.target && !card.target.startsWith('http')
            ).length > 0;
            const hasNavigableContent = hasSubTopics || hasTopicLinks;

            const topicColor = managedTopic?.display?.color;
            const topicColorStyles = topicColor ?
                `data-topic-color style="--topic-color: ${topicColor}; --topic-color-light: ${topicColor}20; --topic-color-medium: ${topicColor}80;"` : '';

            // 計算不同類型的數量和子主題統計
            const countText = this._generateMainTopicCountText(topicCards.length, templateCards.length, linkCards.length, subtopicCounts);



            return `
                <div class="topic-group main-topic" data-topic="${mainTopicName}" ${topicColorStyles}>
                    <div class="topic-header">
                        <div class="topic-title-row">
                            <h3 class="topic-title">
                                <span class="topic-toggle"></span>
                                ${managedTopic?.display?.icon ? `<span class="topic-icon">${managedTopic.display.icon}</span>` : ''}
                                ${managedTopic?.displayName || mainTopicName}
                            </h3>
                            <div class="topic-actions">
                                <button class="action-btn favorite-btn"
                                        data-item-id="${mainTopicName}"
                                        title="${this._isFavorite(mainTopicName) ? '取消收藏' : '加入收藏'}">
                                    <span class="icon">${this._isFavorite(mainTopicName) ? '❤️' : '♡'}</span>
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
                        <p class="topic-description">${this._escapeHtml(topicDescription)}</p>
                        <p class="topic-count">${countText}</p>
                    </div>
                    <div class="templates-grid">
                        ${cardsHtml}
                    </div>
                </div>
            `;
        }).join('');
    }

    private _generateTemplateCardHtml(template: Template): string {        
        // Check if this template is recommended
        const isRecommended = this._isTemplateRecommended(template.id);
        const templateClass = isRecommended ? 'template-card recommended-template' : 'template-card';
        const hasDocumentation = template.documentation && template.documentation.trim().length > 0;
        
        return `
            <div class="${templateClass}" 
                 data-template-id="${template.id}" 
                 data-template-code="${this._escapeHtml(template.code)}"
                 data-has-documentation="${hasDocumentation}"
                 draggable="true">
                <div class="template-header">
                    <h4 class="template-title">${this._escapeHtml(template.title)}</h4>
                    <div class="template-actions">
                        ${isRecommended ? '<span class="recommended-star">⭐</span>' : ''}
                        <button class="action-btn preview-btn" title="預覽程式碼">
                            <span class="icon">👁️</span>
                        </button>
                        <button class="action-btn insert-btn" title="插入到游標位置">
                            <span class="icon">＋</span>
                        </button>
                    </div>
                </div>
                <p class="template-description">${this._escapeHtml(template.description)}</p>
                <div class="template-footer">
                    <span></span>
                    <span class="language-tag">${this._getLanguageTagName(template.language)}</span>
                </div>
            </div>
        `;
    }

    private _isTemplateRecommended(templateId: string): boolean {
        if (!this.managementService) {
            return false;
        }

        try {
            // 檢查所有推薦模板
            const recommendedTemplates = this.managementService.getRecommendedTemplates(6);
            return recommendedTemplates.some(template => template.id === templateId);
        } catch (error) {
            return false;
        }
    }

    private _generateSpecificTopicHtml(allCards: ExtendedCard[], topicPath: string): string {
        // Get all cards that belong to or are children of the current topic path
        const currentPathCards = allCards.filter(card => card.topic === topicPath);
        const childPathCards = allCards.filter(card =>
            card.topic.startsWith(topicPath + '/') &&
            card.topic.split('/').length === topicPath.split('/').length + 1
        );

        // Group child cards by their topics (these become sub-topic groups)
        const childCardsByTopic = new Map<string, ExtendedCard[]>();
        childPathCards.forEach(card => {
            if (!childCardsByTopic.has(card.topic)) {
                childCardsByTopic.set(card.topic, []);
            }
            childCardsByTopic.get(card.topic)!.push(card);
        });

        // Separate current level cards by type
        const currentTopicCards = currentPathCards.filter(card => card.type === 'topic');
        const currentTemplateCards = currentPathCards.filter(card => card.type === 'template');
        const currentLinkCards = currentPathCards.filter(card => card.type === 'link');

        // Filter out topic cards that have corresponding child topic groups
        const childTopicPaths = Array.from(childCardsByTopic.keys());
        const filteredTopicCards = currentTopicCards.filter(card => {
            const cardTargetPath = card.target || card.id;
            return !childTopicPaths.includes(cardTargetPath);
        });

        // Generate HTML for current level template and link cards
        const currentLevelCardsHtml = [
            ...currentTemplateCards.map(card => this._generateTemplateCardFromCard(card)),
            ...currentLinkCards.map(card => this._generateLinkCardHtml(card))
        ].join('');

        // Generate HTML for remaining topic cards (those without child groups)
        const remainingTopicCardsHtml = filteredTopicCards.map(card => this._generateTopicCardHtml(card)).join('');

        // Generate HTML for each child topic group
        const childTopicGroupsHtml = Array.from(childCardsByTopic.entries()).map(([childTopicPath, childCards]) => {
            const childTopicName = childTopicPath.split('/').pop() || childTopicPath;
            const managedChildTopic = this.templateEngine.getTopicByName?.(childTopicName);

            // Separate child cards by type
            const childTopicCards = childCards.filter(card => card.type === 'topic');
            const childTemplateCards = childCards.filter(card => card.type === 'template');
            const childLinkCards = childCards.filter(card => card.type === 'link');

            const childCardsHtml = [
                ...childTopicCards.map(card => this._generateTopicCardHtml(card)),
                ...childTemplateCards.map(card => this._generateTemplateCardFromCard(card)),
                ...childLinkCards.map(card => this._generateLinkCardHtml(card))
            ].join('');

            if (!childCardsHtml) return '';

            const childTopicDescription = managedChildTopic?.description || `${managedChildTopic?.displayName || childTopicName} 相關內容`;
            const hasDocumentation = managedChildTopic && managedChildTopic.documentation && managedChildTopic.documentation.trim().length > 0;


            const childTopicColor = managedChildTopic?.display?.color;
            const childTopicColorStyles = childTopicColor ?
                `data-topic-color style="--topic-color: ${childTopicColor}; --topic-color-light: ${childTopicColor}20; --topic-color-medium: ${childTopicColor}80;"` : '';

            const countText = this._generateSubTopicCountText(childTemplateCards.length, childLinkCards.length);


            return `
                <div class="topic-group main-topic" data-topic="${childTopicName}" ${childTopicColorStyles}>
                    <div class="topic-header">
                        <div class="topic-title-row">
                            <h3 class="topic-title">
                                <span class="topic-toggle"></span>
                                ${managedChildTopic?.display?.icon ? `<span class="topic-icon">${managedChildTopic.display.icon}</span>` : ''}
                                ${managedChildTopic?.displayName || childTopicName}
                            </h3>
                            <div class="topic-actions">
                                <button class="action-btn favorite-btn"
                                        data-item-id="${childTopicPath}"
                                        title="${this._isFavorite(childTopicPath) ? '取消收藏' : '加入收藏'}">
                                    <span class="icon">${this._isFavorite(childTopicPath) ? '❤️' : '♡'}</span>
                                </button>
                                ${hasDocumentation ? `
                                    <button class="topic-doc-btn"
                                            data-topic-name="${childTopicName}"
                                            title="查看 ${managedChildTopic?.displayName || childTopicName} 的詳細說明文件">
                                        📖
                                    </button>
                                ` : ''}
                                <button class="action-btn navigate-btn topic-navigate-btn"
                                        data-topic-path="${childTopicPath}"
                                        title="進入 ${managedChildTopic?.displayName || childTopicName} 主題">
                                    <span class="icon">></span>
                                </button>
                            </div>
                        </div>
                        <p class="topic-description">${this._escapeHtml(childTopicDescription)}</p>
                        <p class="topic-count">${countText}</p>
                    </div>
                    <div class="templates-grid">
                        ${childCardsHtml}
                    </div>
                </div>
            `;
        }).filter(html => html).join('');

        // Generate HTML for current level topic cards (these should be treated as sub-topics)
        const currentTopicCardsHtml = currentTopicCards.map(card => {
            const managedTopic = this.templateEngine.getTopicByName?.(card.target || card.id);
            const displayName = managedTopic?.displayName || card.title;
            const description = managedTopic?.description || card.description;
            const hasDocumentation = managedTopic && managedTopic.documentation && managedTopic.documentation.trim().length > 0;

            const topicColor = managedTopic?.display?.color;
            const topicColorStyles = topicColor ?
                `data-topic-color style="--topic-color: ${topicColor}; --topic-color-light: ${topicColor}20; --topic-color-medium: ${topicColor}80;"` : '';

            // Get templates and links count for this sub-topic
            const subTopicPath = card.target || card.id;
            const subTopicCards = allCards.filter(c => c.topic === subTopicPath);
            const subTemplateCount = subTopicCards.filter(c => c.type === 'template').length;
            const subLinkCount = subTopicCards.filter(c => c.type === 'link').length;
            const subTopicCount = subTopicCards.filter(c => c.type === 'topic').length;

            // Check for topic links (links that point to other topics)
            const subTopicLinkCount = subTopicCards.filter(c =>
                c.type === 'link' && c.target && !c.target.startsWith('http')
            ).length;

            const countText = this._generateSubTopicCountText(subTemplateCount, subLinkCount, subTopicCount);
            const hasSubTopics = subTopicCount > 0 || subTopicLinkCount > 0;

            const subCardsHtml = subTopicCards.map(subCard => {
                if (subCard.type === 'template') return this._generateTemplateCardFromCard(subCard);
                if (subCard.type === 'link') return this._generateLinkCardHtml(subCard);
                if (subCard.type === 'topic') return this._generateTopicCardHtml(subCard);
                return '';
            }).join('');

            return `
                <div class="topic-group main-topic" data-topic="${card.target || card.id}" ${topicColorStyles}>
                    <div class="topic-header">
                        <div class="topic-title-row">
                            <h3 class="topic-title">
                                <span class="topic-toggle"></span>
                                ${managedTopic?.display?.icon ? `<span class="topic-icon">${managedTopic.display.icon}</span>` : '<span class="topic-icon">📁</span>'}
                                ${displayName}
                            </h3>
                            <div class="topic-actions">
                                <button class="action-btn favorite-btn"
                                        data-item-id="${subTopicPath}"
                                        title="${this._isFavorite(subTopicPath) ? '取消收藏' : '加入收藏'}">
                                    <span class="icon">${this._isFavorite(subTopicPath) ? '❤️' : '♡'}</span>
                                </button>
                                ${hasDocumentation ? `
                                    <button class="topic-doc-btn"
                                            data-topic-name="${subTopicPath}"
                                            title="查看 ${displayName} 的詳細說明文件">
                                        📖
                                    </button>
                                ` : ''}
                                ${hasSubTopics ? `
                                    <button class="action-btn navigate-btn topic-navigate-btn"
                                            data-topic-path="${subTopicPath}"
                                            title="進入 ${displayName} 主題">
                                        <span class="icon">></span>
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                        <p class="topic-description">${this._escapeHtml(description)}</p>
                        <p class="topic-count">${countText}</p>
                    </div>
                    <div class="templates-grid">
                        ${subCardsHtml}
                    </div>
                </div>
            `;
        }).join('');

        // Generate HTML for current level link cards (topic links should be navigatable)
        const currentLinkCardsHtml = currentLinkCards.map(card => {
            // Check if this is a topic link (target points to a topic path)
            const isTopicLink = card.target && !card.target.startsWith('http');

            if (isTopicLink) {
                const managedTopic = this.templateEngine.getTopicByName?.(card.target);
                const displayName = managedTopic?.displayName || card.title;
                const description = managedTopic?.description || card.description;
                const hasDocumentation = managedTopic && managedTopic.documentation && managedTopic.documentation.trim().length > 0;

                const topicColor = managedTopic?.display?.color;
                const topicColorStyles = topicColor ?
                    `data-topic-color style="--topic-color: ${topicColor}; --topic-color-light: ${topicColor}20; --topic-color-medium: ${topicColor}80;"` : '';

                // Get content count for this topic link
                const targetTopicCards = allCards.filter(c => c.topic === card.target);
                const targetTemplateCount = targetTopicCards.filter(c => c.type === 'template').length;
                const targetLinkCount = targetTopicCards.filter(c => c.type === 'link').length;
                const targetTopicCount = targetTopicCards.filter(c => c.type === 'topic').length;

                // Check for topic links in target topic
                const targetTopicLinkCount = targetTopicCards.filter(c =>
                    c.type === 'link' && c.target && !c.target.startsWith('http')
                ).length;

                const countText = this._generateSubTopicCountText(targetTemplateCount, targetLinkCount, targetTopicCount);
                const hasTargetSubTopics = targetTopicCount > 0 || targetTopicLinkCount > 0;

                const targetCardsHtml = targetTopicCards.map(targetCard => {
                    if (targetCard.type === 'template') return this._generateTemplateCardFromCard(targetCard);
                    if (targetCard.type === 'link') return this._generateLinkCardHtml(targetCard);
                    if (targetCard.type === 'topic') return this._generateTopicCardHtml(targetCard);
                    return '';
                }).join('');

                return `
                    <div class="topic-group main-topic" data-topic="${card.target}" ${topicColorStyles}>
                        <div class="topic-header">
                            <div class="topic-title-row">
                                <h3 class="topic-title">
                                    <span class="topic-toggle"></span>
                                    <span class="topic-icon">🔗</span>
                                    ${displayName}
                                </h3>
                                <div class="topic-actions">
                                    <button class="action-btn favorite-btn"
                                            data-item-id="${card.target}"
                                            title="${this._isFavorite(card.target) ? '取消收藏' : '加入收藏'}">
                                        <span class="icon">${this._isFavorite(card.target) ? '❤️' : '♡'}</span>
                                    </button>
                                    ${hasDocumentation ? `
                                        <button class="topic-doc-btn"
                                                data-topic-name="${card.target}"
                                                title="查看 ${displayName} 的詳細說明文件">
                                            📖
                                        </button>
                                    ` : ''}
                                    ${hasTargetSubTopics ? `
                                        <button class="action-btn navigate-btn topic-navigate-btn"
                                                data-topic-path="${card.target}"
                                                title="進入 ${displayName} 主題">
                                            <span class="icon">></span>
                                        </button>
                                    ` : ''}
                                </div>
                            </div>
                            <p class="topic-description">${this._escapeHtml(description)}</p>
                            <p class="topic-count">${countText}</p>
                        </div>
                        <div class="templates-grid">
                            ${targetCardsHtml}
                        </div>
                    </div>
                `;
            } else {
                // Regular link card (non-navigatable)
                return this._generateLinkCardHtml(card);
            }
        }).filter(html => html).join('');

        // This section has been replaced by the new organization logic above

        // Wrap current level cards in a topic group container if they exist
        let currentLevelContainer = '';
        if (currentLevelCardsHtml) {
            // Get current topic info for the container
            const managedTopic = this.templateEngine.getTopicByName?.(topicPath.split('/').pop() || topicPath);
            const topicDisplayName = managedTopic?.displayName || topicPath.split('/').pop() || topicPath;

            const templateCount = currentTemplateCards.length;
            const linkCount = currentLinkCards.length;
            let countText = '';
            if (templateCount > 0 && linkCount > 0) {
                countText = `${templateCount} 個模板、${linkCount} 個連結`;
            } else if (templateCount > 0) {
                countText = `${templateCount} 個模板`;
            } else if (linkCount > 0) {
                countText = `${linkCount} 個連結`;
            }

            currentLevelContainer = `
                <div class="topic-group main-topic" data-topic="${topicPath}">
                    <div class="topic-header">
                        <div class="topic-title-row">
                            <h3 class="topic-title">
                                <span class="topic-toggle"></span>
                                ${managedTopic?.display?.icon ? `<span class="topic-icon">${managedTopic.display.icon}</span>` : '<span class="topic-icon">📁</span>'}
                                ${topicDisplayName}
                            </h3>
                        </div>
                        <p class="topic-description">${managedTopic?.description || `${topicDisplayName} 相關內容`}</p>
                        <p class="topic-count">${countText}</p>
                    </div>
                    <div class="templates-grid">
                        ${currentLevelCardsHtml}
                    </div>
                </div>
            `;
        }


        // Organize content in logical order: child topic groups first, then current level content, then remaining topics
        const result = childTopicGroupsHtml + currentLevelContainer + remainingTopicCardsHtml;

        if (!result.trim()) {
            return '<div class="topic-group"><p>沒有找到相關內容</p></div>';
        }

        return result;
    }

    private _generateTopicCardHtml(card: ExtendedCard): string {
        // Check for documentation from both the card and the managed topic
        const topicPath = card.target || card.id;

        // Extract topic name from path - for c/advanced, we need "advanced"
        const topicName = topicPath.split('/').pop() || topicPath;

        // Find the managed topic using the topic name
        let managedTopic = this.templateEngine.getTopicByName?.(topicName);

        const hasDocumentation = (card.documentation && card.documentation.trim().length > 0) ||
                                 (managedTopic && managedTopic.documentation && managedTopic.documentation.trim().length > 0);


        return `
            <div class="topic-card"
                 data-topic-path="${card.target || card.id}"
                 data-card-type="topic">
                <div class="card-header">
                    <h4 class="card-title">
                        <span class="card-icon">📁</span>
                        ${this._escapeHtml(card.title)}
                    </h4>
                    <div class="card-actions">
                        <button class="action-btn favorite-btn"
                                data-item-id="${card.target || card.id}"
                                title="${this._isFavorite(card.target || card.id) ? '取消收藏' : '加入收藏'}">
                            <span class="icon">${this._isFavorite(card.target || card.id) ? '❤️' : '♡'}</span>
                        </button>
                        ${hasDocumentation ? `
                            <button class="action-btn doc-btn"
                                    data-topic-name="${topicName}"
                                    title="查看說明文件">
                                <span class="icon">📖</span>
                            </button>
                        ` : ''}
                        <button class="action-btn navigate-btn" title="進入主題">
                            <span class="icon">></span>
                        </button>
                    </div>
                </div>
                <p class="card-description">${this._escapeHtml(card.description)}</p>
                <div class="card-footer">
                    <span class="card-type-label">主題</span>
                    <span class="language-tag">${this._getLanguageTagName(card.language)}</span>
                </div>
            </div>
        `;
    }

    private _generateLinkCardHtml(card: ExtendedCard): string {
        const hasDocumentation = card.documentation && card.documentation.trim().length > 0;
        const isTopicLink = card.target && !card.target.startsWith('http');

        // Check if this link points to a template
        const isTemplateLink = card.target && (card.target.includes('/templates/') || card.target.includes('templates/'));

        if (isTemplateLink) {
            // Extract template ID from target path
            const templateId = card.target.split('/').pop();
            // Try to find the actual template data
            const allTemplates = this.templateEngine.getAllTemplates();
            const targetTemplate = allTemplates.find(t => t.id === templateId);

            if (targetTemplate) {
                // Display as template card with link context
                const isRecommended = this._isTemplateRecommended(targetTemplate.id);
                const templateClass = isRecommended ? 'template-card recommended-template' : 'template-card';
                const templateHasDocumentation = targetTemplate.documentation && targetTemplate.documentation.trim().length > 0;
                const usageCount = this._getUsageCount(targetTemplate.id);

                return `
                    <div class="${templateClass}"
                         data-template-id="${targetTemplate.id}"
                         data-template-code="${this._escapeHtml(targetTemplate.code)}"
                         data-has-documentation="${templateHasDocumentation}"
                         data-card-type="template"
                         draggable="true">
                        <div class="card-header">
                            <h4 class="card-title">
                                <span class="card-icon">🔗</span>
                                ${this._escapeHtml(card.title)}
                            </h4>
                            <div class="card-actions template-actions">
                                ${isRecommended ? '<span class="recommended-star">⭐</span>' : ''}
                                <button class="action-btn favorite-btn"
                                        data-item-id="${targetTemplate.id}"
                                        title="${this._isFavorite(targetTemplate.id) ? '取消收藏' : '加入收藏'}">
                                    <span class="icon">${this._isFavorite(targetTemplate.id) ? '❤️' : '♡'}</span>
                                </button>
                                <button class="action-btn preview-btn" title="預覽程式碼">
                                    <span class="icon">👁️</span>
                                </button>
                                <button class="action-btn insert-btn" title="插入到遊標位置">
                                    <span class="icon">＋</span>
                                </button>
                            </div>
                        </div>
                        <p class="card-description">${this._escapeHtml(card.description || targetTemplate.description)}</p>
                        <div class="card-footer">
                            <span class="card-type-label">模板連結</span>
                            ${isRecommended && usageCount > 0 ? `<span class="usage-count" style="opacity: 0.6;">已使用 ${usageCount} 次</span>` : ''}
                            <span class="language-tag">${this._getLanguageTagName(targetTemplate.language)}</span>
                        </div>
                    </div>
                `;
            }
        }

        // Regular link display (for non-template links or when template not found)
        return `
            <div class="link-card ${isTopicLink ? 'topic-link' : 'external-link'}"
                 data-link-target="${card.target}"
                 data-card-type="link">
                <div class="card-header">
                    <h4 class="card-title">
                        <span class="card-icon">🔗</span>
                        ${this._escapeHtml(card.title)}
                    </h4>
                    <div class="card-actions">
                        <button class="action-btn favorite-btn"
                                data-item-id="${card.id}"
                                title="${this._isFavorite(card.id) ? '取消收藏' : '加入收藏'}">
                            <span class="icon">${this._isFavorite(card.id) ? '❤️' : '♡'}</span>
                        </button>
                        ${hasDocumentation ? `
                            <button class="action-btn doc-btn"
                                    data-link-id="${card.id}"
                                    title="查看說明文件">
                                <span class="icon">📖</span>
                            </button>
                        ` : ''}
                        <button class="action-btn navigate-btn" title="${isTopicLink ? '進入主題' : '開啟連結'}">
                            <span class="icon">${isTopicLink ? '>' : '↗️'}</span>
                        </button>
                    </div>
                </div>
                <p class="card-description">${this._escapeHtml(card.description)}</p>
                <div class="card-footer">
                    <span class="card-type-label">主題連結</span>
                    <span class="language-tag">${this._getLanguageTagName(card.language)}</span>
                </div>
            </div>
        `;
    }

    private _generateTemplateCardFromCard(card: ExtendedCard): string {
        // Check if this template is recommended
        const isRecommended = this._isTemplateRecommended(card.id);
        const templateClass = isRecommended ? 'template-card recommended-template' : 'template-card';
        const hasDocumentation = card.documentation && card.documentation.trim().length > 0;
        const usageCount = this._getUsageCount(card.id);

        return `
            <div class="${templateClass}"
                 data-template-id="${card.id}"
                 data-template-code="${this._escapeHtml(card.code || '')}"
                 data-has-documentation="${hasDocumentation}"
                 data-card-type="template"
                 draggable="true">
                <div class="card-header">
                    <h4 class="card-title">
                        <span class="card-icon">📄</span>
                        ${this._escapeHtml(card.title)}
                    </h4>
                    <div class="card-actions template-actions">
                        ${isRecommended ? '<span class="recommended-star">⭐</span>' : ''}
                        <button class="action-btn favorite-btn"
                                data-item-id="${card.id}"
                                title="${this._isFavorite(card.id) ? '取消收藏' : '加入收藏'}">
                            <span class="icon">${this._isFavorite(card.id) ? '❤️' : '♡'}</span>
                        </button>
                        <button class="action-btn preview-btn" title="預覽程式碼">
                            <span class="icon">👁️</span>
                        </button>
                        <button class="action-btn insert-btn" title="插入到遊標位置">
                            <span class="icon">＋</span>
                        </button>
                    </div>
                </div>
                <p class="card-description">${this._escapeHtml(card.description)}</p>
                <div class="card-footer">
                    <span class="card-type-label">模板</span>
                    ${isRecommended && usageCount > 0 ? `<span class="usage-count" style="opacity: 0.6;">已使用 ${usageCount} 次</span>` : ''}
                    <span class="language-tag">${this._getLanguageTagName(card.language)}</span>
                </div>
            </div>
        `;
    }

    private _generateCardCountText(topicCount: number, templateCount: number, linkCount: number): string {
        const counts = [];
        if (topicCount > 0) counts.push(`${topicCount} 個主題`);
        if (templateCount > 0) counts.push(`${templateCount} 個模板`);
        if (linkCount > 0) counts.push(`${linkCount} 個連結`);
        return counts.join('、');
    }

    private _getSubtopicCounts(mainTopic: string, allCards: ExtendedCard[]): {[key: string]: number} {
        const subtopicCounts: {[key: string]: number} = {};

        allCards.forEach(card => {
            if (card.topic.startsWith(mainTopic + '/')) {
                const subtopic = card.topic.split('/')[1];
                if (subtopic) {
                    subtopicCounts[subtopic] = (subtopicCounts[subtopic] || 0) + 1;
                }
            }
        });

        return subtopicCounts;
    }

    private _generateMainTopicCountText(topicCount: number, templateCount: number, linkCount: number, subtopicCounts: {[key: string]: number}): string {
        const counts = [];
        if (topicCount > 0) counts.push(`${topicCount} 個主題`);
        if (templateCount > 0) counts.push(`${templateCount} 個模板`);
        if (linkCount > 0) counts.push(`${linkCount} 個連結`);

        const subtopicTemplateCount = Object.values(subtopicCounts).reduce((sum, count) => sum + count, 0);
        if (subtopicTemplateCount > 0) {
            counts.push(`子主題 ${subtopicTemplateCount} 個項目`);
        }

        return counts.join('、') || '無內容';
    }

    private _generateSubTopicCountText(templateCount: number, linkCount: number, topicCount?: number): string {
        const counts = [];
        if (topicCount && topicCount > 0) counts.push(`${topicCount} 個主題`);
        if (templateCount > 0) counts.push(`${templateCount} 個模板`);
        if (linkCount > 0) counts.push(`${linkCount} 個連結`);
        return counts.join('、') || '無內容';
    }

    private _escapeHtml(text: string | undefined | null): string {
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

    private getNonce(): string {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }

}
