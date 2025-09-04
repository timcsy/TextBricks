import * as vscode from 'vscode';
import { TemplateCommands } from './TemplateCommands';
import { ImportExportCommands } from './ImportExportCommands';
import { TextBricksEngine } from '@textbricks/core';
import { WebviewProvider } from '../providers/WebviewProvider';
import { TemplateManagerProvider } from '../providers/TemplateManagerProvider';
import { DocumentationProvider } from '../providers/DocumentationProvider';

/**
 * 統一的命令註冊器
 */
export class CommandRegistry {
    private templateCommands: TemplateCommands;
    private importExportCommands: ImportExportCommands;

    constructor(
        private context: vscode.ExtensionContext,
        private templateEngine: TextBricksEngine,
        private webviewProvider: WebviewProvider,
        private templateManagerProvider: TemplateManagerProvider,
        private documentationProvider: DocumentationProvider
    ) {
        this.templateCommands = new TemplateCommands(
            templateEngine, 
            webviewProvider, 
            templateManagerProvider
        );
        this.importExportCommands = new ImportExportCommands(
            templateEngine, 
            webviewProvider
        );
    }

    /**
     * 註冊所有命令
     */
    registerAllCommands(): void {
        // 基本命令
        const refreshCommand = vscode.commands.registerCommand('textbricks.refreshTemplates', () => {
            this.webviewProvider.refresh();
        });

        const openManagerCommand = vscode.commands.registerCommand('textbricks.openTemplateManager', () => {
            this.templateManagerProvider.createOrShow();
        });

        // 模板相關命令
        const createTemplateCommand = vscode.commands.registerCommand('textbricks.createTemplate', 
            () => this.templateCommands.createTemplate()
        );

        // 匯入匯出命令
        const importTemplatesCommand = vscode.commands.registerCommand('textbricks.importTemplates',
            () => this.importExportCommands.importTemplates()
        );

        const exportTemplatesCommand = vscode.commands.registerCommand('textbricks.exportTemplates',
            () => this.importExportCommands.exportTemplates()
        );

        // 文檔命令
        const showDocumentationCommand = vscode.commands.registerCommand('textbricks.showDocumentation', 
            (templateId?: string) => this.showDocumentation(templateId)
        );

        // 將所有命令加入訂閱
        this.context.subscriptions.push(
            refreshCommand,
            openManagerCommand,
            createTemplateCommand,
            importTemplatesCommand,
            exportTemplatesCommand,
            showDocumentationCommand
        );
    }

    /**
     * 顯示文檔命令處理
     */
    private async showDocumentation(templateId?: string): Promise<void> {
        if (!templateId) {
            const templates = this.templateEngine.getAllTemplates().filter(t => t.documentation);
            
            if (templates.length === 0) {
                vscode.window.showWarningMessage('沒有可用的說明文檔');
                return;
            }

            const templateItems = templates.map(template => ({
                label: template.title,
                detail: template.description,
                template: template
            }));

            const selected = await vscode.window.showQuickPick(templateItems, {
                placeHolder: '選擇要查看說明文檔的模板'
            });

            if (!selected) return;
            templateId = selected.template.id;
        }

        await this.documentationProvider.showDocumentation(templateId);
    }
}