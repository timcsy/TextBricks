import * as vscode from 'vscode';
import { TextBricksEngine, DataPathService } from '@textbricks/core';
import { ImportExportManager, SearchManager, ValidationManager } from '@textbricks/core';
import { WebviewProvider } from '../providers/WebviewProvider';
import { TextBricksManagerProvider } from '../providers/TextBricksManagerProvider';
import { DocumentationProvider } from '../providers/DocumentationProvider';
import { VSCodePlatform } from '../adapters/vscode/VSCodePlatform';

/**
 * 統一命令服務 - 整合所有命令處理邏輯
 */
export class CommandService {
    private importExportManager: ImportExportManager;
    private searchManager: SearchManager;
    private validationManager: ValidationManager;
    private dataPathService: DataPathService;
    private platform: VSCodePlatform;

    constructor(
        private context: vscode.ExtensionContext,
        private templateEngine: TextBricksEngine,
        private webviewProvider: WebviewProvider,
        private textBricksManagerProvider: TextBricksManagerProvider,
        private documentationProvider: DocumentationProvider
    ) {
        this.platform = new VSCodePlatform(this.context);
        this.importExportManager = new ImportExportManager(this.platform);
        this.searchManager = new SearchManager(this.platform);
        this.validationManager = new ValidationManager(this.platform);
        this.dataPathService = DataPathService.getInstance(this.platform);

        // 初始化 DataPathService
        this.dataPathService.initialize().catch(error => {
            this.platform.logError(error as Error, 'CommandService.initialize');
        });
    }

    /**
     * 註冊所有命令
     */
    registerAllCommands(): void {
        const commands = [
            // 基本命令
            vscode.commands.registerCommand('textbricks.refreshTemplates', () =>
                this.refreshTemplates()
            ),
            vscode.commands.registerCommand('textbricks.openTextBricksManager', () =>
                this.openTextBricksManager()
            ),

            // 模板命令
            vscode.commands.registerCommand('textbricks.createTemplate', () =>
                this.createTemplate()
            ),
            vscode.commands.registerCommand('textbricks.searchTemplates', () =>
                this.searchTemplates()
            ),
            vscode.commands.registerCommand('textbricks.validateTemplate', () =>
                this.validateCurrentTemplate()
            ),

            // 匯入匯出命令
            vscode.commands.registerCommand('textbricks.importTemplates', () =>
                this.importTemplates()
            ),
            vscode.commands.registerCommand('textbricks.exportTemplates', () =>
                this.exportTemplates()
            ),

            // 文檔命令
            vscode.commands.registerCommand('textbricks.showDocumentation', (templateId?: string) =>
                this.showDocumentation(templateId)
            ),

            // 資料位置管理命令
            vscode.commands.registerCommand('textbricks.openDataLocation', () =>
                this.openDataLocation()
            ),
            vscode.commands.registerCommand('textbricks.changeDataLocation', () =>
                this.changeDataLocation()
            ),
            vscode.commands.registerCommand('textbricks.resetToSystemDefault', () =>
                this.resetToSystemDefault()
            ),
            vscode.commands.registerCommand('textbricks.initializeDataLocation', () =>
                this.initializeDataLocation()
            )
        ];

        this.context.subscriptions.push(...commands);
    }

    // ==================== 基本命令 ====================

    private async refreshTemplates(): Promise<void> {
        await this.webviewProvider.refresh();
        vscode.window.showInformationMessage('模板列表已刷新');
    }

    private openTextBricksManager(): void {
        this.textBricksManagerProvider.createOrShow();
    }

    // ==================== 模板命令 ====================

