import * as vscode from 'vscode';
import { TextBricksEngine } from '@textbricks/core';
import { Language } from '@textbricks/shared';
import { VSCodePlatform } from '../../../adapters/vscode/VSCodePlatform';

export class LanguageActions {
    constructor(
        private readonly platform: VSCodePlatform,
        private readonly templateEngine: TextBricksEngine,
        private readonly sendDataCallback: () => Promise<void>
    ) {}

    async createLanguage(languageData: Language): Promise<void> {
        const newLanguage = await this.templateEngine.createLanguage(languageData);
        vscode.window.showInformationMessage(`語言 "${newLanguage.title}" 已創建成功`);
        await this.sendDataCallback();
    }

    async updateLanguage(languageName: string, updates: Partial<Language>): Promise<void> {
        const updated = await this.templateEngine.updateLanguage(languageName, updates);
        if (updated) {
            vscode.window.showInformationMessage(`語言 "${updated.title}" 已更新成功`);
            await this.sendDataCallback();
        } else {
            vscode.window.showErrorMessage('找不到指定的語言');
        }
    }
}
