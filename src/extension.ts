import * as vscode from 'vscode';
import { WebviewProvider } from './providers/WebviewProvider';
import { TemplateManagerProvider } from './providers/TemplateManagerProvider';
import { DocumentationProvider } from './providers/DocumentationProvider';
import { TemplateEngine } from './core/TemplateEngine';
import { DocumentationService } from './services/DocumentationService';
import { CommandRegistry } from './commands';

export function activate(context: vscode.ExtensionContext) {
    // Initialize core services
    const templateEngine = new TemplateEngine(context);
    const documentationService = new DocumentationService(context.extensionUri);
    
    // Load templates on activation
    templateEngine.loadTemplates();
    
    // Initialize providers
    const webviewProvider = new WebviewProvider(context.extensionUri, templateEngine, context, templateEngine);
    const templateManagerProvider = new TemplateManagerProvider(context.extensionUri, templateEngine);
    const documentationProvider = new DocumentationProvider(context.extensionUri, templateEngine, documentationService);

    // Register webview view
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(WebviewProvider.viewType, webviewProvider)
    );

    // Register all commands using the new command registry
    const commandRegistry = new CommandRegistry(
        context,
        templateEngine,
        webviewProvider,
        templateManagerProvider,
        documentationProvider
    );
    commandRegistry.registerAllCommands();
}

export function deactivate() {}