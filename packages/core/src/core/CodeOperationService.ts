/**
 * 平台無關的程式碼操作服務
 * 整合所有插入和複製功能，提供一致的行為和錯誤處理
 */

import { TextBricksEngine } from './TextBricksEngine';
import { IPlatform } from '../interfaces/IPlatform';
import { ExtendedTemplate } from '@textbricks/shared';

export interface OperationOptions {
    /** 是否靜默執行（不顯示訊息） */
    silent?: boolean;
    /** 自訂成功訊息 */
    successMessage?: string;
    /** 自訂錯誤訊息前綴 */
    errorPrefix?: string;
}

export class CodeOperationService {
    constructor(
        private readonly engine: TextBricksEngine,
        private readonly platform: IPlatform
    ) {}

    // ==================== 公開 API ====================

    /**
     * 複製完整模板
     */
    async copyTemplate(templateId: string, options?: OperationOptions): Promise<void> {
        const template = await this._getTemplate(templateId);
        if (!template) return;

        try {
            const isEditorActive = this.platform.editor.isEditorActive();
            
            if (!isEditorActive) {
                await this._handleNoEditor(template.code, options);
                return;
            }

            // 使用formatTemplate保持與tooltip一致
            const targetIndentation = await this.platform.editor.calculateTargetIndentation();
            const formattedCode = this.engine.formatTemplate(template, targetIndentation);
            
            await this._executeClipboardOperation(formattedCode, options);
            await this._recordUsage(templateId);
            
            this._showFeedback(
                options?.successMessage || `模板 '${template.title}' 已複製`, 
                'info', 
                options
            );
        } catch (error) {
            const message = `${options?.errorPrefix || '複製模板失敗'}: ${error}`;
            this._showFeedback(message, 'error', options);
            this.platform.logError(error as Error, 'copyTemplate');
        }
    }

    /**
     * 插入完整模板
     */
    async insertTemplate(templateId: string, options?: OperationOptions): Promise<void> {
        const template = await this._getTemplate(templateId);
        if (!template) return;

        try {
            const isEditorActive = this.platform.editor.isEditorActive();
            
            if (!isEditorActive) {
                await this._handleNoEditor(template.code, options, true);
                return;
            }

            const targetIndentation = await this.platform.editor.calculateTargetIndentation();
            const formattedCode = this.engine.formatTemplate(template, targetIndentation);
            
            await this._executeInsertOperation(formattedCode, options);
            await this._recordUsage(templateId);
            
            this._showFeedback(
                options?.successMessage || `模板 '${template.title}' 已插入`, 
                'info', 
                options
            );
        } catch (error) {
            const message = `${options?.errorPrefix || '插入模板失敗'}: ${error}`;
            this._showFeedback(message, 'error', options);
            this.platform.logError(error as Error, 'insertTemplate');
        }
    }

    /**
     * 複製程式碼片段
     */
    async copyCodeSnippet(code: string, templateId?: string, options?: OperationOptions): Promise<void> {
        try {
            const isEditorActive = this.platform.editor.isEditorActive();
            
            if (!isEditorActive) {
                await this._handleNoEditor(code, options);
                return;
            }

            const formattedCode = await this._formatCodeSnippet(code, templateId);
            
            await this._executeClipboardOperation(formattedCode, options);
            await this._recordUsage(templateId);
            
            const lines = code.split('\n').length;
            const defaultMessage = lines > 1 ? `${lines} 行程式碼已複製` : '程式碼片段已複製';
            this._showFeedback(options?.successMessage || defaultMessage, 'info', options);
        } catch (error) {
            const message = `${options?.errorPrefix || '複製程式碼失敗'}: ${error}`;
            this._showFeedback(message, 'error', options);
            this.platform.logError(error as Error, 'copyCodeSnippet');
        }
    }

    /**
     * 插入程式碼片段
     */
    async insertCodeSnippet(code: string, templateId?: string, options?: OperationOptions): Promise<void> {
        try {
            const isEditorActive = this.platform.editor.isEditorActive();
            
            if (!isEditorActive) {
                await this._handleNoEditor(code, options, true);
                return;
            }

            const formattedCode = await this._formatCodeSnippet(code, templateId);
            
            await this._executeInsertOperation(formattedCode, options);
            await this._recordUsage(templateId);
            
            this._showFeedback(options?.successMessage || '程式碼已插入', 'info', options);
        } catch (error) {
            const message = `${options?.errorPrefix || '插入程式碼失敗'}: ${error}`;
            this._showFeedback(message, 'error', options);
            this.platform.logError(error as Error, 'insertCodeSnippet');
        }
    }

    // ==================== 私有輔助方法 ====================

    private async _getTemplate(templateId: string): Promise<ExtendedTemplate | null> {
        const template = this.engine.getTemplateById(templateId);
        if (!template) {
            await this.platform.ui.showErrorMessage(`找不到模板 ID: ${templateId}`);
            return null;
        }
        return template;
    }

    private async _formatCodeSnippet(code: string, templateId: string | undefined): Promise<string> {
        const template = templateId ? this.engine.getTemplateById(templateId) : undefined;
        const targetIndentation = await this.platform.editor.calculateTargetIndentation();

        // 檢查是否為完整模板
        if (template && code.trim() === template.code.trim()) {
            return this.engine.formatTemplate(template, targetIndentation);
        } else {
            return this.engine.formatCodeSnippet(code, template, targetIndentation);
        }
    }

    private async _handleNoEditor(code: string, options?: OperationOptions, isInsert: boolean = false): Promise<void> {
        // 直接複製原始程式碼到剪貼簿，避免額外縮排
        await this.platform.clipboard.writeText(code);
        
        const operation = isInsert ? '插入' : '複製';
        const action = await this.platform.ui.showWarningMessage(
            `沒有打開的編輯器，程式碼已複製到剪貼簿`,
            '開啟新檔案'
        );
        
        if (action === '開啟新檔案') {
            try {
                await this.platform.editor.createNewFile(code);
                this._showFeedback('程式碼已插入到新檔案', 'info', options);
            } catch (error) {
                this.platform.logError(error as Error, '_handleNoEditor - createNewFile');
            }
        }
    }

    private async _executeClipboardOperation(code: string, options?: OperationOptions): Promise<void> {
        await this.platform.clipboard.writeText(code);
    }

    private async _executeInsertOperation(code: string, options?: OperationOptions): Promise<void> {
        await this.platform.editor.insertText(code);
    }

    private async _recordUsage(templateId?: string): Promise<void> {
        if (templateId) {
            try {
                await this.engine.recordTemplateUsage(templateId);
            } catch (error) {
                // 使用統計失敗不應該影響主要功能
                this.platform.logWarning('Failed to record template usage', 'CodeOperationService');
            }
        }
    }

    private _showFeedback(message: string, type: 'info' | 'warning' | 'error', options?: OperationOptions): void {
        if (options?.silent) return;

        switch (type) {
            case 'info':
                this.platform.ui.showInformationMessage(message).catch(error => 
                    this.platform.logError(error, 'showInformationMessage')
                );
                break;
            case 'warning':
                this.platform.ui.showWarningMessage(message).catch(error => 
                    this.platform.logError(error, 'showWarningMessage')
                );
                break;
            case 'error':
                this.platform.ui.showErrorMessage(message).catch(error => 
                    this.platform.logError(error, 'showErrorMessage')
                );
                break;
        }
    }
}