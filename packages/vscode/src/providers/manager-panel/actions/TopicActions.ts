import * as vscode from 'vscode';
import { TopicManager } from '@textbricks/core';
import { VSCodePlatform } from '../../../adapters/vscode/VSCodePlatform';

export class TopicActions {
    constructor(
        private readonly platform: VSCodePlatform,
        private readonly topicManager: TopicManager,
        private readonly sendDataCallback: () => Promise<void>,
        private readonly webviewProvider?: { refresh(preserveNavigationState?: boolean): Promise<void> },
        private panel?: vscode.WebviewPanel
    ) {}

    async createTopic(topicData: unknown): Promise<void> {
        try {
            // 轉換前端數據格式為後端期望的格式
            const data = topicData as any;
            const transformedData = {
                type: 'topic' as const,
                name: data.name,
                title: data.title,
                description: data.description,
                documentation: data.documentation,
                parentPath: data.parent || undefined,
                display: {
                    icon: data.icon || '📁',
                    color: data.color || '#007ACC',
                    order: data.order || 0,
                    collapsed: data.collapsed || false,
                    showInNavigation: data.showInNavigation !== false
                }
            };

            const newTopic = await this.topicManager.createTopic(transformedData);
            vscode.window.showInformationMessage(`主題 "${newTopic.title}" 已創建成功`);
            await this.sendDataCallback();

            // 通知 WebviewProvider 刷新顯示
            if (this.webviewProvider) {
                this.platform.logInfo('Notifying WebviewProvider to refresh after topic creation', 'TopicActions');
                await this.webviewProvider.refresh();
            }
        } catch (error) {
            vscode.window.showErrorMessage(`創建主題失敗: ${error}`);
        }
    }

    async updateTopic(topicId: string, updates: unknown): Promise<void> {
        try {
            const updated = await this.topicManager.updateTopic(topicId, updates);
            vscode.window.showInformationMessage(`主題 "${updated.title}" 已更新成功`);
            await this.sendDataCallback();

            // 通知 WebviewProvider 刷新顯示，保持導航狀態
            if (this.webviewProvider) {
                this.platform.logInfo('Notifying WebviewProvider to refresh after topic update', 'TopicActions');
                await this.webviewProvider.refresh(true);
            }
        } catch (error) {
            vscode.window.showErrorMessage(`更新主題失敗: ${error}`);
        }
    }

    async deleteTopic(topicId: string, deleteChildren: boolean = false): Promise<void> {
        try {
            const topic = this.topicManager.getTopic(topicId);
            if (!topic) {
                vscode.window.showErrorMessage('找不到指定的主題');
                return;
            }

            const confirmed = await vscode.window.showWarningMessage(
                `確定要刪除主題「${topic.title}」嗎？`,
                { modal: true },
                '刪除',
                '取消'
            );

            if (confirmed !== '刪除') {
                return;
            }

            await this.topicManager.deleteTopic(topicId, deleteChildren);
            vscode.window.showInformationMessage(`主題「${topic.title}」已刪除成功`);

            // 通知前端清空詳情面板
            if (this.panel) {
                this.panel.webview.postMessage({
                    type: 'clearDetailsPanel'
                });
            }

            // 重新加載數據並發送到前端
            await this.sendDataCallback();

            // 通知 WebviewProvider 刷新顯示
            if (this.webviewProvider) {
                this.platform.logInfo('Notifying WebviewProvider to refresh after topic deletion', 'TopicActions');
                await this.webviewProvider.refresh();
            }
        } catch (error) {
            this.platform.logError(error as Error, 'TopicActions.deleteTopic');
            vscode.window.showErrorMessage(`刪除主題失敗: ${error}`);
        }
    }

    async moveTopic(operation: unknown): Promise<void> {
        try {
            await this.topicManager.moveTopic(operation as any);
            vscode.window.showInformationMessage('主題已移動');
            await this.sendDataCallback();
        } catch (error) {
            vscode.window.showErrorMessage(`移動主題失敗: ${error}`);
        }
    }

    async reorderTopics(operations: unknown[]): Promise<void> {
        try {
            await this.topicManager.reorderTopics(operations as any);
            vscode.window.showInformationMessage('主題順序已更新');
            await this.sendDataCallback();
        } catch (error) {
            vscode.window.showErrorMessage(`重新排序主題失敗: ${error}`);
        }
    }
}
