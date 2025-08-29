import * as vscode from 'vscode';
import { WebviewProvider } from './providers/WebviewProvider';
import { TemplateManager } from './services/TemplateManager';

export function activate(context: vscode.ExtensionContext) {
    const templateManager = new TemplateManager();
    
    // Load templates on activation
    templateManager.loadTemplates();
    
    const webviewProvider = new WebviewProvider(context.extensionUri, templateManager);

    // Register webview view
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(WebviewProvider.viewType, webviewProvider)
    );

    // Register commands
    const refreshCommand = vscode.commands.registerCommand('educode.refreshTemplates', () => {
        webviewProvider.refresh();
    });

    context.subscriptions.push(refreshCommand);
}

export function deactivate() {}