import * as vscode from 'vscode';
import { ScopeManager } from '@textbricks/core';
import { VSCodePlatform } from '../../../adapters/vscode/VSCodePlatform';

export class ScopeActions {
    constructor(
        private readonly platform: VSCodePlatform,
        private readonly scopeManager: ScopeManager,
        private readonly panel: vscode.WebviewPanel | undefined,
        private readonly sendDataCallback: () => Promise<void>
    ) {}

    async switchScope(scopeId: string): Promise<void> {
        try {
            await this.scopeManager.switchScope(scopeId);
            vscode.window.showInformationMessage(`已切換到範圍 "${scopeId}"`);
            await this.sendDataCallback();
        } catch (error) {
            vscode.window.showErrorMessage(`切換範圍失敗: ${error}`);
        }
    }

    async createScope(scopeData: unknown): Promise<void> {
        try {
            const newScope = await this.scopeManager.createScope(scopeData as any);
            vscode.window.showInformationMessage(`範圍 "${newScope.name}" 已創建成功`);
            await this.sendDataCallback();
        } catch (error) {
            vscode.window.showErrorMessage(`創建範圍失敗: ${error}`);
        }
    }

    async updateScope(scopeId: string, updates: unknown): Promise<void> {
        try {
            const updatedScope = await this.scopeManager.updateScope(scopeId, updates);
            vscode.window.showInformationMessage(`範圍 "${updatedScope.name}" 已更新成功`);
            await this.sendDataCallback();
        } catch (error) {
            vscode.window.showErrorMessage(`更新範圍失敗: ${error}`);
        }
    }

    async deleteScope(scopeId: string): Promise<void> {
        try {
            const confirmed = await vscode.window.showWarningMessage(
                `確定要刪除範圍 "${scopeId}" 嗎？此操作無法恢復。`,
                '確定',
                '取消'
            );

            if (confirmed === '確定') {
                await this.scopeManager.deleteScope(scopeId);
                vscode.window.showInformationMessage(`範圍 "${scopeId}" 已刪除`);
                await this.sendDataCallback();
            }
        } catch (error) {
            vscode.window.showErrorMessage(`刪除範圍失敗: ${error}`);
        }
    }

    async exportScope(options: unknown): Promise<void> {
        try {
            const saveUri = await vscode.window.showSaveDialog({
                defaultUri: vscode.Uri.file('scope-export.json'),
                filters: {
                    'JSON Files': ['json'],
                    'All Files': ['*']
                }
            });

            if (saveUri) {
                const opts = options as any;
                const exportData = await this.scopeManager.exportScope(
                    opts.includeTemplates || true,
                    opts.includeStats || true
                );
                const content = JSON.stringify(exportData, null, 2);

                await vscode.workspace.fs.writeFile(saveUri, Buffer.from(content, 'utf8'));

                vscode.window.showInformationMessage(
                    `範圍已匯出至 ${saveUri.fsPath}`,
                    '開啟檔案'
                ).then(selection => {
                    if (selection === '開啟檔案') {
                        vscode.window.showTextDocument(saveUri);
                    }
                });
            }
        } catch (error) {
            vscode.window.showErrorMessage(`匯出範圍失敗: ${error}`);
        }
    }

    async importScope(): Promise<void> {
        try {
            const openUri = await vscode.window.showOpenDialog({
                canSelectFiles: true,
                canSelectFolders: false,
                canSelectMany: false,
                filters: {
                    'JSON Files': ['json'],
                    'All Files': ['*']
                }
            });

            if (openUri && openUri[0]) {
                const content = await vscode.workspace.fs.readFile(openUri[0]);
                const importData = JSON.parse(content.toString());

                const options = await this.getScopeImportOptions();
                await this.scopeManager.importScope(importData, options);

                vscode.window.showInformationMessage('範圍匯入成功');
                await this.sendDataCallback();
            }
        } catch (error) {
            vscode.window.showErrorMessage(`匯入範圍失敗: ${error}`);
        }
    }

    async addToFavorites(itemId: string): Promise<void> {
        try {
            await this.scopeManager.addFavorite(itemId);
            vscode.window.showInformationMessage('已添加到收藏');
            await this.sendDataCallback();
        } catch (error) {
            vscode.window.showErrorMessage(`添加到收藏失敗: ${error}`);
        }
    }

    async removeFromFavorites(itemId: string): Promise<void> {
        try {
            await this.scopeManager.removeFavorite(itemId);
            vscode.window.showInformationMessage('已從收藏中移除');
            await this.sendDataCallback();
        } catch (error) {
            vscode.window.showErrorMessage(`從收藏中移除失敗: ${error}`);
        }
    }

    async clearUsageStats(): Promise<void> {
        try {
            const confirmed = await vscode.window.showWarningMessage(
                '確定要清除所有使用統計嗎？此操作無法恢復。',
                '確定',
                '取消'
            );

            if (confirmed === '確定') {
                await this.scopeManager.clearUsageStats();
                vscode.window.showInformationMessage('使用統計已清除');
                await this.sendDataCallback();
            }
        } catch (error) {
            vscode.window.showErrorMessage(`清除使用統計失敗: ${error}`);
        }
    }

    private async getScopeImportOptions() {
        const overwriteExisting = await vscode.window.showQuickPick(
            ['是', '否'],
            { placeHolder: '是否覆蓋現有的範圍？' }
        );

        const mergeTopics = await vscode.window.showQuickPick(
            ['是', '否'],
            { placeHolder: '是否合併主題？' }
        );

        const preserveStats = await vscode.window.showQuickPick(
            ['是', '否'],
            { placeHolder: '是否保留統計資料？' }
        );

        return {
            overwriteExisting: overwriteExisting === '是',
            mergeTopics: mergeTopics === '是',
            mergeLanguages: true,
            preserveStats: preserveStats === '是',
            preserveFavorites: true
        };
    }
}
