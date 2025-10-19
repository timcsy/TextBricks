import * as vscode from 'vscode';
import {
    PathTransformService,
    DisplayNameService
} from '@textbricks/core';
import { VSCodePlatform } from '../../../adapters/vscode/VSCodePlatform';
import { DocumentationPanelProvider } from '../../documentation-panel/DocumentationPanelProvider';
import { ScopeActions } from './ScopeActions';
import { TopicActions } from './TopicActions';
import { TemplateActions } from './TemplateActions';
import { LinkActions } from './LinkActions';
import { LanguageActions } from './LanguageActions';
import { SettingsActions } from './SettingsActions';
import { ImportExportActions } from './ImportExportActions';

// Message type definition with index signature for flexibility
interface WebviewMessage {
    type: string;
    [key: string]: unknown;
}

export class ManagerMessageHandler {
    constructor(
        private readonly platform: VSCodePlatform,
        private readonly scopeActions: ScopeActions,
        private readonly topicActions: TopicActions,
        private readonly templateActions: TemplateActions,
        private readonly linkActions: LinkActions,
        private readonly languageActions: LanguageActions,
        private readonly settingsActions: SettingsActions,
        private readonly importExportActions: ImportExportActions,
        private readonly pathTransformService: PathTransformService,
        private readonly displayNameService: DisplayNameService,
        private readonly panel: vscode.WebviewPanel | undefined,
        private readonly documentationProvider?: DocumentationPanelProvider,
        private readonly sendDataCallback?: () => Promise<void>
    ) {}

    async handleMessage(message: WebviewMessage & Record<string, any>): Promise<void> {
        try {
            this.platform.logInfo(`Received message from WebView: ${message.type}`, 'ManagerMessageHandler');

            switch (message.type) {
                // 數據載入
                case 'loadData':
                    if (this.sendDataCallback) {
                        await this.sendDataCallback();
                    }
                    break;

                // Scope 管理
                case 'switchScope':
                    await this.scopeActions.switchScope(message.scopeId as string);
                    break;

                case 'createScope':
                    await this.scopeActions.createScope(message.data);
                    break;

                case 'updateScope':
                    await this.scopeActions.updateScope(message.scopeId as string, message.data);
                    break;

                case 'deleteScope':
                    await this.scopeActions.deleteScope(message.scopeId);
                    break;

                case 'exportScope':
                    await this.scopeActions.exportScope(message.options);
                    break;

                case 'importScope':
                    await this.scopeActions.importScope();
                    break;

                // 收藏管理
                case 'addToFavorites':
                    await this.scopeActions.addToFavorites(message.itemId);
                    break;

                case 'removeFromFavorites':
                    await this.scopeActions.removeFromFavorites(message.itemId);
                    break;

                case 'clearUsageStats':
                    await this.scopeActions.clearUsageStats();
                    break;

                // 主題管理
                case 'createTopic':
                    await this.topicActions.createTopic(message.data);
                    break;

                case 'updateTopic':
                    await this.topicActions.updateTopic(message.topicPath || message.topicId, message.data);
                    break;

                case 'deleteTopic':
                    await this.topicActions.deleteTopic(message.topicPath || message.topicId, message.deleteChildren);
                    break;

                case 'moveTopic':
                    await this.topicActions.moveTopic(message.operation);
                    break;

                case 'reorderTopics':
                    await this.topicActions.reorderTopics(message.operations);
                    break;

                // 模板管理
                case 'createTemplate':
                    await this.templateActions.createTemplate(message.data);
                    break;

                case 'updateTemplate':
                    await this.templateActions.updateTemplate(message.templatePath || message.templateId, message.data);
                    break;

                case 'deleteTemplate':
                    await this.templateActions.deleteTemplate(message.templatePath || message.templateId);
                    break;

                case 'batchCreateTemplates':
                    await this.templateActions.batchCreateTemplates(message.templates);
                    break;

                // 連結管理 (臨時實現)
                case 'createLink':
                    await this.linkActions.createLink(message.data);
                    break;

                case 'updateLink':
                    await this.linkActions.updateLink(message.linkName || message.linkId, message.data);
                    break;

                case 'deleteLink':
                    await this.linkActions.deleteLink(message.linkName || message.linkId, message.linkTitle);
                    break;

                // 語言管理
                case 'createLanguage':
                    await this.languageActions.createLanguage(message.data);
                    break;

                case 'updateLanguage':
                    await this.languageActions.updateLanguage(message.languageName || message.languageId, message.data);
                    break;

                // 匯入匯出
                case 'exportTemplates':
                    await this.importExportActions.exportTemplates(message.filters);
                    break;

                case 'importTemplates':
                    await this.importExportActions.importTemplates();
                    break;

                // 資料位置管理
                case 'getDataLocationInfo':
                    await this.settingsActions.getDataLocationInfo();
                    break;

                case 'getAvailableLocations':
                    await this.settingsActions.getAvailableLocations();
                    break;

                case 'changeDataLocation':
                    await this.settingsActions.changeDataLocation(message.locationPath, message.options);
                    break;

                case 'resetToSystemDefault':
                    await this.settingsActions.resetToSystemDefault();
                    break;

                case 'openDataLocation':
                    await this.settingsActions.openDataLocation();
                    break;

                case 'validateDataPath':
                    await this.settingsActions.validateDataPath(message.path);
                    break;

                case 'syncToDevData':
                    await this.settingsActions.syncToDevData(message.options);
                    break;

                // Services API - 路徑轉換
                case 'pathToDisplayPath':
                    this.pathToDisplayPath(message.path, message.requestId);
                    break;

                case 'displayPathToPath':
                    this.displayPathToPath(message.displayPath, message.requestId);
                    break;

                case 'buildTemplatePath':
                    this.buildTemplatePath(message.template, message.requestId);
                    break;

                case 'getItemIdentifier':
                    this.getItemIdentifier(message.item, message.itemType, message.requestId);
                    break;

                // Services API - 顯示名稱
                case 'getLanguageDisplayName':
                    this.getLanguageDisplayName(message.languageName, message.requestId);
                    break;

                case 'getTopicDisplayName':
                    this.getTopicDisplayName(message.topicPath, message.requestId);
                    break;

                case 'getFullDisplayPath':
                    this.getFullDisplayPath(message.path, message.requestId);
                    break;

                // 文檔渲染
                case 'renderTemplateDocumentation':
                    this.renderTemplateDocumentation(message);
                    break;

                case 'renderTopicDocumentation':
                    this.renderTopicDocumentation(message);
                    break;

                // UI 事件
                case 'showError':
                    vscode.window.showErrorMessage(message.message);
                    break;

                case 'showInfo':
                    vscode.window.showInformationMessage(message.message);
                    break;
            }
        } catch (error) {
            vscode.window.showErrorMessage(`操作失敗: ${error}`);
        }
    }

