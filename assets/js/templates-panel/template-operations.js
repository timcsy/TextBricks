// Template Operations - 模板操作
// 負責處理模板的複製、插入和文檔顯示

(function() {
    'use strict';

    /**
     * Template Operations 類
     * 處理模板相關的操作
     */
    class TemplateOperations {
        constructor(context) {
            this.context = context;
        }

        /**
         * 複製模板
         */
        copyTemplate(templatePath) {
            const vscode = this.context.getVSCode();
            vscode.postMessage({
                type: 'copyTemplate',
                templatePath: templatePath
            });

            console.log('Copy template:', templatePath);
        }

        /**
         * 插入模板
         */
        insertTemplate(templatePath) {
            const vscode = this.context.getVSCode();
            vscode.postMessage({
                type: 'insertTemplate',
                templatePath: templatePath
            });

            console.log('Insert template:', templatePath);
        }

        /**
         * 插入程式碼片段
         */
        insertCodeSnippet(code, templatePath) {
            const vscode = this.context.getVSCode();
            vscode.postMessage({
                type: 'insertCodeSnippet',
                code: code,
                templatePath: templatePath
            });

            console.log('Insert code snippet with template context:', code.substring(0, 50) + '...', 'from template:', templatePath);
        }

        /**
         * 複製程式碼片段
         */
        copyCodeSnippet(code, templatePath) {
            const vscode = this.context.getVSCode();
            vscode.postMessage({
                type: 'copyCodeSnippet',
                code: code,
                templatePath: templatePath
            });

            console.log('Copy code snippet with template context:', code.substring(0, 50) + '...', 'from template:', templatePath);
        }

        /**
         * 顯示模板文檔
         */
        showDocumentation(templatePath) {
            const vscode = this.context.getVSCode();
            vscode.postMessage({
                type: 'showDocumentation',
                templatePath: templatePath
            });

            console.log('Show documentation for template:', templatePath);
        }

        /**
         * 顯示主題文檔
         */
        showTopicDocumentation(topicName) {
            const vscode = this.context.getVSCode();
            vscode.postMessage({
                type: 'showTopicDocumentation',
                topicName: topicName
            });

            console.log('Show documentation for topic:', topicName);
        }
    }

    // 導出到全局（用於模組化）
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = TemplateOperations;
    } else {
        window.TemplateOperations = TemplateOperations;
    }
})();
