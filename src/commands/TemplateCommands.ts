import * as vscode from 'vscode';
import { TemplateEngine } from '../core/TemplateEngine';
import { WebviewProvider } from '../providers/WebviewProvider';
import { TemplateManagerProvider } from '../providers/TemplateManagerProvider';

/**
 * 模板相關命令處理器
 */
export class TemplateCommands {
    constructor(
        private templateEngine: TemplateEngine,
        private webviewProvider: WebviewProvider,
        private templateManagerProvider: TemplateManagerProvider
    ) {}

    /**
     * 創建模板命令
     */
    async createTemplate(): Promise<void> {
        const title = await vscode.window.showInputBox({
            prompt: '輸入模板標題',
            placeHolder: '例如：Hello World'
        });

        if (!title) return;

        const description = await vscode.window.showInputBox({
            prompt: '輸入模板描述',
            placeHolder: '例如：顯示 Hello World 的基本程式'
        });

        if (!description) return;

        // 獲取可用的語言和分類
        const languages = this.templateEngine.getLanguages();
        const categories = this.templateEngine.getCategories();

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

        if (!selectedLanguage) return;

        const categoryItems = categories.map(cat => ({
            label: cat.name,
            detail: `Level ${cat.level} - ${cat.description}`,
            category: cat
        }));

        const selectedCategory = await vscode.window.showQuickPick(categoryItems, {
            placeHolder: '選擇分類'
        });

        if (!selectedCategory) return;

        // 開啟新文檔進行程式碼編輯
        const doc = await vscode.workspace.openTextDocument({
            language: selectedLanguage.language.id,
            content: `// ${title}\n// ${description}\n\n// 在這裡寫您的程式碼\n`
        });

        const editor = await vscode.window.showTextDocument(doc);

        // 詢問是否儲存為模板
        const action = await vscode.window.showInformationMessage(
            '請編寫程式碼，完成後點擊「儲存為模板」',
            '儲存為模板',
            '取消'
        );

        if (action === '儲存為模板') {
            await this.saveAsTemplate(editor, title, description, selectedLanguage.language.id, selectedCategory.category.id);
        }
    }

    /**
     * 儲存編輯器內容為模板
     */
    private async saveAsTemplate(
        editor: vscode.TextEditor,
        title: string,
        description: string,
        languageId: string,
        categoryId: string
    ): Promise<void> {
        const code = editor.document.getText();
        
        try {
            await this.templateEngine.createTemplate({
                title,
                description,
                code,
                language: languageId,
                categoryId
            });
            
            vscode.window.showInformationMessage(`模板「${title}」已創建成功！`);
            this.webviewProvider.refresh();
        } catch (error) {
            vscode.window.showErrorMessage(`創建模板失敗：${error}`);
        }
    }
}