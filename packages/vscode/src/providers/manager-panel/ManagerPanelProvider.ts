import * as vscode from 'vscode';
import {
    TextBricksEngine,
    ScopeManager,
    TopicManager,
    DataPathService,
    PathTransformService,
    DisplayNameService
} from '@textbricks/core';
import {
    ExtendedTemplate,
    Language,
    ScopeConfig,
    ScopeUsageStats,
    TopicConfig,
    TopicHierarchy,
    DataLocationInfo,
    DataLocationOption,
    DataMigrationResult
} from '@textbricks/shared';
import { VSCodePlatform } from '../../adapters/vscode/VSCodePlatform';
import { DocumentationPanelProvider } from '../documentation-panel/DocumentationPanelProvider';
import { ScopeActions } from './actions/ScopeActions';
import { TopicActions } from './actions/TopicActions';
import { TemplateActions } from './actions/TemplateActions';
import { LinkActions } from './actions/LinkActions';
import { LanguageActions } from './actions/LanguageActions';
import { SettingsActions } from './actions/SettingsActions';
import { ImportExportActions } from './actions/ImportExportActions';
import { ManagerMessageHandler } from './actions/ManagerMessageHandler';

// Message type definition with index signature for flexibility
interface WebviewMessage {
    type: string;
    [key: string]: unknown;
}

export class ManagerPanelProvider {
    public static readonly viewType = 'textbricks-manager';

    private _panel?: vscode.WebviewPanel;
    private _disposables: vscode.Disposable[] = [];
    private scopeManager: ScopeManager;
    private topicManager: TopicManager;
    private dataPathService: DataPathService;
    private platform: VSCodePlatform;

    // Services
    private pathTransformService: PathTransformService;
    private displayNameService: DisplayNameService;

    // Action classes
    private scopeActions: ScopeActions;
    private topicActions: TopicActions;
    private templateActions: TemplateActions;
    private linkActions: LinkActions;
    private languageActions: LanguageActions;
    private settingsActions: SettingsActions;
    private importExportActions: ImportExportActions;
    private messageHandler: ManagerMessageHandler;

    private initializationPromise: Promise<void>;

    constructor(
        private readonly _extensionUri: vscode.Uri,
        private readonly templateEngine: TextBricksEngine,
        private readonly context: vscode.ExtensionContext,
        scopeManager?: ScopeManager,
        topicManager?: TopicManager,
        dataPathService?: DataPathService,
        private readonly webviewProvider?: { refresh(preserveNavigationState?: boolean): Promise<void> }, // WebviewProvider or TemplatesPanelProvider
        private readonly documentationProvider?: DocumentationPanelProvider
    ) {
        this.platform = new VSCodePlatform(context);
        this.dataPathService = dataPathService || DataPathService.getInstance(this.platform);
        this.scopeManager = scopeManager || new ScopeManager(this.platform, this.dataPathService);
        this.topicManager = topicManager || new TopicManager(this.platform, this.dataPathService);

        // 初始化 Services
        this.pathTransformService = new PathTransformService(this.platform);
        this.displayNameService = new DisplayNameService();

        // 初始化 Action classes
        this.scopeActions = new ScopeActions(
            this.platform,
            this.scopeManager,
            this._panel,
            () => this._sendData()
        );

        this.topicActions = new TopicActions(
            this.platform,
            this.topicManager,
            () => this._sendData(),
            this.webviewProvider,
            this._panel
        );

        this.templateActions = new TemplateActions(
            this.platform,
            this.templateEngine,
            this.scopeManager,
            () => this._sendData(),
            this.webviewProvider,
            this._panel
        );

        this.linkActions = new LinkActions(
            this.platform,
            this.dataPathService,
            () => this._sendData(),
            this.webviewProvider,
            this._panel
        );

        this.languageActions = new LanguageActions(
            this.platform,
            this.templateEngine,
            () => this._sendData()
        );

        this.settingsActions = new SettingsActions(
            this.platform,
            this.dataPathService,
            this._panel,
            () => this._sendData()
        );

        this.importExportActions = new ImportExportActions(
            this.platform,
            this.templateEngine,
            () => this._sendData()
        );

        // 初始化 MessageHandler
        this.messageHandler = new ManagerMessageHandler(
            this.platform,
            this.scopeActions,
            this.topicActions,
            this.templateActions,
            this.linkActions,
            this.languageActions,
            this.settingsActions,
            this.importExportActions,
            this.pathTransformService,
            this.displayNameService,
            this._panel,
            this.documentationProvider,
            () => this._sendData()
        );

        // 啟動初始化但不等待
        this.initializationPromise = this.initializeManagers();
    }

