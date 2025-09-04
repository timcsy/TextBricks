import * as vscode from 'vscode';
import { VSCodePlatform } from './adapters/vscode';
import { TextBricksEngine, CodeOperationService, SearchService, DocumentationService } from './core';
import { WebviewProvider } from './providers/WebviewProvider';
import { TemplateManagerProvider } from './providers/TemplateManagerProvider';
import { DocumentationProvider } from './providers/DocumentationProvider';
import { CommandRegistry } from './commands';

export async function activate(context: vscode.ExtensionContext) {
    try {
        // 初始化平台適配器
        const platform = new VSCodePlatform(context);
        await platform.initialize({
            debug: context.extensionMode === vscode.ExtensionMode.Development,
            logLevel: 'info',
            features: {
                'webview': true,
                'statusBar': true,
                'notifications': true
            }
        });
        
        // 啟動平台
        await platform.start();
        
        // 初始化核心服務
        const textBricksEngine = new TextBricksEngine(platform);
        const codeOperationService = new CodeOperationService(textBricksEngine, platform);
        const searchService = new SearchService(textBricksEngine);
        const documentationService = new DocumentationService(platform);
        
        // 初始化核心引擎
        await textBricksEngine.initialize();
        
        // 初始化提供者（使用新架構）
        const webviewProvider = new WebviewProvider(
            context.extensionUri, 
            textBricksEngine, // 使用新的引擎
            context, 
            codeOperationService, 
            documentationService,
            textBricksEngine // 向後兼容
        );
        
        const templateManagerProvider = new TemplateManagerProvider(
            context.extensionUri, 
            textBricksEngine // 使用新的引擎
        );
        
        const documentationProvider = new DocumentationProvider(
            context.extensionUri, 
            textBricksEngine, // 使用新的引擎
            documentationService, 
            codeOperationService
        );

        // 註冊 WebView 視圖
        context.subscriptions.push(
            platform.registerWebviewViewProvider(WebviewProvider.viewType, webviewProvider)
        );

        // 註冊所有命令
        const commandRegistry = new CommandRegistry(
            context,
            textBricksEngine, // 使用新的引擎
            webviewProvider,
            templateManagerProvider,
            documentationProvider
        );
        commandRegistry.registerAllCommands();

        // 設置平台錯誤處理器
        platform.setErrorHandler((error: Error, context: string) => {
            console.error(`[TextBricks] ${context}:`, error);
            
            if (platform.getConfiguration().debug) {
                vscode.window.showErrorMessage(`TextBricks Error (${context}): ${error.message}`);
            }
        });

        // 添加清理處理
        context.subscriptions.push({
            dispose: async () => {
                await platform.stop();
                await platform.dispose();
            }
        });

        console.log('TextBricks activated successfully with new architecture');
        
    } catch (error) {
        console.error('Failed to activate TextBricks:', error);
        vscode.window.showErrorMessage(`TextBricks activation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
}

export function deactivate() {}