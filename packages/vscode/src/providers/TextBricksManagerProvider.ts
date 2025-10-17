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
import { VSCodePlatform } from '../adapters/vscode/VSCodePlatform';
import { WebviewProvider } from './WebviewProvider';
import { DocumentationProvider } from './DocumentationProvider';

// Message type definition with index signature for flexibility
interface WebviewMessage {
    type: string;
    [key: string]: unknown;
}

export class TextBricksManagerProvider {
    public static readonly viewType = 'textbricks-manager';

    private _panel?: vscode.WebviewPanel;
    private _disposables: vscode.Disposable[] = [];
    private scopeManager: ScopeManager;
    private topicManager: TopicManager;
    private dataPathService: DataPathService;
    private platform: VSCodePlatform;

    // 新增的 Services
    private pathTransformService: PathTransformService;
    private displayNameService: DisplayNameService;

    private initializationPromise: Promise<void>;

    constructor(
        private readonly _extensionUri: vscode.Uri,
        private readonly templateEngine: TextBricksEngine,
        private readonly context: vscode.ExtensionContext,
        scopeManager?: ScopeManager,
        topicManager?: TopicManager,
        dataPathService?: DataPathService,
        private readonly webviewProvider?: WebviewProvider,
        private readonly documentationProvider?: DocumentationProvider
    ) {
        this.platform = new VSCodePlatform(context);
        this.dataPathService = dataPathService || DataPathService.getInstance(this.platform);
        this.scopeManager = scopeManager || new ScopeManager(this.platform);
        this.topicManager = topicManager || new TopicManager(this.platform, this.dataPathService);

        // 初始化新的 Services
        this.pathTransformService = new PathTransformService(this.platform);
        this.displayNameService = new DisplayNameService();

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
                }
            });
        } catch (error) {
            this.platform.logError(error as Error, 'TextBricksManagerProvider.initializeManagers');
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
            TextBricksManagerProvider.viewType,
            'TextBricks Manager',
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [this._extensionUri]
            }
        );

        this._panel.webview.html = this._getHtmlForWebview(this._panel.webview);

        // Handle messages from the webview
        this._panel.webview.onDidReceiveMessage(
            message => this._handleMessage(message),
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

    private async _handleMessage(message: WebviewMessage & Record<string, any>) {
        try {
            this.platform.logInfo(`Received message from WebView: ${message.type}`, 'TextBricksManagerProvider');
            switch (message.type) {
                // 數據載入
                case 'loadData':
                    await this._sendData();
                    break;

                // Scope 管理
                case 'switchScope':
                    await this._switchScope(message.scopeId as string);
                    break;

                case 'createScope':
                    await this._createScope(message.data);
                    break;

                case 'updateScope':
                    await this._updateScope(message.scopeId as string, message.data);
                    break;

                case 'deleteScope':
                    await this._deleteScope(message.scopeId);
                    break;

                case 'exportScope':
                    await this._exportScope(message.options);
                    break;

                case 'importScope':
                    await this._importScope();
                    break;

                // 收藏管理
                case 'addToFavorites':
                    await this._addToFavorites(message.itemId);
                    break;

                case 'removeFromFavorites':
                    await this._removeFromFavorites(message.itemId);
                    break;

                case 'clearUsageStats':
                    await this._clearUsageStats();
                    break;

                // 主題管理
                case 'createTopic':
                    await this._createTopic(message.data);
                    break;

                case 'updateTopic':
                    await this._updateTopic(message.topicPath || message.topicId, message.data);
                    break;

                case 'deleteTopic':
                    await this._deleteTopic(message.topicPath || message.topicId, message.deleteChildren);
                    break;

                case 'moveTopic':
                    await this._moveTopic(message.operation);
                    break;

                case 'reorderTopics':
                    await this._reorderTopics(message.operations);
                    break;

                // 模板管理
                case 'createTemplate':
                    await this._createTemplate(message.data);
                    break;

                case 'updateTemplate':
                    await this._updateTemplate(message.templatePath || message.templateId, message.data);
                    break;

                case 'deleteTemplate':
                    await this._deleteTemplate(message.templatePath || message.templateId);
                    break;

                case 'batchCreateTemplates':
                    await this._batchCreateTemplates(message.templates);
                    break;

                // 連結管理 (臨時實現)
                case 'createLink':
                    await this._createLink(message.data);
                    break;

                case 'updateLink':
                    await this._updateLink(message.linkName || message.linkId, message.data);
                    break;

                case 'deleteLink':
                    await this._deleteLink(message.linkName || message.linkId);
                    break;

                // 語言管理
                case 'createLanguage':
                    await this._createLanguage(message.data);
                    break;

                case 'updateLanguage':
                    await this._updateLanguage(message.languageName || message.languageId, message.data);
                    break;

                // 匯入匯出
                case 'exportTemplates':
                    await this._exportTemplates(message.filters);
                    break;

                case 'importTemplates':
                    await this._importTemplates();
                    break;

                // 資料位置管理
                case 'getDataLocationInfo':
                    await this._getDataLocationInfo();
                    break;

                case 'getAvailableLocations':
                    await this._getAvailableLocations();
                    break;

                case 'changeDataLocation':
                    await this._changeDataLocation(message.locationPath, message.options);
                    break;

                case 'resetToSystemDefault':
                    await this._resetToSystemDefault();
                    break;

                case 'openDataLocation':
                    await this._openDataLocation();
                    break;

                case 'validateDataPath':
                    await this._validateDataPath(message.path);
                    break;

                // Services API - 路徑轉換
                case 'pathToDisplayPath':
                    this._pathToDisplayPath(message.path, message.requestId);
                    break;

                case 'displayPathToPath':
                    this._displayPathToPath(message.displayPath, message.requestId);
                    break;

                case 'buildTemplatePath':
                    this._buildTemplatePath(message.template, message.requestId);
                    break;

                case 'getItemIdentifier':
                    this._getItemIdentifier(message.item, message.itemType, message.requestId);
                    break;

                // Services API - 顯示名稱
                case 'getLanguageDisplayName':
                    this._getLanguageDisplayName(message.languageName, message.requestId);
                    break;

                case 'getTopicDisplayName':
                    this._getTopicDisplayName(message.topicPath, message.requestId);
                    break;

                case 'getFullDisplayPath':
                    this._getFullDisplayPath(message.path, message.requestId);
                    break;

                // 文檔渲染
                case 'renderTemplateDocumentation':
                    if (this.documentationProvider && message.template && message.template.documentation) {
                        const renderedHtml = this.documentationProvider.markdownToHtml(
                            message.template.documentation,
                            message.template.name
                        );
                        this._panel?.webview.postMessage({
                            type: 'documentationRendered',
                            requestId: message.requestId,
                            html: renderedHtml,
                            title: `${message.template.title} - 說明文件`
                        });
                    }
                    break;

                case 'renderTopicDocumentation':
                    if (this.documentationProvider && message.topic && message.topic.documentation) {
                        const renderedHtml = this.documentationProvider.markdownToHtml(
                            message.topic.documentation,
                            message.topic.name
                        );
                        this._panel?.webview.postMessage({
                            type: 'documentationRendered',
                            requestId: message.requestId,
                            html: renderedHtml,
                            title: `${message.topic.title || message.topic.name} - 主題說明文件`
                        });
                    }
                    break;

                // UI 事件
                case 'showError':
                    vscode.window.showErrorMessage(message.message);
                    break;

                case 'showInfo':
                    vscode.window.showInformationMessage(message.message);
                    break;
            }
        } catch (error) {
            vscode.window.showErrorMessage(`操作失敗: ${error}`);
        }
    }

    private async _sendData() {
        this.platform.logInfo('_sendData called', 'TextBricksManagerProvider');

        // 等待初始化完成
        try {
            await this.initializationPromise;
            this.platform.logInfo('Managers initialized successfully', 'TextBricksManagerProvider');
        } catch (initError) {
            this.platform.logError(initError as Error, 'TextBricksManagerProvider._sendData.init');
        }

        if (this._panel) {
            try {
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
                    this.platform.logWarning(`ScopeManager error: ${scopeError}`, 'TextBricksManagerProvider');
                    // 使用默認的 scope 數據
                    currentScope = { id: 'local', name: '本機範圍', type: 'local' };
                    availableScopes = [currentScope];
                    favorites = [];
                }

                try {
                    const rawHierarchy = this.topicManager.getHierarchy();
                    this.platform.logInfo(`Raw hierarchy roots: ${rawHierarchy?.roots?.length}`, 'TextBricksManagerProvider');
                    if (rawHierarchy?.roots?.[0]) {
                        this.platform.logInfo(`First root topic: ${rawHierarchy.roots[0].topic.name}, loadedLinks: ${(rawHierarchy.roots[0].topic as any).loadedLinks?.length}`, 'TextBricksManagerProvider');
                    }
                    // 清理循環引用：移除 parent 屬性，保留結構
                    topicHierarchy = this.cleanCircularReferences(rawHierarchy);
                    this.platform.logInfo(`Cleaned hierarchy roots: ${topicHierarchy?.roots?.length}`, 'TextBricksManagerProvider');
                    if (topicHierarchy?.roots?.[0]) {
                        this.platform.logInfo(`First cleaned root topic: ${topicHierarchy.roots[0].topic.name}, loadedLinks: ${(topicHierarchy.roots[0].topic as any).loadedLinks?.length}`, 'TextBricksManagerProvider');
                    }
                    topicStats = this.cleanCircularReferences(this.topicManager.getStatistics());
                } catch (topicError) {
                    this.platform.logWarning(`TopicManager error: ${topicError}`, 'TextBricksManagerProvider');
                    // 從現有模板數據構建簡單的主題統計
                    const topics = [...new Set(templates.map(t => (t as any).topicPath || t.language))];
                    topicStats = {
                        totalTopics: topics.length,
                        activeTopics: topics.length
                    };
                }

                this.platform.logInfo('Sending dataLoaded message with fallback data...', 'TextBricksManagerProvider');

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
                    this.platform.logInfo('dataLoaded message sent successfully', 'TextBricksManagerProvider');
                } catch (jsonError) {
                    this.platform.logError(jsonError as Error, 'TextBricksManagerProvider._sendData.serialize');
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
                    this.platform.logInfo('Simplified dataLoaded message sent', 'TextBricksManagerProvider');
                }
            } catch (error) {
                this.platform.logError(error as Error, 'TextBricksManagerProvider._sendData');

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
            this.platform.logInfo('No panel available', 'TextBricksManagerProvider');
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

    private async _createTemplate(templateData: Omit<ExtendedTemplate, 'type'>) {
        try {
            this.platform.logInfo(`Creating template: ${(templateData as any).title}`, 'TextBricksManagerProvider');
            const topicPath = (templateData as any).topicPath || (templateData as any).topic || 'default';
            const newTemplate = await this.templateEngine.createTemplate(templateData, topicPath);
            this.platform.logInfo(`Template created successfully: ${newTemplate.name}`, 'TextBricksManagerProvider');
            vscode.window.showInformationMessage(`模板 "${newTemplate.title}" 已創建成功`);
            await this._sendData();
        } catch (error) {
            this.platform.logError(error as Error, 'TextBricksManagerProvider._createTemplate');
            vscode.window.showErrorMessage(`創建模板失敗: ${error}`);
        }
    }

    private async _updateTemplate(templateId: string, updates: Partial<ExtendedTemplate>) {
        try {
            this.platform.logInfo(`Updating template: ${templateId}`, 'TextBricksManagerProvider');
            const updated = await this.templateEngine.updateTemplate(templateId, updates);
            if (updated) {
                this.platform.logInfo(`Template updated successfully: ${updated.name}`, 'TextBricksManagerProvider');

                // 等待一小段時間確保文件操作完成
                await new Promise(resolve => setTimeout(resolve, 100));

                // 刷新模板管理器數據
                await this._sendData();

                // 通知 WebviewProvider 刷新顯示，並保持導航狀態
                if (this.webviewProvider) {
                    this.platform.logInfo('Notifying WebviewProvider to refresh with preserved navigation state', 'TextBricksManagerProvider');
                    await this.webviewProvider.refresh(true);
                }

                vscode.window.showInformationMessage(`模板 "${updated.title}" 已更新成功`);
            } else {
                this.platform.logWarning(`Template not found for ID: ${templateId}`, 'TextBricksManagerProvider');
                vscode.window.showErrorMessage('找不到指定的模板');
            }
        } catch (error) {
            this.platform.logError(error as Error, 'TextBricksManagerProvider._updateTemplate');
            vscode.window.showErrorMessage(`更新模板失敗: ${error}`);
        }
    }

    private async _deleteTemplate(templateId: string) {
        const template = this.templateEngine.getTemplate(templateId);
        if (!template) {
            vscode.window.showErrorMessage('找不到指定的模板');
            return;
        }

        const confirmed = await vscode.window.showWarningMessage(
            `確定要刪除模板 "${template.title}" 嗎？此操作無法恢復。`,
            '確定',
            '取消'
        );

        if (confirmed === '確定') {
            await this.templateEngine.deleteTemplate(templateId);
            vscode.window.showInformationMessage(`模板 "${template.title}" 已刪除`);
            await this._sendData();

            // 通知 WebviewProvider 刷新顯示
            if (this.webviewProvider) {
                await this.webviewProvider.refresh();
            }
        }
    }




    private async _createLanguage(languageData: Language) {
        const newLanguage = await this.templateEngine.createLanguage(languageData);
        vscode.window.showInformationMessage(`語言 "${newLanguage.title}" 已創建成功`);
        await this._sendData();
    }

    private async _updateLanguage(languageName: string, updates: Partial<Language>) {
        const updated = await this.templateEngine.updateLanguage(languageName, updates);
        if (updated) {
            vscode.window.showInformationMessage(`語言 "${updated.title}" 已更新成功`);
            await this._sendData();
        } else {
            vscode.window.showErrorMessage('找不到指定的語言');
        }
    }

    private async _exportTemplates(filters?: unknown) {
        const saveUri = await vscode.window.showSaveDialog({
            defaultUri: vscode.Uri.file('templates-export.json'),
            filters: {
                'JSON Files': ['json'],
                'All Files': ['*']
            }
        });

        if (saveUri) {
            try {
                const exportData = await this.templateEngine.exportTemplates(filters);
                const content = JSON.stringify(exportData, null, 2);
                
                await vscode.workspace.fs.writeFile(saveUri, Buffer.from(content, 'utf8'));
                
                vscode.window.showInformationMessage(
                    `模板已匯出至 ${saveUri.fsPath}`,
                    '開啟檔案'
                ).then(selection => {
                    if (selection === '開啟檔案') {
                        vscode.window.showTextDocument(saveUri);
                    }
                });
            } catch (error) {
                vscode.window.showErrorMessage(`匯出失敗: ${error}`);
            }
        }
    }

    private async _importTemplates() {
        const openUri = await vscode.window.showOpenDialog({
            canSelectFiles: true,
            canSelectFolders: false,
            canSelectMany: false,
            filters: {
                'JSON Files': ['json'],
                'All Files': ['*']
            }
        });

        if (openUri && openUri[0]) {
            try {
                const content = await vscode.workspace.fs.readFile(openUri[0]);
                const importData = JSON.parse(content.toString());

                const options = await this._getImportOptions();
                const targetTopicPath = 'imported';
                const result = await this.templateEngine.importTemplates(importData, targetTopicPath, options);

                let message = `匯入完成: ${result.imported} 個模板已匯入`;
                if (result.skipped > 0) {
                    message += `, ${result.skipped} 個模板已跳過`;
                }
                if (result.errors.length > 0) {
                    message += `, ${result.errors.length} 個錯誤`;
                }

                vscode.window.showInformationMessage(message);

                if (result.errors.length > 0) {
                    const showErrors = await vscode.window.showWarningMessage(
                        '匯入過程中出現一些錯誤，是否查看詳情？',
                        '查看錯誤',
                        '忽略'
                    );
                    
                    if (showErrors === '查看錯誤') {
                        const errorMessage = result.errors.join('\n');
                        vscode.window.showErrorMessage(errorMessage);
                    }
                }

                await this._sendData();
            } catch (error) {
                vscode.window.showErrorMessage(`匯入失敗: ${error}`);
            }
        }
    }

    private async _batchCreateTemplates(templates: unknown[]) {
        if (!templates || !Array.isArray(templates) || templates.length === 0) {
            vscode.window.showErrorMessage('沒有提供有效的模板資料');
            return;
        }

        let successCount = 0;
        let errorCount = 0;
        const errors: string[] = [];

        try {
            for (let i = 0; i < templates.length; i++) {
                const template = templates[i];
                const index = i + 1;

                try {
                    // Validate required fields
                    if (!template.title || !template.description || !template.code || !template.language || !template.topic) {
                        throw new Error(`模板 ${index}: 缺少必要欄位`);
                    }

                    // Check if language exists
                    const allLanguages = this.scopeManager.getCurrentScope().languages || [];
                    const languageExists = allLanguages.find(lang => lang.name === template.language);

                    if (!languageExists) {
                        throw new Error(`模板 ${index}: 語言 "${template.language}" 不存在`);
                    }

                    // Create the template
                    const topicPath = template.topic || template.language || 'default';
                    const templateData = {
                        name: template.title.toLowerCase().replace(/\s+/g, '-'),
                        title: template.title,
                        description: template.description,
                        code: template.code,
                        language: template.language
                    };
                    await this.templateEngine.createTemplate(templateData, topicPath);

                    successCount++;
                } catch (error) {
                    errorCount++;
                    errors.push(`${error}`);
                }
            }

            // Show results
            let message = `批次新增完成：${successCount} 個模板已創建`;
            if (errorCount > 0) {
                message += `，${errorCount} 個失敗`;
            }

            vscode.window.showInformationMessage(message);

            if (errors.length > 0) {
                const showErrors = await vscode.window.showWarningMessage(
                    '創建過程中出現一些錯誤，是否查看詳情？',
                    '查看錯誤',
                    '忽略'
                );
                
                if (showErrors === '查看錯誤') {
                    const errorMessage = errors.join('\n');
                    vscode.window.showErrorMessage(`批次新增錯誤：\n${errorMessage}`);
                }
            }

            // Refresh the data
            await this._sendData();

        } catch (error) {
            vscode.window.showErrorMessage(`批次新增失敗：${error}`);
        }
    }

    private async _getImportOptions() {
        const overwriteExisting = await vscode.window.showQuickPick(
            ['是', '否'],
            { placeHolder: '是否覆蓋現有的模板？' }
        );

        const mergeTopics = await vscode.window.showQuickPick(
            ['是', '否'],
            { placeHolder: '是否合併主題？' }
        );

        const mergeLanguages = await vscode.window.showQuickPick(
            ['是', '否'],
            { placeHolder: '是否合併語言？' }
        );

        return {
            overwriteExisting: overwriteExisting === '是',
            mergeTopics: mergeTopics === '是',
            mergeLanguages: mergeLanguages === '是'
        };
    }

    private async _createTopic(topicData: unknown) {
        try {
            const newTopic = await this.topicManager.createTopic(topicData as any);
            vscode.window.showInformationMessage(`主題 "${newTopic.title}" 已創建成功`);
            await this._sendData();

            // 通知 WebviewProvider 刷新顯示
            if (this.webviewProvider) {
                this.platform.logInfo('Notifying WebviewProvider to refresh after topic creation', 'TextBricksManagerProvider');
                await this.webviewProvider.refresh();
            }
        } catch (error) {
            vscode.window.showErrorMessage(`創建主題失敗: ${error}`);
        }
    }

    private async _updateTopic(topicId: string, updates: unknown) {
        try {
            const updated = await this.topicManager.updateTopic(topicId, updates);
            vscode.window.showInformationMessage(`主題 "${updated.title}" 已更新成功`);
            await this._sendData();

            // 通知 WebviewProvider 刷新顯示，保持導航狀態
            if (this.webviewProvider) {
                this.platform.logInfo('Notifying WebviewProvider to refresh after topic update', 'TextBricksManagerProvider');
                await this.webviewProvider.refresh(true);
            }
        } catch (error) {
            vscode.window.showErrorMessage(`更新主題失敗: ${error}`);
        }
    }

    private async _deleteTopic(topicId: string, deleteChildren: boolean = false) {
        try {
            const topic = this.topicManager.getTopic(topicId);
            if (!topic) {
                vscode.window.showErrorMessage('找不到指定的主題');
                return;
            }

            const confirmed = await vscode.window.showWarningMessage(
                `確定要刪除主題 "${topic.title}" 嗎？此操作無法恢復。`,
                '確定',
                '取消'
            );

            if (confirmed === '確定') {
                await this.topicManager.deleteTopic(topicId, deleteChildren);
                vscode.window.showInformationMessage(`主題 "${topic.title}" 已刪除`);
                await this._sendData();

                // 通知 WebviewProvider 刷新顯示
                if (this.webviewProvider) {
                    this.platform.logInfo('Notifying WebviewProvider to refresh after topic deletion', 'TextBricksManagerProvider');
                    await this.webviewProvider.refresh();
                }
            }
        } catch (error) {
            vscode.window.showErrorMessage(`刪除主題失敗: ${error}`);
        }
    }

    // ==================== Scope 管理方法 ====================

    private async _switchScope(scopeId: string) {
        try {
            await this.scopeManager.switchScope(scopeId);
            vscode.window.showInformationMessage(`已切換到範圍 "${scopeId}"`);
            await this._sendData();
        } catch (error) {
            vscode.window.showErrorMessage(`切換範圍失敗: ${error}`);
        }
    }

    private async _createScope(scopeData: unknown) {
        try {
            const newScope = await this.scopeManager.createScope(scopeData as any);
            vscode.window.showInformationMessage(`範圍 "${newScope.name}" 已創建成功`);
            await this._sendData();
        } catch (error) {
            vscode.window.showErrorMessage(`創建範圍失敗: ${error}`);
        }
    }

    private async _updateScope(scopeId: string, updates: unknown) {
        try {
            const updatedScope = await this.scopeManager.updateScope(scopeId, updates);
            vscode.window.showInformationMessage(`範圍 "${updatedScope.name}" 已更新成功`);
            await this._sendData();
        } catch (error) {
            vscode.window.showErrorMessage(`更新範圍失敗: ${error}`);
        }
    }

    private async _deleteScope(scopeId: string) {
        try {
            const confirmed = await vscode.window.showWarningMessage(
                `確定要刪除範圍 "${scopeId}" 嗎？此操作無法恢復。`,
                '確定',
                '取消'
            );

            if (confirmed === '確定') {
                await this.scopeManager.deleteScope(scopeId);
                vscode.window.showInformationMessage(`範圍 "${scopeId}" 已刪除`);
                await this._sendData();
            }
        } catch (error) {
            vscode.window.showErrorMessage(`刪除範圍失敗: ${error}`);
        }
    }

    private async _exportScope(options: unknown) {
        try {
            const saveUri = await vscode.window.showSaveDialog({
                defaultUri: vscode.Uri.file('scope-export.json'),
                filters: {
                    'JSON Files': ['json'],
                    'All Files': ['*']
                }
            });

            if (saveUri) {
                const opts = options as any;
                const exportData = await this.scopeManager.exportScope(
                    opts.includeTemplates || true,
                    opts.includeStats || true
                );
                const content = JSON.stringify(exportData, null, 2);

                await vscode.workspace.fs.writeFile(saveUri, Buffer.from(content, 'utf8'));

                vscode.window.showInformationMessage(
                    `範圍已匯出至 ${saveUri.fsPath}`,
                    '開啟檔案'
                ).then(selection => {
                    if (selection === '開啟檔案') {
                        vscode.window.showTextDocument(saveUri);
                    }
                });
            }
        } catch (error) {
            vscode.window.showErrorMessage(`匯出範圍失敗: ${error}`);
        }
    }

    private async _importScope() {
        try {
            const openUri = await vscode.window.showOpenDialog({
                canSelectFiles: true,
                canSelectFolders: false,
                canSelectMany: false,
                filters: {
                    'JSON Files': ['json'],
                    'All Files': ['*']
                }
            });

            if (openUri && openUri[0]) {
                const content = await vscode.workspace.fs.readFile(openUri[0]);
                const importData = JSON.parse(content.toString());

                const options = await this._getScopeImportOptions();
                await this.scopeManager.importScope(importData, options);

                vscode.window.showInformationMessage('範圍匯入成功');
                await this._sendData();
            }
        } catch (error) {
            vscode.window.showErrorMessage(`匯入範圍失敗: ${error}`);
        }
    }

    private async _getScopeImportOptions() {
        const overwriteExisting = await vscode.window.showQuickPick(
            ['是', '否'],
            { placeHolder: '是否覆蓋現有的範圍？' }
        );

        const mergeTopics = await vscode.window.showQuickPick(
            ['是', '否'],
            { placeHolder: '是否合併主題？' }
        );

        const preserveStats = await vscode.window.showQuickPick(
            ['是', '否'],
            { placeHolder: '是否保留統計資料？' }
        );

        return {
            overwriteExisting: overwriteExisting === '是',
            mergeTopics: mergeTopics === '是',
            mergeLanguages: true,
            preserveStats: preserveStats === '是',
            preserveFavorites: true
        };
    }

    // ==================== 收藏管理方法 ====================

    private async _addToFavorites(itemId: string) {
        try {
            await this.scopeManager.addFavorite(itemId);
            vscode.window.showInformationMessage('已添加到收藏');
            await this._sendData();
        } catch (error) {
            vscode.window.showErrorMessage(`添加到收藏失敗: ${error}`);
        }
    }

    private async _removeFromFavorites(itemId: string) {
        try {
            await this.scopeManager.removeFavorite(itemId);
            vscode.window.showInformationMessage('已從收藏中移除');
            await this._sendData();
        } catch (error) {
            vscode.window.showErrorMessage(`從收藏中移除失敗: ${error}`);
        }
    }

    private async _clearUsageStats() {
        try {
            const confirmed = await vscode.window.showWarningMessage(
                '確定要清除所有使用統計嗎？此操作無法恢復。',
                '確定',
                '取消'
            );

            if (confirmed === '確定') {
                await this.scopeManager.clearUsageStats();
                vscode.window.showInformationMessage('使用統計已清除');
                await this._sendData();
            }
        } catch (error) {
            vscode.window.showErrorMessage(`清除使用統計失敗: ${error}`);
        }
    }

    // ==================== 主題管理方法 ====================

    private async _moveTopic(operation: unknown) {
        try {
            await this.topicManager.moveTopic(operation as any);
            vscode.window.showInformationMessage('主題已移動');
            await this._sendData();
        } catch (error) {
            vscode.window.showErrorMessage(`移動主題失敗: ${error}`);
        }
    }

    private async _reorderTopics(operations: unknown[]) {
        try {
            await this.topicManager.reorderTopics(operations as any);
            vscode.window.showInformationMessage('主題順序已更新');
            await this._sendData();
        } catch (error) {
            vscode.window.showErrorMessage(`重新排序主題失敗: ${error}`);
        }
    }

    // ==================== 資料位置管理方法 ====================

    private async _getDataLocationInfo() {
        try {
            const locationInfo = await this.dataPathService.getCurrentLocationInfo();
            this._panel?.webview.postMessage({
                type: 'dataLocationInfo',
                data: locationInfo
            });
        } catch (error) {
            vscode.window.showErrorMessage(`獲取資料位置資訊失敗: ${error}`);
        }
    }

    private async _getAvailableLocations() {
        try {
            const locations = await this.dataPathService.getAvailableLocations();
            this._panel?.webview.postMessage({
                type: 'availableLocations',
                data: locations
            });
        } catch (error) {
            vscode.window.showErrorMessage(`獲取可用位置失敗: ${error}`);
        }
    }

    private async _changeDataLocation(locationPath: string, options?: { migrateData?: boolean; createBackup?: boolean }) {
        try {
            const confirmed = await vscode.window.showWarningMessage(
                `確定要變更資料存儲位置到 "${locationPath}" 嗎？`,
                { modal: true },
                '確定',
                '取消'
            );

            if (confirmed === '確定') {
                vscode.window.withProgress({
                    location: vscode.ProgressLocation.Notification,
                    title: '變更資料位置中...',
                    cancellable: false
                }, async (progress) => {
                    progress.report({ message: '準備遷移資料...' });

                    const result = await this.dataPathService.setDataPath(locationPath, options);

                    if (result.success) {
                        progress.report({ message: '完成！' });
                        vscode.window.showInformationMessage(
                            `資料位置已成功變更至 "${locationPath}"`
                        );

                        this._panel?.webview.postMessage({
                            type: 'dataLocationChanged',
                            data: result
                        });

                        await this._sendData();
                    } else {
                        throw new Error(`遷移失敗: ${result.errors.join(', ')}`);
                    }
                });
            }
        } catch (error) {
            vscode.window.showErrorMessage(`變更資料位置失敗: ${error}`);
        }
    }

    private async _resetToSystemDefault() {
        try {
            const confirmed = await vscode.window.showWarningMessage(
                '確定要重設為系統預設位置嗎？這將會遷移您的資料。',
                { modal: true },
                '確定',
                '取消'
            );

            if (confirmed === '確定') {
                vscode.window.withProgress({
                    location: vscode.ProgressLocation.Notification,
                    title: '重設資料位置中...',
                    cancellable: false
                }, async (progress) => {
                    progress.report({ message: '準備重設...' });

                    const result = await this.dataPathService.resetToSystemDefault();

                    if (result.success) {
                        progress.report({ message: '完成！' });
                        vscode.window.showInformationMessage('已重設為系統預設位置');

                        this._panel?.webview.postMessage({
                            type: 'dataLocationReset',
                            data: result
                        });

                        await this._sendData();
                    } else {
                        throw new Error(`重設失敗: ${result.errors.join(', ')}`);
                    }
                });
            }
        } catch (error) {
            vscode.window.showErrorMessage(`重設資料位置失敗: ${error}`);
        }
    }

    private async _openDataLocation() {
        try {
            await this.dataPathService.openDataLocation();
        } catch (error) {
            vscode.window.showErrorMessage(`開啟資料位置失敗: ${error}`);
        }
    }

    private async _validateDataPath(path: string) {
        try {
            const validation = await this.dataPathService.validatePath(path);
            this._panel?.webview.postMessage({
                type: 'pathValidationResult',
                data: validation
            });
        } catch (error) {
            vscode.window.showErrorMessage(`驗證路徑失敗: ${error}`);
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
            vscode.Uri.joinPath(this._extensionUri, 'assets', 'css', 'textbricks-manager.css')
        );
        const utilsUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'assets', 'js', 'common', 'utils.js')
        );
        const eventDelegatorUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'assets', 'js', 'common', 'event-delegator.js')
        );
        const cardTemplatesUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'assets', 'js', 'common', 'card-templates.js')
        );
        const servicesBridgeUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'assets', 'js', 'services-bridge.js')
        );
        const uiStateServiceUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'assets', 'js', 'ui-state-service.js')
        );
        const treeBuilderServiceUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'assets', 'js', 'tree-builder-service.js')
        );

        // Manager modules - Utils
        const pathHelpersUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'assets', 'js', 'manager', 'utils', 'path-helpers.js')
        );
        const dataHelpersUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'assets', 'js', 'manager', 'utils', 'data-helpers.js')
        );

        // Manager modules - Core
        const stateManagerUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'assets', 'js', 'manager', 'core', 'state-manager.js')
        );
        const messageHandlerUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'assets', 'js', 'manager', 'core', 'message-handler.js')
        );

        // Manager modules - Handlers
        const templateHandlersUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'assets', 'js', 'manager', 'handlers', 'template-handlers.js')
        );
        const topicHandlersUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'assets', 'js', 'manager', 'handlers', 'topic-handlers.js')
        );
        const favoritesHandlersUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'assets', 'js', 'manager', 'handlers', 'favorites-handlers.js')
        );
        const linkHandlersUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'assets', 'js', 'manager', 'handlers', 'link-handlers.js')
        );
        const contextMenuHandlerUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'assets', 'js', 'manager', 'handlers', 'context-menu-handler.js')
        );
        const treeNavigationHandlerUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'assets', 'js', 'manager', 'handlers', 'tree-navigation-handler.js')
        );
        const documentationHandlerUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'assets', 'js', 'manager', 'handlers', 'documentation-handler.js')
        );
        const buttonHandlerUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'assets', 'js', 'manager', 'handlers', 'button-handler.js')
        );

        // Manager modules - Core (Event Coordinator)
        const eventCoordinatorUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'assets', 'js', 'manager', 'core', 'event-coordinator.js')
        );

        // Manager modules - UI
        const modalManagerUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'assets', 'js', 'manager', 'ui', 'modal-manager.js')
        );
        const formGeneratorUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'assets', 'js', 'manager', 'ui', 'form-generator.js')
        );

        // Manager modules - Renderers
        const overviewRendererUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'assets', 'js', 'manager', 'ui', 'renderers', 'overview-renderer.js')
        );
        const statsRendererUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'assets', 'js', 'manager', 'ui', 'renderers', 'stats-renderer.js')
        );
        const favoritesRendererUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'assets', 'js', 'manager', 'ui', 'renderers', 'favorites-renderer.js')
        );
        const contentRendererUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'assets', 'js', 'manager', 'ui', 'renderers', 'content-renderer.js')
        );
        const languagesRendererUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'assets', 'js', 'manager', 'ui', 'renderers', 'languages-renderer.js')
        );
        const settingsRendererUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'assets', 'js', 'manager', 'ui', 'renderers', 'settings-renderer.js')
        );

        // Manager main coordinator
        const managerUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'assets', 'js', 'manager', 'manager.js')
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
    <script nonce="${nonce}" src="${eventDelegatorUri}"></script>
    <script nonce="${nonce}" src="${cardTemplatesUri}"></script>
    <script nonce="${nonce}" src="${servicesBridgeUri}"></script>
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

    private async _createLink(linkData: unknown) {
        try {
            this.platform.logInfo(`Creating link: ${(linkData as any).title}`, 'TextBricksManagerProvider');

            // Create link JSON file in the appropriate topic's links directory
            const linkPath = await this._getLinkPath(linkData);

            await vscode.workspace.fs.writeFile(
                vscode.Uri.file(linkPath),
                Buffer.from(JSON.stringify(linkData, null, 2))
            );

            this.platform.logInfo(`Link created successfully at: ${linkPath}`, 'TextBricksManagerProvider');
            vscode.window.showInformationMessage(`連結 "${(linkData as any).title}" 已創建成功`);
            await this._sendData();
        } catch (error) {
            this.platform.logError(error as Error, 'TextBricksManagerProvider._createLink');
            vscode.window.showErrorMessage(`創建連結失敗: ${error}`);
        }
    }

    private async _updateLink(linkId: string, linkData: unknown) {
        try {
            this.platform.logInfo(`Updating link: ${linkId}`, 'TextBricksManagerProvider');

            // Find and update the link JSON file
            const linkPath = await this._getLinkPath(linkData);

            await vscode.workspace.fs.writeFile(
                vscode.Uri.file(linkPath),
                Buffer.from(JSON.stringify(linkData, null, 2))
            );

            this.platform.logInfo(`Link updated successfully at: ${linkPath}`, 'TextBricksManagerProvider');
            vscode.window.showInformationMessage(`連結已更新成功`);
            await this._sendData();
        } catch (error) {
            this.platform.logError(error as Error, 'TextBricksManagerProvider._updateLink');
            vscode.window.showErrorMessage(`更新連結失敗: ${error}`);
        }
    }

    private async _getLinkPath(linkData: unknown): Promise<string> {
        // Get the current data location
        const locationInfo = await this.dataPathService.getCurrentLocationInfo();

        // Get current topic context from linkData (passed from frontend)
        // Fallback to 'general' if no topic context is provided
        const currentTopicPath = (linkData as any).currentTopic || 'general';

        // Build the links directory path under the current topic
        const linksDirPath = vscode.Uri.joinPath(
            vscode.Uri.file(locationInfo.path),
            'scopes',
            'local', // Default scope
            ...currentTopicPath.split('/'), // Current topic hierarchy
            'links'
        );

        // Ensure the links directory exists
        try {
            await vscode.workspace.fs.createDirectory(linksDirPath);
        } catch (error) {
            // Directory might already exist, that's OK
        }

        // Create the link file path (using name instead of id)
        const linkFilePath = vscode.Uri.joinPath(linksDirPath, `${(linkData as any).name}.json`);
        return linkFilePath.fsPath;
    }

    private async _deleteLink(linkId: string) {
        try {
            this.platform.logInfo(`Deleting link with ID: ${linkId}`, 'TextBricksManagerProvider');

            // Find the link file by searching through all topics
            const locationInfo = await this.dataPathService.getCurrentLocationInfo();
            const scopePath = vscode.Uri.joinPath(
                vscode.Uri.file(locationInfo.path),
                'scopes',
                'local'
            );

            // Search for the link file recursively
            let linkFilePath: vscode.Uri | null = null;
            const platform = this.platform;

            async function searchForLinkFile(dir: vscode.Uri): Promise<vscode.Uri | null> {
                try {
                    const entries = await vscode.workspace.fs.readDirectory(dir);

                    for (const [name, type] of entries) {
                        const fullPath = vscode.Uri.joinPath(dir, name);

                        if (type === vscode.FileType.Directory) {
                            // Check if this is a links directory
                            if (name === 'links') {
                                // Look for the link file in this directory
                                const possibleLinkPath = vscode.Uri.joinPath(fullPath, `${linkId}.json`);
                                try {
                                    await vscode.workspace.fs.stat(possibleLinkPath);
                                    return possibleLinkPath;
                                } catch {
                                    // File not found, continue searching
                                }
                            } else {
                                // Recursively search subdirectories
                                const found = await searchForLinkFile(fullPath);
                                if (found) { return found; }
                            }
                        }
                    }
                } catch (error) {
                    platform.logWarning(`Error searching directory: ${dir.fsPath}`, 'TextBricksManagerProvider');
                }
                return null;
            }

            linkFilePath = await searchForLinkFile(scopePath);

            if (!linkFilePath) {
                vscode.window.showErrorMessage(`找不到連結檔案：${linkId}`);
                return;
            }

            // Delete the link file
            await vscode.workspace.fs.delete(linkFilePath);

            this.platform.logInfo(`Link deleted successfully at: ${linkFilePath.fsPath}`, 'TextBricksManagerProvider');
            vscode.window.showInformationMessage(`連結已刪除成功`);
            await this._sendData();

            // 通知 WebviewProvider 刷新顯示
            if (this.webviewProvider) {
                this.platform.logInfo('Notifying WebviewProvider to refresh after link deletion', 'TextBricksManagerProvider');
                await this.webviewProvider.refresh();
            }
        } catch (error) {
            this.platform.logError(error as Error, 'TextBricksManagerProvider._deleteLink');
            vscode.window.showErrorMessage(`刪除連結失敗: ${error}`);
        }
    }

    // ==================== Services API Methods ====================

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
            this.platform.logError(error as Error, 'TextBricksManagerProvider._updateServicesData');
        }
    }

    /**
     * 路徑轉顯示路徑
     */
    private _pathToDisplayPath(path: string, requestId?: string) {
        try {
            const displayPath = this.pathTransformService.pathToDisplayPath(path);
            this._panel?.webview.postMessage({
                type: 'serviceResponse',
                requestId,
                method: 'pathToDisplayPath',
                result: displayPath
            });
        } catch (error) {
            this._panel?.webview.postMessage({
                type: 'serviceError',
                requestId,
                method: 'pathToDisplayPath',
                error: String(error)
            });
        }
    }

    /**
     * 顯示路徑轉內部路徑
     */
    private _displayPathToPath(displayPath: string, requestId?: string) {
        try {
            const path = this.pathTransformService.displayPathToPath(displayPath);
            this._panel?.webview.postMessage({
                type: 'serviceResponse',
                requestId,
                method: 'displayPathToPath',
                result: path
            });
        } catch (error) {
            this._panel?.webview.postMessage({
                type: 'serviceError',
                requestId,
                method: 'displayPathToPath',
                error: String(error)
            });
        }
    }

    /**
     * 構建模板路徑
     */
    private _buildTemplatePath(template: unknown, requestId?: string) {
        try {
            const path = this.pathTransformService.buildTemplatePath(template);
            this._panel?.webview.postMessage({
                type: 'serviceResponse',
                requestId,
                method: 'buildTemplatePath',
                result: path
            });
        } catch (error) {
            this._panel?.webview.postMessage({
                type: 'serviceError',
                requestId,
                method: 'buildTemplatePath',
                error: String(error)
            });
        }
    }

    /**
     * 獲取項目識別符
     */
    private _getItemIdentifier(item: unknown, itemType: string, requestId?: string) {
        try {
            const identifier = this.pathTransformService.getItemIdentifier(item as any, itemType as any);
            this._panel?.webview.postMessage({
                type: 'serviceResponse',
                requestId,
                method: 'getItemIdentifier',
                result: identifier
            });
        } catch (error) {
            this._panel?.webview.postMessage({
                type: 'serviceError',
                requestId,
                method: 'getItemIdentifier',
                error: String(error)
            });
        }
    }

    /**
     * 獲取語言顯示名稱
     */
    private _getLanguageDisplayName(languageName: string, requestId?: string) {
        try {
            const displayName = this.displayNameService.getLanguageDisplayName(languageName);
            this._panel?.webview.postMessage({
                type: 'serviceResponse',
                requestId,
                method: 'getLanguageDisplayName',
                result: displayName
            });
        } catch (error) {
            this._panel?.webview.postMessage({
                type: 'serviceError',
                requestId,
                method: 'getLanguageDisplayName',
                error: String(error)
            });
        }
    }

    /**
     * 獲取主題顯示名稱
     */
    private _getTopicDisplayName(topicPath: string, requestId?: string) {
        try {
            const displayName = this.displayNameService.getTopicDisplayName(topicPath);
            this._panel?.webview.postMessage({
                type: 'serviceResponse',
                requestId,
                method: 'getTopicDisplayName',
                result: displayName
            });
        } catch (error) {
            this._panel?.webview.postMessage({
                type: 'serviceError',
                requestId,
                method: 'getTopicDisplayName',
                error: String(error)
            });
        }
    }

    /**
     * 獲取完整顯示路徑
     */
    private _getFullDisplayPath(path: string, requestId?: string) {
        try {
            const displayPath = this.displayNameService.getFullDisplayPath(path);
            this._panel?.webview.postMessage({
                type: 'serviceResponse',
                requestId,
                method: 'getFullDisplayPath',
                result: displayPath
            });
        } catch (error) {
            this._panel?.webview.postMessage({
                type: 'serviceError',
                requestId,
                method: 'getFullDisplayPath',
                error: String(error)
            });
        }
    }

    // ==================== End Services API Methods ====================

    private _getNonce(): string {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }
}