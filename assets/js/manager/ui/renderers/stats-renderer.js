// Stats Renderer - 統計頁面渲染
// 負責渲染統計頁面的所有內容

(function() {
    'use strict';

    /**
     * Stats Renderer 類
     * 處理統計頁面的渲染邏輯
     */
    class StatsRenderer {
        constructor(context) {
            this.context = context;
        }

        /**
         * 渲染統計頁面
         */
        render() {
            // 確保統計頁面是活躍的

            // 更新統計數據
            this.updateTemplateUsageStats();
            this.updateLanguageUsageStats();
            this.updateTopicUsageStats();
        }

        /**
         * 更新模板使用統計
         */
        updateTemplateUsageStats() {
            const container = document.getElementById('template-usage-list');
            if (!container) return;

            const currentData = this.context.getCurrentData();
            const scopeStats = currentData.scope?.usageStats;
            const usageTemplates = scopeStats?.mostUsedTemplates || [];

            if (usageTemplates.length === 0) {
                container.innerHTML = '<p class="no-data">尚無使用統計數據</p>';
                return;
            }

            const utils = this.context.getUtils();
            const pathHelpers = this.context.getPathHelpers();
            const allTemplates = currentData.templates || [];

            const total = usageTemplates.reduce((sum, item) => sum + (item.usage || 0), 0);
            const html = usageTemplates.slice(0, 10).map((item, index) => {
                const percentage = total > 0 ? Math.round((item.usage / total) * 100) : 0;

                // 使用 getDisplayPath 獲取主題路徑的顯示名稱
                const templatePath = item.path;
                const pathParts = (templatePath || '').split('/');

                // 找到 templates 的位置
                const templatesIndex = pathParts.indexOf('templates');
                let displayPath = templatePath;

                // 嘗試從實際模板獲取 title 和 language
                const actualTemplate = allTemplates.find(t =>
                    pathHelpers.buildTemplatePath(t) === templatePath
                );

                if (templatesIndex !== -1) {
                    // 獲取主題路徑部分（在 templates 之前）
                    const topicPath = pathParts.slice(0, templatesIndex).join('/');
                    const topicDisplayPath = topicPath ? pathHelpers.getDisplayPath(topicPath) : '';

                    const templateName = actualTemplate?.title || pathParts[templatesIndex + 1] || '';

                    // 組合完整顯示路徑（不包含 templates）
                    if (topicDisplayPath) {
                        displayPath = `${topicDisplayPath}/${templateName}`;
                    } else {
                        displayPath = templateName;
                    }
                } else {
                    // 如果沒有 templates，直接使用 getDisplayPath
                    displayPath = pathHelpers.getDisplayPath(templatePath);
                }

                // 從模板物件中獲取語言用於副標題
                const language = actualTemplate?.language || '';
                const languageDisplayName = pathHelpers.getLanguageDisplayName(language) || language || '未知語言';

                return `
                    <div class="usage-item">
                        <div class="usage-item-info">
                            <div class="usage-item-name">${utils.escapeHtml(displayPath)}</div>
                            <div class="usage-item-details">
                                ${utils.escapeHtml(languageDisplayName)}
                            </div>
                        </div>
                        <div class="usage-item-stats">
                            <div class="usage-count">${item.usage || 0}</div>
                            <div class="usage-percentage">${percentage}%</div>
                            <div class="usage-bar">
                                <div class="usage-bar-fill" style="width: ${percentage}%"></div>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

            container.innerHTML = html;
        }

        /**
         * 更新語言使用統計
         */
        updateLanguageUsageStats() {
            const container = document.getElementById('language-usage-list');
            if (!container) return;

            const currentData = this.context.getCurrentData();
            const scopeStats = currentData.scope?.usageStats;
            const languageUsage = scopeStats?.languageUsage || {};

            const entries = Object.entries(languageUsage).sort((a, b) => b[1] - a[1]);

            if (entries.length === 0) {
                container.innerHTML = '<p class="no-data">尚無語言使用統計</p>';
                return;
            }

            const utils = this.context.getUtils();
            const total = entries.reduce((sum, [, usage]) => sum + usage, 0);
            const html = entries.slice(0, 8).map(([langName, usage]) => {
                const language = currentData.languages?.find(l => l.name === langName);
                const langTitle = language ? language.title : langName;
                const percentage = total > 0 ? Math.round((usage / total) * 100) : 0;

                return `
                    <div class="usage-item">
                        <div class="usage-item-info">
                            <div class="usage-item-name">${utils.escapeHtml(langTitle)}</div>
                            <div class="usage-item-details">${langName}</div>
                        </div>
                        <div class="usage-item-stats">
                            <div class="usage-count">${usage}</div>
                            <div class="usage-percentage">${percentage}%</div>
                            <div class="usage-bar">
                                <div class="usage-bar-fill" style="width: ${percentage}%"></div>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

            container.innerHTML = html;
        }

        /**
         * 更新主題使用統計
         */
        updateTopicUsageStats() {
            const container = document.getElementById('topic-usage-list');
            if (!container) return;

            const currentData = this.context.getCurrentData();
            const scopeStats = currentData.scope?.usageStats;
            const topicUsage = scopeStats?.topicUsage || {};

            const entries = Object.entries(topicUsage).sort((a, b) => b[1] - a[1]);

            if (entries.length === 0) {
                container.innerHTML = '<p class="no-data">尚無主題使用統計</p>';
                return;
            }

            const utils = this.context.getUtils();
            const total = entries.reduce((sum, [, usage]) => sum + usage, 0);
            const html = entries.slice(0, 8).map(([topicPath, usage]) => {
                const percentage = total > 0 ? Math.round((usage / total) * 100) : 0;

                // Get display name for topic
                const topicDisplayName = this.context.getTopicDisplayName(topicPath) || topicPath || '未分類';

                return `
                    <div class="usage-item">
                        <div class="usage-item-info">
                            <div class="usage-item-name">${utils.escapeHtml(topicDisplayName)}</div>
                            <div class="usage-item-details">主題</div>
                        </div>
                        <div class="usage-item-stats">
                            <div class="usage-count">${usage}</div>
                            <div class="usage-percentage">${percentage}%</div>
                            <div class="usage-bar">
                                <div class="usage-bar-fill" style="width: ${percentage}%"></div>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

            container.innerHTML = html;
        }
    }

    // 導出到全局（用於模組化）
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = StatsRenderer;
    } else {
        window.StatsRenderer = StatsRenderer;
    }
})();
