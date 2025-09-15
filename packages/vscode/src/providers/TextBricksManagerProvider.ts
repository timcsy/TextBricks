import * as vscode from 'vscode';
import { TextBricksEngine } from '@textbricks/core';
import { ExtendedTemplate, Language } from '@textbricks/shared';

export class TextBricksManagerProvider {
    public static readonly viewType = 'textbricks-manager';
    
    private _panel?: vscode.WebviewPanel;
    private _disposables: vscode.Disposable[] = [];

    constructor(
        private readonly _extensionUri: vscode.Uri,
        private readonly templateEngine: TextBricksEngine
    ) {}

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
            switch (message.type) {
                case 'loadData':
                    await this._sendData();
                    break;

                case 'createTemplate':
                    await this._createTemplate(message.data);
                    break;

                case 'updateTemplate':
                    await this._updateTemplate(message.templateId, message.data);
                    break;

                case 'deleteTemplate':
                    await this._deleteTemplate(message.templateId);
                    break;


                case 'createLanguage':
                    await this._createLanguage(message.data);
                    break;

                case 'updateLanguage':
                    await this._updateLanguage(message.languageId, message.data);
                    break;

                case 'createTopic':
                    await this._createTopic(message.data);
                    break;

                case 'updateTopic':
                    await this._updateTopic(message.topicId, message.data);
                    break;

                case 'deleteTopic':
                    await this._deleteTopic(message.topicId);
                    break;

                case 'exportTemplates':
                    await this._exportTemplates(message.filters);
                    break;

                case 'importTemplates':
                    await this._importTemplates();
                    break;

                case 'batchCreateTemplates':
                    await this._batchCreateTemplates(message.templates);
                    break;

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
        if (this._panel) {
            try {
                // 使用公開的getter方法來獲取數據
                console.log('Getting template manager...');
                const templateManager = this.templateEngine.getTemplateManager();
                console.log('Template manager:', templateManager);
                
                console.log('Getting templates...');
                const templates = templateManager.getAllTemplates();
                console.log('Templates count:', templates.length);
                
                // Topics are now managed differently
                
                console.log('Getting languages...');
                const languages = templateManager.getLanguages();
                console.log('Languages count:', languages.length);

                console.log('Getting topics...');
                const topics = templateManager.getManagedTopics();
                console.log('Topics count:', topics.length);

                console.log('Sending dataLoaded message...');
                this._panel.webview.postMessage({
                    type: 'dataLoaded',
                    data: {
                        templates,
                        languages,
                        topics
                    }
                });
                console.log('dataLoaded message sent');
            } catch (error) {
                console.error('Error in _sendData:', error);
                this._panel.webview.postMessage({
                    type: 'error',
                    message: 'Failed to load data: ' + (error instanceof Error ? error.message : String(error))
                });
            }
        } else {
            console.log('No panel available');
        }
    }

    private async _createTemplate(templateData: Omit<ExtendedTemplate, 'id'>) {
        const newTemplate = await this.templateEngine.createTemplate(templateData);
        vscode.window.showInformationMessage(`模板 "${newTemplate.title}" 已創建成功`);
        await this._sendData();
    }

