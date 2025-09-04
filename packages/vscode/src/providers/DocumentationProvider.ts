import * as vscode from 'vscode';
import { DocumentationService } from '@textbricks/core';
import { TextBricksEngine } from '@textbricks/core';
import { CodeOperationService } from '@textbricks/core';
import { Template, DocumentationType } from '@textbricks/shared';

export class DocumentationProvider {
    public static readonly viewType = 'textbricks-documentation';
    
    private _panel?: vscode.WebviewPanel;
    private _disposables: vscode.Disposable[] = [];
    private _currentTemplate?: Template;

    constructor(
        private readonly _extensionUri: vscode.Uri,
        private readonly templateEngine: TextBricksEngine,
        private readonly documentationService: DocumentationService,
        private readonly codeOperationService: CodeOperationService
    ) {}

    public async showDocumentation(templateId: string) {
        const template = this.templateEngine.getTemplateById(templateId);
        if (!template) {
            vscode.window.showErrorMessage(`找不到模板 ID: ${templateId}`);
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

    private async _handleMessage(message: any) {
        console.log('[DOCUMENTATION] Received message:', message.type, message);
        
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
                console.log('[DOCUMENTATION] Handling copyCodeBlock with code:', message.code?.substring(0, 50) + '...');
                if (message.code) {
                    await this.codeOperationService.copyCodeSnippet(message.code, message.templateId);
                } else {
                    console.error('[DOCUMENTATION] No code in copyCodeBlock message');
                    vscode.window.showErrorMessage('沒有程式碼可複製');
                }
                break;
            case 'insertCodeBlock':
                console.log('[DOCUMENTATION] Handling insertCodeBlock with code:', message.code?.substring(0, 50) + '...');
                if (message.code) {
                    await this.codeOperationService.insertCodeSnippet(message.code, message.templateId);
                } else {
                    console.error('[DOCUMENTATION] No code in insertCodeBlock message');
                    vscode.window.showErrorMessage('沒有程式碼可插入');
                }
                break;
            case 'openExternal':
                if (message.url) {
                    vscode.env.openExternal(vscode.Uri.parse(message.url));
                }
                break;
            default:
                console.log('[DOCUMENTATION] Unknown message type:', message.type);
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
            console.error('Documentation loading error:', error);
            this._panel.webview.html = this._getErrorHtml(`載入說明文檔時發生錯誤：${error}`);
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

    private _getDocumentationHtml(docResult: any, template: Template): string {
        const styleUri = this._panel!.webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'assets', 'css', 'documentation.css')
        );
        const scriptUri = this._panel!.webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'assets', 'js', 'documentation.js')
        );

        // Import highlight.js for code syntax highlighting
        const highlightCssUri = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/vs2015.min.css';
        const highlightJsUri = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js';

        const nonce = this._getNonce();

        let contentHtml = '';
        
        if (docResult.error) {
            contentHtml = `<div class="error">
                <h2>⚠️ 載入錯誤</h2>
                <p>${docResult.error}</p>
            </div>`;
        } else {
            // Convert markdown to HTML (simple implementation)
            contentHtml = this._markdownToHtml(docResult.content);
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
                <span class="label">分類：</span>
                <span class="value">${this._getCategoryName(template.categoryId)}</span>
            </div>
            <div class="info-item">
                <span class="label">文檔類型：</span>
                <span class="value doc-type">${this._getDocTypeDisplay(docResult.type)}</span>
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

    private _markdownToHtml(markdown: string): string {
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
            const codeId = Math.random().toString(36).substr(2, 9); // Generate unique ID
            // Store the raw code in a data attribute to preserve formatting
            const rawCodeEscaped = this._escapeHtml(trimmedCode);
            return `<div class="code-block-container" data-template-id="${this._currentTemplate?.id || ''}">
                <div class="code-block-header">
                    <span class="language-label">${language.toUpperCase() || 'CODE'}</span>
                    <div class="code-actions">
                        <button class="code-action-btn insert-code-btn" data-code-id="${codeId}" data-raw-code="${this._escapeHtml(JSON.stringify(trimmedCode))}" title="插入程式碼">➕ 插入</button>
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

        // Lists - improved handling to avoid cross-paragraph merging
        const lines = html.split('\n');
        let processedLines: string[] = [];
        let inList = false;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const isListItem = /^- (.*)/.test(line);
            
            if (isListItem) {
                const content = line.replace(/^- (.*)/, '$1');
                if (!inList) {
                    processedLines.push('<ul>');
                    inList = true;
                }
                processedLines.push(`<li>${content}</li>`);
            } else {
                if (inList && line.trim() === '') {
                    // Empty line after list items - check if next non-empty line is also a list item
                    let nextNonEmptyIndex = i + 1;
                    while (nextNonEmptyIndex < lines.length && lines[nextNonEmptyIndex].trim() === '') {
                        nextNonEmptyIndex++;
                    }
                    
                    if (nextNonEmptyIndex >= lines.length || !/^- (.*)/.test(lines[nextNonEmptyIndex])) {
                        // Close the list
                        processedLines.push('</ul>');
                        inList = false;
                    }
                } else if (inList) {
                    // Non-list line while in list - close the list
                    processedLines.push('</ul>');
                    inList = false;
                }
                processedLines.push(line);
            }
        }
        
        // Close list if still open at end
        if (inList) {
            processedLines.push('</ul>');
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

    private _getCategoryName(categoryId: string): string {
        const category = this.templateEngine.getCategories().find(cat => cat.id === categoryId);
        return category ? category.name : categoryId;
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