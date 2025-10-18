// Languages Renderer - 語言管理頁面渲染
// 負責渲染語言管理頁面的所有內容

(function() {
    'use strict';

    /**
     * Languages Renderer 類
     * 處理語言管理頁面的渲染邏輯
     */
    class LanguagesRenderer {
        constructor(context) {
            this.context = context;
        }

        /**
         * 渲染語言管理頁面
         */
        render() {
            const container = document.getElementById('languages-list');
            if (!container) {
                console.warn('Languages list container not found');
                return;
            }

            const currentData = this.context.getCurrentData();
            const languages = currentData.languages || [];

            if (languages.length === 0) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 40px; color: var(--vscode-descriptionForeground);">
                        <p>沒有語言</p>
                        <button class="btn btn-primary" id="create-first-language-btn">
                            <span class="icon">＋</span> 添加第一個語言
                        </button>
                    </div>
                `;
                return;
            }

            const utils = this.context.getUtils();
            const templates = currentData.templates || [];

            container.innerHTML = languages.map(language => {
                const languageName = language.name;
                const templateCount = templates.filter(t => t.language === languageName).length;
                const extensions = Array.isArray(language.fileExtensions)
                    ? language.fileExtensions.join(', ')
                    : (language.extension || '');

                return `
                    <div class="data-item">
                        <div class="data-item-header">
                            <h3 class="data-item-title">${utils.escapeHtml(language.title || language.name)}</h3>
                            <div class="data-item-actions">
                                <button class="btn btn-secondary" data-action="edit-language" data-language-name="${utils.escapeHtml(languageName)}">
                                    <span class="icon">✏️</span> 編輯
                                </button>
                            </div>
                        </div>

                        <div class="data-item-meta">
                            名稱: ${utils.escapeHtml(languageName)} • 副檔名: ${utils.escapeHtml(extensions)} • 包含 ${templateCount} 個模板
                        </div>
                    </div>
                `;
            }).join('');
        }
    }

    // 導出到全局（用於模組化）
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = LanguagesRenderer;
    } else {
        window.LanguagesRenderer = LanguagesRenderer;
    }
})();