    private async _updateTemplate(templateId: string, updates: Partial<ExtendedTemplate>) {
        const updated = await this.templateEngine.updateTemplate(templateId, updates);
        if (updated) {
            vscode.window.showInformationMessage(`模板 "${updated.title}" 已更新成功`);
            await this._sendData();
        } else {
            vscode.window.showErrorMessage('找不到指定的模板');
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
        const newTopic = await this.templateEngine.createTopic(topicData);
        vscode.window.showInformationMessage(`主題 "${newTopic.name}" 已創建成功`);
        await this._sendData();
    }

    private async _updateTopic(topicId: string, updates: any) {
        const updated = await this.templateEngine.updateTopic(topicId, updates);
        if (updated) {
            vscode.window.showInformationMessage(`主題 "${updated.name}" 已更新成功`);
            await this._sendData();
        } else {
            vscode.window.showErrorMessage('找不到指定的主題');
        }
    }

    private async _deleteTopic(topicId: string) {
        const topic = this.templateEngine.getTopicById(topicId);
        if (!topic) {
            vscode.window.showErrorMessage('找不到指定的主題');
            return;
        }

        const confirmed = await vscode.window.showWarningMessage(
            `確定要刪除主題 "${topic.name}" 嗎？此操作無法恢復。`,
            '確定',
            '取消'
        );

        if (confirmed === '確定') {
            await this.templateEngine.deleteTopic(topicId);
            vscode.window.showInformationMessage(`主題 "${topic.name}" 已刪除`);
            await this._sendData();
        }
    }

    private _getHtmlForWebview(webview: vscode.Webview): string {
        const styleUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'assets', 'css', 'textbricks-manager.css')
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
    <link href="${styleUri}" rel="stylesheet">
    <title>TextBricks Manager</title>
</head>
<body>
    <div id="app">
        <div class="header">
            <h1>TextBricks Manager</h1>
            <div class="toolbar">
                <button id="refresh-btn" class="btn btn-secondary">
                    <span class="icon">🔄</span> 重新整理
                </button>
                <button id="import-btn" class="btn btn-primary">
                    <span class="icon">📥</span> 匯入模板
                </button>
                <button id="export-btn" class="btn btn-primary">
                    <span class="icon">📤</span> 匯出模板
                </button>
            </div>
        </div>

        <div class="main-content">
            <div class="sidebar">
                <div class="sidebar-section">
                    <h3>管理項目</h3>
                    <nav class="nav-menu">
                        <button class="nav-item active" data-tab="templates">
                            <span class="icon">📄</span> 模板管理
                        </button>
                        <button class="nav-item" data-tab="topics">
                            <span class="icon">🏷️</span> 主題管理
                        </button>
                        <button class="nav-item" data-tab="languages">
                            <span class="icon">💬</span> 語言管理
                        </button>
                        <button class="nav-item" data-tab="analytics" disabled>
                            <span class="icon">📊</span> 使用統計 (即將推出)
                        </button>
                        <button class="nav-item" data-tab="users" disabled>
                            <span class="icon">👥</span> 用戶管理 (即將推出)
                        </button>
                    </nav>
                </div>
                
                <div class="sidebar-section">
                    <h3>快速操作</h3>
                    <div class="quick-actions">
                        <button id="create-template-btn" class="btn btn-success btn-full">
                            <span class="icon">➕</span> 新增模板
                        </button>
                        <button id="create-topic-btn" class="btn btn-secondary btn-full">
                            <span class="icon">🏷️</span> 新增主題
                        </button>
                        <button id="create-language-btn" class="btn btn-secondary btn-full">
                            <span class="icon">💬</span> 新增語言
                        </button>
                        <button id="json-import-btn" class="btn btn-info btn-full">
                            <span class="icon">📋</span> JSON批次新增
                        </button>
                    </div>
                </div>
            </div>

            <div class="content-area">
                <div id="loading" class="loading">
                    <div class="spinner"></div>
                    <p>載入中...</p>
                </div>

                <!-- Templates Tab -->
                <div id="templates-tab" class="tab-content active">
                    <div class="tab-header">
                        <h2>模板管理</h2>
                        <div class="filters">
                            <select id="filter-language">
                                <option value="">所有語言</option>
                            </select>
                            <input type="text" id="search-templates" placeholder="搜尋模板...">
                        </div>
                    </div>
                    <div id="topics-stats"></div>
                    <div id="templates-list" class="data-list"></div>
                </div>


                <!-- Topics Tab -->
                <div id="topics-tab" class="tab-content">
                    <div class="tab-header">
                        <h2>主題管理</h2>
                    </div>
                    <div id="topics-list" class="data-list"></div>
                </div>

                <!-- Languages Tab -->
                <div id="languages-tab" class="tab-content">
                    <div class="tab-header">
                        <h2>語言管理</h2>
                    </div>
                    <div id="languages-list" class="data-list"></div>
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

    <script nonce="${nonce}" src="${scriptUri}"></script>
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