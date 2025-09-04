import * as vscode from 'vscode';
import { TemplateEngine } from '../core/TemplateEngine';
import { Template } from '../models/Template';

/**
 * 統一的程式碼操作服務
 * 整合所有插入和複製功能，提供一致的行為和錯誤處理
 */
export class CodeOperationService {
    constructor(
        private readonly templateEngine: TemplateEngine
    ) {}

    // ==================== 公開 API ====================

    /**
     * 複製完整模板
     */
    async copyTemplate(templateId: string, options?: OperationOptions): Promise<void> {
        const template = this._getTemplate(templateId);
        if (!template) return;

        try {
            const editor = this._getActiveEditor();
            
            if (!editor) {
                await this._handleNoEditor(template.code, options);
                return;
            }

            // 使用formatTemplate保持與tooltip一致
            const targetIndentation = this._getCurrentIndentation(editor);
            const formattedCode = this.templateEngine.formatTemplate(template, targetIndentation);
            
            await this._executeClipboardOperation(formattedCode, options);
            await this._recordUsage(templateId);
            
            this._showFeedback(`模板 '${template.title}' 已複製`, 'info', options);
        } catch (error) {
            this._showFeedback(`複製模板失敗: ${error}`, 'error', options);
        }
    }

    /**
     * 插入完整模板
     */
    async insertTemplate(templateId: string, options?: OperationOptions): Promise<void> {
        const template = this._getTemplate(templateId);
        if (!template) return;

        try {
            const editor = this._getActiveEditor();
            
            if (!editor) {
                await this._handleNoEditor(template.code, options, true);
                return;
            }

            const targetIndentation = this._getCurrentIndentation(editor);
            const formattedCode = this.templateEngine.formatTemplate(template, targetIndentation);
            
            await this._executeInsertOperation(editor, formattedCode, options);
            await this._recordUsage(templateId);
            
            this._showFeedback(`模板 '${template.title}' 已插入`, 'info', options);
        } catch (error) {
            this._showFeedback(`插入模板失敗: ${error}`, 'error', options);
        }
    }

    /**
     * 複製程式碼片段
     */
    async copyCodeSnippet(code: string, templateId?: string, options?: OperationOptions): Promise<void> {
        try {
            const editor = this._getActiveEditor();
            
            if (!editor) {
                await this._handleNoEditor(code, options);
                return;
            }

            const formattedCode = this._formatCodeSnippet(code, templateId, editor);
            
            await this._executeClipboardOperation(formattedCode, options);
            await this._recordUsage(templateId);
            
            const lines = code.split('\n').length;
            const message = lines > 1 ? `${lines} 行程式碼已複製` : '程式碼片段已複製';
            this._showFeedback(message, 'info', options);
        } catch (error) {
            this._showFeedback(`複製程式碼失敗: ${error}`, 'error', options);
        }
    }

    /**
     * 插入程式碼片段
     */
    async insertCodeSnippet(code: string, templateId?: string, options?: OperationOptions): Promise<void> {
        try {
            const editor = this._getActiveEditor();
            
            if (!editor) {
                await this._handleNoEditor(code, options, true);
                return;
            }

            const formattedCode = this._formatCodeSnippet(code, templateId, editor);
            
            await this._executeInsertOperation(editor, formattedCode, options);
            await this._recordUsage(templateId);
            
            this._showFeedback('程式碼已插入', 'info', options);
        } catch (error) {
            this._showFeedback(`插入程式碼失敗: ${error}`, 'error', options);
        }
    }

    // ==================== 私有輔助方法 ====================

    private _getTemplate(templateId: string): Template | null {
        const template = this.templateEngine.getTemplateById(templateId);
        if (!template) {
            vscode.window.showErrorMessage(`找不到模板 ID: ${templateId}`);
            return null;
        }
        return template;
    }

    private _getActiveEditor(): vscode.TextEditor | undefined {
        return vscode.window.activeTextEditor;
    }

    private _getCurrentIndentation(editor: vscode.TextEditor): string {
        const document = editor.document;
        const selection = editor.selection;
        const position = selection.active;

        // 取得目前行
        const currentLine = document.lineAt(position.line);
        const lineText = currentLine.text;
        const cursorColumn = position.character;

        // 取得行縮排
        const indentMatch = lineText.match(/^(\s*)/);
        const lineIndentation = indentMatch?.[1] || '';

        // 游標在行首或縮排內
        if (cursorColumn <= lineIndentation.length) {
            return lineIndentation;
        }

        // 非空行，使用行縮排
        if (lineText.trim().length > 0) {
            return lineIndentation;
        }

        // 空行，使用前一行縮排
        if (position.line > 0) {
            const prevLine = document.lineAt(position.line - 1);
            const prevIndentMatch = prevLine.text.match(/^(\s*)/);
            return prevIndentMatch?.[1] || '';
        }

        return '';
    }

    private _formatCodeSnippet(code: string, templateId: string | undefined, editor: vscode.TextEditor): string {
        const template = templateId ? this.templateEngine.getTemplateById(templateId) : undefined;
        const targetIndentation = this._getCurrentIndentation(editor);

        // 檢查是否為完整模板
        if (template && code.trim() === template.code.trim()) {
            return this.templateEngine.formatTemplate(template, targetIndentation);
        } else {
            return this.templateEngine.formatCodeSnippet(code, template, targetIndentation);
        }
    }

    private async _handleNoEditor(code: string, options?: OperationOptions, isInsert: boolean = false): Promise<void> {
        // 直接複製原始程式碼到剪貼簿，避免額外縮排
        await vscode.env.clipboard.writeText(code);
        
        const operation = isInsert ? '插入' : '複製';
        const action = await vscode.window.showWarningMessage(
            `沒有打開的編輯器，程式碼已複製到剪貼簿`,
            '開啟新檔案'
        );
        
        if (action === '開啟新檔案') {
            const newDoc = await vscode.workspace.openTextDocument();
            const newEditor = await vscode.window.showTextDocument(newDoc);
            
            // 插入原始程式碼，不添加額外縮排
            await newEditor.edit(editBuilder => {
                editBuilder.insert(new vscode.Position(0, 0), code);
            });
            
            this._showFeedback('程式碼已插入到新檔案', 'info', options);
        }
    }

    private async _executeClipboardOperation(code: string, options?: OperationOptions): Promise<void> {
        await vscode.env.clipboard.writeText(code);
    }

    private async _executeInsertOperation(editor: vscode.TextEditor, code: string, options?: OperationOptions): Promise<void> {
        const position = editor.selection.active;
        await editor.edit(editBuilder => {
            editBuilder.insert(position, code);
        });
    }

    private async _recordUsage(templateId?: string): Promise<void> {
        if (templateId) {
            try {
                await this.templateEngine.recordTemplateUsage(templateId);
            } catch (error) {
                // 使用統計失敗不應該影響主要功能
                console.warn('Failed to record template usage:', error);
            }
        }
    }

    private _showFeedback(message: string, type: 'info' | 'warning' | 'error', options?: OperationOptions): void {
        if (options?.silent) return;

        switch (type) {
            case 'info':
                vscode.window.showInformationMessage(message);
                break;
            case 'warning':
                vscode.window.showWarningMessage(message);
                break;
            case 'error':
                vscode.window.showErrorMessage(message);
                break;
        }
    }
}

// ==================== 類型定義 ====================

export interface OperationOptions {
    /** 是否靜默執行（不顯示訊息） */
    silent?: boolean;
    /** 自訂成功訊息 */
    successMessage?: string;
    /** 自訂錯誤訊息前綴 */
    errorPrefix?: string;
}