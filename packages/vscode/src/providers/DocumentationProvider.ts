import * as vscode from 'vscode';
import { DocumentationService } from '@textbricks/core';
import { TextBricksEngine } from '@textbricks/core';
import { CodeOperationService } from '@textbricks/core';
import { Template, DocumentationType, Topic } from '@textbricks/shared';

// Message type definition
interface DocumentationMessage {
    type: string;
    [key: string]: unknown;
}

// Documentation result type (flexible for different documentation formats)
type DocumentationResult = unknown;

export class DocumentationProvider {
    public static readonly viewType = 'textbricks-documentation';

    private _panel?: vscode.WebviewPanel;
    private _disposables: vscode.Disposable[] = [];
    private _currentTemplate?: Template;
    private platform;

    constructor(
        private readonly _extensionUri: vscode.Uri,
        private readonly templateEngine: TextBricksEngine,
        private readonly documentationService: DocumentationService,
        private readonly codeOperationService: CodeOperationService
    ) {
        this.platform = this.templateEngine.getPlatform();
    }

    public async showDocumentation(templatePath: string) {
        // Force reload latest data to ensure we get the most current template documentation
        this.platform.logInfo('Force reloading data before showing template documentation', 'DocumentationProvider');
        await this.templateEngine.forceReloadTemplates();

        const template = this.templateEngine.getTemplateByPath(templatePath);
        if (!template) {
            vscode.window.showErrorMessage(`找不到模板路徑: ${templatePath}`);
            return;
        }

        if (!template.documentation) {
            vscode.window.showWarningMessage(`模板 "${template.title}" 沒有說明文檔`);
            return;
        }

        this._currentTemplate = template;

        // Create or show panel
        const column = vscode.ViewColumn.Beside; // Open beside current editor
        
        if (this._panel) {
            this._panel.reveal(column);
        } else {
            this._panel = vscode.window.createWebviewPanel(
                DocumentationProvider.viewType,
                `📖 ${template.title} - 說明文檔`,
                column,
                {
                    enableScripts: true,
                    localResourceRoots: [this._extensionUri],
                    retainContextWhenHidden: true
                }
            );

            this._panel.onDidDispose(
                () => this._onPanelDisposed(),
                null,
                this._disposables
            );

            // Handle messages from webview if needed
            this._panel.webview.onDidReceiveMessage(
                message => this._handleMessage(message),
                null,
                this._disposables
            );
        }

        // Load and display documentation
        await this._updateWebview();
    }

    public async showTopicDocumentation(topic: Topic) {
        // Force reload latest data to ensure we get the most current topic documentation
        this.platform.logInfo('Force reloading data before showing topic documentation', 'DocumentationProvider');
        await this.templateEngine.forceReloadTemplates();

        const allTopics = this.templateEngine.getAllTopicConfigs();
        let latestTopic = allTopics.find(t => t.name === topic.name);

        if (!latestTopic) {
            // Direct file system read as fallback
            try {
                const fs = require('fs').promises;
                const path = require('path');

                // Try to construct the topic file path using working directory
                const dataPath = path.join(process.cwd(), 'data');
                const topicFilePath = path.join(dataPath, 'local', topic.name, 'topic.json');

                this.platform.logInfo(`Attempting direct file read from: ${topicFilePath}`, 'DocumentationProvider');
                const topicFileContent = await fs.readFile(topicFilePath, 'utf8');
                latestTopic = JSON.parse(topicFileContent);
                this.platform.logInfo('Direct file read successful', 'DocumentationProvider');
            } catch (error) {
                this.platform.logError(error as Error, 'DocumentationProvider.showTopicDocumentation');
            }
        }

        this.platform.logInfo(`Latest topic data: ${latestTopic?.name}, doc length: ${latestTopic?.documentation?.length}`, 'DocumentationProvider');

        if (!latestTopic || !latestTopic.documentation) {
            vscode.window.showWarningMessage(`主題 "${topic.name}" 沒有說明文檔`);
            return;
        }

        // Create or show panel for topic
        const column = vscode.ViewColumn.Beside; // Open beside current editor

        if (this._panel) {
            this._panel.reveal(column);
        } else {
            this._panel = vscode.window.createWebviewPanel(
                DocumentationProvider.viewType,
                `📖 ${latestTopic.name} 主題 - 說明文件`,
                column,
                {
                    enableScripts: true,
                    localResourceRoots: [this._extensionUri],
                    retainContextWhenHidden: true
                }
            );

            this._panel.onDidDispose(
                () => this._onPanelDisposed(),
                null,
                this._disposables
            );

            // Handle messages from webview if needed
            this._panel.webview.onDidReceiveMessage(
                message => this._handleMessage(message),
                null,
                this._disposables
            );
        }

        // Load and display topic documentation with latest data
        await this._updateTopicWebview(latestTopic);
    }

