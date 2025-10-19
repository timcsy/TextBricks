import * as vscode from 'vscode';
import { TextBricksEngine } from '@textbricks/core';
import { VSCodePlatform } from '../../../adapters/vscode/VSCodePlatform';

export class ImportExportActions {
    constructor(
        private readonly platform: VSCodePlatform,
        private readonly templateEngine: TextBricksEngine,
        private readonly sendDataCallback: () => Promise<void>
    ) {}

    async exportTemplates(filters?: unknown): Promise<void> {
        const saveUri = await vscode.window.showSaveDialog({
            defaultUri: vscode.Uri.file('templates-export.json'),
            filters: {
                'JSON Files': ['json'],
                'All Files': ['*']
            }
        });

        if (saveUri) {
            try {
                const exportData = await this.templateEngine.exportTemplates(filters);
                const content = JSON.stringify(exportData, null, 2);

                await vscode.workspace.fs.writeFile(saveUri, Buffer.from(content, 'utf8'));

                vscode.window.showInformationMessage(
                    `模板已匯出至 ${saveUri.fsPath}`,
                    '開啟檔案'
                ).then(selection => {
                    if (selection === '開啟檔案') {
                        vscode.window.showTextDocument(saveUri);
                    }
                });
            } catch (error) {
                vscode.window.showErrorMessage(`匯出失敗: ${error}`);
            }
        }
    }

    async importTemplates(): Promise<void> {
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
            try {
                const content = await vscode.workspace.fs.readFile(openUri[0]);
                const importData = JSON.parse(content.toString());

                const options = await this.getImportOptions();
                const targetTopicPath = 'imported';
                const result = await this.templateEngine.importTemplates(importData, targetTopicPath, options);

                let message = `匯入完成: ${result.imported} 個模板已匯入`;
                if (result.skipped > 0) {
                    message += `, ${result.skipped} 個模板已跳過`;
                }
                if (result.errors.length > 0) {
                    message += `, ${result.errors.length} 個錯誤`;
                }

                vscode.window.showInformationMessage(message);

                if (result.errors.length > 0) {
                    const showErrors = await vscode.window.showWarningMessage(
                        '匯入過程中出現一些錯誤，是否查看詳情？',
                        '查看錯誤',
                        '忽略'
                    );

                    if (showErrors === '查看錯誤') {
                        const errorMessage = result.errors.join('\n');
                        vscode.window.showErrorMessage(errorMessage);
                    }
                }

                await this.sendDataCallback();
            } catch (error) {
                vscode.window.showErrorMessage(`匯入失敗: ${error}`);
            }
        }
    }

    private async getImportOptions() {
        const overwriteExisting = await vscode.window.showQuickPick(
            ['是', '否'],
            { placeHolder: '是否覆蓋現有的模板？' }
        );

        const mergeTopics = await vscode.window.showQuickPick(
            ['是', '否'],
            { placeHolder: '是否合併主題？' }
        );

        const mergeLanguages = await vscode.window.showQuickPick(
            ['是', '否'],
            { placeHolder: '是否合併語言？' }
        );

        return {
            overwriteExisting: overwriteExisting === '是',
            mergeTopics: mergeTopics === '是',
            mergeLanguages: mergeLanguages === '是'
        };
    }
}
