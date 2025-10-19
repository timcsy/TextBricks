import { CodeOperationService, DocumentationService, TextBricksEngine } from '@textbricks/core';
import { InsertActions } from './actions/InsertActions';
import { FavoriteActions } from './actions/FavoriteActions';
import { NavigationActions } from './actions/NavigationActions';
import { DocumentationPanelProvider } from '../documentation-panel/DocumentationPanelProvider';
import * as vscode from 'vscode';

interface WebviewMessage {
    type: string;
    templatePath?: string;
    topicPath?: string;
    topicName?: string;
    code?: string;
    text?: string;
    itemId?: string;
    [key: string]: any;
}

/**
 * TemplateMessageHandler - 模板面板消息處理器
 *
 * 集中處理來自 Templates Panel Webview 的所有消息
 */
export class TemplateMessageHandler {
    constructor(
        private readonly templateEngine: TextBricksEngine,
        private readonly codeOperationService: CodeOperationService,
        private readonly insertActions: InsertActions,
        private readonly favoriteActions: FavoriteActions,
        private readonly navigationActions: NavigationActions,
        private readonly documentationProvider: DocumentationPanelProvider | undefined
    ) {}

    /**
     * 處理來自 Webview 的消息
     */
    async handleMessage(message: WebviewMessage): Promise<void> {
        switch (message.type) {
            // 複製和插入操作
            case 'copyTemplate':
                this.codeOperationService.copyTemplate(message.templatePath!);
                break;

            case 'insertTemplate':
                this.codeOperationService.insertTemplate(message.templatePath!);
                break;

            case 'copyCodeSnippet':
                this.codeOperationService.copyCodeSnippet(message.code!, message.templatePath);
                break;

            case 'insertCodeSnippet':
                this.codeOperationService.insertCodeSnippet(message.code!, message.templatePath);
                break;

            // 拖曳操作
            case 'dragTemplate':
                await this.insertActions.handleDragTemplate(message.templatePath!, message.text!);
                break;

            // 文檔顯示
            case 'showDocumentation':
                if (this.documentationProvider) {
                    this.documentationProvider.showDocumentation(message.templatePath!);
                }
                break;

            case 'showTopicDocumentation':
                if (this.documentationProvider && message.topicName) {
                    const allTopicConfigs = this.templateEngine.getAllTopicConfigs();
                    const managedTopic = allTopicConfigs.find(t => t.name === message.topicName);
                    if (managedTopic && managedTopic.documentation) {
                        this.documentationProvider.showTopicDocumentation(managedTopic);
                    } else {
                        vscode.window.showErrorMessage('找不到主題文檔');
                    }
                }
                break;

            // 導航操作
            case 'navigateToTopic':
                this.navigationActions.handleTopicNavigation(message.topicPath!);
                break;

            case 'navigateBack':
                this.navigationActions.handleBackNavigation();
                break;

            case 'navigateForward':
                this.navigationActions.handleForwardNavigation();
                break;

            // 收藏操作
            case 'toggleFavorite':
                await this.favoriteActions.toggleFavorite(message.itemId!);
                // 需要刷新視圖
                break;

            case 'refreshFavoritesTab':
                // 刷新收藏標籤的邏輯
                break;

            // 使用次數更新
            case 'incrementUsage':
                if (message.templatePath) {
                    const scopeManager = this.templateEngine.getScopeManager();
                    await scopeManager.updateUsage(message.templatePath);
                }
                break;

            default:
                console.warn(`Unknown message type: ${message.type}`);
        }
    }
}
