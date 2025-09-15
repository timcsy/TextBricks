import * as vscode from 'vscode';
import * as path from 'path';
import { TextBricksEngine } from '@textbricks/core';
import { DocumentationProvider } from './DocumentationProvider';
import { DocumentationService } from '@textbricks/core';
import { CodeOperationService } from '@textbricks/core';
import { Template, Language } from '@textbricks/shared';

export class WebviewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'textbricks-webview';
    
    private _view?: vscode.WebviewView;
    private _selectedLanguage: string;
    private _documentationProvider?: DocumentationProvider;

    constructor(
        private readonly _extensionUri: vscode.Uri,
        private readonly templateEngine: TextBricksEngine,
        private readonly _context: vscode.ExtensionContext,
        private readonly codeOperationService: CodeOperationService,
        private readonly documentationService: DocumentationService,
        private readonly managementService?: TextBricksEngine
    ) {
        // Load saved language preference or default to 'c'
        this._selectedLanguage = this._context.globalState.get('textbricks.selectedLanguage', 'c');
        
        // Initialize documentation provider
        this._documentationProvider = new DocumentationProvider(this._extensionUri, this.templateEngine, this.documentationService, this.codeOperationService);
        
    }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;

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
                    case 'changeLanguage':
                        this._changeLanguage(message.languageId);
                        break;
                    case 'showDocumentation':
                        this._showDocumentation(message.templateId);
                        break;
                    case 'showTopicDocumentation':
                        this._showTopicDocumentation(message.topicName);
                        break;
                }
            },
            undefined,
            []
        );
    }

    public refresh() {
        if (this._view) {
            this._view.webview.html = this._getHtmlForWebview(this._view.webview);
        }
    }





    private async _handleDragTemplate(templateId: string, text: string) {
        // This method is called during drag start - just log for now
        console.log(`Dragging template ${templateId}: ${text.substring(0, 50)}...`);
    }

    private _changeLanguage(languageId: string) {
        this._selectedLanguage = languageId;
        
        // Save the language preference
        this._context.globalState.update('textbricks.selectedLanguage', languageId);
        
        this.refresh();
        
        // Show a message to let the user know the language has been changed
        const language = this.templateEngine.getLanguageById(languageId);
        if (language) {
            vscode.window.showInformationMessage(`已切換至 ${language.displayName} 語言模板`);
        }
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




    private _getHtmlForWebview(webview: vscode.Webview): string {
        const topics = this.templateEngine.getTopics();
        const languages = this.templateEngine.getLanguages();
        
        // Get CSS and JS URIs
        const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'assets', 'css', 'style.css'));
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'assets', 'js', 'main.js'));

        const nonce = this.getNonce();

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}'; img-src ${webview.cspSource} data:;">
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
            <div class="language-selector">
                <label for="language-select" class="language-label">🌐</label>
                <select id="language-select" class="language-select">
                    ${this._generateLanguageOptionsHtml(languages)}
                </select>
            </div>
        </div>
    </div>
    
    <div class="container">
        ${this._generateRecommendedTemplatesHtml()}
        ${this._generateTopicsHtml(topics)}
    </div>

    <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
    }

    private _generateLanguageOptionsHtml(languages: Language[]): string {
        return languages.map(language => {
            const selected = language.id === this._selectedLanguage ? 'selected' : '';
            return `<option value="${language.id}" ${selected}>${language.displayName}</option>`;
        }).join('');
    }

    private _generateRecommendedTemplatesHtml(): string {
        
        if (!this.managementService) {
            return ''; // 如果沒有 managementService，不顯示推薦區域
        }

        // 獲取推薦模板
        const recommendedTemplates = this.managementService.getRecommendedTemplates(6);


        // 如果沒有推薦模板，不顯示區域
        if (recommendedTemplates.length === 0) {
            return '';
        }

        // 推薦模板區域
        const filteredRecommended = recommendedTemplates.filter(template => 
            template.language === this._selectedLanguage
        );

        if (filteredRecommended.length === 0) {
            return '';
        }

        const recommendedHtml = filteredRecommended
            .map(template => this._generateRecommendedTemplateCardHtml(template))
            .join('');

        return `
            <div class="topic-group recommended-topic" data-topic="recommended">
                <div class="topic-header">
                    <h3 class="topic-title">
                        <span class="topic-toggle"></span>
                        <span class="recommended-badge">⭐ 推薦</span>
                        推薦模板
                    </h3>
                    <p class="topic-description">基於您的使用習慣智能推薦</p>
                </div>
                <div class="templates-grid">
                    ${recommendedHtml}
                </div>
            </div>
        `;
    }

    private _generateRecommendedTemplateCardHtml(template: any): string {
        const usageCount = template.metadata?.usage || 0;
        const hasDocumentation = template.documentation && template.documentation.trim().length > 0;

        return `
            <div class="template-card recommended-template" 
                 data-template-id="${template.id}" 
                 data-template-code="${this._escapeHtml(template.code)}"
                 data-has-documentation="${hasDocumentation}"
                 draggable="true">
                <div class="template-header">
                    <h4 class="template-title">${this._escapeHtml(template.title)}</h4>
                    <div class="template-actions">
                        <span class="recommended-star">⭐</span>
                        ${usageCount > 0 ? `<span class="usage-count">${usageCount} 次</span>` : ''}
                        <button class="action-btn preview-btn" title="預覽程式碼">
                            <span class="icon">👁️</span>
                        </button>
                        <button class="action-btn insert-btn" title="插入到游標位置">
                            <span class="icon">➕</span>
                        </button>
                    </div>
                </div>
                <p class="template-description">${this._escapeHtml(template.description)}</p>
                <div class="template-footer">
                    <span></span>
                    <span class="language-tag">${template.language.toUpperCase()}</span>
                </div>
            </div>
        `;
    }

    private _generateTopicsHtml(topics: string[]): string {
        return topics.map(topic => {
            const templates = this.templateEngine.getTemplatesByLanguageAndTopic(this._selectedLanguage, topic);
            if (templates.length === 0) {
                return ''; // Don't show empty topics
            }

            const templatesHtml = templates.map(template => this._generateTemplateCardHtml(template)).join('');

            // Get managed topic information for enhanced display
            const managedTopic = this.templateEngine.getTopicByName?.(topic);
            let topicDescription = `${templates.length} 個模板`;

            if (managedTopic && managedTopic.description) {
                topicDescription = managedTopic.description;
            }

            // Check if topic has documentation
            const hasDocumentation = managedTopic && managedTopic.documentation && managedTopic.documentation.trim().length > 0;

            const topicColorStyles = managedTopic && managedTopic.color ?
                `data-topic-color style="--topic-color: ${managedTopic.color}; --topic-color-light: ${managedTopic.color}20; --topic-color-medium: ${managedTopic.color}80;"` : '';

            return `
                <div class="topic-group" data-topic="${topic}" ${topicColorStyles}>
                    <div class="topic-header">
                        <div class="topic-title-row">
                            <h3 class="topic-title">
                                <span class="topic-toggle"></span>
                                ${managedTopic && managedTopic.icon ? `<span class="topic-icon">${managedTopic.icon}</span>` : ''}
                                ${topic}
                            </h3>
                            ${hasDocumentation ? `
                                <button class="topic-doc-btn"
                                        data-topic-name="${topic}"
                                        title="查看 ${topic} 的詳細學習指南">
                                    📖
                                </button>
                            ` : ''}
                        </div>
                        <p class="topic-description">${this._escapeHtml(topicDescription)}</p>
                        <p class="topic-count">${templates.length} 個模板</p>
                    </div>
                    <div class="templates-grid">
                        ${templatesHtml}
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
                            <span class="icon">➕</span>
                        </button>
                    </div>
                </div>
                <p class="template-description">${this._escapeHtml(template.description)}</p>
                <div class="template-footer">
                    <span></span>
                    <span class="language-tag">${template.language.toUpperCase()}</span>
                </div>
            </div>
        `;
    }

    private _isTemplateRecommended(templateId: string): boolean {
        if (!this.managementService) {
            return false;
        }
        
        try {
            // 只檢查實際顯示在推薦區的模板
            const recommendedTemplates = this.managementService.getRecommendedTemplates(6);
            const filteredRecommended = recommendedTemplates.filter(template => 
                template.language === this._selectedLanguage
            );
            return filteredRecommended.some(template => template.id === templateId);
        } catch (error) {
            return false;
        }
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
