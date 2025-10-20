import * as vscode from 'vscode';
import * as path from 'path';
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

        // 版本檢查與資料更新
        const currentVersion = context.extension.packageJSON.version;
        const lastVersion = context.globalState.get<string>('textbricks.lastVersion');
        const isFirstInstall = !lastVersion;
        const isVersionUpdated = lastVersion && lastVersion !== currentVersion;

        platform.logInfo?.(`Version check: current=${currentVersion}, last=${lastVersion}, isFirstInstall=${isFirstInstall}, isUpdated=${isVersionUpdated}`);

        // 首次安裝：直接初始化，不詢問
        if (isFirstInstall) {
            try {
                const initialized = await dataPathService.autoInitialize();
                if (initialized) {
                    await context.globalState.update('textbricks.lastVersion', currentVersion);
                    await context.globalState.update('textbricks.lastDataUpdate', new Date().toISOString());
                    platform.logInfo?.('First install: data initialized successfully');
                }
            } catch (error) {
                platform.logError?.(error as Error, 'First install initialization failed');
            }
        }
        // 版本更新：詢問是否更新資料
        else if (isVersionUpdated) {
            try {
                const dataPath = await dataPathService.getDataPath();
                const localScopePath = path.join(dataPath, 'scopes', 'local');

                // 檢查是否有現有資料
                const { promises: fs } = await import('fs');
                let hasExistingData = false;
                try {
                    await fs.access(localScopePath);
                    const contents = await fs.readdir(localScopePath);
                    hasExistingData = contents.length > 0;
                } catch {
                    hasExistingData = false;
                }

                if (hasExistingData) {
                    // 詢問使用者是否要更新資料
                    const choice = await vscode.window.showInformationMessage(
                        `TextBricks 已更新至 v${currentVersion}\n\n是否要使用最新的模板資料取代現有資料？\n\n（現有資料將會備份到 .backup 資料夾）`,
                        { modal: true },
                        '使用最新資料',
                        '保留現有資料'
                    );

                    if (choice === '使用最新資料') {
                        // 顯示進度訊息
                        await vscode.window.withProgress({
                            location: vscode.ProgressLocation.Notification,
                            title: 'TextBricks',
                            cancellable: false
                        }, async (progress) => {
                            progress.report({ message: '正在備份現有資料...' });

                            const maxBackups = vscode.workspace.getConfiguration('textbricks').get<number>('maxDataBackups') || 3;
                            const result = await dataPathService.backupAndReplace({ maxBackups });

                            if (result.success) {
                                progress.report({ message: '資料更新完成！' });
                                platform.logInfo?.(`Data updated successfully: ${result.updatedFiles} files, backup: ${result.backupPath}`);

                                await context.globalState.update('textbricks.lastDataUpdate', new Date().toISOString());

                                vscode.window.showInformationMessage(
                                    `資料已更新！已備份舊資料到：\n.backup/${path.basename(result.backupPath || '')}`
                                );
                            } else {
                                throw new Error(result.errors.join(', '));
                            }
                        });

                        // 更新成功後才更新版本記錄
                        await context.globalState.update('textbricks.lastVersion', currentVersion);
                    } else if (choice === '保留現有資料') {
                        // 使用者選擇保留現有資料，也更新版本記錄（避免每次都詢問）
                        platform.logInfo?.('User chose to keep existing data');
                        await context.globalState.update('textbricks.lastVersion', currentVersion);
                    }
                    // 如果使用者關閉對話框（choice === undefined），不更新版本記錄，下次還會詢問
                } else {
                    // 版本更新但沒有現有資料，直接初始化
                    await dataPathService.autoInitialize();
                    // 更新版本記錄
                    await context.globalState.update('textbricks.lastVersion', currentVersion);
                }

            } catch (error) {
                platform.logError?.(error as Error, 'Version update check failed');
                vscode.window.showErrorMessage(`資料更新失敗：${error instanceof Error ? error.message : String(error)}`);
            }
        }
        // 既不是首次安裝也不是版本更新，但仍需確保資料存在
        else {
            try {
                const dataPath = await dataPathService.getDataPath();
                const localScopePath = path.join(dataPath, 'scopes', 'local');
                const { promises: fs } = await import('fs');

                // 檢查資料是否存在
                let hasData = false;
                try {
                    await fs.access(localScopePath);
                    const contents = await fs.readdir(localScopePath);
                    hasData = contents.length > 0;
                } catch {
                    hasData = false;
                }

                // 如果沒有資料，自動初始化
                if (!hasData) {
                    platform.logInfo?.('No data found, initializing...');
                    await dataPathService.autoInitialize();
                }
            } catch (error) {
                platform.logError?.(error as Error, 'Data check failed');
            }
        }

        // 檢查是否剛剛完成資料複製（而不是只檢查是否初始化）
        let wasJustMigrated = false;
        try {
            wasJustMigrated = dataPathService.wasJustMigrated();
            platform.logInfo?.(`Data migration status: ${wasJustMigrated ? 'Just migrated' : 'Already existed'}`);
        } catch (error) {
            platform.logError?.(error as Error, 'wasJustMigrated check failed');
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

        // 如果剛剛完成資料複製，等待並重新載入
        if (wasJustMigrated) {
            platform.logInfo?.('⚠️ Data was just migrated, reloading all managers and templates');
            await new Promise(resolve => setTimeout(resolve, 1000)); // 增加到 1 秒
            // 重新載入 managers 以讀取複製的資料
            await scopeManager.initialize();
            await topicManager.initialize();
            await templateRepository.initialize();
            // 重新載入 engine 的模板資料
            await textBricksEngine.loadTemplates();
            platform.logInfo?.(`✓ Templates reloaded: ${textBricksEngine.getTopics().length} topics`);
        }

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

        // 如果剛完成資料複製，顯示訊息
        if (wasJustMigrated) {
            vscode.window.showInformationMessage('TextBricks 已初始化完成，模板已就緒！');
        }

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