    private async initializeManagers(): Promise<void> {
        try {
            await this.platform.initialize();

            // 如果管理器是外部注入的，它們應該已經初始化了
            // 只有當我們自己創建時才需要初始化
            if (!arguments[3]) { // 如果沒有傳入 scopeManager
                await this.dataPathService.initialize();
                await this.scopeManager.initialize();
                await this.topicManager.initialize();
            }

            // 監聽 scope 切換事件
            this.scopeManager.addEventListener(event => {
                if (event.type === 'scope-switched') {
                    this.topicManager.setScopeId(event.scopeId);
                    this.topicManager.initialize();
                    this._sendData();
                } else if (event.type === 'usage-updated') {
                    // Usage 更新後重新發送數據，讓 Manager 面板即時更新
                    this.platform.logInfo(`Usage updated event received for ${event.itemPath}, new count: ${event.newCount}`, 'ManagerPanelProvider');
                    this._sendData();
                }
            });
        } catch (error) {
            this.platform.logError(error as Error, 'ManagerPanelProvider.initializeManagers');
        }
    }

    public createOrShow() {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        // If we already have a panel, show it.
        if (this._panel) {
            this._panel.reveal(column);
            return;
        }

        // Otherwise, create a new panel.
        this._panel = vscode.window.createWebviewPanel(
            ManagerPanelProvider.viewType,
            'TextBricks Manager',
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [this._extensionUri]
            }
        );

        this._panel.webview.html = this._getHtmlForWebview(this._panel.webview);

        // Update action classes and message handler with the new panel reference
        this.updatePanelReferences(this._panel);

        // Handle messages from the webview
        this._panel.webview.onDidReceiveMessage(
            message => this.messageHandler.handleMessage(message),
            null,
            this._disposables
        );

