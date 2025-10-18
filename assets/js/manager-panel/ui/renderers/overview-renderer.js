// Overview Renderer - 總覽頁面渲染
// 負責渲染總覽頁面的所有內容

(function() {
    'use strict';

    /**
     * Overview Renderer 類
     * 處理總覽頁面的渲染邏輯
     */
    class OverviewRenderer {
        constructor(context) {
            this.context = context;
        }

        /**
         * 渲染總覽頁面
         */
        render() {
            console.log('[OverviewRenderer] Rendering overview page');

            // 更新統計數據和最近活動
            this.updateStats();
            this.updateRecentActivity();

            console.log('[OverviewRenderer] Overview rendered');
        }

        /**
         * 更新總覽統計數據
         */
        updateStats() {
            const currentData = this.context.getCurrentData();
            const uiStateService = this.context.getUIStateService();

            const scopeStats = currentData.scope?.usageStats;
            const topicStats = currentData.topics?.statistics;
            const favoritesCount = currentData.scope?.favorites?.length || 0;

            // 使用 UIStateService 獲取統計
            const stats = uiStateService.getStatistics();

            // 更新統計數字到對應的元素
            this._updateStatValue('total-templates', stats.totalTemplates);
            this._updateStatValue('favorite-templates', favoritesCount);
            this._updateStatValue('total-topics', stats.totalTopics);
            this._updateStatValue('active-topics', topicStats?.activeTopics || stats.totalTopics);
            this._updateStatValue('total-languages', stats.totalLanguages);

            // 更新最常用語言
            const mostUsedLang = this._getMostUsedLanguage();
            this._updateStatValue('most-used-language', mostUsedLang || '-');
        }

        /**
         * 更新最近活動列表
         */
        updateRecentActivity() {
            const recentContainer = document.getElementById('recent-templates');
            if (!recentContainer) return;

            const currentData = this.context.getCurrentData();
            const usageStats = currentData.scope?.usageStats;
            const recentTemplates = usageStats?.recentTemplates || usageStats?.mostUsedTemplates || [];

            if (recentTemplates.length === 0) {
                recentContainer.innerHTML = '<p class="no-data">尚無最近使用的模板</p>';
                return;
            }

            const html = recentTemplates.slice(0, 5).map(template => {
                const templateData = currentData.templates?.find(t =>
                    this.context.buildTemplatePath(t) === template.id ||
                    t.title === template.title
                );
                if (!templateData) return '';

                const utils = this.context.getUtils();
                return `
                    <div class="recent-item">
                        <div class="recent-item-info">
                            <div class="recent-item-title">${utils.escapeHtml(templateData.title)}</div>
                            <div class="recent-item-meta">${utils.escapeHtml(templateData.language)} • ${utils.escapeHtml(this.context.getTopicDisplayName(templateData.topic))}</div>
                        </div>
                        <div class="recent-item-usage">${template.usage || 1} 次使用</div>
                    </div>
                `;
            }).filter(Boolean).join('');

            recentContainer.innerHTML = html || '<p class="no-data">尚無最近使用的模板</p>';
        }

        /**
         * 更新統計數值（私有方法）
         */
        _updateStatValue(elementId, value) {
            const element = document.getElementById(elementId);
            if (element) {
                element.textContent = value;
            }
        }

        /**
         * 獲取最常用的語言（私有方法）
         */
        _getMostUsedLanguage() {
            const currentData = this.context.getCurrentData();
            const usageStats = currentData.scope?.usageStats;
            if (!usageStats || !usageStats.languageUsage) return null;

            let maxUsage = 0;
            let mostUsedLang = null;

            for (const [lang, usage] of Object.entries(usageStats.languageUsage)) {
                if (usage > maxUsage) {
                    maxUsage = usage;
                    mostUsedLang = lang;
                }
            }

            // 找到語言的顯示名稱
            const language = currentData.languages?.find(l => l.name === mostUsedLang);
            return language ? language.title : mostUsedLang;
        }
    }

    // 導出到全局（用於模組化）
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = OverviewRenderer;
    } else {
        window.OverviewRenderer = OverviewRenderer;
    }
})();