    private async createTemplate(): Promise<void> {
        try {
            const title = await vscode.window.showInputBox({
                prompt: '輸入模板標題',
                placeHolder: '例如：Hello World',
                validateInput: (value) => {
                    if (!value || value.trim().length === 0) {
                        return '標題不能為空';
                    }
                    return null;
                }
            });

            if (!title) {return;}

            const description = await vscode.window.showInputBox({
                prompt: '輸入模板描述',
                placeHolder: '例如：顯示 Hello World 的基本程式',
                validateInput: (value) => {
                    if (!value || value.trim().length === 0) {
                        return '描述不能為空';
                    }
                    return null;
                }
            });

            if (!description) {return;}

            // 獲取語言選擇
            const languages = this.templateEngine.getLanguages();
            if (languages.length === 0) {
                vscode.window.showErrorMessage('沒有可用的程式語言，請先在 TextBricks Manager 中添加語言');
                return;
            }

            const languageItems = languages.map(lang => ({
                label: lang.title,
                detail: lang.name,
                language: lang
            }));

            const selectedLanguage = await vscode.window.showQuickPick(languageItems, {
                placeHolder: '選擇程式語言'
            });

            if (!selectedLanguage) {return;}

            // 獲取主題選擇
            const topics = this.templateEngine.getTopics();
            const topicInput = await vscode.window.showInputBox({
                placeHolder: '輸入模板主題',
                prompt: '例如：基礎、控制、結構、進階等',
                value: topics.length > 0 ? topics[0] : '基礎'
            });

            const topic = topicInput || '基礎';

            // 開啟編輯器
            const doc = await vscode.workspace.openTextDocument({
                language: selectedLanguage.language.name,
                content: `// ${title}\n// ${description}\n\n// 在這裡寫您的程式碼\n`
            });

            const editor = await vscode.window.showTextDocument(doc);

            // 詢問儲存
            const action = await vscode.window.showInformationMessage(
                '請編寫程式碼，完成後點擊「儲存為模板」',
                '儲存為模板',
                '取消'
            );

            if (action === '儲存為模板') {
                await this.saveAsTemplate(editor, title, description, selectedLanguage.language.name, topic);
            }

        } catch (error) {
            vscode.window.showErrorMessage(`創建模板失敗：${error}`);
        }
    }

    private async saveAsTemplate(
        editor: vscode.TextEditor,
        title: string,
        description: string,
        languageId: string,
        topic: string
    ): Promise<void> {
        try {
            const code = editor.document.getText();

            // 驗證模板
            const validationResult = this.validationManager.validateTemplate({
                title,
                description,
                code,
                language: languageId,
                topic
            });

            if (!validationResult.isValid) {
                const errorMessages = validationResult.errors.map(e => e.message).join('\n');
                vscode.window.showErrorMessage(`模板驗證失敗：\n${errorMessages}`);
                return;
            }

            if (validationResult.warnings.length > 0) {
                const warningMessages = validationResult.warnings.map(w => w.message).join('\n');
                const proceed = await vscode.window.showWarningMessage(
                    `模板有警告，是否繼續？\n${warningMessages}`,
                    '繼續',
                    '取消'
                );
                if (proceed !== '繼續') {return;}
            }

            // 創建模板
            const topicPath = topic || languageId;
            const templateData = {
                name: title.toLowerCase().replace(/\s+/g, '-'),
                title,
                description,
                code,
                language: languageId
            };
            await this.templateEngine.createTemplate(templateData, topicPath);

            vscode.window.showInformationMessage(`模板「${title}」已創建成功！`);
            this.webviewProvider.refresh();

        } catch (error) {
            vscode.window.showErrorMessage(`儲存模板失敗：${error}`);
        }
    }

    private async searchTemplates(): Promise<void> {
        try {
            const query = await vscode.window.showInputBox({
                prompt: '輸入搜尋關鍵字',
                placeHolder: '搜尋模板標題、描述或標籤...'
            });

            if (!query) {return;}

            const templates = this.templateEngine.getAllTemplates();
            const searchResult = await this.searchManager.searchTemplates(templates, query);

            if (searchResult.templates.length === 0) {
                vscode.window.showInformationMessage('未找到符合條件的模板');
                return;
            }

            // 顯示搜尋結果
            const templateItems = searchResult.templates.map(template => ({
                label: template.title,
                detail: template.description,
                description: `${template.language} • ${(template as any).topicPath || template.language}`,
                template: template
            }));

            const selected = await vscode.window.showQuickPick(templateItems, {
                placeHolder: `找到 ${searchResult.totalCount} 個模板，選擇一個查看`
            });

            if (selected) {
                // 這裡可以添加選擇模板後的操作，比如插入或複製
                vscode.window.showInformationMessage(`已選擇模板：${selected.template.title}`);
            }

        } catch (error) {
            vscode.window.showErrorMessage(`搜尋失敗：${error}`);
        }
    }