    private _onPanelDisposed() {
        this._panel = undefined;
        this._currentTemplate = undefined;
        
        // Clean up resources
        while (this._disposables.length) {
            const disposable = this._disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }

    private async _handleMessage(message: DocumentationMessage & Record<string, any>) {
        this.platform.logInfo(`Received message: ${message.type}`, 'DocumentationProvider');
        
        switch (message.type) {
            case 'refresh':
                await this._updateWebview();
                break;
            case 'copyCode':
                if (this._currentTemplate) {
                    await vscode.env.clipboard.writeText(this._currentTemplate.code);
                    vscode.window.showInformationMessage('程式碼已複製到剪貼簿');
                }
                break;
            case 'copyCodeBlock':
                this.platform.logInfo(`Handling copyCodeBlock, code length: ${message.code?.length}`, 'DocumentationProvider');
                if (message.code) {
                    await this.codeOperationService.copyCodeSnippet(message.code, message.templateId);
                } else {
                    this.platform.logWarning('No code in copyCodeBlock message', 'DocumentationProvider');
                    vscode.window.showErrorMessage('沒有程式碼可複製');
                }
                break;
            case 'insertCodeBlock':
                this.platform.logInfo(`Handling insertCodeBlock, code length: ${message.code?.length}`, 'DocumentationProvider');
                if (message.code) {
                    await this.codeOperationService.insertCodeSnippet(message.code, message.templateId);
                } else {
                    this.platform.logWarning('No code in insertCodeBlock message', 'DocumentationProvider');
                    vscode.window.showErrorMessage('沒有程式碼可插入');
                }
                break;
            case 'openExternal':
                if (message.url) {
                    vscode.env.openExternal(vscode.Uri.parse(message.url));
                }
                break;
            default:
                this.platform.logWarning(`Unknown message type: ${message.type}`, 'DocumentationProvider');
        }
    }

    private async _updateWebview() {
        if (!this._panel || !this._currentTemplate) {
            return;
        }

        try {
            // Show loading state
            this._panel.webview.html = this._getLoadingHtml();

            // Process documentation
            const docResult = await this.documentationService.processDocumentation(
                this._currentTemplate, 
                this._currentTemplate.documentation!
            );

            // Update title if needed
            this._panel.title = `📖 ${this._currentTemplate.title} - 說明文檔`;

            // Generate final HTML
            this._panel.webview.html = this._getDocumentationHtml(docResult, this._currentTemplate);
            
            // Send refresh complete message to webview
            setTimeout(() => {
                this._panel?.webview.postMessage({ type: 'refresh-complete' });
            }, 100); // Small delay to ensure HTML is loaded

        } catch (error) {
            this.platform.logError(error as Error, 'DocumentationProvider._updateWebview');
            this._panel.webview.html = this._getErrorHtml(`載入說明文檔時發生錯誤：${error}`);
        }
    }

    private async _updateTopicWebview(topic: Topic) {
        if (!this._panel || !topic.documentation) {
            return;
        }

        try {
            // Show loading state
            this._panel.webview.html = this._getLoadingHtml();

            // Update title
            this._panel.title = `📖 ${topic.name}`;

            // Generate HTML for topic documentation (simple markdown content)
            const docResult = {
                type: 'markdown' as DocumentationType,
                content: topic.documentation,
                processedAt: new Date(),
                metadata: {}
            };

            // Generate final HTML
            this._panel.webview.html = this._getTopicDocumentationHtml(docResult, topic);

            // Send refresh complete message to webview
            setTimeout(() => {
                this._panel?.webview.postMessage({ type: 'refresh-complete' });
            }, 100); // Small delay to ensure HTML is loaded

        } catch (error) {
            this.platform.logError(error as Error, 'DocumentationProvider._updateTopicWebview');
            this._panel.webview.html = this._getErrorHtml(`載入主題說明文檔時發生錯誤：${error}`);
        }
    }

    private _getLoadingHtml(): string {
        return `<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>載入中...</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            padding: 20px;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
        }
        .loading {
            text-align: center;
        }
        .spinner {
            width: 32px;
            height: 32px;
            border: 3px solid var(--vscode-progressBar-background);
            border-top: 3px solid var(--vscode-progressBar-foreground);
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 16px;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="loading">
        <div class="spinner"></div>
        <p>正在載入說明文檔...</p>
    </div>
</body>
</html>`;
    }

    private _getErrorHtml(error: string): string {
        return `<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>載入錯誤</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            padding: 20px;
        }
        .error {
            color: var(--vscode-errorForeground);
            background-color: var(--vscode-inputValidation-errorBackground);
            border: 1px solid var(--vscode-inputValidation-errorBorder);
            padding: 16px;
            border-radius: 4px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <h1>🚫 載入錯誤</h1>
    <div class="error">
        <strong>錯誤詳情：</strong><br>
        ${error}
    </div>
    <button onclick="location.reload()">重新載入</button>
</body>
</html>`;
    }

    private _getDocumentationHtml(docResult: DocumentationResult, template: Template): string {
        const variablesUri = this._panel!.webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'assets', 'css', 'common', 'variables.css')
        );
        const componentsUri = this._panel!.webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'assets', 'css', 'common', 'components.css')
        );
        const styleUri = this._panel!.webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'assets', 'css', 'documentation-panel', 'documentation-panel.css')
        );
        const scriptUri = this._panel!.webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'assets', 'js', 'documentation-panel', 'documentation.js')
        );

        // Import highlight.js for code syntax highlighting
        const highlightCssUri = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/vs2015.min.css';
        const highlightJsUri = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js';

        const nonce = this._getNonce();

        const result = docResult as any;
        let contentHtml = '';

        if (result.error) {
            contentHtml = `<div class="error">
                <h2>⚠️ 載入錯誤</h2>
                <p>${result.error}</p>
            </div>`;
        } else {
            contentHtml = this.markdownToHtml(result.content, template.name);
        }

        return `<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; 
        style-src ${this._panel!.webview.cspSource} 'unsafe-inline' https://cdnjs.cloudflare.com; 
        script-src 'nonce-${nonce}' https://cdnjs.cloudflare.com 'unsafe-inline'; 
        img-src ${this._panel!.webview.cspSource} data: https:;">
    
    <title>${template.title} - 說明文檔</title>
    <link href="${variablesUri}" rel="stylesheet">
    <link href="${componentsUri}" rel="stylesheet">
    <link href="${styleUri}" rel="stylesheet">
    <link rel="stylesheet" href="${highlightCssUri}">
</head>
<body>
    <div class="documentation-container">
        <div class="header">
            <h1 class="doc-title">
                <span class="doc-icon">📖</span>
                ${this._escapeHtml(template.title)} - 說明文檔
            </h1>
            <div class="header-actions">
                <button id="refresh-btn" class="btn btn-secondary" title="重新載入">
                    <span class="icon">🔄</span> 重新載入
                </button>
                <button id="copy-code-btn" class="btn btn-primary" title="複製模板程式碼">
                    <span class="icon">📋</span> 複製程式碼
                </button>
            </div>
        </div>
        
        <div class="template-info">
            <div class="info-item">
                <span class="label">程式語言：</span>
                <span class="value language-tag">${template.language.toUpperCase()}</span>
            </div>
            <div class="info-item">
                <span class="label">語言：</span>
                <span class="value">${template.language}</span>
            </div>
            <div class="info-item">
                <span class="label">文檔類型：</span>
                <span class="value doc-type">${this._getDocTypeDisplay(result.type)}</span>
            </div>
        </div>

        <div class="documentation-content">
            ${contentHtml}
        </div>
    </div>

    <script src="${highlightJsUri}"></script>
    <script nonce="${nonce}">
        // Initialize syntax highlighting
        hljs.highlightAll();
    </script>
    <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
    }

    public markdownToHtml(markdown: string, identifier?: string): string {
        // Simple markdown to HTML conversion
        // In a real implementation, you'd use a proper markdown parser like 'marked'
        let html = markdown;

        // Headers
        html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');
        html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
        html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');

        // Code blocks
        html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
            const language = lang || '';
            const trimmedCode = code.trim();
            const codeId = Math.random().toString(36).substring(2, 11); // Generate unique ID
            // Store the raw code in a data attribute to preserve formatting
            const rawCodeEscaped = this._escapeHtml(trimmedCode);
            const dataId = identifier || this._currentTemplate?.name || '';
            return `<div class="code-block-container" data-template-path="${dataId}">
                <div class="code-block-header">
                    <span class="language-label">${language.toUpperCase() || 'CODE'}</span>
                    <div class="code-actions">
                        <button class="code-action-btn insert-code-btn" data-code-id="${codeId}" data-raw-code="${this._escapeHtml(JSON.stringify(trimmedCode))}" title="插入程式碼">＋ 插入</button>
                        <button class="code-action-btn copy-code-btn" data-code-id="${codeId}" data-raw-code="${this._escapeHtml(JSON.stringify(trimmedCode))}" title="複製程式碼">📋 複製</button>
                    </div>
                </div>
                <pre id="code-${codeId}"><code class="language-${language}">${rawCodeEscaped}</code></pre>
            </div>`;
        });

        // Inline code
        html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

        // Bold and italic
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

        // Links
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" onclick="handleLinkClick(\'$2\')">$1</a>');

        // Lists - improved handling for both bulleted and numbered lists
        const lines = html.split('\n');
        let processedLines: string[] = [];
        let inBulletList = false;
        let inNumberedList = false;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const isBulletItem = /^- (.*)/.test(line);
            const isNumberedItem = /^\d+\.\s+(.*)/.test(line);

            if (isBulletItem) {
                const content = line.replace(/^- (.*)/, '$1');
                if (inNumberedList) {
                    processedLines.push('</ol>');
                    inNumberedList = false;
                }
                if (!inBulletList) {
                    processedLines.push('<ul>');
                    inBulletList = true;
                }
                processedLines.push(`<li>${content}</li>`);
            } else if (isNumberedItem) {
                const content = line.replace(/^\d+\.\s+(.*)/, '$1');
                if (inBulletList) {
                    processedLines.push('</ul>');
                    inBulletList = false;
                }
                if (!inNumberedList) {
                    processedLines.push('<ol>');
                    inNumberedList = true;
                }
                processedLines.push(`<li>${content}</li>`);
            } else {
                if ((inBulletList || inNumberedList) && line.trim() === '') {
                    // Empty line after list items - check if next non-empty line is also a list item
                    let nextNonEmptyIndex = i + 1;
                    while (nextNonEmptyIndex < lines.length && lines[nextNonEmptyIndex].trim() === '') {
                        nextNonEmptyIndex++;
                    }

                    const nextLineIsList = nextNonEmptyIndex < lines.length &&
                        (/^- (.*)/.test(lines[nextNonEmptyIndex]) || /^\d+\.\s+(.*)/.test(lines[nextNonEmptyIndex]));

                    if (!nextLineIsList) {
                        // Close the appropriate list
                        if (inBulletList) {
                            processedLines.push('</ul>');
                            inBulletList = false;
                        }
                        if (inNumberedList) {
                            processedLines.push('</ol>');
                            inNumberedList = false;
                        }
                    }
                } else if (inBulletList || inNumberedList) {
                    // Non-list line while in list - close the appropriate list
                    if (inBulletList) {
                        processedLines.push('</ul>');
                        inBulletList = false;
                    }
                    if (inNumberedList) {
                        processedLines.push('</ol>');
                        inNumberedList = false;
                    }
                }
                processedLines.push(line);
            }
        }

        // Close lists if still open at end
        if (inBulletList) {
            processedLines.push('</ul>');
        }
        if (inNumberedList) {
            processedLines.push('</ol>');
        }
        
        html = processedLines.join('\n');

        // Paragraphs
        html = html.replace(/\n\n/g, '</p><p>');
        html = '<p>' + html + '</p>';

        // Clean up empty paragraphs
        html = html.replace(/<p><\/p>/g, '');
        html = html.replace(/<p>(<h[1-6]>)/g, '$1');
        html = html.replace(/(<\/h[1-6]>)<\/p>/g, '$1');
        html = html.replace(/<p>(<pre>)/g, '$1');
        html = html.replace(/(<\/pre>)<\/p>/g, '$1');
        html = html.replace(/<p>(<ul>)/g, '$1');
        html = html.replace(/(<\/ul>)<\/p>/g, '$1');

        return html;
    }

    private _getTopicDocumentationHtml(docResult: DocumentationResult, topic: Topic): string {
        const variablesUri = this._panel!.webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'assets', 'css', 'common', 'variables.css')
        );
        const componentsUri = this._panel!.webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'assets', 'css', 'common', 'components.css')
        );
        const styleUri = this._panel!.webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'assets', 'css', 'documentation-panel', 'documentation-panel.css')
        );
        const scriptUri = this._panel!.webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'assets', 'js', 'documentation-panel', 'documentation.js')
        );

        // Import highlight.js for code syntax highlighting
        const highlightCssUri = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/vs2015.min.css';
        const highlightJsUri = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js';

        const nonce = this._getNonce();

        const result = docResult as any;
        let contentHtml = '';

        if (result.error) {
            contentHtml = `<div class="error">
                <h2>⚠️ 載入錯誤</h2>
                <p>${result.error}</p>
            </div>`;
        } else {
            // Convert markdown to HTML for topic documentation
            contentHtml = this.markdownToHtml(result.content, topic.name);
        }

        return `<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none';
        style-src ${this._panel!.webview.cspSource} 'unsafe-inline' https://cdnjs.cloudflare.com;
        script-src 'nonce-${nonce}' https://cdnjs.cloudflare.com 'unsafe-inline';
        img-src ${this._panel!.webview.cspSource} data: https:;">

    <title>${topic.name}</title>
    <link href="${variablesUri}" rel="stylesheet">
    <link href="${componentsUri}" rel="stylesheet">
    <link href="${styleUri}" rel="stylesheet">
    <link rel="stylesheet" href="${highlightCssUri}">
