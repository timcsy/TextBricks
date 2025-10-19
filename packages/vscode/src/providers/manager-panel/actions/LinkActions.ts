import * as vscode from 'vscode';
import { DataPathService } from '@textbricks/core';
import { VSCodePlatform } from '../../../adapters/vscode/VSCodePlatform';

export class LinkActions {
    constructor(
        private readonly platform: VSCodePlatform,
        private readonly dataPathService: DataPathService,
        private readonly sendDataCallback: () => Promise<void>,
        private readonly webviewProvider?: { refresh(preserveNavigationState?: boolean): Promise<void> },
        private panel?: vscode.WebviewPanel
    ) {}

    async createLink(linkData: unknown): Promise<void> {
        try {
            this.platform.logInfo(`Creating link: ${(linkData as any).title}`, 'LinkActions');

            // Create link JSON file in the appropriate topic's links directory
            const linkPath = await this.getLinkPath(linkData);

            await vscode.workspace.fs.writeFile(
                vscode.Uri.file(linkPath),
                Buffer.from(JSON.stringify(linkData, null, 2))
            );

            this.platform.logInfo(`Link created successfully at: ${linkPath}`, 'LinkActions');
            vscode.window.showInformationMessage(`連結 "${(linkData as any).title}" 已創建成功`);
            await this.sendDataCallback();
        } catch (error) {
            this.platform.logError(error as Error, 'LinkActions.createLink');
            vscode.window.showErrorMessage(`創建連結失敗: ${error}`);
        }
    }

    async updateLink(linkId: string, linkData: unknown): Promise<void> {
        try {
            this.platform.logInfo(`Updating link: ${linkId}`, 'LinkActions');

            // Find and update the link JSON file
            const linkPath = await this.getLinkPath(linkData);

            await vscode.workspace.fs.writeFile(
                vscode.Uri.file(linkPath),
                Buffer.from(JSON.stringify(linkData, null, 2))
            );

            this.platform.logInfo(`Link updated successfully at: ${linkPath}`, 'LinkActions');
            vscode.window.showInformationMessage(`連結已更新成功`);
            await this.sendDataCallback();
        } catch (error) {
            this.platform.logError(error as Error, 'LinkActions.updateLink');
            vscode.window.showErrorMessage(`更新連結失敗: ${error}`);
        }
    }

    async deleteLink(linkId: string, linkTitle?: string): Promise<void> {
        try {
            this.platform.logInfo(`Deleting link with ID: ${linkId}`, 'LinkActions');

            // 確認刪除
            const displayName = linkTitle || linkId;
            const confirmed = await vscode.window.showWarningMessage(
                `確定要刪除連結「${displayName}」嗎？`,
                { modal: true },
                '刪除',
                '取消'
            );

            if (confirmed !== '刪除') {
                return;
            }

            // Find the link file by searching through all topics
            const locationInfo = await this.dataPathService.getCurrentLocationInfo();
            const scopePath = vscode.Uri.joinPath(
                vscode.Uri.file(locationInfo.path),
                'scopes',
                'local'
            );

            // Search for the link file recursively
            let linkFilePath: vscode.Uri | null = null;
            const platform = this.platform;

            async function searchForLinkFile(dir: vscode.Uri): Promise<vscode.Uri | null> {
                try {
                    const entries = await vscode.workspace.fs.readDirectory(dir);

                    for (const [name, type] of entries) {
                        const fullPath = vscode.Uri.joinPath(dir, name);

                        if (type === vscode.FileType.Directory) {
                            // Check if this is a links directory
                            if (name === 'links') {
                                // Look for the link file in this directory
                                const possibleLinkPath = vscode.Uri.joinPath(fullPath, `${linkId}.json`);
                                try {
                                    await vscode.workspace.fs.stat(possibleLinkPath);
                                    return possibleLinkPath;
                                } catch {
                                    // File not found, continue searching
                                }
                            } else {
                                // Recursively search subdirectories
                                const found = await searchForLinkFile(fullPath);
                                if (found) { return found; }
                            }
                        }
                    }
                } catch (error) {
                    platform.logWarning(`Error searching directory: ${dir.fsPath}`, 'LinkActions');
                }
                return null;
            }

            linkFilePath = await searchForLinkFile(scopePath);

            if (!linkFilePath) {
                vscode.window.showErrorMessage(`找不到連結檔案：${linkId}`);
                return;
            }

            // Delete the link file
            await vscode.workspace.fs.delete(linkFilePath);

            this.platform.logInfo(`Link deleted successfully at: ${linkFilePath.fsPath}`, 'LinkActions');
            vscode.window.showInformationMessage(`連結「${displayName}」已刪除成功`);

            // 通知前端清空詳情面板
            this.sendClearDetailsPanelMessage();

            // 重新加載數據並發送到前端
            await this.sendDataCallback();
        } catch (error) {
            this.platform.logError(error as Error, 'LinkActions.deleteLink');
            vscode.window.showErrorMessage(`刪除連結失敗: ${error}`);
        }
    }

    private async getLinkPath(linkData: unknown): Promise<string> {
        // Get the current data location
        const locationInfo = await this.dataPathService.getCurrentLocationInfo();

        // Get topic from linkData (passed from frontend)
        // Support both 'topic' and 'currentTopic' fields for compatibility
        const topicPath = (linkData as any).topic || (linkData as any).currentTopic || 'general';

        this.platform.logInfo(`Creating link in topic: ${topicPath}`, 'LinkActions');

        // Build the links directory path under the topic
        const linksDirPath = vscode.Uri.joinPath(
            vscode.Uri.file(locationInfo.path),
            'scopes',
            'local', // Default scope
            ...topicPath.split('/'), // Topic hierarchy
            'links'
        );

        // Ensure the links directory exists
        try {
            await vscode.workspace.fs.createDirectory(linksDirPath);
            this.platform.logInfo(`Created links directory at: ${linksDirPath.fsPath}`, 'LinkActions');
        } catch (error) {
            // Directory might already exist, that's OK
            this.platform.logInfo(`Links directory already exists at: ${linksDirPath.fsPath}`, 'LinkActions');
        }

        // Create the link file path (using name instead of id)
        const linkFilePath = vscode.Uri.joinPath(linksDirPath, `${(linkData as any).name}.json`);
        this.platform.logInfo(`Link file path: ${linkFilePath.fsPath}`, 'LinkActions');

        return linkFilePath.fsPath;
    }

    /**
     * 發送清空詳情面板的消息到前端
     */
    private sendClearDetailsPanelMessage(): void {
        if (this.panel) {
            this.platform.logInfo('Sending clearDetailsPanel message to webview', 'LinkActions');
            this.panel.webview.postMessage({
                type: 'clearDetailsPanel'
            });
        }
    }
}