    // ==================== Services API Methods ====================

    /**
     * 路徑轉顯示路徑
     */
    private pathToDisplayPath(path: string, requestId?: string) {
        try {
            const displayPath = this.pathTransformService.pathToDisplayPath(path);
            this.panel?.webview.postMessage({
                type: 'serviceResponse',
                requestId,
                method: 'pathToDisplayPath',
                result: displayPath
            });
        } catch (error) {
            this.panel?.webview.postMessage({
                type: 'serviceError',
                requestId,
                method: 'pathToDisplayPath',
                error: String(error)
            });
        }
    }

    /**
     * 顯示路徑轉內部路徑
     */
    private displayPathToPath(displayPath: string, requestId?: string) {
        try {
            const path = this.pathTransformService.displayPathToPath(displayPath);
            this.panel?.webview.postMessage({
                type: 'serviceResponse',
                requestId,
                method: 'displayPathToPath',
                result: path
            });
        } catch (error) {
            this.panel?.webview.postMessage({
                type: 'serviceError',
                requestId,
                method: 'displayPathToPath',
                error: String(error)
            });
        }
    }

    /**
     * 構建模板路徑
     */
    private buildTemplatePath(template: unknown, requestId?: string) {
        try {
            const path = this.pathTransformService.buildTemplatePath(template);
            this.panel?.webview.postMessage({
                type: 'serviceResponse',
                requestId,
                method: 'buildTemplatePath',
                result: path
            });
        } catch (error) {
            this.panel?.webview.postMessage({
                type: 'serviceError',
                requestId,
                method: 'buildTemplatePath',
                error: String(error)
            });
        }
    }

