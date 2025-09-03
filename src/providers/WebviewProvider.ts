import * as vscode from 'vscode';
import * as path from 'path';
import { TemplateManager } from '../services/TemplateManager';
import { TemplateManagementService } from '../services/TemplateManagementService';
import { DocumentationProvider } from './DocumentationProvider';
import { DocumentationService } from '../services/DocumentationService';
import { Template, TemplateCategory, Language, ProgrammingContext } from '../models/Template';

export class WebviewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'textbricks-webview';
    
    private _view?: vscode.WebviewView;
    private _selectedLanguage: string;
    private _documentationProvider?: DocumentationProvider;

    constructor(
        private readonly _extensionUri: vscode.Uri,
        private readonly templateManager: TemplateManager,
        private readonly _context: vscode.ExtensionContext,
        private readonly managementService?: TemplateManagementService
    ) {
        // Load saved language preference or default to 'c'
        this._selectedLanguage = this._context.globalState.get('textbricks.selectedLanguage', 'c');
        
        // Initialize documentation provider
        const documentationService = new DocumentationService(this._extensionUri);
        this._documentationProvider = new DocumentationProvider(this._extensionUri, this.templateManager, documentationService);
        
        // Set up drag detection for smart indentation (temporarily disabled)
        // this._setupDragDetection();
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
                    case 'insertTemplate':
                        this._insertTemplate(message.templateId);
                        break;
                    case 'copyCodeSnippet':
                        this._copyCodeSnippet(message.code, message.templateId);
                        break;
                    case 'insertCodeSnippet':
                        this._insertCodeSnippet(message.code, message.templateId);
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
            // Get current editor indentation for smart formatting
            const targetIndentation = this._getCurrentIndentation();
            const formattedCode = this.templateManager.formatTemplate(template, targetIndentation);
            
            await vscode.env.clipboard.writeText(formattedCode);
            vscode.window.showInformationMessage(`Template '${template.title}' copied to clipboard`);
            
            // 記錄模板使用統計
            if (this.managementService) {
                await this.managementService.recordTemplateUsage(templateId);
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to copy template: ${error}`);
        }
    }

    private async _insertTemplate(templateId: string) {
        const template = this.templateManager.getTemplateById(templateId);
        if (!template) {
            vscode.window.showErrorMessage(`Template with id '${templateId}' not found`);
            return;
        }

        try {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                // Try to copy to clipboard as fallback
                await vscode.env.clipboard.writeText(template.code);
                const action = await vscode.window.showWarningMessage(
                    '沒有打開的編輯器，模板已複製到剪貼簿',
                    '開啟新檔案'
                );
                
                if (action === '開啟新檔案') {
                    const newDoc = await vscode.workspace.openTextDocument();
                    const newEditor = await vscode.window.showTextDocument(newDoc);
                    
                    // Get formatting for new document
                    const targetIndentation = this._getCurrentIndentationForEditor(newEditor);
                    const formattedCode = this.templateManager.formatTemplate(template, targetIndentation);
                    
                    // Insert the template into the new document
                    await newEditor.edit(editBuilder => {
                        editBuilder.insert(new vscode.Position(0, 0), formattedCode);
                    });
                    
                    vscode.window.showInformationMessage(`模板 '${template.title}' 已插入到新檔案`);
                    
                    // 記錄模板使用統計
                    if (this.managementService) {
                        await this.managementService.recordTemplateUsage(templateId);
                    }
                }
                return;
            }

            // Get current editor indentation for smart formatting
            const targetIndentation = this._getCurrentIndentation();
            const formattedCode = this.templateManager.formatTemplate(template, targetIndentation);

            // Insert at current cursor position
            const position = editor.selection.active;
            await editor.edit(editBuilder => {
                editBuilder.insert(position, formattedCode);
            });

            vscode.window.showInformationMessage(`Template '${template.title}' inserted`);
            
            // 記錄模板使用統計
            if (this.managementService) {
                await this.managementService.recordTemplateUsage(templateId);
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to insert template: ${error}`);
        }
    }

    private async _copyCodeSnippet(code: string, templateId?: string) {
        try {
            // Get current editor indentation for smart formatting
            const targetIndentation = this._getCurrentIndentation();
            
            let formattedCode: string;
            
            if (templateId) {
                // If we know which template this came from, use template-aware formatting
                const template = this.templateManager.getTemplateById(templateId);
                if (template) {
                    console.log(`[COPY SNIPPET] Using template-aware formatting for template: ${templateId}`);
                    console.log(`[COPY SNIPPET] Selected code:\n${code}`);
                    console.log(`[COPY SNIPPET] Full template code:\n${template.code}`);
                    
                    // Check if this is the full template or a snippet
                    if (code.trim() === template.code.trim()) {
                        // Full template - use template formatting
                        formattedCode = this.templateManager.formatTemplate(template, targetIndentation);
                        console.log(`[COPY SNIPPET] Full template match, using formatTemplate`);
                    } else {
                        // Code snippet - use template-aware snippet formatting
                        formattedCode = this.templateManager.formatCodeSnippetWithTemplate(code, template, targetIndentation);
                        console.log(`[COPY SNIPPET] Code snippet, using template-aware formatting`);
                    }
                } else {
                    // Fallback to basic formatting
                    formattedCode = this.templateManager.formatCodeSnippet(code, targetIndentation);
                    console.log(`[COPY SNIPPET] Template not found, using basic formatting`);
                }
            } else {
                // No template info, use basic formatting
                formattedCode = this.templateManager.formatCodeSnippet(code, targetIndentation);
                console.log(`[COPY SNIPPET] No template info, using basic formatting`);
            }
            
            await vscode.env.clipboard.writeText(formattedCode);
            
            // Show subtle feedback without being annoying
            const lines = code.split('\n').length;
            const message = lines > 1 ? `${lines} 行文字已複製` : '文字片段已複製';
            vscode.window.showInformationMessage(message);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to copy text snippet: ${error}`);
        }
    }

    private async _insertCodeSnippet(code: string, templateId?: string) {
        console.log(`[DEBUG] _insertCodeSnippet called with code: "${code.substring(0, 100)}...", templateId: ${templateId}`);
        
        try {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                console.log(`[DEBUG] No active editor found`);
                vscode.window.showErrorMessage('No active editor found');
                return;
            }

            console.log(`[DEBUG] Active editor found: ${editor.document.fileName}`);

            // Get current editor indentation for smart formatting
            const targetIndentation = this._getCurrentIndentation();
            console.log(`[DEBUG] Target indentation: "${targetIndentation}" (length: ${targetIndentation.length})`);
            
            let formattedCode: string;
            
            if (templateId) {
                // If we know which template this came from, use template-aware formatting
                const template = this.templateManager.getTemplateById(templateId);
                if (template) {
                    console.log(`[INSERT SNIPPET] Using template-aware formatting for template: ${templateId}`);
                    console.log(`[INSERT SNIPPET] Selected code:\n${code}`);
                    
                    // Use template-aware snippet formatting
                    formattedCode = this.templateManager.formatCodeSnippetWithTemplate(code, template, targetIndentation);
                    console.log(`[INSERT SNIPPET] Code snippet, using template-aware formatting`);
                } else {
                    // Fallback to basic formatting
                    formattedCode = this.templateManager.formatCodeSnippet(code, targetIndentation);
                    console.log(`[INSERT SNIPPET] Template not found, using basic formatting`);
                }
            } else {
                // Basic formatting without template context
                formattedCode = this.templateManager.formatCodeSnippet(code, targetIndentation);
                console.log(`[INSERT SNIPPET] Code snippet, using basic formatting`);
            }
            
            console.log(`[INSERT SNIPPET] Final formatted code:\n${formattedCode}`);
            
            // Insert at current cursor position
            const position = editor.selection.active;
            await editor.edit(editBuilder => {
                editBuilder.insert(position, formattedCode);
            });

            // Show subtle feedback without being annoying
            const lines = code.split('\n').length;
            const message = lines > 1 ? `${lines} 行程式碼已插入` : '程式碼片段已插入';
            vscode.window.showInformationMessage(message);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to insert text snippet: ${error}`);
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
        const language = this.templateManager.getLanguageById(languageId);
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

    private _getCurrentIndentation(): string {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return '';
        }

        const document = editor.document;
        const selection = editor.selection;
        const position = selection.active;

        // Get the line where cursor is positioned
        const currentLine = document.lineAt(position.line);
        const lineText = currentLine.text;
        const cursorColumn = position.character;

        console.log(`DEBUG: Cursor at line ${position.line}, column ${cursorColumn}`);
        console.log(`DEBUG: Line text: "${lineText}"`);

        // Extract line indentation
        const indentMatch = lineText.match(/^(\s*)/);
        const lineIndentation = indentMatch?.[1] || '';
        console.log(`DEBUG: Line indentation: "${lineIndentation}" (length: ${lineIndentation.length})`);

        // Strategy 1: If cursor is at the beginning of line, use line's indentation
        if (cursorColumn === 0) {
            console.log(`DEBUG: Cursor at line start, using line indentation`);
            return lineIndentation;
        }

        // Strategy 2: If cursor is within or after line indentation, use full line indentation
        if (cursorColumn <= lineIndentation.length) {
            console.log(`DEBUG: Cursor within indentation, using line indentation`);
            return lineIndentation;
        }

        // Strategy 3: If cursor is after indentation in a non-empty line, use line indentation
        if (lineText.trim().length > 0) {
            console.log(`DEBUG: Cursor after indentation, using line indentation`);
            return lineIndentation;
        }

        // Strategy 4: Empty line - look at context (previous line)
        if (position.line > 0) {
            const prevLine = document.lineAt(position.line - 1);
            const prevIndentMatch = prevLine.text.match(/^(\s*)/);
            const prevIndent = prevIndentMatch?.[1] || '';
            console.log(`DEBUG: Empty line, using previous line indentation: "${prevIndent}"`);
            return prevIndent;
        }

        // Final fallback
        console.log(`DEBUG: Final fallback to empty indentation`);
        return '';
    }

    private _getCurrentIndentationForEditor(editor: vscode.TextEditor): string {
        if (!editor) {
            return '';
        }

        const document = editor.document;
        const selection = editor.selection;
        const position = selection.active;

        // Get the line where cursor is positioned
        const currentLine = document.lineAt(position.line);
        const lineText = currentLine.text;
        
        // Extract line indentation
        const indentMatch = lineText.match(/^(\s*)/);
        return indentMatch?.[1] || '';
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
        ${this._generateRecommendedTemplatesHtml()}
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

    private _generateRecommendedTemplatesHtml(): string {
        console.log('[DEBUG] _generateRecommendedTemplatesHtml called');
        
        if (!this.managementService) {
            console.log('[DEBUG] No managementService available');
            return ''; // 如果沒有 managementService，不顯示推薦區域
        }

        // 獲取推薦模板
        const recommendedTemplates = this.managementService.getRecommendedTemplates(6);

        console.log('[DEBUG] Recommended templates count:', recommendedTemplates.length);
        console.log('[DEBUG] Recommended data:', recommendedTemplates);

        // 如果沒有推薦模板，不顯示區域
        if (recommendedTemplates.length === 0) {
            console.log('[DEBUG] No templates to show - returning empty string');
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
            <div class="category recommended-category" data-level="0">
                <div class="category-header">
                    <h3 class="category-title">
                        <span class="category-toggle"></span>
                        <span class="recommended-badge">⭐ 推薦</span>
                        推薦模板
                    </h3>
                    <p class="category-description">基於您的使用習慣智能推薦</p>
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

    // === 上下文資料收集功能 (預留) ===

    // 收集當前編程上下文信息
    private async collectProgrammingContext(): Promise<ProgrammingContext> {
        const context: ProgrammingContext = {};

        try {
            // 收集當前活動編輯器信息
            const activeEditor = vscode.window.activeTextEditor;
            if (activeEditor) {
                context.currentFile = {
                    path: activeEditor.document.fileName,
                    language: activeEditor.document.languageId,
                    extension: path.extname(activeEditor.document.fileName),
                    size: activeEditor.document.getText().length
                };

                // 收集游標位置和周圍代碼
                const position = activeEditor.selection.active;
                context.cursor = {
                    line: position.line,
                    column: position.character,
                    surroundingCode: this.getSurroundingCode(activeEditor, position),
                    currentFunction: await this.getCurrentFunction(activeEditor, position),
                    currentClass: await this.getCurrentClass(activeEditor, position)
                };
            }

            // 收集工作區和項目信息
            context.project = await this.collectProjectInfo();

            // 收集最近的編程活動
            context.recentActivity = await this.collectRecentActivity();

            // 收集用戶工作習慣（從設定中）
            context.workingStyle = this.collectWorkingStyle();

            // 收集技能等級信息（從使用歷史推斷）
            context.skillLevel = await this.estimateSkillLevel();

        } catch (error) {
            console.warn('Failed to collect programming context:', error);
        }

        return context;
    }

    // 獲取游標周圍的代碼片段
    private getSurroundingCode(editor: vscode.TextEditor, position: vscode.Position): string {
        try {
            const startLine = Math.max(0, position.line - 5);
            const endLine = Math.min(editor.document.lineCount - 1, position.line + 5);
            
            const range = new vscode.Range(startLine, 0, endLine, editor.document.lineAt(endLine).text.length);
            return editor.document.getText(range);
        } catch {
            return '';
        }
    }

    // 檢測當前函數（預留實現）
    private async getCurrentFunction(editor: vscode.TextEditor, position: vscode.Position): Promise<string | undefined> {
        try {
            // 使用 VS Code 符號提供者檢測函數
            const symbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
                'vscode.executeDocumentSymbolProvider',
                editor.document.uri
            );
            
            if (symbols) {
                return this.findContainingSymbol(symbols, position, vscode.SymbolKind.Function)?.name;
            }
        } catch {
            // 靜默處理錯誤，使用正則匹配
        }
        
        const surroundingCode = this.getSurroundingCode(editor, position);
        const functionMatch = surroundingCode.match(/(?:function|def|func)\s+(\w+)/);
        return functionMatch ? functionMatch[1] : undefined;
    }

    // 檢測當前類別（預留實現）
    private async getCurrentClass(editor: vscode.TextEditor, position: vscode.Position): Promise<string | undefined> {
        try {
            const symbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
                'vscode.executeDocumentSymbolProvider',
                editor.document.uri
            );
            
            if (symbols) {
                return this.findContainingSymbol(symbols, position, vscode.SymbolKind.Class)?.name;
            }
        } catch {
            // 靜默處理錯誤
        }
        
        const surroundingCode = this.getSurroundingCode(editor, position);
        const classMatch = surroundingCode.match(/class\s+(\w+)/);
        return classMatch ? classMatch[1] : undefined;
    }

    // 在符號樹中查找包含指定位置的符號
    private findContainingSymbol(
        symbols: vscode.DocumentSymbol[], 
        position: vscode.Position, 
        kind?: vscode.SymbolKind
    ): vscode.DocumentSymbol | undefined {
        for (const symbol of symbols) {
            if (symbol.range.contains(position)) {
                if (!kind || symbol.kind === kind) {
                    return symbol;
                }
                const childSymbol = this.findContainingSymbol(symbol.children, position, kind);
                if (childSymbol) return childSymbol;
            }
        }
        return undefined;
    }

    // 收集項目信息（預留實現框架）
    private async collectProjectInfo(): Promise<ProgrammingContext['project']> {
        try {
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders || workspaceFolders.length === 0) {
                return undefined;
            }

            const workspaceRoot = workspaceFolders[0].uri.fsPath;
            
            return {
                type: await this.detectProjectType(workspaceRoot),
                framework: await this.detectFramework(workspaceRoot),
                hasTests: await this.hasTestDirectory(workspaceRoot),
                hasLinter: await this.hasLinterConfig(workspaceRoot)
            };
        } catch {
            return undefined;
        }
    }

    // 項目類型檢測（預留具體實現）
    private async detectProjectType(workspaceRoot: string): Promise<any> {
        // TODO: 檢查 package.json, requirements.txt, Cargo.toml 等判斷項目類型
        return 'unknown';
    }

    // 框架檢測（預留具體實現）
    private async detectFramework(workspaceRoot: string): Promise<string | undefined> {
        // TODO: 檢測 React, Vue, Angular, Express, Django, Flask 等
        return undefined;
    }

    // 測試目錄檢測（預留具體實現）
    private async hasTestDirectory(workspaceRoot: string): Promise<boolean> {
        // TODO: 檢查 tests/, test/, __tests__ 目錄
        return false;
    }

    // Linter 配置檢測（預留具體實現）
    private async hasLinterConfig(workspaceRoot: string): Promise<boolean> {
        // TODO: 檢查 .eslintrc, .pylintrc, rustfmt.toml 等
        return false;
    }

    // 收集最近編程活動（預留實現）
    private async collectRecentActivity(): Promise<ProgrammingContext['recentActivity']> {
        // TODO: 從 VS Code API 收集最近檔案、命令歷史等
        return {
            recentFiles: [],
            recentCommands: [],
            recentSearch: [],
            editingPatterns: []
        };
    }

    // 收集用戶工作習慣
    private collectWorkingStyle(): ProgrammingContext['workingStyle'] {
        try {
            const config = vscode.workspace.getConfiguration();
            
            return {
                preferredIndentation: config.get('editor.insertSpaces') ? 'spaces' : 'tabs',
                preferredQuotes: 'single', // TODO: 從代碼分析中檢測
                codeStyle: 'mixed', // TODO: 從模板使用模式推斷
                complexityPreference: 'simple' // TODO: 從模板選擇歷史推斷
            };
        } catch {
            return undefined;
        }
    }

    // 估計技能等級（預留實現）
    private async estimateSkillLevel(): Promise<ProgrammingContext['skillLevel']> {
        // TODO: 基於模板使用歷史、代碼複雜度分析等推斷技能等級
        return [{
            language: this._selectedLanguage,
            level: 'intermediate',
            estimatedProgress: 50,
            weakAreas: [],
            strengths: []
        }];
    }

    // === 上下文感知推薦的公開接口 ===

    // 獲取基於當前上下文的推薦模板
    public async getContextAwareRecommendations(limit: number = 6) {
        if (!this.managementService) {
            return [];
        }

        try {
            const context = await this.collectProgrammingContext();
            return await this.managementService.getContextualRecommendations(context, limit);
        } catch (error) {
            console.warn('Failed to get context-aware recommendations:', error);
            return this.managementService.getRecommendedTemplates(limit);
        }
    }

    // 根據當前游標位置獲取推薦
    public async getPositionBasedRecommendations(limit: number = 3) {
        if (!this.managementService) return [];

        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor) return [];

        try {
            const position = activeEditor.selection.active;
            const surroundingCode = this.getSurroundingCode(activeEditor, position);
            
            return await this.managementService.getPositionAwareRecommendations(
                activeEditor.document.fileName,
                position.line,
                position.character,
                surroundingCode,
                limit
            );
        } catch (error) {
            console.warn('Failed to get position-based recommendations:', error);
            return [];
        }
    }


}