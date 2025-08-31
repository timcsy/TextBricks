import * as vscode from 'vscode';
import { TemplateManager } from '../services/TemplateManager';
import { Template, TemplateCategory, Language } from '../models/Template';

export class WebviewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'textbricks-webview';
    
    private _view?: vscode.WebviewView;
    private _selectedLanguage: string;

    constructor(
        private readonly _extensionUri: vscode.Uri,
        private readonly templateManager: TemplateManager,
        private readonly _context: vscode.ExtensionContext
    ) {
        // Load saved language preference or default to 'c'
        this._selectedLanguage = this._context.globalState.get('textbricks.selectedLanguage', 'c');
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
                        this._copyTemplate(message.templateId);
                        break;
                    case 'dragTemplate':
                        this._handleDragTemplate(message.templateId, message.text);
                        break;
                    case 'changeLanguage':
                        this._changeLanguage(message.languageId);
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

    private async _copyTemplate(templateId: string) {
        const template = this.templateManager.getTemplateById(templateId);
        if (!template) {
            vscode.window.showErrorMessage(`Template with id '${templateId}' not found`);
            return;
        }

        try {
            const formattedCode = this.templateManager.formatTemplate(template);
            await vscode.env.clipboard.writeText(formattedCode);
            vscode.window.showInformationMessage(`Template '${template.title}' copied to clipboard`);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to copy template: ${error}`);
        }
    }


    private _handleDragTemplate(templateId: string, text: string) {
        // This will be used for drag and drop functionality
        console.log(`Dragging template ${templateId}: ${text.substring(0, 50)}...`);
    }

    private _changeLanguage(languageId: string) {
        this._selectedLanguage = languageId;
        
        // Save the language preference
        this._context.globalState.update('textbricks.selectedLanguage', languageId);
        
        this.refresh();
        
        // Show a message to let the user know the language has been changed
        const language = this.templateManager.getLanguageById(languageId);
        if (language) {
            vscode.window.showInformationMessage(`已切換至 ${language.displayName} 語言模板`);
        }
    }

    private _getHtmlForWebview(webview: vscode.Webview): string {
        const categories = this.templateManager.getCategories();
        const languages = this.templateManager.getLanguages();
        
        // Get CSS and JS URIs
        const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'style.css'));
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js'));

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
                <h2><span class="logo"><img src="${webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'icons', 'TextBricks.svg'))}" alt="TextBricks"></span>TextBricks</h2>
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
        ${this._generateCategoriesHtml(categories)}
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

    private _generateCategoriesHtml(categories: TemplateCategory[]): string {
        return categories.map(category => {
            const templates = this.templateManager.getTemplatesByLanguageAndCategory(this._selectedLanguage, category.id);
            if (templates.length === 0) {
                return ''; // Don't show empty categories
            }
            
            const templatesHtml = templates.map(template => this._generateTemplateCardHtml(template)).join('');
            
            return `
                <div class="category" data-level="${category.level}">
                    <div class="category-header">
                        <h3 class="category-title">
                            <span class="category-toggle"></span>
                            <span class="level-badge">Level ${category.level}</span>
                            ${category.name}
                        </h3>
                        <p class="category-description">${category.description}</p>
                    </div>
                    <div class="templates-grid">
                        ${templatesHtml}
                    </div>
                </div>
            `;
        }).join('');
    }

    private _generateTemplateCardHtml(template: Template): string {        
        return `
            <div class="template-card" 
                 data-template-id="${template.id}" 
                 data-template-code="${this._escapeHtml(template.code)}"
                 draggable="true">
                <div class="template-header">
                    <h4 class="template-title">${this._escapeHtml(template.title)}</h4>
                    <div class="template-actions">
                        <button class="action-btn preview-btn" title="預覽程式碼">
                            <span class="icon">👁️</span>
                        </button>
                        <button class="action-btn copy-btn" title="複製到剪貼簿">
                            <span class="icon">📋</span>
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

    private _escapeHtml(text: string): string {
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