    private async validateCurrentTemplate(): Promise<void> {
        try {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showWarningMessage('請先開啟一個檔案');
                return;
            }

            const code = editor.document.getText();
            const languageId = editor.document.languageId;

            // 簡化的模板物件用於驗證
            const template = {
                title: '當前檔案',
                description: '檔案內容驗證',
                code,
                language: languageId,
                topic: '驗證'
            };

            const validationResult = this.validationManager.validateTemplate(template, {
                requireDocumentation: false,
                maxCodeLength: 10000
            });

            if (validationResult.isValid) {
                vscode.window.showInformationMessage('程式碼驗證通過！');
            } else {
                const errorMessages = validationResult.errors.map(e => `${e.field}: ${e.message}`).join('\n');
                vscode.window.showErrorMessage(`程式碼驗證失敗：\n${errorMessages}`);
            }

            if (validationResult.warnings.length > 0) {
                const warningMessages = validationResult.warnings.map(w => `${w.field}: ${w.message}`).join('\n');
                vscode.window.showWarningMessage(`程式碼警告：\n${warningMessages}`);
            }

        } catch (error) {
            vscode.window.showErrorMessage(`驗證失敗：${error}`);
        }
    }

    // ==================== 匯入匯出命令 ====================

    private async importTemplates(): Promise<void> {
        try {
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

            if (!files || files.length === 0) {return;}

            const content = await vscode.workspace.fs.readFile(files[0]);
            const importData = this.importExportManager.parseImportData(content.toString());

            // 驗證匯入資料
            const validationResult = this.validationManager.validateImportData(importData, {
                validateVersionCompatibility: true,
                requireMetadata: false
            });

            if (!validationResult.isValid) {
                const errorMessages = validationResult.errors.map(e => e.message).join('\n');
                vscode.window.showErrorMessage(`匯入資料驗證失敗：\n${errorMessages}`);
                return;
            }

            // 詢問匯入選項
            const options = await this.getImportOptions();
            if (!options) {return;}

            const targetTopicPath = 'imported';
            const result = await this.templateEngine.importTemplates(importData, targetTopicPath, options);

            // 顯示結果
            await this.showImportResult(result);
            this.webviewProvider.refresh();

        } catch (error) {
            vscode.window.showErrorMessage(`匯入失敗：${error}`);
        }
    }

    private async exportTemplates(): Promise<void> {
        try {
            const saveUri = await vscode.window.showSaveDialog({
                defaultUri: vscode.Uri.file('textbricks-templates.json'),
                filters: {
                    'JSON Files': ['json'],
                    'All Files': ['*']
                },
                saveLabel: '匯出模板'
            });

            if (!saveUri) {return;}

            const templates = this.templateEngine.getAllTemplates();
            const languages = this.templateEngine.getLanguages();
            const topics = this.templateEngine.getAllTopicConfigs();

            const exportData = await this.importExportManager.exportTemplates(templates, languages, topics);
            const content = this.importExportManager.formatExportData(exportData);

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

    // ==================== 文檔命令 ====================

    private async showDocumentation(templateId?: string): Promise<void> {
        try {
            if (!templateId) {
                const templates = this.templateEngine.getAllTemplates().filter(t => t.documentation);

                if (templates.length === 0) {
                    vscode.window.showWarningMessage('沒有可用的說明文檔');
                    return;
                }

                const templateItems = templates.map(template => ({
                    label: template.title,
                    detail: template.description,
                    template: template
                }));

                const selected = await vscode.window.showQuickPick(templateItems, {
                    placeHolder: '選擇要查看說明文檔的模板'
                });

                if (!selected) {return;}
                // Build full template path (topicPath/templates/name)
                const template = selected.template as any;
                templateId = template.topicPath
                    ? `${template.topicPath}/templates/${template.name}`
                    : template.name;
            }

            await this.documentationProvider.showDocumentation(templateId);

        } catch (error) {
            vscode.window.showErrorMessage(`顯示文檔失敗：${error}`);
        }
    }

    // ==================== 輔助方法 ====================

    private async getImportOptions(): Promise<{
        overwriteExisting: boolean;
        mergeTopics: boolean;
        mergeLanguages: boolean;
    } | null> {
        const overwriteExisting = await vscode.window.showQuickPick(
            ['是', '否'],
            { placeHolder: '是否覆蓋現有的模板？' }
        );

        if (overwriteExisting === undefined) { return null; }

        const mergeTopics = await vscode.window.showQuickPick(
            ['是', '否'],
            { placeHolder: '是否合併主題？' }
        );

        if (mergeTopics === undefined) { return null; }

        const mergeLanguages = await vscode.window.showQuickPick(
            ['是', '否'],
            { placeHolder: '是否合併語言？' }
        );

        if (mergeLanguages === undefined) { return null; }

        return {
            overwriteExisting: overwriteExisting === '是',
            mergeTopics: mergeTopics === '是',
            mergeLanguages: mergeLanguages === '是'
        };
    }

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

    // ==================== 資料位置管理命令 ====================

    private async openDataLocation(): Promise<void> {
        try {
            await this.dataPathService.openDataLocation();
        } catch (error) {
            vscode.window.showErrorMessage(`開啟資料位置失敗：${error}`);
        }
    }

    private async changeDataLocation(): Promise<void> {
        try {
            // 獲取可用位置
            const locations = await this.dataPathService.getAvailableLocations();

            const locationItems = locations.map(location => ({
                label: location.name,
                detail: location.path,
                description: location.recommended ? '推薦' : undefined,
                location: location
            }));

            // 添加自定義選項
            locationItems.push({
                label: '自定義位置...',
                detail: '選擇自定義資料夾',
                description: '自定義',
                location: null
            });

            const selected = await vscode.window.showQuickPick(locationItems, {
                placeHolder: '選擇資料存儲位置'
            });

            if (!selected) {return;}

            let targetPath: string;

            if (selected.location) {
                targetPath = selected.location.path;
            } else {
                // 自定義位置
                const folder = await vscode.window.showOpenDialog({
                    canSelectFiles: false,
                    canSelectFolders: true,
                    canSelectMany: false,
                    openLabel: '選擇資料夾'
                });

                if (!folder || folder.length === 0) {return;}
                targetPath = folder[0].fsPath;
            }

            // 詢問遷移選項
            const migrateData = await vscode.window.showQuickPick(
                ['是', '否'],
                { placeHolder: '是否遷移現有資料？' }
            );

            if (migrateData === undefined) {return;}

            const createBackup = await vscode.window.showQuickPick(
                ['是', '否'],
                { placeHolder: '是否建立備份？' }
            );

            if (createBackup === undefined) {return;}

            // 確認變更
            const confirmed = await vscode.window.showWarningMessage(
                `確定要變更資料存儲位置到 "${targetPath}" 嗎？`,
                { modal: true },
                '確定',
                '取消'
            );

            if (confirmed === '確定') {
                await vscode.window.withProgress({
                    location: vscode.ProgressLocation.Notification,
                    title: '變更資料位置中...',
                    cancellable: false
                }, async (progress) => {
                    progress.report({ message: '準備遷移資料...' });

                    const result = await this.dataPathService.setDataPath(targetPath, {
                        migrateData: migrateData === '是',
                        createBackup: createBackup === '是'
                    });

                    if (result.success) {
                        progress.report({ message: '完成！' });
                        vscode.window.showInformationMessage(
                            `資料位置已成功變更至 "${targetPath}"`
                        );
                        this.webviewProvider.refresh();
                    } else {
                        throw new Error(`遷移失敗: ${result.errors.join(', ')}`);
                    }
                });
            }

        } catch (error) {
            vscode.window.showErrorMessage(`變更資料位置失敗：${error}`);
        }
    }

    private async resetToSystemDefault(): Promise<void> {
        try {
            const confirmed = await vscode.window.showWarningMessage(
                '確定要重設為系統預設位置嗎？這將會遷移您的資料。',
                { modal: true },
                '確定',
                '取消'
            );

            if (confirmed === '確定') {
                await vscode.window.withProgress({
                    location: vscode.ProgressLocation.Notification,
                    title: '重設資料位置中...',
                    cancellable: false
                }, async (progress) => {
                    progress.report({ message: '準備重設...' });

                    const result = await this.dataPathService.resetToSystemDefault();

                    if (result.success) {
                        progress.report({ message: '完成！' });
                        vscode.window.showInformationMessage('已重設為系統預設位置');
                        this.webviewProvider.refresh();
                    } else {
                        throw new Error(`重設失敗: ${result.errors.join(', ')}`);
                    }
                });
            }

        } catch (error) {
            vscode.window.showErrorMessage(`重設資料位置失敗：${error}`);
        }
    }

    private async initializeDataLocation(): Promise<void> {
        try {
            const confirmed = await vscode.window.showInformationMessage(
                '這將初始化 TextBricks 資料位置並複製範本資料。確定要繼續嗎？',
                { modal: true },
                '確定',
                '取消'
            );

            if (confirmed === '確定') {
                await vscode.window.withProgress({
                    location: vscode.ProgressLocation.Notification,
                    title: '初始化資料位置中...',
                    cancellable: false
                }, async (progress) => {
                    progress.report({ message: '準備初始化...' });

                    // 強制重新初始化 DataPathService
                    await this.dataPathService.initialize();

                    progress.report({ message: '完成！' });
                    vscode.window.showInformationMessage('資料位置已成功初始化');
                    this.webviewProvider.refresh();
                });
            }

        } catch (error) {
            vscode.window.showErrorMessage(`初始化資料位置失敗：${error}`);
        }
    }
}