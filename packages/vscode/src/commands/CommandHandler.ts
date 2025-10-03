import * as vscode from 'vscode';
import { TextBricksEngine } from '@textbricks/core';

export class CommandHandler {
    constructor(private templateEngine: TextBricksEngine) {}

    async copyTemplate(templatePath: string): Promise<void> {
        const template = this.templateEngine.getTemplateByPath(templatePath);

        if (!template) {
            vscode.window.showErrorMessage(`Template with path '${templatePath}' not found`);
            return;
        }

        try {
            const formattedCode = this.templateEngine.formatTemplate(template);
            await vscode.env.clipboard.writeText(formattedCode);
            vscode.window.showInformationMessage(`Template '${template.title}' copied to clipboard`);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to copy template: ${error}`);
        }
    }

    async insertTemplate(templatePath: string): Promise<void> {
        const template = this.templateEngine.getTemplateByPath(templatePath);

        if (!template) {
            vscode.window.showErrorMessage(`Template with path '${templatePath}' not found`);
            return;
        }

        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active text editor found');
            return;
        }

        try {
            const formattedCode = this.templateEngine.formatTemplate(template);
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