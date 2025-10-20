import * as vscode from 'vscode';
import { VSCodePlatform } from './adapters/vscode';
import { TextBricksEngine, CodeOperationService, SearchService, DocumentationService, DataPathService, ScopeManager, TopicManager, TemplateRepository } from '@textbricks/core';
import { TemplatesPanelProvider } from './providers/templates-panel/TemplatesPanelProvider';
import { ManagerPanelProvider } from './providers/manager-panel/ManagerPanelProvider';
import { DocumentationPanelProvider } from './providers/documentation-panel/DocumentationPanelProvider';
import { CommandService } from './services/CommandService';

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

        // 初始化資料路徑服務
        const dataPathService = DataPathService.getInstance(platform);

        // 嘗試自動初始化資料位置
        const wasJustInitialized = await dataPathService.autoInitialize();
        if (!wasJustInitialized) {
            // 用戶取消了初始化，仍然嘗試使用預設路徑
            await dataPathService.initialize();
        }

        // 獲取當前資料路徑
        const dataPath = await dataPathService.getDataPath();
        const localScopePath = await dataPathService.getScopePath('local');

        // 創建共享的管理器實例
        const scopeManager = new ScopeManager(platform, dataPathService);
        const topicManager = new TopicManager(platform, dataPathService);
        const templateRepository = new TemplateRepository(platform, dataPathService, topicManager);

        // 初始化管理器
        await scopeManager.initialize();
        await topicManager.initialize();
        await templateRepository.initialize();

        // 如果剛剛完成初始化和資料複製，等待一小段時間確保檔案系統操作完成
        if (wasJustInitialized) {
            await new Promise(resolve => setTimeout(resolve, 500));
            // 重新載入 managers 以讀取複製的資料
            await scopeManager.initialize();
            await topicManager.initialize();
            await templateRepository.initialize();
        }

        // 初始化核心服務，注入共享的管理器
        const textBricksEngine = new TextBricksEngine(
            platform,
            dataPathService,
            topicManager,
            scopeManager,
            templateRepository
        );
        const codeOperationService = new CodeOperationService(textBricksEngine, platform);
        const searchService = new SearchService(textBricksEngine);
        const documentationService = new DocumentationService(platform);

        // 初始化核心引擎，使用動態資料路徑
        await textBricksEngine.initialize(localScopePath);
        
        // 初始化提供者（使用新架構）
        const webviewProvider = new TemplatesPanelProvider(
            context.extensionUri,
            textBricksEngine, // 使用新的引擎
            context,
            codeOperationService,
            documentationService,
            dataPathService, // 傳遞 DataPathService
            textBricksEngine // 向後兼容
        );

        const documentationProvider = new DocumentationPanelProvider(
            context.extensionUri,
            textBricksEngine, // 使用新的引擎
            documentationService,
            codeOperationService
        );

        const managerWebviewProvider = new ManagerPanelProvider(
            context.extensionUri,
            textBricksEngine, // 使用新的引擎
            context, // 添加 context 參數
            scopeManager, // 傳遞共享的 scopeManager
            topicManager, // 傳遞共享的 topicManager
            dataPathService, // 傳遞共享的 dataPathService
            webviewProvider, // 傳遞 webviewProvider 用於同步更新
            documentationProvider // 傳遞 documentationProvider 用於顯示文檔
        );

        // 註冊 WebView 視圖
        context.subscriptions.push(
            platform.registerWebviewViewProvider(TemplatesPanelProvider.viewType, webviewProvider)
        );

        // 註冊所有命令
        const commandService = new CommandService(
            context,
            textBricksEngine,
            webviewProvider,
            managerWebviewProvider,
            documentationProvider
        );
        commandService.registerAllCommands();

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

        platform.logInfo('TextBricks activated successfully with new architecture', 'Extension');

    } catch (error) {
        // 啟動失敗時直接使用 console.error (此時 platform 可能未初始化)
        console.error('Failed to activate TextBricks:', error);
        vscode.window.showErrorMessage(`TextBricks activation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
}

export function deactivate() {}