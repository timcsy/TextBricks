import * as vscode from 'vscode';
import * as path from 'path';
import { TextBricksEngine, DataPathService, CodeOperationService, DocumentationService } from '@textbricks/core';
import { DocumentationPanelProvider } from '../documentation-panel/DocumentationPanelProvider';
import { Template, Language } from '@textbricks/shared';
import { VSCodePlatform } from '../../adapters/vscode/VSCodePlatform';

// Actions
import { InsertActions } from './actions/InsertActions';
import { FavoriteActions } from './actions/FavoriteActions';
import { RecommendationActions } from './actions/RecommendationActions';
import { NavigationActions } from './actions/NavigationActions';

// Renderers
import { NavigationRenderer } from './renderers/NavigationRenderer';
import { RecommendationRenderer } from './renderers/RecommendationRenderer';
import { TopicRenderer } from './renderers/TopicRenderer';
import { CardRenderer } from './renderers/CardRenderer';

// Message Handler
import { TemplateMessageHandler } from './TemplateMessageHandler';

interface PartialScopeConfig {
    languages?: Language[];
    favorites?: string[];
    usage?: Record<string, number>;
}

type ItemWithPath = Template & { topicPath?: string };

/**
 * TemplatesPanelProvider - 模板面板視圖提供者
 *
 * 負責管理 Templates Panel 的 Webview，整合 Actions 和 Renderers
 */
