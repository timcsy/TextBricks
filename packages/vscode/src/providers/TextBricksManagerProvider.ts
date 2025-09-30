import * as vscode from 'vscode';
import { TextBricksEngine, ScopeManager, TopicManager, DataPathService } from '@textbricks/core';
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

export class TextBricksManagerProvider {
    public static readonly viewType = 'textbricks-manager';

    private _panel?: vscode.WebviewPanel;
    private _disposables: vscode.Disposable[] = [];
    private scopeManager: ScopeManager;
    private topicManager: TopicManager;
    private dataPathService: DataPathService;
    private platform: VSCodePlatform;

    private initializationPromise: Promise<void>;

    constructor(
        private readonly _extensionUri: vscode.Uri,
        private readonly templateEngine: TextBricksEngine,
        private readonly context: vscode.ExtensionContext,
        private readonly webviewProvider?: WebviewProvider
    ) {
        this.platform = new VSCodePlatform(context);
        this.dataPathService = DataPathService.getInstance(this.platform);
        this.scopeManager = new ScopeManager(this.platform);
        this.topicManager = new TopicManager(this.platform, this.dataPathService);

        // 啟動初始化但不等待
        this.initializationPromise = this.initializeManagers();
    }

    private async initializeManagers(): Promise<void> {
        try {
            await this.platform.initialize();
            await this.dataPathService.initialize();
            await this.scopeManager.initialize();
            await this.topicManager.initialize();

            // 監聽 scope 切換事件
            this.scopeManager.addEventListener(event => {
                if (event.type === 'scope-switched') {
                    this.topicManager.setScopeId(event.scopeId);
                    this.topicManager.initialize();
                    this._sendData();
                }
            });
        } catch (error) {
            console.error('Failed to initialize managers:', error);
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

    private async _handleMessage(message: any) {
        try {
            console.log('Received message from WebView:', message);
            switch (message.type) {
                // 數據載入
                case 'loadData':
                    await this._sendData();
                    break;

                // Scope 管理
                case 'switchScope':
                    await this._switchScope(message.scopeId);
                    break;

                case 'createScope':
                    await this._createScope(message.data);
                    break;

                case 'updateScope':
                    await this._updateScope(message.scopeId, message.data);
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
                    await this._updateTopic(message.topicId, message.data);
                    break;

                case 'deleteTopic':
                    await this._deleteTopic(message.topicId, message.deleteChildren);
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
                    await this._updateTemplate(message.templateId, message.data);
                    break;

                case 'deleteTemplate':
                    await this._deleteTemplate(message.templateId);
                    break;

                case 'batchCreateTemplates':
                    await this._batchCreateTemplates(message.templates);
                    break;

                // 連結管理 (臨時實現)
                case 'createLink':
                    await this._createLink(message.data);
                    break;

                case 'updateLink':
                    await this._updateLink(message.linkId, message.data);
                    break;

                case 'deleteLink':
                    vscode.window.showInformationMessage(`連結已刪除成功（臨時功能）`);
                    break;

                // 語言管理
                case 'createLanguage':
                    await this._createLanguage(message.data);
                    break;

                case 'updateLanguage':
                    await this._updateLanguage(message.languageId, message.data);
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
        console.log('_sendData called');

        // 等待初始化完成
        try {
            await this.initializationPromise;
            console.log('Managers initialized successfully');
        } catch (initError) {
            console.error('Manager initialization failed:', initError);
        }

        if (this._panel) {
            try {
                // 獲取基本的模板和語言資料
                const templateManager = this.templateEngine.getTemplateManager();
                const templates = templateManager.getAllTemplates();
                const languages = templateManager.getLanguages();

                // 嘗試獲取新的管理器數據，如果失敗則使用默認值
                let currentScope = null;
                let availableScopes: any[] = [];
                let usageStats = null;
                let favorites: any[] = [];
                let topicHierarchy = null;
                let topicStats = null;

                try {
                    currentScope = this.cleanCircularReferences(this.scopeManager.getCurrentScope());
                    availableScopes = this.cleanCircularReferences(this.scopeManager.getAvailableScopes());
                    usageStats = this.cleanCircularReferences(this.scopeManager.getUsageStats());
                    favorites = this.cleanCircularReferences(this.scopeManager.getFavorites());
                } catch (scopeError) {
                    console.warn('ScopeManager error:', scopeError);
                    // 使用默認的 scope 數據
                    currentScope = { id: 'local', name: '本機範圍', type: 'local' };
                    availableScopes = [currentScope];
                    favorites = [];
                }

                try {
                    const rawHierarchy = this.topicManager.getHierarchy();
                    // 清理循環引用：移除 parent 屬性，保留結構
                    topicHierarchy = this.cleanCircularReferences(rawHierarchy);
                    topicStats = this.cleanCircularReferences(this.topicManager.getStatistics());
                } catch (topicError) {
                    console.warn('TopicManager error:', topicError);
                    // 從現有模板數據構建簡單的主題統計
                    const topics = [...new Set(templates.map(t => t.topic))];
                    topicStats = {
                        totalTopics: topics.length,
                        activeTopics: topics.length
                    };
                }

                console.log('Sending dataLoaded message with fallback data...');

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
                    console.log('dataLoaded message sent successfully');
                } catch (jsonError) {
                    console.error('JSON serialization error:', jsonError);
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
                    console.log('Simplified dataLoaded message sent');
                }
            } catch (error) {
                console.error('Critical error in _sendData:', error);

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
            console.log('No panel available');
        }
    }

    private cleanCircularReferences(obj: any): any {
        if (!obj || typeof obj !== 'object') {
            return obj;
        }

        if (Array.isArray(obj)) {
            return obj.map(item => this.cleanCircularReferences(item));
        }

        const cleaned: any = {};
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

    private async _createTemplate(templateData: Omit<ExtendedTemplate, 'id'>) {
        try {
            console.log('Creating template with data:', templateData);
            const newTemplate = await this.templateEngine.createTemplate(templateData);
            console.log('Template created successfully:', newTemplate);
            vscode.window.showInformationMessage(`模板 "${newTemplate.title}" 已創建成功`);
            await this._sendData();
        } catch (error) {
            console.error('Error creating template:', error);
            vscode.window.showErrorMessage(`創建模板失敗: ${error}`);
        }
    }

    private async _updateTemplate(templateId: string, updates: Partial<ExtendedTemplate>) {
        try {
            console.log('Updating template with ID:', templateId, 'Updates:', updates);
            const updated = await this.templateEngine.updateTemplate(templateId, updates);
            if (updated) {
                console.log('Template updated successfully:', updated);

                // 等待一小段時間確保文件操作完成
                await new Promise(resolve => setTimeout(resolve, 100));

                // 刷新模板管理器數據
                await this._sendData();

                // 通知 WebviewProvider 刷新顯示，並保持導航狀態
                if (this.webviewProvider) {
                    console.log('Notifying WebviewProvider to refresh with preserved navigation state...');
                    console.log('[Debug] Template ID being updated:', templateId);
                    console.log('[Debug] Template updates:', updates);
                    await this.webviewProvider.refresh(true);
                }

                vscode.window.showInformationMessage(`模板 "${updated.title}" 已更新成功`);
            } else {
                console.warn('Template not found for ID:', templateId);
                vscode.window.showErrorMessage('找不到指定的模板');
            }
        } catch (error) {
            console.error('Error updating template:', error);
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
        vscode.window.showInformationMessage(`語言 "${newLanguage.displayName}" 已創建成功`);
        await this._sendData();
    }

    private async _updateLanguage(languageId: string, updates: Partial<Language>) {
        const updated = await this.templateEngine.updateLanguage(languageId, updates);
        if (updated) {
            vscode.window.showInformationMessage(`語言 "${updated.displayName}" 已更新成功`);
            await this._sendData();
        } else {
            vscode.window.showErrorMessage('找不到指定的語言');
        }
    }

    private async _exportTemplates(filters?: any) {
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
                const result = await this.templateEngine.importTemplates(importData, options);

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

    private async _batchCreateTemplates(templates: any[]) {
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
                    const templateManager = this.templateEngine.getTemplateManager();
                    const languageExists = templateManager.getLanguageById(template.language);

                    if (!languageExists) {
                        throw new Error(`模板 ${index}: 語言 "${template.language}" 不存在`);
                    }

                    // Create the template
                    await this.templateEngine.createTemplate({
                        title: template.title,
                        description: template.description,
                        code: template.code,
                        language: template.language,
                        topic: template.topic
                    });

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

    private async _createTopic(topicData: any) {
        try {
            const newTopic = await this.topicManager.createTopic(topicData);
            vscode.window.showInformationMessage(`主題 "${newTopic.displayName}" 已創建成功`);
            await this._sendData();

            // 通知 WebviewProvider 刷新顯示
            if (this.webviewProvider) {
                console.log('Notifying WebviewProvider to refresh after topic creation...');
                await this.webviewProvider.refresh();
            }
        } catch (error) {
            vscode.window.showErrorMessage(`創建主題失敗: ${error}`);
        }
    }

    private async _updateTopic(topicId: string, updates: any) {
        try {
            const updated = await this.topicManager.updateTopic(topicId, updates);
            vscode.window.showInformationMessage(`主題 "${updated.displayName}" 已更新成功`);
            await this._sendData();

            // 通知 WebviewProvider 刷新顯示，保持導航狀態
            if (this.webviewProvider) {
                console.log('Notifying WebviewProvider to refresh after topic update...');
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
                `確定要刪除主題 "${topic.displayName}" 嗎？此操作無法恢復。`,
                '確定',
                '取消'
            );

            if (confirmed === '確定') {
                await this.topicManager.deleteTopic(topicId, deleteChildren);
                vscode.window.showInformationMessage(`主題 "${topic.displayName}" 已刪除`);
                await this._sendData();

                // 通知 WebviewProvider 刷新顯示
                if (this.webviewProvider) {
                    console.log('Notifying WebviewProvider to refresh after topic deletion...');
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

    private async _createScope(scopeData: any) {
        try {
            const newScope = await this.scopeManager.createScope(scopeData);
            vscode.window.showInformationMessage(`範圍 "${newScope.name}" 已創建成功`);
            await this._sendData();
        } catch (error) {
            vscode.window.showErrorMessage(`創建範圍失敗: ${error}`);
        }
    }

    private async _updateScope(scopeId: string, updates: any) {
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

    private async _exportScope(options: any) {
        try {
            const saveUri = await vscode.window.showSaveDialog({
                defaultUri: vscode.Uri.file('scope-export.json'),
                filters: {
                    'JSON Files': ['json'],
                    'All Files': ['*']
                }
            });

            if (saveUri) {
                const exportData = await this.scopeManager.exportScope(
                    options.includeTemplates || true,
                    options.includeStats || true
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
            await this.scopeManager.addToFavorites(itemId);
            vscode.window.showInformationMessage('已添加到收藏');
            await this._sendData();
        } catch (error) {
            vscode.window.showErrorMessage(`添加到收藏失敗: ${error}`);
        }
    }

    private async _removeFromFavorites(itemId: string) {
        try {
            await this.scopeManager.removeFromFavorites(itemId);
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

    private async _moveTopic(operation: any) {
        try {
            await this.topicManager.moveTopic(operation);
            vscode.window.showInformationMessage('主題已移動');
            await this._sendData();
        } catch (error) {
            vscode.window.showErrorMessage(`移動主題失敗: ${error}`);
        }
    }

    private async _reorderTopics(operations: any[]) {
        try {
            await this.topicManager.reorderTopics(operations);
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
        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'assets', 'js', 'textbricks-manager.js')
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

    <script nonce="${nonce}" src="${utilsUri}"></script>
    <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
    }

    private async _createLink(linkData: any) {
        try {
            console.log('Creating link with data:', linkData);

            // Create link JSON file in the appropriate topic's links directory
            const linkPath = await this._getLinkPath(linkData);

            await vscode.workspace.fs.writeFile(
                vscode.Uri.file(linkPath),
                Buffer.from(JSON.stringify(linkData, null, 2))
            );

            console.log('Link created successfully at:', linkPath);
            vscode.window.showInformationMessage(`連結 "${linkData.title}" 已創建成功`);
            await this._sendData();
        } catch (error) {
            console.error('Error creating link:', error);
            vscode.window.showErrorMessage(`創建連結失敗: ${error}`);
        }
    }

    private async _updateLink(linkId: string, linkData: any) {
        try {
            console.log('Updating link with ID:', linkId, 'Data:', linkData);

            // Find and update the link JSON file
            const linkPath = await this._getLinkPath(linkData);

            await vscode.workspace.fs.writeFile(
                vscode.Uri.file(linkPath),
                Buffer.from(JSON.stringify(linkData, null, 2))
            );

            console.log('Link updated successfully at:', linkPath);
            vscode.window.showInformationMessage(`連結已更新成功`);
            await this._sendData();
        } catch (error) {
            console.error('Error updating link:', error);
            vscode.window.showErrorMessage(`更新連結失敗: ${error}`);
        }
    }

    private async _getLinkPath(linkData: any): Promise<string> {
        // Get the current data location
        const locationInfo = await this.dataPathService.getCurrentLocationInfo();

        // TODO: Determine the current topic context from the manager UI
        // For now, we need to get this information from the frontend
        // This should be passed along with the linkData in the future

        // Default to a root links directory for now
        // In a complete implementation, this should come from the current topic selection
        let currentTopicPath = 'general'; // Default fallback

        // If linkData contains information about the current topic context, use it
        if (linkData.currentTopic) {
            currentTopicPath = linkData.currentTopic;
        }

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

        // Create the link file path
        const linkFilePath = vscode.Uri.joinPath(linksDirPath, `${linkData.id}.json`);
        return linkFilePath.fsPath;
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