import * as vscode from 'vscode';
import { TextBricksEngine } from '@textbricks/core';
import { WebviewProvider } from '../providers/WebviewProvider';
import { TextBricksManagerProvider } from '../providers/TextBricksManagerProvider';

/**
 * 模板相關命令處理器
 */
export class TemplateCommands {
    constructor(
        private templateEngine: TextBricksEngine,
        private webviewProvider: WebviewProvider,
        private textBricksManagerProvider: TextBricksManagerProvider
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

        // 獲取可用的語言和主題
        const languages = this.templateEngine.getLanguages();
        const topics = this.templateEngine.getTopics();

        if (languages.length === 0) {
            vscode.window.showErrorMessage('沒有可用的程式語言，請先在 TextBricks Manager 中添加語言');
            return;
        }

        // Topics are optional, can be empty

        const languageItems = languages.map(lang => ({
            label: lang.displayName,
            detail: lang.id,
            language: lang
        }));

        const selectedLanguage = await vscode.window.showQuickPick(languageItems, {
            placeHolder: '選擇程式語言'
        });

        if (!selectedLanguage) return;

        // 讓使用者輸入 topic
        const topicInput = await vscode.window.showInputBox({
            placeHolder: '輸入模板主題（可選）',
            prompt: '例如：基礎、控制、結構、進階等',
            value: topics.length > 0 ? topics[0] : ''
        });

        const topic = topicInput || '未知主題';

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
            await this.saveAsTemplate(editor, title, description, selectedLanguage.language.id, topic);
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
        topic: string
    ): Promise<void> {
        const code = editor.document.getText();

        try {
            await this.templateEngine.createTemplate({
                title,
                description,
                code,
                language: languageId,
                topic
            });
            
            vscode.window.showInformationMessage(`模板「${title}」已創建成功！`);
            this.webviewProvider.refresh();
        } catch (error) {
            vscode.window.showErrorMessage(`創建模板失敗：${error}`);
        }
    }
}