        // Reset when the current panel is closed
        this._panel.onDidDispose(
            () => this._onPanelDisposed(),
            null,
            this._disposables
        );
    }

    private updatePanelReferences(panel: vscode.WebviewPanel) {
        // Update action classes with new panel reference
        this.scopeActions = new ScopeActions(
            this.platform,
            this.scopeManager,
            panel,
            () => this._sendData()
        );

        this.settingsActions = new SettingsActions(
            this.platform,
            this.dataPathService,
            panel,
            () => this._sendData()
        );

        this.topicActions = new TopicActions(
            this.platform,
            this.topicManager,
            () => this._sendData(),
            this.webviewProvider,
            panel
        );

        this.templateActions = new TemplateActions(
            this.platform,
            this.templateEngine,
            this.scopeManager,
            () => this._sendData(),
            this.webviewProvider,
            panel
        );

        this.linkActions = new LinkActions(
            this.platform,
            this.dataPathService,
            () => this._sendData(),
            this.webviewProvider,
            panel
        );

        // Recreate message handler with updated action classes
        this.messageHandler = new ManagerMessageHandler(
            this.platform,
            this.scopeActions,
            this.topicActions,
            this.templateActions,
            this.linkActions,
            this.languageActions,
            this.settingsActions,
            this.importExportActions,
            this.pathTransformService,
            this.displayNameService,
            panel,
            this.documentationProvider,
            () => this._sendData()
        );
    }

    private _onPanelDisposed() {
        this._panel = undefined;

        // Clean up our resources
        while (this._disposables.length) {
            const disposable = this._disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }

    private async _sendData() {
        this.platform.logInfo('_sendData called', 'ManagerPanelProvider');

        // 等待初始化完成
        try {
            await this.initializationPromise;
            this.platform.logInfo('Managers initialized successfully', 'ManagerPanelProvider');
        } catch (initError) {
            this.platform.logError(initError as Error, 'ManagerPanelProvider._sendData.init');
        }

        if (!this._panel) {
            this.platform.logWarning('_panel is null, cannot send data', 'ManagerPanelProvider');
            return;
        }

        if (this._panel) {
            try {
                // 重新初始化 TopicManager 以重新加載連結
                this.platform.logInfo('Reinitializing TopicManager to reload links', 'ManagerPanelProvider');
                await this.topicManager.initialize();

                // 更新 Services 的數據源
                await this._updateServicesData();

                // 獲取基本的模板和語言資料
                const templateManager = this.templateEngine.getTemplateManager();
                const templates = templateManager.getAllTemplates();
                const languages = templateManager.getLanguages();

                // 嘗試獲取新的管理器數據，如果失敗則使用默認值
                let currentScope = null;
                let availableScopes: unknown[] = [];
                let usageStats = null;
                let favorites: unknown[] = [];
                let topicHierarchy = null;
                let topicStats = null;

                try {
                    currentScope = this.cleanCircularReferences(this.scopeManager.getCurrentScope());
                    availableScopes = this.cleanCircularReferences(this.scopeManager.getAvailableScopes()) as unknown[];
                    usageStats = this.cleanCircularReferences(this.scopeManager.getUsageStats());
                    favorites = this.cleanCircularReferences(this.scopeManager.getFavorites()) as unknown[];
                } catch (scopeError) {
                    this.platform.logWarning(`ScopeManager error: ${scopeError}`, 'ManagerPanelProvider');
                    // 使用默認的 scope 數據
                    currentScope = { id: 'local', name: '本機範圍', type: 'local' };
                    availableScopes = [currentScope];
                    favorites = [];
                }

                try {
                    const rawHierarchy = this.topicManager.getHierarchy();
                    this.platform.logInfo(`Raw hierarchy roots: ${rawHierarchy?.roots?.length}`, 'ManagerPanelProvider');
                    if (rawHierarchy?.roots?.[0]) {
                        this.platform.logInfo(`First root topic: ${rawHierarchy.roots[0].topic.name}, loadedLinks: ${(rawHierarchy.roots[0].topic as any).loadedLinks?.length}`, 'ManagerPanelProvider');
                    }
                    // 清理循環引用：移除 parent 屬性，保留結構
                    topicHierarchy = this.cleanCircularReferences(rawHierarchy);
                    this.platform.logInfo(`Cleaned hierarchy roots: ${topicHierarchy?.roots?.length}`, 'ManagerPanelProvider');
                    if (topicHierarchy?.roots?.[0]) {
                        this.platform.logInfo(`First cleaned root topic: ${topicHierarchy.roots[0].topic.name}, loadedLinks: ${(topicHierarchy.roots[0].topic as any).loadedLinks?.length}`, 'ManagerPanelProvider');
                    }
                    topicStats = this.cleanCircularReferences(this.topicManager.getStatistics());
                } catch (topicError) {
                    this.platform.logWarning(`TopicManager error: ${topicError}`, 'ManagerPanelProvider');
                    // 從現有模板數據構建簡單的主題統計
                    const topics = [...new Set(templates.map(t => (t as any).topicPath || t.language))];
                    topicStats = {
                        totalTopics: topics.length,
                        activeTopics: topics.length
                    };
                }

                this.platform.logInfo('Sending dataLoaded message with fallback data...', 'ManagerPanelProvider');

                const dataToSend = {
                    type: 'dataLoaded',
                    data: {
                        // 傳統數據
                        templates,
                        languages,

                        // 新的數據結構（帶備用值）
                        scope: {
                            current: currentScope,
                            available: availableScopes,
                            usageStats,
                            favorites
                        },
                        topics: {
                            hierarchy: topicHierarchy,
                            statistics: topicStats
                        }
                    }
                };

                // 安全地發送消息，避免循環引用
                try {
                    // 先測試是否可以序列化
                    JSON.stringify(dataToSend);
                    this._panel.webview.postMessage(dataToSend);
                    this.platform.logInfo('dataLoaded message sent successfully', 'ManagerPanelProvider');
                } catch (jsonError) {
                    this.platform.logError(jsonError as Error, 'ManagerPanelProvider._sendData.serialize');
                    // 發送簡化版本
                    this._panel.webview.postMessage({
                        type: 'dataLoaded',
                        data: {
                            templates: templates || [],
                            languages: languages || [],
                            scope: {
                                current: { id: 'local', name: '本機範圍', type: 'local' },
                                available: [{ id: 'local', name: '本機範圍', type: 'local' }],
                                usageStats: null,
                                favorites: []
                            },
                            topics: {
                                hierarchy: null,
                                statistics: { totalTopics: 0, activeTopics: 0 }
                            }
                        }
                    });
                    this.platform.logInfo('Simplified dataLoaded message sent', 'ManagerPanelProvider');
                }
            } catch (error) {
                this.platform.logError(error as Error, 'ManagerPanelProvider._sendData');

                // 發送錯誤消息，但仍嘗試提供基本數據
                this._panel.webview.postMessage({
                    type: 'dataLoaded',
                    data: {
                        templates: [],
                        languages: [],
                        scope: {
                            current: { id: 'local', name: '本機範圍', type: 'local' },
                            available: [{ id: 'local', name: '本機範圍', type: 'local' }],
                            usageStats: null,
                            favorites: []
                        },
                        topics: {
                            hierarchy: null,
                            statistics: { totalTopics: 0, activeTopics: 0 }
                        }
                    }
                });

                this._panel.webview.postMessage({
                    type: 'error',
                    message: 'Failed to load data: ' + (error instanceof Error ? error.message : String(error))
                });
            }
        } else {
            this.platform.logInfo('No panel available', 'ManagerPanelProvider');
        }
    }

    private cleanCircularReferences(obj: unknown): unknown {
        if (!obj || typeof obj !== 'object') {
            return obj;
        }

        if (Array.isArray(obj)) {
            return obj.map(item => this.cleanCircularReferences(item));
        }

        const cleaned: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(obj)) {
            // 跳過可能造成循環引用的屬性
            if (key === 'parent') {
                continue;
            }

            if (key === 'children' && Array.isArray(value)) {
                // 對 children 進行深度清理
                cleaned[key] = value.map(child => this.cleanCircularReferences(child));
            } else if (typeof value === 'object' && value !== null) {
                cleaned[key] = this.cleanCircularReferences(value);
            } else {
                cleaned[key] = value;
            }
        }

        return cleaned;
    }

    /**
     * 更新 Services 的數據源（當數據重新載入時調用）
     */
    private async _updateServicesData() {
        try {
            // 獲取最新的主題和語言數據
            const topics = this.templateEngine.getAllTopicConfigs();
            const languages = this.templateEngine.getLanguages();
            const templates = this.templateEngine.getTemplateManager().getAllTemplates();

            // 更新 PathTransformService
            const topicsMap = new Map();
            topics.forEach(topic => {
                const topicWithPath = topic as any;
                if (topicWithPath.path) {
                    const pathKey = Array.isArray(topicWithPath.path)
                        ? topicWithPath.path.join('/')
                        : topicWithPath.path;
                    topicsMap.set(pathKey, topic);
                }
                topicsMap.set(topic.name, topic);
            });
            this.pathTransformService.updateTopicsMap(topicsMap);

            // 更新 DisplayNameService
            this.displayNameService.updateLanguages(languages);
            this.displayNameService.updateTopics(topics);
        } catch (error) {
            this.platform.logError(error as Error, 'ManagerPanelProvider._updateServicesData');
        }
    }

    private _getHtmlForWebview(webview: vscode.Webview): string {
        const variablesUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'assets', 'css', 'common', 'variables.css')
        );
        const componentsUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'assets', 'css', 'common', 'components.css')
        );
        const styleUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'assets', 'css', 'manager-panel', 'manager-panel.css')
        );
        const utilsUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'assets', 'js', 'common', 'utils.js')
        );
        const uiStateServiceUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'assets', 'js', 'manager-panel', 'utils', 'ui-state-service.js')
        );
        const treeBuilderServiceUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'assets', 'js', 'manager-panel', 'utils', 'tree-builder-service.js')
        );

        // Manager modules - Utils
        const pathHelpersUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'assets', 'js', 'manager-panel', 'utils', 'path-helpers.js')
        );
        const dataHelpersUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'assets', 'js', 'manager-panel', 'utils', 'data-helpers.js')
        );

        // Manager modules - Core
        const stateManagerUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'assets', 'js', 'manager-panel', 'core', 'state-manager.js')
        );
        const messageHandlerUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'assets', 'js', 'manager-panel', 'core', 'message-handler.js')
        );

        // Manager modules - Handlers
        const templateHandlersUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'assets', 'js', 'manager-panel', 'handlers', 'template-handlers.js')
        );
        const topicHandlersUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'assets', 'js', 'manager-panel', 'handlers', 'topic-handlers.js')
        );
        const favoritesHandlersUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'assets', 'js', 'manager-panel', 'handlers', 'favorites-handlers.js')
        );
        const linkHandlersUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'assets', 'js', 'manager-panel', 'handlers', 'link-handlers.js')
        );
        const contextMenuHandlerUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'assets', 'js', 'manager-panel', 'handlers', 'context-menu-handler.js')
        );
        const treeNavigationHandlerUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'assets', 'js', 'manager-panel', 'handlers', 'tree-navigation-handler.js')
        );
        const documentationHandlerUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'assets', 'js', 'manager-panel', 'handlers', 'documentation-handler.js')
        );
        const buttonHandlerUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'assets', 'js', 'manager-panel', 'handlers', 'button-handler.js')
        );

        // Manager modules - Core (Event Coordinator)
        const eventCoordinatorUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'assets', 'js', 'manager-panel', 'core', 'event-coordinator.js')
        );

        // Manager modules - UI
        const modalManagerUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'assets', 'js', 'manager-panel', 'ui', 'modal-manager.js')
        );
        const formGeneratorUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'assets', 'js', 'manager-panel', 'ui', 'form-generator.js')
        );

        // Manager modules - Renderers
        const overviewRendererUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'assets', 'js', 'manager-panel', 'ui', 'renderers', 'overview-renderer.js')
        );
        const statsRendererUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'assets', 'js', 'manager-panel', 'ui', 'renderers', 'stats-renderer.js')
        );
        const favoritesRendererUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'assets', 'js', 'manager-panel', 'ui', 'renderers', 'favorites-renderer.js')
        );
        const contentRendererUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'assets', 'js', 'manager-panel', 'ui', 'renderers', 'content-renderer.js')
        );
        const languagesRendererUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'assets', 'js', 'manager-panel', 'ui', 'renderers', 'languages-renderer.js')
        );
        const settingsRendererUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'assets', 'js', 'manager-panel', 'ui', 'renderers', 'settings-renderer.js')
        );

        // Manager main coordinator
        const managerUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'assets', 'js', 'manager-panel', 'manager.js')
        );

        const nonce = this._getNonce();

        return `<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}' 'unsafe-inline'; img-src ${webview.cspSource} data:;">
    <link href="${variablesUri}" rel="stylesheet">
    <link href="${componentsUri}" rel="stylesheet">
    <link href="${styleUri}" rel="stylesheet">
    <title>TextBricks Manager</title>
</head>
<body>
    <div id="app">
        <div class="header">
            <div class="header-left">
                <h1>TextBricks Manager</h1>
                <div class="scope-selector-container">
                    <label for="scope-selector">範圍:</label>
                    <select id="scope-selector" class="scope-selector">
                        <option value="local">本機範圍</option>
                    </select>
                    <span id="current-scope-display" class="scope-display">本機範圍</span>
                </div>
            </div>
            <div class="toolbar">
                <button id="refresh-btn" class="btn btn-secondary">
                    <span class="icon">🔄</span> 重新整理
                </button>
                <button id="export-scope-btn" class="btn btn-primary">
                    <span class="icon">📤</span> 匯出範圍
                </button>
                <button id="import-scope-btn" class="btn btn-primary">
                    <span class="icon">📥</span> 匯入範圍
                </button>
                <button id="import-btn" class="btn btn-secondary">
                    <span class="icon">📥</span> 匯入模板
                </button>
                <button id="export-btn" class="btn btn-secondary">
                    <span class="icon">📤</span> 匯出模板
                </button>
            </div>
        </div>

        <div class="main-content">
            <div class="sidebar">
                <div class="sidebar-section">
                    <h3>總覽與統計</h3>
                    <nav class="nav-menu">
                        <button class="nav-item active" data-tab="overview">
                            <span class="icon">🏠</span> 總覽
                        </button>
                        <button class="nav-item" data-tab="stats">
                            <span class="icon">📊</span> 使用統計
                        </button>
                        <button class="nav-item" data-tab="favorites">
                            <span class="icon">❤️</span> 收藏管理
                        </button>
                    </nav>
                </div>

                <div class="sidebar-section">
                    <h3>內容管理</h3>
                    <nav class="nav-menu">
                        <button class="nav-item" data-tab="content">
                            <span class="icon">🗂️</span> 內容管理
                        </button>
                        <button class="nav-item" data-tab="languages">
                            <span class="icon">💬</span> 語言管理
                        </button>
                    </nav>
                </div>

                <div class="sidebar-section">
                    <h3>設定</h3>
                    <nav class="nav-menu">
                        <button class="nav-item" data-tab="settings">
                            <span class="icon">⚙️</span> 資料位置設定
                        </button>
                    </nav>
                </div>

                <div class="sidebar-section">
                    <h3>快速操作</h3>
                    <div class="quick-actions">
                        <button id="create-scope-btn" class="btn btn-primary btn-full">
                            <span class="icon">📁</span> 新增範圍
                        </button>
                        <button id="create-topic-btn" class="btn btn-success btn-full">
                            <span class="icon">🏷️</span> 新增主題
                        </button>
                        <button id="create-template-btn" class="btn btn-success btn-full">
                            <span class="icon">📄</span> 新增模板
                        </button>
                        <button id="create-link-btn" class="btn btn-info btn-full">
                            <span class="icon">🔗</span> 新增連結
                        </button>
                        <button id="create-language-btn" class="btn btn-secondary btn-full">
                            <span class="icon">💬</span> 新增語言
                        </button>
                        <button id="json-import-btn" class="btn btn-info btn-full">
                            <span class="icon">📋</span> JSON批次新增
                        </button>
                        <button id="clear-stats-btn" class="btn btn-warning btn-full">
                            <span class="icon">🗑️</span> 清除統計
                        </button>
                    </div>
                </div>
            </div>

            <div class="content-area">
                <div id="loading" class="loading">
                    <div class="spinner"></div>
                    <p>載入中...</p>
                </div>

                <!-- Overview Tab -->
                <div id="overview-tab" class="tab-content active">
                    <div class="tab-header">
                        <h2>範圍總覽</h2>
                    </div>
                    <div class="overview-content">
                        <div class="overview-cards">
                            <div class="overview-card">
                                <div class="card-header">
                                    <span class="icon">📄</span>
                                    <h3>模板統計</h3>
                                </div>
                                <div class="card-content">
                                    <div class="stat-item">
                                        <span class="stat-value" id="total-templates">0</span>
                                        <span class="stat-label">總模板數</span>
                                    </div>
                                    <div class="stat-item">
                                        <span class="stat-value" id="favorite-templates">0</span>
                                        <span class="stat-label">收藏模板</span>
                                    </div>
                                </div>
                            </div>
                            <div class="overview-card">
                                <div class="card-header">
                                    <span class="icon">🏷️</span>
                                    <h3>主題統計</h3>
                                </div>
                                <div class="card-content">
                                    <div class="stat-item">
                                        <span class="stat-value" id="total-topics">0</span>
                                        <span class="stat-label">總主題數</span>
                                    </div>
                                    <div class="stat-item">
                                        <span class="stat-value" id="active-topics">0</span>
                                        <span class="stat-label">活躍主題</span>
                                    </div>
                                </div>
                            </div>
                            <div class="overview-card">
                                <div class="card-header">
                                    <span class="icon">💬</span>
                                    <h3>語言統計</h3>
                                </div>
                                <div class="card-content">
                                    <div class="stat-item">
                                        <span class="stat-value" id="total-languages">0</span>
                                        <span class="stat-label">支援語言</span>
                                    </div>
                                    <div class="stat-item">
                                        <span class="stat-value" id="most-used-language">-</span>
                                        <span class="stat-label">最常用語言</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="recent-activity">
                            <h3>最近活動</h3>
                            <div id="recent-templates" class="recent-list">
                                <p class="no-data">尚無最近使用的模板</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Stats Tab -->
                <div id="stats-tab" class="tab-content">
                    <div class="tab-header">
                        <h2>使用統計</h2>
                        <button id="export-stats-btn" class="btn btn-secondary">
                            <span class="icon">📤</span> 匯出統計
                        </button>
                    </div>
                    <div class="stats-content">
                        <div class="stats-section">
                            <h3>模板使用頻率</h3>
                            <div id="template-usage-chart" class="chart-container">
                                <div id="template-usage-list" class="usage-list"></div>
                            </div>
                        </div>
                        <div class="stats-section">
                            <h3>語言使用分布</h3>
                            <div id="language-usage-chart" class="chart-container">
                                <div id="language-usage-list" class="usage-list"></div>
                            </div>
                        </div>
                        <div class="stats-section">
                            <h3>主題使用分布</h3>
                            <div id="topic-usage-chart" class="chart-container">
                                <div id="topic-usage-list" class="usage-list"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Favorites Tab -->
                <div id="favorites-tab" class="tab-content">
                    <div class="tab-header">
                        <h2>收藏管理</h2>
                        <div class="favorites-filters">
                            <select id="favorites-filter-language">
                                <option value="">所有語言</option>
                            </select>
                            <select id="favorites-filter-topic">
                                <option value="">所有主題</option>
                            </select>
                            <input type="text" id="search-favorites" placeholder="搜尋收藏...">
                        </div>
                    </div>
                    <div class="favorites-content">
                        <div id="favorites-stats" class="favorites-summary">
                            <div class="summary-item">
                                <span class="summary-value" id="total-favorites">0</span>
                                <span class="summary-label">總收藏數</span>
                            </div>
                            <div class="summary-item">
                                <span class="summary-value" id="favorites-by-language">0</span>
                                <span class="summary-label">當前語言收藏</span>
                            </div>
                        </div>
                        <div id="favorites-list" class="data-list">
                            <p class="no-data">尚無收藏的模板</p>
                        </div>
                    </div>
                </div>

                <!-- Content Management Tab -->
                <div id="content-tab" class="tab-content">
                    <div class="tab-header">
                        <h2>內容管理</h2>
                        <div class="content-toolbar">
                            <div class="content-filters">
                                <select id="content-filter-language">
                                    <option value="">所有語言</option>
                                </select>
                                <select id="content-filter-topic">
                                    <option value="">所有主題</option>
                                </select>
                                <input type="text" id="search-content" placeholder="搜尋主題或模板...">
                            </div>
                        </div>
                    </div>

                    <div class="content-main">
                        <!-- Tree View -->
                        <div id="content-tree-view" class="content-view active">
                            <div class="content-layout">
                                <div class="content-tree-panel">
                                    <div class="tree-header">
                                        <h3>主題架構</h3>
                                        <div class="tree-actions">
                                            <button id="add-topic-btn" class="btn btn-success btn-small">
                                                <span class="icon">🏷️</span> 新增主題
                                            </button>
                                            <button id="add-template-btn" class="btn btn-primary btn-small">
                                                <span class="icon">📄</span> 新增模板
                                            </button>
                                            <button id="add-link-btn" class="btn btn-info btn-small">
                                                <span class="icon">🔗</span> 新增連結
                                            </button>
                                            <button id="expand-all-btn" class="btn btn-text btn-small">
                                                <span class="icon">📂</span> 全部展開
                                            </button>
                                            <button id="collapse-all-btn" class="btn btn-text btn-small">
                                                <span class="icon">📁</span> 全部收縮
                                            </button>
                                        </div>
                                    </div>
                                    <div id="content-tree" class="content-tree"></div>
                                </div>

                                <div class="content-details-panel">
                                    <div id="content-details" class="content-details">
                                        <div class="welcome-message">
                                            <div class="welcome-icon">🗂️</div>
                                            <h3>歡迎使用內容管理</h3>
                                            <p>請從左側選擇一個主題或模板來查看詳細資訊</p>
                                            <div class="welcome-actions">
                                                <button class="btn btn-primary" data-action="open-modal" data-modal-type="topic">
                                                    <span class="icon">🏷️</span> 建立新主題
                                                </button>
                                                <button class="btn btn-success" data-action="open-modal" data-modal-type="template">
                                                    <span class="icon">📄</span> 建立新模板
                                                </button>
                                                <button class="btn btn-info" data-action="open-modal" data-modal-type="link">
                                                    <span class="icon">🔗</span> 建立新連結
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- List View (Backward Compatibility) -->
                        <div id="content-list-view" class="content-view">
                            <div class="list-sections">
                                <div class="list-section">
                                    <h3>模板列表</h3>
                                    <div id="templates-list" class="data-list"></div>
                                </div>
                                <div class="list-section">
                                    <h3>主題列表</h3>
                                    <div id="topics-list" class="data-list"></div>
                                </div>
                                <div class="list-section">
                                    <h3>連結列表</h3>
                                    <div id="links-list" class="data-list"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Languages Tab -->
                <div id="languages-tab" class="tab-content">
                    <div class="tab-header">
                        <h2>語言管理</h2>
                    </div>
                    <div id="languages-list" class="data-list"></div>
                </div>

                <!-- Settings Tab -->
                <div id="settings-tab" class="tab-content">
                    <div class="tab-header">
                        <h2>資料位置設定</h2>
                        <button id="refresh-location-info-btn" class="btn btn-secondary">
                            <span class="icon">🔄</span> 重新整理
                        </button>
                    </div>
                    <div class="settings-content">
                        <div class="settings-section">
                            <div class="current-location-info">
                                <h3>目前位置資訊</h3>
                                <div id="current-location-card" class="location-card">
                                    <div class="location-header">
                                        <span class="location-icon">📁</span>
                                        <div class="location-details">
                                            <div class="location-name" id="current-location-name">載入中...</div>
                                            <div class="location-path" id="current-location-path">-</div>
                                        </div>
                                        <div class="location-actions">
                                            <button id="open-location-btn" class="btn btn-text btn-small">
                                                <span class="icon">📂</span> 開啟位置
                                            </button>
                                        </div>
                                    </div>
                                    <div class="location-stats">
                                        <div class="stat-item">
                                            <span class="stat-label">總大小:</span>
                                            <span class="stat-value" id="location-size">-</span>
                                        </div>
                                        <div class="stat-item">
                                            <span class="stat-label">可用空間:</span>
                                            <span class="stat-value" id="location-free-space">-</span>
                                        </div>
                                        <div class="stat-item">
                                            <span class="stat-label">範圍數量:</span>
                                            <span class="stat-value" id="location-scopes-count">-</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="settings-section">
                            <h3>可用位置選項</h3>
                            <div id="available-locations" class="locations-list">
                                <div class="loading-placeholder">載入可用位置中...</div>
                            </div>
                        </div>

                        <div class="settings-section">
                            <h3>自定義位置</h3>
                            <div class="custom-location-form">
                                <div class="form-row">
                                    <label for="custom-path-input">自定義路徑:</label>
                                    <div class="input-group">
                                        <input type="text" id="custom-path-input" placeholder="輸入完整路徑..." class="form-input">
                                        <button id="browse-custom-path-btn" class="btn btn-secondary">瀏覽</button>
                                        <button id="validate-custom-path-btn" class="btn btn-secondary">驗證</button>
                                    </div>
                                </div>
                                <div id="custom-path-validation" class="validation-result" style="display: none;"></div>
                                <div class="form-actions">
                                    <label class="checkbox-wrapper">
                                        <input type="checkbox" id="migrate-data-checkbox" checked>
                                        <span class="checkmark"></span>
                                        遷移現有資料到新位置
                                    </label>
                                    <label class="checkbox-wrapper">
                                        <input type="checkbox" id="create-backup-checkbox" checked>
                                        <span class="checkmark"></span>
                                        建立備份
                                    </label>
                                    <button id="apply-custom-location-btn" class="btn btn-primary" disabled>
                                        <span class="icon">📁</span> 套用自定義位置
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div class="settings-section">
                            <h3>重設選項</h3>
                            <div class="reset-options">
                                <button id="reset-to-system-default-btn" class="btn btn-warning">
                                    <span class="icon">🏠</span> 重設為系統預設位置
                                </button>
                                <p class="reset-description">
                                    這將會把資料存儲位置重設為系統預設位置，並選擇性地遷移現有資料。
                                </p>
                            </div>
                        </div>

                        ${this.dataPathService.isDevEnvironment() ? `
                        <div class="settings-section dev-sync-section">
                            <h3>⚙️ 開發工具</h3>
                            <div class="dev-sync-content">
                                <div class="sync-options">
                                    <label class="checkbox-wrapper">
                                        <input type="checkbox" id="include-usage-checkbox">
                                        <span class="checkmark"></span>
                                        包含使用統計 (usage)
                                    </label>
                                    <label class="checkbox-wrapper">
                                        <input type="checkbox" id="include-favorites-checkbox">
                                        <span class="checkmark"></span>
                                        包含收藏列表 (favorites)
                                    </label>
                                    <label class="checkbox-wrapper">
                                        <input type="checkbox" id="include-metadata-checkbox">
                                        <span class="checkmark"></span>
                                        包含元數據 (metadata)
                                    </label>
                                </div>
                                <button id="sync-to-dev-data-btn" class="btn btn-primary">
                                    <span class="icon">🔄</span> 同步到開發數據 (data/local)
                                </button>
                                <p class="sync-description">
                                    將運行時模板同步回項目的 data/local 目錄（含文檔文件）。
                                    <br>同步前會自動備份到 data/local.backup。
                                </p>
                            </div>
                        </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Context Menu -->
    <div id="context-menu" class="context-menu" style="display: none;">
        <div class="context-menu-item" data-action="edit">✏️ 編輯</div>
        <div class="context-menu-item" data-action="copy">📋 複製</div>
        <div class="context-menu-item" data-action="delete">🗑️ 刪除</div>
        <div class="context-menu-separator"></div>
        <div class="context-menu-item" data-action="add-template">📄 新增模板</div>
        <div class="context-menu-item" data-action="add-topic">🏷️ 新增子主題</div>
        <div class="context-menu-item" data-action="add-link">🔗 建立連結</div>
        <div class="context-menu-separator"></div>
        <div class="context-menu-item" data-action="toggle-favorite">❤️ 加入收藏</div>
    </div>

    <!-- Modal for editing -->
    <div id="modal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h3 id="modal-title">編輯項目</h3>
                <button id="modal-close" class="btn btn-text">✕</button>
            </div>
            <div id="modal-body" class="modal-body">
                <!-- Dynamic content -->
            </div>
            <div class="modal-footer">
                <button id="modal-cancel" class="btn btn-secondary">取消</button>
                <button id="modal-save" class="btn btn-primary">儲存</button>
            </div>
        </div>
    </div>

    <!-- JSON Import Modal -->
    <div id="json-modal" class="modal">
        <div class="modal-content" style="max-width: 800px; width: 90%;">
            <div class="modal-header">
                <h3>JSON批次新增模板</h3>
                <button id="json-modal-close" class="btn btn-text">✕</button>
            </div>
            <div class="modal-body">
                <div class="json-import-section">
                    <div style="display: flex; gap: 20px;">
                        <div style="flex: 1;">
                            <h4>JSON格式說明</h4>
                            <div class="json-help">
                                <p>支援兩種格式：</p>
                                <p><strong>1. 單個模板：</strong></p>
                                <pre><code>{
  "title": "模板標題",
  "description": "模板描述",
  "code": "程式碼內容",
  "language": "語言ID",
  "topic": "主題名稱"
}</code></pre>
                                <p><strong>2. 模板陣列：</strong></p>
                                <pre><code>[
  {
    "title": "模板1",
    "description": "描述1",
    "code": "程式碼1",
    "language": "python",
    "topic": "基礎"
  },
  {
    "title": "模板2",
    "description": "描述2",
    "code": "程式碼2",
    "language": "javascript",
    "topic": "進階"
  }
]</code></pre>
                            </div>
                        </div>
                        <div style="flex: 1;">
                            <h4>可用的語言ID</h4>
                            <div id="available-languages" class="info-list"></div>
                        </div>
                    </div>
                    <div style="margin-top: 20px;">
                        <label for="json-input">JSON內容：</label>
                        <textarea id="json-input" placeholder="請輸入JSON格式的模板資料..." style="width: 100%; min-height: 200px; font-family: 'Courier New', monospace; padding: 10px; border: 1px solid var(--vscode-input-border); background: var(--vscode-input-background); color: var(--vscode-input-foreground);"></textarea>
                        <div id="json-validation-message" style="margin-top: 5px; color: var(--vscode-errorForeground); display: none;"></div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button id="json-modal-cancel" class="btn btn-secondary">取消</button>
                <button id="json-modal-import" class="btn btn-primary">匯入模板</button>
            </div>
        </div>
    </div>

    <!-- Common utilities -->
    <script nonce="${nonce}" src="${utilsUri}"></script>
    <script nonce="${nonce}" src="${uiStateServiceUri}"></script>
    <script nonce="${nonce}" src="${treeBuilderServiceUri}"></script>

    <!-- Manager modules - Utils (must load first) -->
    <script nonce="${nonce}" src="${pathHelpersUri}"></script>
    <script nonce="${nonce}" src="${dataHelpersUri}"></script>

    <!-- Manager modules - Core -->
    <script nonce="${nonce}" src="${stateManagerUri}"></script>
    <script nonce="${nonce}" src="${messageHandlerUri}"></script>

    <!-- Manager modules - Handlers -->
    <script nonce="${nonce}" src="${templateHandlersUri}"></script>
    <script nonce="${nonce}" src="${topicHandlersUri}"></script>
    <script nonce="${nonce}" src="${favoritesHandlersUri}"></script>
    <script nonce="${nonce}" src="${linkHandlersUri}"></script>
    <script nonce="${nonce}" src="${contextMenuHandlerUri}"></script>
    <script nonce="${nonce}" src="${treeNavigationHandlerUri}"></script>
    <script nonce="${nonce}" src="${documentationHandlerUri}"></script>
    <script nonce="${nonce}" src="${buttonHandlerUri}"></script>

    <!-- Manager modules - Core (Event Coordinator) -->
    <script nonce="${nonce}" src="${eventCoordinatorUri}"></script>

    <!-- Manager modules - UI -->
    <script nonce="${nonce}" src="${modalManagerUri}"></script>
    <script nonce="${nonce}" src="${formGeneratorUri}"></script>

    <!-- Manager modules - Renderers -->
    <script nonce="${nonce}" src="${overviewRendererUri}"></script>
    <script nonce="${nonce}" src="${statsRendererUri}"></script>
    <script nonce="${nonce}" src="${favoritesRendererUri}"></script>
    <script nonce="${nonce}" src="${contentRendererUri}"></script>
    <script nonce="${nonce}" src="${languagesRendererUri}"></script>
    <script nonce="${nonce}" src="${settingsRendererUri}"></script>

    <!-- Manager main coordinator (must load last) -->
    <script nonce="${nonce}" src="${managerUri}"></script>
</body>
</html>`;
    }

    private _getNonce(): string {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }
}
