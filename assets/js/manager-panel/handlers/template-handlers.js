// Template Handlers - 模板操作處理器
// 負責處理模板的 CRUD 操作

(function() {
    'use strict';

    /**
     * Template Handlers 類
     * 處理模板相關的用戶操作
     */
    class TemplateHandlers {
        constructor(context) {
            this.context = context;
        }

        /**
         * 編輯模板
         */
        editTemplate(templatePath) {
            console.log('Editing template:', templatePath);
            const currentData = this.context.getCurrentData();
            console.log('Available templates:', currentData.templates);

            const template = currentData.templates?.find(t =>
                this.context.buildTemplatePath(t) === templatePath
            );

            if (template) {
                console.log('Found template:', template);
                this.context.openModal('template', template);
            } else {
                console.error('Template not found:', templatePath);
            }
        }

        /**
         * 刪除模板
         */
        deleteTemplate(templatePath) {
            const currentData = this.context.getCurrentData();
            const template = currentData.templates?.find(t =>
                this.context.buildTemplatePath(t) === templatePath
            );

            if (template) {
                // 直接發送刪除請求，讓後端處理確認
                const vscode = this.context.getVSCode();
                vscode.postMessage({
                    type: 'deleteTemplate',
                    templatePath: templatePath,
                    templateTitle: template.title
                });
            }
        }

        /**
         * 複製模板
         */
        duplicateTemplate(templatePath) {
            const currentData = this.context.getCurrentData();
            const template = currentData.templates?.find(t =>
                this.context.buildTemplatePath(t) === templatePath
            );

            if (template) {
                const newTitle = prompt('請輸入複製後的模板標題：', `${template.title} 副本`);
                if (newTitle && newTitle.trim()) {
                    const vscode = this.context.getVSCode();
                    vscode.postMessage({
                        type: 'duplicateTemplate',
                        templatePath: templatePath,
                        newTitle: newTitle.trim()
                    });
                }
            }
        }

        /**
         * 複製模板（右鍵選單用）
         */
        copyTemplate(templatePath) {
            const currentData = this.context.getCurrentData();
            const template = currentData.templates?.find(t =>
                this.context.buildTemplatePath(t) === templatePath
            );

            if (template) {
                // 創建副本數據，移除 name 屬性讓系統自動生成
                const templateCopy = {
                    title: `${template.title} 副本`,
                    description: template.description || '',
                    code: template.code || '',
                    language: template.language,
                    topicPath: template.topicPath || template.topic,
                    documentation: template.documentation || ''
                };

                // 打開模態框，傳入副本數據作為預填值
                this.context.openModal('template', templateCopy);
            }
        }

        /**
         * 預覽模板
         */
        previewTemplate(templatePath) {
            const currentData = this.context.getCurrentData();
            const template = currentData.templates?.find(t =>
                this.context.buildTemplatePath(t) === templatePath
            );

            if (template) {
                // Show preview in modal or detail panel
                this.context.showTemplateDetails(templatePath);
            }
        }

        /**
         * 查看模板
         */
        viewTemplate(templatePath) {
            // Redirect to showTemplateDetails using templatePath
            this.context.showTemplateDetails(templatePath);
        }

        /**
         * 使用模板 (插入到編輯器)
         */
        useTemplate(templatePath) {
            const vscode = this.context.getVSCode();
            vscode.postMessage({
                type: 'useTemplate',
                templatePath: templatePath
            });
        }

        /**
         * 在主題中創建模板
         */
        createTemplateInTopic(topicPath) {
            const topic = this.context.findTopicByPath(topicPath);
            if (topic) {
                this.context.openModal('template', { topic: topicPath });
            }
        }

        /**
         * 查看模板文檔
         */
        viewTemplateDocumentation(templatePath) {
            const currentData = this.context.getCurrentData();
            const template = currentData.templates?.find(t =>
                this.context.buildTemplatePath(t) === templatePath
            );

            if (template && template.documentation) {
                this.context.showDocumentationModal(template, 'template');
            }
        }

        /**
         * 移動模板到另一個主題
         */
        moveTemplateToTopic(templatePath, newTopicPath) {
            const currentData = this.context.getCurrentData();
            const template = currentData.templates?.find(t =>
                this.context.buildTemplatePath(t) === templatePath
            );

            if (template) {
                const vscode = this.context.getVSCode();
                vscode.postMessage({
                    type: 'updateTemplate',
                    templatePath: templatePath,
                    data: { ...template, topic: newTopicPath }
                });
            }
        }

        /**
         * 更新模板使用統計
         */
        trackTemplateUsage(templatePath) {
            const vscode = this.context.getVSCode();
            vscode.postMessage({
                type: 'trackTemplateUsage',
                templatePath: templatePath
            });
        }
    }

    // 導出到全局（用於模組化）
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = TemplateHandlers;
    } else {
        window.TemplateHandlers = TemplateHandlers;
    }
})();
