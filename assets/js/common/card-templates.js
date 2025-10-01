/**
 * TextBricks 卡片模板系統
 * 統一的卡片 HTML 生成邏輯
 */

console.log('[TextBricks] Loading card-templates.js');

const CardTemplates = {
    /**
     * 渲染模板卡片
     * @param {Object} data - 卡片數據
     * @returns {string} HTML 字符串
     */
    template(data) {
        const {
            id,
            title,
            description,
            languageTag,
            topicName,
            isFavorite = false,
            actions = ['preview', 'copy', 'insert']
        } = data;

        const utils = window.TextBricksUtils || {};
        const escapeHtml = utils.escapeHtml || (text => text);

        return `
            <div class="tb-card tb-card--template"
                 data-id="${escapeHtml(id)}"
                 data-type="template"
                 draggable="true">
                <div class="tb-card__header">
                    <span class="tb-card__tag tb-card__tag--language">
                        ${escapeHtml(languageTag)}
                    </span>
                    ${isFavorite ? '<span class="codicon codicon-star-full"></span>' : ''}
                </div>
                <div class="tb-card__body">
                    <h3 class="tb-card__title">${escapeHtml(title)}</h3>
                    <p class="tb-card__description">${escapeHtml(description)}</p>
                    ${topicName ? `<span class="tb-card__tag tb-card__tag--topic">${escapeHtml(topicName)}</span>` : ''}
                </div>
                <div class="tb-card__footer">
                    <div class="tb-card__actions">
                        ${this._renderActions(actions, id)}
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * 渲染主題卡片
     * @param {Object} data - 卡片數據
     * @returns {string} HTML 字符串
     */
    topic(data) {
        const {
            id,
            title,
            description,
            icon = '📁',
            count = 0,
            isFavorite = false
        } = data;

        const utils = window.TextBricksUtils || {};
        const escapeHtml = utils.escapeHtml || (text => text);

        return `
            <div class="tb-card tb-card--topic"
                 data-id="${escapeHtml(id)}"
                 data-type="topic">
                <div class="tb-card__header">
                    <span class="tb-card__icon">${icon}</span>
                    ${isFavorite ? '<span class="codicon codicon-star-full"></span>' : ''}
                </div>
                <div class="tb-card__body">
                    <h3 class="tb-card__title">${escapeHtml(title)}</h3>
                    <p class="tb-card__description">${escapeHtml(description)}</p>
                    ${count > 0 ? `<span class="tb-card__count">${count} 個模板</span>` : ''}
                </div>
            </div>
        `;
    },

    /**
     * 渲染連結卡片
     * @param {Object} data - 卡片數據
     * @returns {string} HTML 字符串
     */
    link(data) {
        const {
            id,
            title,
            description,
            target,
            languageTag
        } = data;

        const utils = window.TextBricksUtils || {};
        const escapeHtml = utils.escapeHtml || (text => text);

        return `
            <div class="tb-card tb-card--link"
                 data-id="${escapeHtml(id)}"
                 data-type="link"
                 data-target="${escapeHtml(target)}">
                <div class="tb-card__header">
                    <span class="codicon codicon-link"></span>
                    ${languageTag ? `<span class="tb-card__tag tb-card__tag--language">${escapeHtml(languageTag)}</span>` : ''}
                </div>
                <div class="tb-card__body">
                    <h3 class="tb-card__title">${escapeHtml(title)}</h3>
                    <p class="tb-card__description">${escapeHtml(description)}</p>
                </div>
            </div>
        `;
    },

    /**
     * 渲染卡片動作按鈕
     * @private
     * @param {string[]} actions - 動作列表
     * @param {string} id - 卡片 ID
     * @returns {string} HTML 字符串
     */
    _renderActions(actions, id) {
        const actionButtons = {
            preview: `<button class="tb-btn tb-btn--icon-only tb-btn--ghost"
                             data-action="preview"
                             data-id="${id}"
                             title="預覽">
                        <span class="codicon codicon-eye"></span>
                      </button>`,
            copy: `<button class="tb-btn tb-btn--icon-only tb-btn--ghost"
                          data-action="copy"
                          data-id="${id}"
                          title="複製">
                     <span class="codicon codicon-copy"></span>
                   </button>`,
            insert: `<button class="tb-btn tb-btn--icon-only tb-btn--primary"
                            data-action="insert"
                            data-id="${id}"
                            title="插入">
                      <span class="codicon codicon-add"></span>
                    </button>`,
            edit: `<button class="tb-btn tb-btn--icon-only tb-btn--ghost"
                          data-action="edit"
                          data-id="${id}"
                          title="編輯">
                     <span class="codicon codicon-edit"></span>
                   </button>`,
            delete: `<button class="tb-btn tb-btn--icon-only tb-btn--ghost tb-btn--danger"
                            data-action="delete"
                            data-id="${id}"
                            title="刪除">
                       <span class="codicon codicon-trash"></span>
                     </button>`,
            favorite: `<button class="tb-btn tb-btn--icon-only tb-btn--ghost"
                              data-action="favorite"
                              data-id="${id}"
                              title="收藏">
                         <span class="codicon codicon-star"></span>
                       </button>`
        };

        return actions
            .map(action => actionButtons[action] || '')
            .join('');
    },

    /**
     * 批量渲染卡片
     * @param {Array} items - 卡片數據數組
     * @param {string} type - 卡片類型 (template, topic, link)
     * @returns {string} HTML 字符串
     */
    renderMany(items, type = 'template') {
        if (!Array.isArray(items)) {
            return '';
        }

        return items
            .map(item => this[type] ? this[type](item) : '')
            .join('');
    },

    /**
     * 渲染空狀態
     * @param {Object} options - 選項
     * @returns {string} HTML 字符串
     */
    empty(options = {}) {
        const {
            icon = 'inbox',
            title = '沒有內容',
            description = '',
            actionText = '',
            actionHandler = ''
        } = options;

        return `
            <div class="tb-empty-state">
                <span class="codicon codicon-${icon} tb-empty-state__icon"></span>
                <h3 class="tb-empty-state__title">${title}</h3>
                ${description ? `<p class="tb-empty-state__description">${description}</p>` : ''}
                ${actionText ? `<button class="tb-btn tb-btn--primary" onclick="${actionHandler}">${actionText}</button>` : ''}
            </div>
        `;
    }
};

// 導出為全局變量
if (typeof window !== 'undefined') {
    window.CardTemplates = CardTemplates;
}

// 支持模組化導入（如果環境支持）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CardTemplates;
}