import * as vscode from 'vscode';
import { TemplateManager } from '../services/TemplateManager';

export class CommandHandler {
    constructor(private templateManager: TemplateManager) {}

    async copyTemplate(templateId: string): Promise<void> {
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

    async insertTemplate(templateId: string): Promise<void> {
        const template = this.templateManager.getTemplateById(templateId);
        
        if (!template) {
            vscode.window.showErrorMessage(`Template with id '${templateId}' not found`);
            return;
        }

        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active text editor found');
            return;
        }

        try {
            const formattedCode = this.templateManager.formatTemplate(template);
            const position = editor.selection.active;
            
            await editor.edit(editBuilder => {
                editBuilder.insert(position, formattedCode);
            });
            
            vscode.window.showInformationMessage(`Template '${template.title}' inserted`);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to insert template: ${error}`);
        }
    }
}