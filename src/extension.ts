import * as vscode from 'vscode';
import { WebviewProvider } from './providers/WebviewProvider';
import { TemplateManagerProvider } from './providers/TemplateManagerProvider';
import { TemplateManager } from './services/TemplateManager';
import { TemplateManagementService } from './services/TemplateManagementService';

export function activate(context: vscode.ExtensionContext) {
    // Initialize core services
    const templateManager = new TemplateManager();
    const managementService = new TemplateManagementService(templateManager, context);
    
    // Load templates on activation
    templateManager.loadTemplates();
    
    // Initialize providers
    const webviewProvider = new WebviewProvider(context.extensionUri, templateManager, context, managementService);
    const templateManagerProvider = new TemplateManagerProvider(context.extensionUri, managementService);

    // Register webview view
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(WebviewProvider.viewType, webviewProvider)
    );

    // Register commands
    const refreshCommand = vscode.commands.registerCommand('textbricks.refreshTemplates', () => {
        webviewProvider.refresh();
    });

    const openManagerCommand = vscode.commands.registerCommand('textbricks.openTemplateManager', () => {
        templateManagerProvider.createOrShow();
    });

    const createTemplateCommand = vscode.commands.registerCommand('textbricks.createTemplate', async () => {
        // Quick create template from command palette
        const title = await vscode.window.showInputBox({
            prompt: '輸入模板標題',
            placeHolder: '例如：Hello World'
        });

        if (!title) {return;}

        const description = await vscode.window.showInputBox({
            prompt: '輸入模板描述',
            placeHolder: '例如：顯示 Hello World 的基本程式'
        });

        if (!description) {return;}

        // Get available languages and categories
        const languages = templateManager.getLanguages();
        const categories = templateManager.getCategories();

        if (languages.length === 0) {
            vscode.window.showErrorMessage('沒有可用的程式語言，請先在模板管理器中添加語言');
            return;
        }

        if (categories.length === 0) {
            vscode.window.showErrorMessage('沒有可用的分類，請先在模板管理器中添加分類');
            return;
        }

        const languageItems = languages.map(lang => ({
            label: lang.displayName,
            detail: lang.id,
            language: lang
        }));

        const selectedLanguage = await vscode.window.showQuickPick(languageItems, {
            placeHolder: '選擇程式語言'
        });

        if (!selectedLanguage) {return;}

        const categoryItems = categories.map(cat => ({
            label: cat.name,
            detail: `Level ${cat.level} - ${cat.description}`,
            category: cat
        }));

        const selectedCategory = await vscode.window.showQuickPick(categoryItems, {
            placeHolder: '選擇分類'
        });

        if (!selectedCategory) {return;}

        // Open a new document for code editing
        const doc = await vscode.workspace.openTextDocument({
            language: selectedLanguage.language.id,
            content: `// ${title}\n// ${description}\n\n// 在這裡寫您的程式碼\n`
        });

        const editor = await vscode.window.showTextDocument(doc);

        // Show info message with save instruction
        const action = await vscode.window.showInformationMessage(
            '請編寫程式碼，完成後點擊「儲存為模板」',
            '儲存為模板',
            '取消'
        );

        if (action === '儲存為模板') {
            const code = editor.document.getText();
            
            try {
                await managementService.createTemplate({
                    title,
                    description,
                    code,
                    language: selectedLanguage.language.id,
                    categoryId: selectedCategory.category.id
                });
                
                vscode.window.showInformationMessage(`模板「${title}」已創建成功！`);
                webviewProvider.refresh();
            } catch (error) {
                vscode.window.showErrorMessage(`創建模板失敗：${error}`);
            }
        }
    });

    const importTemplatesCommand = vscode.commands.registerCommand('textbricks.importTemplates', async () => {
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

        try {
            const content = await vscode.workspace.fs.readFile(files[0]);
            const importData = JSON.parse(content.toString());

            // Ask for import options
            const overwriteExisting = await vscode.window.showQuickPick(
                ['是', '否'],
                { placeHolder: '是否覆蓋現有的模板？' }
            );

            if (overwriteExisting === undefined) {return;}

            const mergeCategories = await vscode.window.showQuickPick(
                ['是', '否'],
                { placeHolder: '是否合併分類？' }
            );

            if (mergeCategories === undefined) {return;}

            const mergeLanguages = await vscode.window.showQuickPick(
                ['是', '否'],
                { placeHolder: '是否合併語言？' }
            );

            if (mergeLanguages === undefined) {return;}

            const options = {
                overwriteExisting: overwriteExisting === '是',
                mergeCategories: mergeCategories === '是',
                mergeLanguages: mergeLanguages === '是'
            };

            const result = await managementService.importTemplates(importData, options);

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

            webviewProvider.refresh();

        } catch (error) {
            vscode.window.showErrorMessage(`匯入失敗：${error}`);
        }
    });

    const exportTemplatesCommand = vscode.commands.registerCommand('textbricks.exportTemplates', async () => {
        const saveUri = await vscode.window.showSaveDialog({
            defaultUri: vscode.Uri.file('textbricks-templates.json'),
            filters: {
                'JSON Files': ['json'],
                'All Files': ['*']
            },
            saveLabel: '匯出模板'
        });

        if (!saveUri) {return;}

        try {
            const exportData = await managementService.exportTemplates();
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
    });

    // Register all commands
    context.subscriptions.push(
        refreshCommand,
        openManagerCommand,
        createTemplateCommand,
        importTemplatesCommand,
        exportTemplatesCommand
    );
}

export function deactivate() {}