import * as vscode from 'vscode';
import { TemplateEngine } from '../core/TemplateEngine';
import { WebviewProvider } from '../providers/WebviewProvider';

/**
 * 匯入匯出命令處理器
 */
export class ImportExportCommands {
    constructor(
        private templateEngine: TemplateEngine,
        private webviewProvider: WebviewProvider
    ) {}

    /**
     * 匯入模板命令
     */
    async importTemplates(): Promise<void> {
        const files = await vscode.window.showOpenDialog({
            canSelectFiles: true,
            canSelectFolders: false,
            canSelectMany: false,
            filters: {
                'JSON Files': ['json'],
                'All Files': ['*']
            },
            openLabel: '選擇要匯入的模板檔案'
        });

        if (!files || files.length === 0) return;

        try {
            const content = await vscode.workspace.fs.readFile(files[0]);
            const importData = JSON.parse(content.toString());

            // 詢問匯入選項
            const options = await this.getImportOptions();
            if (!options) return;

            const result = await this.templateEngine.importTemplates(importData, options);

            // 顯示結果
            await this.showImportResult(result);
            this.webviewProvider.refresh();

        } catch (error) {
            vscode.window.showErrorMessage(`匯入失敗：${error}`);
        }
    }

    /**
     * 匯出模板命令
     */
    async exportTemplates(): Promise<void> {
        const saveUri = await vscode.window.showSaveDialog({
            defaultUri: vscode.Uri.file('textbricks-templates.json'),
            filters: {
                'JSON Files': ['json'],
                'All Files': ['*']
            },
            saveLabel: '匯出模板'
        });

        if (!saveUri) return;

        try {
            const exportData = await this.templateEngine.exportTemplates();
            const content = JSON.stringify(exportData, null, 2);
            
            await vscode.workspace.fs.writeFile(saveUri, Buffer.from(content, 'utf8'));
            
            const action = await vscode.window.showInformationMessage(
                `模板已匯出至 ${saveUri.fsPath}`,
                '開啟檔案'
            );
            
            if (action === '開啟檔案') {
                await vscode.window.showTextDocument(saveUri);
            }
        } catch (error) {
            vscode.window.showErrorMessage(`匯出失敗：${error}`);
        }
    }

    /**
     * 獲取匯入選項
     */
    private async getImportOptions(): Promise<{
        overwriteExisting: boolean;
        mergeCategories: boolean;
        mergeLanguages: boolean;
    } | null> {
        const overwriteExisting = await vscode.window.showQuickPick(
            ['是', '否'],
            { placeHolder: '是否覆蓋現有的模板？' }
        );

        if (overwriteExisting === undefined) return null;

        const mergeCategories = await vscode.window.showQuickPick(
            ['是', '否'],
            { placeHolder: '是否合併分類？' }
        );

        if (mergeCategories === undefined) return null;

        const mergeLanguages = await vscode.window.showQuickPick(
            ['是', '否'],
            { placeHolder: '是否合併語言？' }
        );

        if (mergeLanguages === undefined) return null;

        return {
            overwriteExisting: overwriteExisting === '是',
            mergeCategories: mergeCategories === '是',
            mergeLanguages: mergeLanguages === '是'
        };
    }

    /**
     * 顯示匯入結果
     */
    private async showImportResult(result: {
        imported: number;
        skipped: number;
        errors: string[];
    }): Promise<void> {
        let message = `匯入完成：${result.imported} 個模板已匯入`;
        if (result.skipped > 0) {
            message += `，${result.skipped} 個模板已跳過`;
        }
        if (result.errors.length > 0) {
            message += `，${result.errors.length} 個錯誤`;
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
    }
}