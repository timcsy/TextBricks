"use strict";
/**
 * 平台無關的程式碼操作服務
 * 整合所有插入和複製功能，提供一致的行為和錯誤處理
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeOperationService = void 0;
class CodeOperationService {
    constructor(engine, platform) {
        this.engine = engine;
        this.platform = platform;
    }
    // ==================== 公開 API ====================
    /**
     * 複製完整模板
     */
    async copyTemplate(templateId, options) {
        const template = await this._getTemplate(templateId);
        if (!template)
            return;
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
            this._showFeedback(options?.successMessage || `模板 '${template.title}' 已複製`, 'info', options);
        }
        catch (error) {
            const message = `${options?.errorPrefix || '複製模板失敗'}: ${error}`;
            this._showFeedback(message, 'error', options);
            this.platform.logError(error, 'copyTemplate');
        }
    }
    /**
     * 插入完整模板
     */
    async insertTemplate(templateId, options) {
        const template = await this._getTemplate(templateId);
        if (!template)
            return;
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
            this._showFeedback(options?.successMessage || `模板 '${template.title}' 已插入`, 'info', options);
        }
        catch (error) {
            const message = `${options?.errorPrefix || '插入模板失敗'}: ${error}`;
            this._showFeedback(message, 'error', options);
            this.platform.logError(error, 'insertTemplate');
        }
    }
    /**
     * 複製程式碼片段
     */
    async copyCodeSnippet(code, templateId, options) {
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
        }
        catch (error) {
            const message = `${options?.errorPrefix || '複製程式碼失敗'}: ${error}`;
            this._showFeedback(message, 'error', options);
            this.platform.logError(error, 'copyCodeSnippet');
        }
    }
    /**
     * 插入程式碼片段
     */
    async insertCodeSnippet(code, templateId, options) {
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
        }
        catch (error) {
            const message = `${options?.errorPrefix || '插入程式碼失敗'}: ${error}`;
            this._showFeedback(message, 'error', options);
            this.platform.logError(error, 'insertCodeSnippet');
        }
    }
    // ==================== 私有輔助方法 ====================
    async _getTemplate(templateId) {
        const template = this.engine.getTemplateById(templateId);
        if (!template) {
            await this.platform.ui.showErrorMessage(`找不到模板 ID: ${templateId}`);
            return null;
        }
        return template;
    }
    async _formatCodeSnippet(code, templateId) {
        const template = templateId ? this.engine.getTemplateById(templateId) : undefined;
        const targetIndentation = await this.platform.editor.calculateTargetIndentation();
        // 檢查是否為完整模板
        if (template && code.trim() === template.code.trim()) {
            return this.engine.formatTemplate(template, targetIndentation);
        }
        else {
            return this.engine.formatCodeSnippet(code, template, targetIndentation);
        }
    }
    async _handleNoEditor(code, options, isInsert = false) {
        // 直接複製原始程式碼到剪貼簿，避免額外縮排
        await this.platform.clipboard.writeText(code);
        const operation = isInsert ? '插入' : '複製';
        const action = await this.platform.ui.showWarningMessage(`沒有打開的編輯器，程式碼已複製到剪貼簿`, '開啟新檔案');
        if (action === '開啟新檔案') {
            try {
                await this.platform.editor.createNewFile(code);
                this._showFeedback('程式碼已插入到新檔案', 'info', options);
            }
            catch (error) {
                this.platform.logError(error, '_handleNoEditor - createNewFile');
            }
        }
    }
    async _executeClipboardOperation(code, options) {
        await this.platform.clipboard.writeText(code);
    }
    async _executeInsertOperation(code, options) {
        await this.platform.editor.insertText(code);
    }
    async _recordUsage(templateId) {
        if (templateId) {
            try {
                await this.engine.recordTemplateUsage(templateId);
            }
            catch (error) {
                // 使用統計失敗不應該影響主要功能
                this.platform.logWarning('Failed to record template usage', 'CodeOperationService');
            }
        }
    }
    _showFeedback(message, type, options) {
        if (options?.silent)
            return;
        switch (type) {
            case 'info':
                this.platform.ui.showInformationMessage(message).catch(error => this.platform.logError(error, 'showInformationMessage'));
                break;
            case 'warning':
                this.platform.ui.showWarningMessage(message).catch(error => this.platform.logError(error, 'showWarningMessage'));
                break;
            case 'error':
                this.platform.ui.showErrorMessage(message).catch(error => this.platform.logError(error, 'showErrorMessage'));
                break;
        }
    }
}
exports.CodeOperationService = CodeOperationService;
//# sourceMappingURL=CodeOperationService.js.map