export class TemplatesPanelProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'textbricks-webview';

    private _view?: vscode.WebviewView;
    private _documentationProvider?: DocumentationPanelProvider;
    private _currentTopicPath: string = '';
    private _scopeConfig: PartialScopeConfig | null = null;
    private platform: VSCodePlatform;

    // Actions
    private insertActions: InsertActions;
    private favoriteActions: FavoriteActions;
    private recommendationActions: RecommendationActions;
    private navigationActions: NavigationActions;

    // Renderers
    private navigationRenderer: NavigationRenderer;
    private recommendationRenderer: RecommendationRenderer;
    private topicRenderer: TopicRenderer;
    private cardRenderer: CardRenderer;

    // Message Handler
    private messageHandler: TemplateMessageHandler;

    constructor(
        private readonly _extensionUri: vscode.Uri,
        private readonly templateEngine: TextBricksEngine,
        private readonly _context: vscode.ExtensionContext,
        private readonly codeOperationService: CodeOperationService,
        private readonly documentationService: DocumentationService,
        private readonly dataPathService: DataPathService,
        private readonly managementService?: TextBricksEngine
    ) {
        this.platform = this.templateEngine.getPlatform() as VSCodePlatform;

        // Initialize documentation provider
        this._documentationProvider = new DocumentationPanelProvider(
            this._extensionUri,
            this.templateEngine,
            this.documentationService,
            this.codeOperationService
        );

        // Initialize Actions
        this.insertActions = new InsertActions(this.platform);
        this.favoriteActions = new FavoriteActions(
            this.templateEngine,
            this.dataPathService,
            this.platform,
            () => this._currentTopicPath
        );
        this.recommendationActions = new RecommendationActions(
            () => this._scopeConfig
        );
        this.navigationActions = new NavigationActions(
            this.templateEngine,
            this.platform,
            () => this._currentTopicPath,
            (path: string) => { this._currentTopicPath = path; },
            () => this.refresh()
        );

        // Initialize CardRenderer (needed by other renderers)
        this.cardRenderer = new CardRenderer(
            this.templateEngine,
            (lang) => this._getLanguageTagName(lang),
            (id) => this._isFavorite(id),
            (id) => this._getUsageCount(id),
            (path) => this._isTemplateRecommended(path)
        );

        // Initialize other Renderers
        this.navigationRenderer = new NavigationRenderer(
            this.templateEngine,
            () => this._currentTopicPath,
            () => this.navigationActions.getBrowsingHistory(),
            () => this.navigationActions.getHistoryIndex()
        );

        this.recommendationRenderer = new RecommendationRenderer(
            (template, type) => this.cardRenderer.generateRecommendedTemplateCardHtml(template, type),
            (card) => this.cardRenderer.generateTopicCardHtml(card),
            (card) => this.cardRenderer.generateLinkCardHtml(card)
        );

        this.topicRenderer = new TopicRenderer(
            this.templateEngine,
            this.platform,
            () => this._currentTopicPath,
            (id) => this._isFavorite(id),
            (card) => this.cardRenderer.generateTopicCardHtml(card),
            (card) => this.cardRenderer.generateLinkCardHtml(card),
            (card) => this.cardRenderer.generateTemplateCardFromCard(card),
            (text) => this.cardRenderer.escapeHtml(text)
        );

        // Initialize Message Handler
        this.messageHandler = new TemplateMessageHandler(
            this.templateEngine,
            this.codeOperationService,
            this.insertActions,
            this.favoriteActions,
            this.navigationActions,
            this._documentationProvider
        );

        // 監聽 usage 更新事件，動態更新使用次數
        const scopeManager = this.templateEngine.getScopeManager();
        scopeManager.addEventListener(event => {
            if (event.type === 'usage-updated') {
                this.platform.logInfo(`Usage updated: ${event.itemPath} -> ${event.newCount}`, 'TemplatesPanelProvider');
                // 發送訊息給 webview，動態更新使用次數
                if (this._view) {
                    this._view.webview.postMessage({
                        type: 'usageUpdated',
                        itemPath: event.itemPath,
                        newCount: event.newCount
                    });
                }
            }
        });
    }

    /**
     * 載入 Scope 配置
     */
    private async _loadScopeConfig(): Promise<void> {
        try {
            const fs = require('fs').promises;
            const localScopePath = await this.dataPathService.getScopePath('local');
            const scopePath = path.join(localScopePath, 'scope.json');
            const scopeData = await fs.readFile(scopePath, 'utf8');
            this._scopeConfig = JSON.parse(scopeData);
        } catch (error) {
            this.platform.logError(error as Error, 'TemplatesPanelProvider._loadScopeConfig');
            this._scopeConfig = { languages: [], favorites: [], usage: {} };
        }
    }

    /**
     * 獲取語言標籤名稱
     */
    private _getLanguageTagName(languageName: string): string {
        if (!this._scopeConfig) {
            return languageName.toUpperCase();
        }

        const language = this._scopeConfig.languages?.find(lang => lang.name === languageName);
        return language?.tagName || languageName.toUpperCase();
    }

    /**
     * 獲取收藏列表（委託給 FavoriteActions）
     */
    private _getFavorites(): string[] {
        return this.favoriteActions.getFavorites();
    }

    /**
     * 獲取使用次數
     */
    private _getUsageCount(itemId: string): number {
        return this._scopeConfig?.usage?.[itemId] || 0;
    }

    /**
     * 檢查是否為收藏（委託給 FavoriteActions）
     */
    private _isFavorite(itemId: string): boolean {
        return this.favoriteActions.isFavorite(itemId);
    }

    /**
     * 檢查模板是否被推薦
     */
    private _isTemplateRecommended(templatePath: string): boolean {
        if (!this.managementService) {
            return false;
        }

        try {
            const recommendedTemplates = this.managementService.getRecommendedTemplates(6);
            return recommendedTemplates.some(template => {
                const tPath = (template as any).topicPath ? `${(template as any).topicPath}/templates/${template.name}` : template.name;
                return tPath === templatePath;
            });
        } catch (error) {
            return false;
        }
    }

    /**
     * 解析 Webview 視圖
     */
    public async resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;

        // Load scope configuration and favorite actions
        await this._loadScopeConfig();
        await this.favoriteActions.loadScopeConfig();

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                this._extensionUri
            ]
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        // Handle messages from the webview using the message handler
        webviewView.webview.onDidReceiveMessage(
            async (message) => {
                await this.messageHandler.handleMessage(message);

                // Handle special cases that need webview updates
                if (message.type === 'toggleFavorite') {
                    // Reload favorites to get updated state
                    await this.favoriteActions.loadScopeConfig();

                    // Send update message to frontend
                    if (this._view) {
                        this._view.webview.postMessage({
                            type: 'favoriteToggled',
                            itemId: message.itemId,
                            isFavorite: this._isFavorite(message.itemId)
                        });
                    }

                    // Also refresh the favorites tab content
                    const favoriteItems = this.favoriteActions.getFavoriteItemsForDisplay();
                    const favoriteHtml = this.recommendationRenderer.generateUpdatedFavoritesContent(favoriteItems);

                    if (this._view) {
                        this._view.webview.postMessage({
                            type: 'updateFavoritesContent',
                            content: favoriteHtml
                        });
                    }
                } else if (message.type === 'refreshFavoritesTab') {
                    // Reload favorites first
                    await this.favoriteActions.loadScopeConfig();

                    // Generate updated favorites content
                    const favoriteItems = this.favoriteActions.getFavoriteItemsForDisplay();
                    const favoriteHtml = this.recommendationRenderer.generateUpdatedFavoritesContent(favoriteItems);

                    // Send updated content to frontend
                    if (this._view) {
                        this._view.webview.postMessage({
                            type: 'updateFavoritesContent',
                            content: favoriteHtml
                        });
                    }
                }
            },
            undefined,
            []
        );
    }

    /**
     * 刷新視圖
     */
    public async refresh(preserveNavigationState: boolean = false) {
        if (this._view) {
            this.platform.logInfo(`Starting refresh... ${preserveNavigationState ? '(preserving navigation state)' : '(normal refresh)'}`, 'TemplatesPanelProvider.refresh');

            // 保存當前導航狀態
            const savedNavState = {
                currentTopicPath: this._currentTopicPath,
                browsingHistory: [...this.navigationActions.getBrowsingHistory()],
                historyIndex: this.navigationActions.getHistoryIndex()
            };

            this.platform.logInfo(`Current state before operation: ${JSON.stringify(savedNavState)}`, 'TemplatesPanelProvider.refresh');

            // 強制重新載入模板數據
            await this.templateEngine.forceReloadTemplates();

            // 如果需要保持導航狀態，恢復之前的狀態
            if (preserveNavigationState) {
                this._currentTopicPath = savedNavState.currentTopicPath;
                this.platform.logInfo(`Navigation state preserved and restored: ${this._currentTopicPath}`, 'TemplatesPanelProvider.refresh');
            } else {
                this.platform.logInfo('Normal refresh - navigation state may change based on HTML generation', 'TemplatesPanelProvider.refresh');
            }

            // 重新生成 HTML
            this._view.webview.html = this._getHtmlForWebview(this._view.webview);

            this.platform.logInfo(`Templates refreshed successfully. Final currentTopicPath: ${this._currentTopicPath}`, 'TemplatesPanelProvider.refresh');
        }
    }

    /**
     * 生成 Webview 的 HTML
     */
    private _getHtmlForWebview(webview: vscode.Webview): string {
        const topics = this.templateEngine.getTopics();

        // Get CSS and JS URIs
        const variablesUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'assets', 'css', 'common', 'variables.css'));
        const componentsUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'assets', 'css', 'common', 'components.css'));
        const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'assets', 'css', 'templates-panel', 'templates-panel.css'));
        const utilsUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'assets', 'js', 'common', 'utils.js'));

        // Templates Panel Modular Scripts
        const templateOperationsUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'assets', 'js', 'templates-panel', 'template-operations.js'));
        const dragDropHandlerUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'assets', 'js', 'templates-panel', 'drag-drop-handler.js'));
        const navigationHandlerUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'assets', 'js', 'templates-panel', 'navigation-handler.js'));
        const panelEventHandlersUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'assets', 'js', 'templates-panel', 'panel-event-handlers.js'));
        const tooltipManagerUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'assets', 'js', 'templates-panel', 'tooltip-manager.js'));
        const templatesPanelUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'assets', 'js', 'templates-panel', 'templates-panel.js'));

        const nonce = this.getNonce();

        // Generate recommended templates using RecommendationActions
        const allTemplates = this.templateEngine.getAllTemplates() as ItemWithPath[];
        const currentTopicItems = this.navigationActions.filterCurrentTopicItems(allTemplates);
        // Filter to only include templates (type check and cast)
        const currentTopicTemplates = currentTopicItems.filter((item): item is ItemWithPath =>
            'type' in item && item.type === 'template'
        );
        const recommendedTemplates = this.recommendationActions.getRecommendedByUsage(currentTopicTemplates, 6);
        const favoriteItems = this.favoriteActions.getFavoriteItemsForDisplay();

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
                    ${this.navigationRenderer.generateNavigationButtonsHtml()}
                </div>
                <nav class="breadcrumb">
                    ${this.navigationRenderer.generateBreadcrumbHtml()}
                </nav>
            </div>
        </div>
    </div>

    <div class="container">
        ${this.recommendationRenderer.generateRecommendedTemplatesHtml(recommendedTemplates, favoriteItems)}
        ${this.topicRenderer.generateTopicsHtml(topics)}
    </div>

    <!-- Common utilities -->
    <script nonce="${nonce}" src="${utilsUri}"></script>

    <!-- Templates Panel modular scripts (loaded in dependency order) -->
    <script nonce="${nonce}" src="${templateOperationsUri}"></script>
    <script nonce="${nonce}" src="${dragDropHandlerUri}"></script>
    <script nonce="${nonce}" src="${navigationHandlerUri}"></script>
    <script nonce="${nonce}" src="${panelEventHandlersUri}"></script>
    <script nonce="${nonce}" src="${tooltipManagerUri}"></script>
    <script nonce="${nonce}" src="${templatesPanelUri}"></script>
</body>
</html>`;
    }

    /**
     * 生成隨機 nonce
     */
    private getNonce(): string {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }
}
