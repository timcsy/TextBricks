// Form Generator - 表單生成器
// 負責生成各種類型的表單 HTML

(function() {
    'use strict';

    /**
     * Form Generator 類
     * 生成模板、主題、連結、語言等表單
     */
    class FormGenerator {
        constructor(context) {
            this.context = context;
        }

        /**
         * 獲取模板表單
         */
        getTemplateForm(template, prefillData = null) {
            const currentData = this.context.getCurrentData();
            const utils = this.context.getUtils();

            // 使用 prefillData 或 template 的值，prefillData 優先
            const defaultTopic = prefillData?.topicPath || template?.topic || template?.topicPath || '';
            const defaultTopicDisplay = defaultTopic ? this.context.getDisplayPath(defaultTopic) : '';

            return `
                <div class="form-group">
                    <label for="template-name">模板名稱 *</label>
                    <input type="text" id="template-name" value="${template && template.name ? utils.escapeHtml(template.name) : ''}" ${template && template.name ? 'readonly' : ''} required>
                    <div class="form-help">模板的內部名稱，如：hello-world、for-loop、class-template${template && template.name ? '（編輯時不可修改）' : ''}</div>
                </div>

                <div class="form-group">
                    <label for="template-title">標題 *</label>
                    <input type="text" id="template-title" value="${template ? utils.escapeHtml(template.title) : ''}" required>
                </div>

                <div class="form-group">
                    <label for="template-description">描述 *</label>
                    <textarea id="template-description" rows="3" required>${template ? utils.escapeHtml(template.description) : ''}</textarea>
                </div>

                <div class="form-group-inline">
                    <div class="form-group">
                        <label for="template-language">語言 *</label>
                        <select id="template-language" required>
                            <option value="">選擇語言</option>
                            ${currentData.languages.map(lang => `
                                <option value="${lang.name}" ${template && template.language === lang.name ? 'selected' : ''}>
                                    ${utils.escapeHtml(lang.title)}
                                </option>
                            `).join('')}
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="template-topic">主題 *</label>
                        <div style="display: flex; gap: 8px; align-items: center;">
                            <input type="text" id="template-topic-display" style="flex: 1;" value="${utils.escapeHtml(defaultTopicDisplay)}" readonly required placeholder="點擊瀏覽選擇主題...">
                            <input type="hidden" id="template-topic" value="${utils.escapeHtml(defaultTopic)}">
                            <button type="button" id="browse-topic-btn" class="btn btn-secondary btn-small">
                                <span class="icon">🗂️</span> 瀏覽
                            </button>
                        </div>
                        <div class="form-help">點擊「瀏覽」以樹狀結構選擇主題</div>
                    </div>
                </div>

                <div class="form-group">
                    <label for="template-code">程式碼 *</label>
                    <textarea id="template-code" rows="10" style="font-family: monospace;" required>${template ? utils.escapeHtml(template.code) : ''}</textarea>
                </div>

                <div class="form-group-inline">
                    <div class="form-group">
                        <label for="template-author">作者</label>
                        <input type="text" id="template-author" value="${template?.metadata?.author || ''}">
                    </div>

                    <div class="form-group">
                        <label for="template-difficulty">難度</label>
                        <select id="template-difficulty">
                            <option value="">不指定</option>
                            <option value="beginner" ${template?.metadata?.difficulty === 'beginner' ? 'selected' : ''}>初學者</option>
                            <option value="intermediate" ${template?.metadata?.difficulty === 'intermediate' ? 'selected' : ''}>中級</option>
                            <option value="advanced" ${template?.metadata?.difficulty === 'advanced' ? 'selected' : ''}>高級</option>
                        </select>
                    </div>
                </div>

                <div class="form-group">
                    <label for="template-tags">標籤</label>
                    <input type="text" id="template-tags" value="${template?.metadata?.tags ? template.metadata.tags.join(', ') : ''}" placeholder="用逗號分隔多個標籤">
                    <div class="form-help">例如：迴圈, 基礎, 練習</div>
                </div>

                <div class="form-group">
                    <label for="template-documentation-type">說明文檔類型</label>
                    <select id="template-documentation-type">
                        <option value="">無說明文檔</option>
                        <option value="markdown">內嵌 Markdown</option>
                        <option value="file">本地檔案路徑</option>
                        <option value="url">外部 URL</option>
                    </select>
                    <div class="form-help">選擇說明文檔的提供方式</div>
                </div>

                <div class="form-group" id="documentation-content-group" style="display: none;">
                    <label for="template-documentation">說明文檔內容</label>
                    <div id="documentation-input-container">
                        <!-- Dynamic content based on type -->
                    </div>
                    <div class="documentation-actions">
                        <button type="button" id="generate-doc-template" class="btn btn-secondary btn-small">生成標準格式</button>
                        <button type="button" id="preview-documentation" class="btn btn-info btn-small">預覽</button>
                    </div>
                </div>
            `;
        }

        /**
         * 獲取主題表單
         */
        getTopicForm(topic, prefillData = null) {
            const utils = this.context.getUtils();

            // 計算當前主題的完整路徑
            const currentTopicPath = topic ? (Array.isArray(topic.path) ? topic.path.join('/') : topic.path) : '';
            const currentTopicDisplayPath = currentTopicPath ? this.context.getDisplayPath(currentTopicPath) : '';

            // 使用 prefillData 或 topic 的 parent 值，prefillData 優先
            const defaultParent = prefillData?.parentPath || topic?.parent || '';
            const parentDisplayPath = defaultParent ? this.context.getDisplayPath(defaultParent) : '';

            return `
                <div class="form-group">
                    <label for="topic-name">主題名稱 *</label>
                    <input type="text" id="topic-name" value="${topic && topic.name ? utils.escapeHtml(topic.name) : ''}" ${topic && topic.name ? 'readonly' : ''} required>
                    <div class="form-help">主題的內部名稱，如：basic、advanced、algorithm${topic && topic.name ? '（編輯時不可修改）' : ''}</div>
                </div>

                <div class="form-group">
                    <label for="topic-title">顯示名稱 *</label>
                    <input type="text" id="topic-title" value="${topic ? utils.escapeHtml(topic.title) : ''}" required>
                    <div class="form-help">主題的顯示名稱，如：基礎、進階、演算法</div>
                </div>

                <div class="form-group">
                    <label for="topic-parent">所屬主題</label>
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <input type="text" id="topic-parent-display" style="flex: 1;" value="${utils.escapeHtml(parentDisplayPath)}" readonly placeholder="無（頂層主題）">
                        <input type="hidden" id="topic-parent" value="${utils.escapeHtml(defaultParent)}">
                        <button type="button" id="browse-parent-topic-btn" class="btn btn-secondary btn-small">
                            <span class="icon">🗂️</span> 瀏覽
                        </button>
                        <button type="button" id="clear-parent-topic-btn" class="btn btn-secondary btn-small">清除</button>
                    </div>
                    <div class="form-help">選擇上層主題，留空則為頂層主題</div>
                </div>

                <div class="form-group">
                    <label for="topic-description">主題簡介 *</label>
                    <textarea id="topic-description" rows="2" required>${topic ? utils.escapeHtml(topic.description) : ''}</textarea>
                    <div class="form-help">簡短描述（1-2句話），會顯示在主題列表中</div>
                </div>

                <div class="form-group">
                    <label for="topic-documentation-type">說明文檔類型</label>
                    <select id="topic-documentation-type">
                        <option value="">無說明文檔</option>
                        <option value="markdown">內嵌 Markdown</option>
                        <option value="file">本地檔案路徑</option>
                        <option value="url">外部 URL</option>
                    </select>
                    <div class="form-help">選擇說明文檔的提供方式</div>
                </div>

                <div class="form-group" id="topic-documentation-content-group" style="display: none;">
                    <label for="topic-documentation">詳細說明文檔內容</label>
                    <div id="topic-documentation-input-container">
                        <!-- Dynamic content based on type -->
                    </div>
                    <div class="documentation-actions">
                        <button type="button" id="generate-topic-doc-template" class="btn btn-secondary btn-small">生成標準格式</button>
                        <button type="button" id="preview-topic-documentation" class="btn btn-info btn-small">預覽</button>
                    </div>
                </div>

                <div class="form-group-inline">
                    <div class="form-group">
                        <label for="topic-color">主題顏色</label>
                        <input type="color" id="topic-color" value="${topic?.color || '#007acc'}">
                        <div class="form-help">用於標識主題的顏色</div>
                    </div>

                    <div class="form-group">
                        <label for="topic-icon">主題圖標</label>
                        <input type="text" id="topic-icon" value="${topic?.icon || ''}" placeholder="🏷️">
                        <div class="form-help">表示主題的 emoji 圖標</div>
                    </div>
                </div>
            `;
        }

        /**
         * 獲取連結表單
         */
        getLinkForm(link, prefillData = null) {
            const utils = this.context.getUtils();

            // 使用 prefillData 或 link 的值，prefillData 優先
            const defaultTarget = prefillData?.targetPath || link?.target || '';
            const targetDisplayPath = defaultTarget ? this.context.getDisplayPath(defaultTarget) : '';

            // 計算保存到主題的顯示路徑
            const saveToTopicPath = link?.topic || '';
            const saveToDisplayPath = saveToTopicPath ? this.context.getDisplayPath(saveToTopicPath) : '';

            return `
                <div class="form-group">
                    <label for="link-name">連結名稱 *</label>
                    <input type="text" id="link-name" value="${link ? utils.escapeHtml(link.name) : ''}" required>
                    <div class="form-help">連結的唯一識別符，如：advanced-pointer-link</div>
                </div>

                <div class="form-group">
                    <label for="link-title">連結標題 *</label>
                    <input type="text" id="link-title" value="${link ? utils.escapeHtml(link.title) : ''}" required>
                    <div class="form-help">連結的顯示標題，如：Python 基礎、進階指標教學</div>
                </div>

                <div class="form-group">
                    <label for="link-target">目標路徑 *</label>
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <input type="text" id="link-target-display" style="flex: 1;" value="${utils.escapeHtml(targetDisplayPath)}" readonly placeholder="選擇目標主題" required>
                        <input type="hidden" id="link-target" value="${utils.escapeHtml(defaultTarget)}">
                        <button type="button" id="browse-target-btn" class="btn btn-secondary btn-small">
                            <span class="icon">🗂️</span> 瀏覽
                        </button>
                    </div>
                    <div class="form-help">選擇連結要指向的主題或子主題</div>
                </div>

                <div class="form-group">
                    <label for="link-description">連結描述 *</label>
                    <textarea id="link-description" rows="2" required>${link ? utils.escapeHtml(link.description) : ''}</textarea>
                    <div class="form-help">描述這個連結的用途，如：快速跳轉到進階指標主題</div>
                </div>

                <div class="form-group">
                    <label for="link-save-to-topic">保存到主題 *</label>
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <input type="text" id="link-save-to-topic-display" style="flex: 1;" value="${utils.escapeHtml(saveToDisplayPath)}" readonly placeholder="選擇主題" required>
                        <input type="hidden" id="link-save-to-topic" value="${utils.escapeHtml(saveToTopicPath)}">
                        <button type="button" id="browse-save-to-topic-btn" class="btn btn-secondary btn-small">
                            <span class="icon">🗂️</span> 瀏覽
                        </button>
                    </div>
                    <div class="form-help">此連結將會新增到選擇的主題的 links 資料夾中</div>
                </div>
            `;
        }

        /**
         * 獲取語言表單
         */
        getLanguageForm(language, prefillData = null) {
            const utils = this.context.getUtils();

            return `
                <div class="form-group">
                    <label for="language-name">名稱 *</label>
                    <input type="text" id="language-name" value="${language ? language.name : ''}" ${language ? 'readonly' : ''} required>
                    <div class="form-help">語言的唯一識別碼，如：javascript, python, cpp</div>
                </div>

                <div class="form-group">
                    <label for="language-title">顯示標題 *</label>
                    <input type="text" id="language-title" value="${language ? utils.escapeHtml(language.title) : ''}" required>
                    <div class="form-help">在界面上顯示的名稱</div>
                </div>

                <div class="form-group">
                    <label for="language-tag-name">標籤名稱 *</label>
                    <input type="text" id="language-tag-name" value="${language ? language.tagName : ''}" required placeholder="js">
                    <div class="form-help">用於語法高亮的標籤名稱</div>
                </div>

                <div class="form-group">
                    <label for="language-extensions">副檔名 *</label>
                    <input type="text" id="language-extensions" value="${language ? language.fileExtensions?.join(', ') : ''}" required placeholder=".js, .jsx">
                    <div class="form-help">包含點號，多個用逗號分隔，如：.js, .jsx</div>
                </div>

                <div class="form-group">
                    <label for="language-description">描述</label>
                    <textarea id="language-description" rows="3">${language ? utils.escapeHtml(language.description) : ''}</textarea>
                </div>
            `;
        }

        /**
         * 從表單獲取模板數據
         */
        getTemplateData() {
            const name = document.getElementById('template-name')?.value.trim();
            const title = document.getElementById('template-title')?.value.trim();
            const description = document.getElementById('template-description')?.value.trim();
            const language = document.getElementById('template-language')?.value;
            const topic = document.getElementById('template-topic')?.value;
            const code = document.getElementById('template-code')?.value;
            const author = document.getElementById('template-author')?.value.trim();
            const difficulty = document.getElementById('template-difficulty')?.value;
            const tagsInput = document.getElementById('template-tags')?.value.trim();

            // 驗證必填字段
            if (!name || !title || !description || !language || !topic || !code) {
                throw new Error('請填寫所有必填字段');
            }

            // 處理標籤
            const tags = tagsInput ? tagsInput.split(',').map(t => t.trim()).filter(Boolean) : [];

            // 處理文檔
            const documentationType = document.getElementById('template-documentation-type')?.value;
            let documentation = null;

            if (documentationType) {
                const docInput = document.getElementById('template-documentation');
                const docContent = docInput?.value.trim();

                if (docContent) {
                    switch (documentationType) {
                        case 'markdown':
                            documentation = { type: 'markdown', content: docContent };
                            break;
                        case 'file':
                            documentation = { type: 'file', path: docContent };
                            break;
                        case 'url':
                            documentation = { type: 'url', url: docContent };
                            break;
                    }
                }
            }

            return {
                name,
                title,
                description,
                language,
                topic,
                code,
                metadata: {
                    author: author || undefined,
                    difficulty: difficulty || undefined,
                    tags: tags.length > 0 ? tags : undefined
                },
                documentation
            };
        }

        /**
         * 從表單獲取主題數據
         */
        getTopicData() {
            const name = document.getElementById('topic-name')?.value.trim();
            const title = document.getElementById('topic-title')?.value.trim();
            const parent = document.getElementById('topic-parent')?.value.trim();
            const description = document.getElementById('topic-description')?.value.trim();
            const color = document.getElementById('topic-color')?.value;
            const icon = document.getElementById('topic-icon')?.value.trim();

            // 驗證必填字段
            if (!name || !title || !description) {
                throw new Error('請填寫所有必填字段');
            }

            // 處理文檔
            const documentationType = document.getElementById('topic-documentation-type')?.value;
            let documentation = null;

            if (documentationType) {
                const docInput = document.getElementById('topic-documentation');
                const docContent = docInput?.value.trim();

                if (docContent) {
                    switch (documentationType) {
                        case 'markdown':
                            documentation = { type: 'markdown', content: docContent };
                            break;
                        case 'file':
                            documentation = { type: 'file', path: docContent };
                            break;
                        case 'url':
                            documentation = { type: 'url', url: docContent };
                            break;
                    }
                }
            }

            return {
                name,
                title,
                parent: parent || null,
                description,
                color: color || '#007acc',
                icon: icon || null,
                documentation
            };
        }

        /**
         * 從表單獲取連結數據
         */
        getLinkData() {
            const name = document.getElementById('link-name')?.value.trim();
            const title = document.getElementById('link-title')?.value.trim();
            const target = document.getElementById('link-target')?.value.trim();
            const description = document.getElementById('link-description')?.value.trim();
            const saveToTopic = document.getElementById('link-save-to-topic')?.value.trim();

            // 驗證必填字段
            if (!name || !title || !target || !description || !saveToTopic) {
                throw new Error('請填寫所有必填字段');
            }

            return {
                name,
                title,
                target,
                description,
                topic: saveToTopic
            };
        }

        /**
         * 從表單獲取語言數據
         */
        getLanguageData() {
            const name = document.getElementById('language-name')?.value.trim();
            const title = document.getElementById('language-title')?.value.trim();
            const tagName = document.getElementById('language-tag-name')?.value.trim();
            const extensionsInput = document.getElementById('language-extensions')?.value.trim();
            const description = document.getElementById('language-description')?.value.trim();

            // 驗證必填字段
            if (!name || !title || !tagName || !extensionsInput) {
                throw new Error('請填寫所有必填字段');
            }

            // 處理副檔名
            const fileExtensions = extensionsInput.split(',').map(ext => ext.trim()).filter(Boolean);

            return {
                name,
                title,
                tagName,
                fileExtensions,
                description: description || undefined
            };
        }
    }

    // 導出到全局（用於模組化）
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = FormGenerator;
    } else {
        window.FormGenerator = FormGenerator;
    }
})();
