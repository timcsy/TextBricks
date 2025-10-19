import * as vscode from 'vscode';
import { DataPathService } from '@textbricks/core';
import { VSCodePlatform } from '../../../adapters/vscode/VSCodePlatform';

export class SettingsActions {
    constructor(
        private readonly platform: VSCodePlatform,
        private readonly dataPathService: DataPathService,
        private readonly panel: vscode.WebviewPanel | undefined,
        private readonly sendDataCallback: () => Promise<void>
    ) {}

    async getDataLocationInfo(): Promise<void> {
        try {
            const locationInfo = await this.dataPathService.getCurrentLocationInfo();
            this.panel?.webview.postMessage({
                type: 'dataLocationInfo',
                data: locationInfo
            });
        } catch (error) {
            vscode.window.showErrorMessage(`獲取資料位置資訊失敗: ${error}`);
        }
    }

    async getAvailableLocations(): Promise<void> {
        try {
            const locations = await this.dataPathService.getAvailableLocations();
            this.panel?.webview.postMessage({
                type: 'availableLocations',
                data: locations
            });
        } catch (error) {
            vscode.window.showErrorMessage(`獲取可用位置失敗: ${error}`);
        }
    }

    async changeDataLocation(locationPath: string, options?: { migrateData?: boolean; createBackup?: boolean }): Promise<void> {
        try {
            const confirmed = await vscode.window.showWarningMessage(
                `確定要變更資料存儲位置到 "${locationPath}" 嗎？`,
                { modal: true },
                '確定',
                '取消'
            );

            if (confirmed === '確定') {
                vscode.window.withProgress({
                    location: vscode.ProgressLocation.Notification,
                    title: '變更資料位置中...',
                    cancellable: false
                }, async (progress) => {
                    progress.report({ message: '準備遷移資料...' });

                    const result = await this.dataPathService.setDataPath(locationPath, options);

                    if (result.success) {
                        progress.report({ message: '完成！' });
                        vscode.window.showInformationMessage(
                            `資料位置已成功變更至 "${locationPath}"`
                        );

                        this.panel?.webview.postMessage({
                            type: 'dataLocationChanged',
                            data: result
                        });

                        await this.sendDataCallback();
                    } else {
                        throw new Error(`遷移失敗: ${result.errors.join(', ')}`);
                    }
                });
            }
        } catch (error) {
            vscode.window.showErrorMessage(`變更資料位置失敗: ${error}`);
        }
    }

    async resetToSystemDefault(): Promise<void> {
        try {
            const confirmed = await vscode.window.showWarningMessage(
                '確定要重設為系統預設位置嗎？這將會遷移您的資料。',
                { modal: true },
                '確定',
                '取消'
            );

            if (confirmed === '確定') {
                vscode.window.withProgress({
                    location: vscode.ProgressLocation.Notification,
                    title: '重設資料位置中...',
                    cancellable: false
                }, async (progress) => {
                    progress.report({ message: '準備重設...' });

                    const result = await this.dataPathService.resetToSystemDefault();

                    if (result.success) {
                        progress.report({ message: '完成！' });
                        vscode.window.showInformationMessage('已重設為系統預設位置');

                        this.panel?.webview.postMessage({
                            type: 'dataLocationReset',
                            data: result
                        });

                        await this.sendDataCallback();
                    } else {
                        throw new Error(`重設失敗: ${result.errors.join(', ')}`);
                    }
                });
            }
        } catch (error) {
            vscode.window.showErrorMessage(`重設資料位置失敗: ${error}`);
        }
    }

    async openDataLocation(): Promise<void> {
        try {
            await this.dataPathService.openDataLocation();
        } catch (error) {
            vscode.window.showErrorMessage(`開啟資料位置失敗: ${error}`);
        }
    }

    async validateDataPath(path: string): Promise<void> {
        try {
            const validation = await this.dataPathService.validatePath(path);
            this.panel?.webview.postMessage({
                type: 'pathValidationResult',
                data: validation
            });
        } catch (error) {
            vscode.window.showErrorMessage(`驗證路徑失敗: ${error}`);
        }
    }

    async syncToDevData(options?: {
        includeUsage?: boolean;
        includeFavorites?: boolean;
        includeMetadata?: boolean;
    }): Promise<void> {
        try {
            // 構建選項說明文字
            const optionTexts: string[] = [];
            if (options?.includeUsage) {
                optionTexts.push('✓ 包含使用統計');
            } else {
                optionTexts.push('✗ 不含使用統計');
            }
            if (options?.includeFavorites) {
                optionTexts.push('✓ 包含收藏列表');
            } else {
                optionTexts.push('✗ 不含收藏列表');
            }
            if (options?.includeMetadata) {
                optionTexts.push('✓ 包含元數據');
            } else {
                optionTexts.push('✗ 不含元數據');
            }

            const confirmed = await vscode.window.showWarningMessage(
                `確定要同步到開發數據？\n\n將執行：\n1. 備份當前 data/local → data/local.backup\n2. 完整覆蓋 data/local\n3. 複製文檔文件並調整路徑\n\n${optionTexts.join('\n')}`,
                { modal: true },
                '確定',
                '取消'
            );

            if (confirmed === '確定') {
                const result = await vscode.window.withProgress({
                    location: vscode.ProgressLocation.Notification,
                    title: '同步到開發數據中...',
                    cancellable: false
                }, async (progress) => {
                    progress.report({ message: '備份並複製資料...' });
                    return await this.dataPathService.syncToDevData(options);
                });

                if (result.success) {
                    const successMessage = [
                        '✅ 同步完成',
                        '',
                        `- 已同步：${result.templatesCount} 個模板檔案`,
                        `- 已同步：${result.topicsCount} 個主題配置`,
                        `- 已同步：${result.docsCount} 個文檔文件（已調整路徑）`,
                        '',
                        `- 已備份：data/local.backup`
                    ].join('\n');

                    vscode.window.showInformationMessage(successMessage);
                } else {
                    vscode.window.showErrorMessage(`同步失敗: ${result.message}`);
                }
            }
        } catch (error) {
            vscode.window.showErrorMessage(`同步到開發數據失敗: ${error}`);
        }
    }
}