</head>
<body>
    <div class="documentation-container">
        <div class="header">
            <h1 class="doc-title">
                <span class="doc-icon">${topic.display?.icon || '📚'}</span>
                ${this._escapeHtml(topic.name)}
            </h1>
            <div class="header-actions">
                <button id="refresh-btn" class="btn btn-secondary" title="重新載入">
                    <span class="icon">🔄</span> 重新載入
                </button>
            </div>
        </div>

        <div class="topic-info">
            <div class="info-item">
                <span class="label">主題名稱：</span>
                <span class="value topic-name">${this._escapeHtml(topic.name)}</span>
            </div>
            <div class="info-item">
                <span class="label">簡介：</span>
                <span class="value">${this._escapeHtml(topic.description)}</span>
            </div>
        </div>

        <div class="documentation-content">
            ${contentHtml}
        </div>
    </div>

    <script src="${highlightJsUri}"></script>
    <script nonce="${nonce}">
        // Initialize syntax highlighting
        hljs.highlightAll();
    </script>
    <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
    }

    private _getTopicName(topic: string): string {
        // For topic-based system, just return the topic name
        return topic || '未知主題';
    }

    private _getDocTypeDisplay(type: DocumentationType): string {
        switch (type) {
            case DocumentationType.MARKDOWN:
                return '內嵌 Markdown';
            case DocumentationType.FILE:
                return '本地檔案';
            case DocumentationType.URL:
                return '外部連結';
            default:
                return '未知';
        }
    }

    private _escapeHtml(text: string): string {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
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