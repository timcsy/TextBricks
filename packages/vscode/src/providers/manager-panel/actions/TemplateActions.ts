import * as vscode from 'vscode';
import { TextBricksEngine, ScopeManager } from '@textbricks/core';
import { ExtendedTemplate } from '@textbricks/shared';
import { VSCodePlatform } from '../../../adapters/vscode/VSCodePlatform';

export class TemplateActions {
    constructor(
        private readonly platform: VSCodePlatform,
        private readonly templateEngine: TextBricksEngine,
        private readonly scopeManager: ScopeManager,
        private readonly sendDataCallback: () => Promise<void>,
        private readonly webviewProvider?: { refresh(preserveNavigationState?: boolean): Promise<void> },
        private panel?: vscode.WebviewPanel
    ) {}

    async createTemplate(templateData: Omit<ExtendedTemplate, 'type'>): Promise<void> {
        try {
            this.platform.logInfo(`Creating template: ${(templateData as any).title}`, 'TemplateActions');
            const topicPath = (templateData as any).topicPath || (templateData as any).topic || 'default';
            const newTemplate = await this.templateEngine.createTemplate(templateData, topicPath);
            this.platform.logInfo(`Template created successfully: ${newTemplate.name}`, 'TemplateActions');
            vscode.window.showInformationMessage(`模板 "${newTemplate.title}" 已創建成功`);
            await this.sendDataCallback();
        } catch (error) {
            this.platform.logError(error as Error, 'TemplateActions.createTemplate');
            vscode.window.showErrorMessage(`創建模板失敗: ${error}`);
        }
    }

    async updateTemplate(templateId: string, updates: Partial<ExtendedTemplate>): Promise<void> {
        try {
            this.platform.logInfo(`Updating template: ${templateId}`, 'TemplateActions');
            const updated = await this.templateEngine.updateTemplate(templateId, updates);
            if (updated) {
                this.platform.logInfo(`Template updated successfully: ${updated.name}`, 'TemplateActions');

                // 等待一小段時間確保文件操作完成
                await new Promise(resolve => setTimeout(resolve, 100));

                // 刷新模板管理器數據
                await this.sendDataCallback();

                // 通知 WebviewProvider 刷新顯示，並保持導航狀態
                if (this.webviewProvider) {
                    this.platform.logInfo('Notifying WebviewProvider to refresh with preserved navigation state', 'TemplateActions');
                    await this.webviewProvider.refresh(true);
                }

                vscode.window.showInformationMessage(`模板 "${updated.title}" 已更新成功`);
            } else {
                this.platform.logWarning(`Template not found for ID: ${templateId}`, 'TemplateActions');
                vscode.window.showErrorMessage('找不到指定的模板');
            }
        } catch (error) {
            this.platform.logError(error as Error, 'TemplateActions.updateTemplate');
            vscode.window.showErrorMessage(`更新模板失敗: ${error}`);
        }
    }

    async deleteTemplate(templateId: string): Promise<void> {
        try {
            const template = this.templateEngine.getTemplate(templateId);
            if (!template) {
                vscode.window.showErrorMessage('找不到指定的模板');
                return;
            }

            const confirmed = await vscode.window.showWarningMessage(
                `確定要刪除模板「${template.title}」嗎？`,
                { modal: true },
                '刪除',
                '取消'
            );

            if (confirmed !== '刪除') {
                return;
            }

            await this.templateEngine.deleteTemplate(templateId);
            vscode.window.showInformationMessage(`模板「${template.title}」已刪除成功`);

            // 通知前端清空詳情面板
            if (this.panel) {
                this.panel.webview.postMessage({
                    type: 'clearDetailsPanel'
                });
            }

            // 重新加載數據並發送到前端
            await this.sendDataCallback();

            // 通知 WebviewProvider 刷新顯示
            if (this.webviewProvider) {
                await this.webviewProvider.refresh();
            }
        } catch (error) {
            this.platform.logError(error as Error, 'TemplateActions.deleteTemplate');
            vscode.window.showErrorMessage(`刪除模板失敗: ${error}`);
        }
    }

    async batchCreateTemplates(templates: unknown[]): Promise<void> {
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
                    const allLanguages = this.scopeManager.getCurrentScope().languages || [];
                    const languageExists = allLanguages.find(lang => lang.name === template.language);

                    if (!languageExists) {
                        throw new Error(`模板 ${index}: 語言 "${template.language}" 不存在`);
                    }

                    // Create the template
                    const topicPath = template.topic || template.language || 'default';
                    const templateData = {
                        name: template.title.toLowerCase().replace(/\s+/g, '-'),
                        title: template.title,
                        description: template.description,
                        code: template.code,
                        language: template.language
                    };
                    await this.templateEngine.createTemplate(templateData, topicPath);

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
            await this.sendDataCallback();

        } catch (error) {
            vscode.window.showErrorMessage(`批次新增失敗：${error}`);
        }
    }
}