    /**
     * 獲取項目識別符
     */
    private getItemIdentifier(item: unknown, itemType: string, requestId?: string) {
        try {
            const identifier = this.pathTransformService.getItemIdentifier(item as any, itemType as any);
            this.panel?.webview.postMessage({
                type: 'serviceResponse',
                requestId,
                method: 'getItemIdentifier',
                result: identifier
            });
        } catch (error) {
            this.panel?.webview.postMessage({
                type: 'serviceError',
                requestId,
                method: 'getItemIdentifier',
                error: String(error)
            });
        }
    }

    /**
     * 獲取語言顯示名稱
     */
    private getLanguageDisplayName(languageName: string, requestId?: string) {
        try {
            const displayName = this.displayNameService.getLanguageDisplayName(languageName);
            this.panel?.webview.postMessage({
                type: 'serviceResponse',
                requestId,
                method: 'getLanguageDisplayName',
                result: displayName
            });
        } catch (error) {
            this.panel?.webview.postMessage({
                type: 'serviceError',
                requestId,
                method: 'getLanguageDisplayName',
                error: String(error)
            });
        }
    }

    /**
     * 獲取主題顯示名稱
     */
    private getTopicDisplayName(topicPath: string, requestId?: string) {
        try {
            const displayName = this.displayNameService.getTopicDisplayName(topicPath);
            this.panel?.webview.postMessage({
                type: 'serviceResponse',
                requestId,
                method: 'getTopicDisplayName',
                result: displayName
            });
        } catch (error) {
            this.panel?.webview.postMessage({
                type: 'serviceError',
                requestId,
                method: 'getTopicDisplayName',
                error: String(error)
            });
        }
    }

    /**
     * 獲取完整顯示路徑
     */
    private getFullDisplayPath(path: string, requestId?: string) {
        try {
            const displayPath = this.displayNameService.getFullDisplayPath(path);
            this.panel?.webview.postMessage({
                type: 'serviceResponse',
                requestId,
                method: 'getFullDisplayPath',
                result: displayPath
            });
        } catch (error) {
            this.panel?.webview.postMessage({
                type: 'serviceError',
                requestId,
                method: 'getFullDisplayPath',
                error: String(error)
            });
        }
    }

    /**
     * 渲染模板文檔
     */
    private renderTemplateDocumentation(message: WebviewMessage & Record<string, any>) {
        if (this.documentationProvider && message.template && message.template.documentation) {
            // Extract markdown content from documentation
            let markdownContent = '';
            const doc = message.template.documentation;

            if (typeof doc === 'string') {
                markdownContent = doc;
            } else if (typeof doc === 'object') {
                if (doc.type === 'markdown' && doc.content) {
                    markdownContent = doc.content;
                } else if (doc.type === 'file' && doc.path) {
                    markdownContent = `檔案路徑：${doc.path}`;
                } else if (doc.type === 'url' && doc.url) {
                    markdownContent = `外部連結：[${doc.url}](${doc.url})`;
                }
            }

            const renderedHtml = this.documentationProvider.markdownToHtml(
                markdownContent,
                message.template.name
            );
            this.panel?.webview.postMessage({
                type: 'documentationRendered',
                requestId: message.requestId,
                html: renderedHtml,
                title: `${message.template.title} - 說明文件`
            });
        }
    }

    /**
     * 渲染主題文檔
     */
    private renderTopicDocumentation(message: WebviewMessage & Record<string, any>) {
        if (this.documentationProvider && message.topic && message.topic.documentation) {
            // Extract markdown content from documentation
            let markdownContent = '';
            const doc = message.topic.documentation;

            if (typeof doc === 'string') {
                markdownContent = doc;
            } else if (typeof doc === 'object') {
                if (doc.type === 'markdown' && doc.content) {
                    markdownContent = doc.content;
                } else if (doc.type === 'file' && doc.path) {
                    markdownContent = `檔案路徑：${doc.path}`;
                } else if (doc.type === 'url' && doc.url) {
                    markdownContent = `外部連結：[${doc.url}](${doc.url})`;
                }
            }

            const renderedHtml = this.documentationProvider.markdownToHtml(
                markdownContent,
                message.topic.name
            );
            this.panel?.webview.postMessage({
                type: 'documentationRendered',
                requestId: message.requestId,
                html: renderedHtml,
                title: `${message.topic.title || message.topic.name} - 主題說明文件`
            });
        }
    }
}
