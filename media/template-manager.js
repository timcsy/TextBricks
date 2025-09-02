// Template Manager JavaScript

(function() {
    const vscode = acquireVsCodeApi();
    
    // State
    let currentData = {
        templates: [],
        categories: [],
        languages: []
    };
    let currentTab = 'templates';
    let editingItem = null;

    // Initialize
    function init() {
        setupEventListeners();
        loadData();
        console.log('Template Manager initialized');
    }

    function setupEventListeners() {
        // Tab navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', handleTabSwitch);
        });

        // Toolbar buttons
        document.getElementById('refresh-btn').addEventListener('click', loadData);
        document.getElementById('import-btn').addEventListener('click', importTemplates);
        document.getElementById('export-btn').addEventListener('click', exportTemplates);

        // Quick action buttons
        document.getElementById('create-template-btn').addEventListener('click', () => openModal('template'));
        document.getElementById('create-category-btn').addEventListener('click', () => openModal('category'));
        document.getElementById('create-language-btn').addEventListener('click', () => openModal('language'));
        
        // JSON import button - check if exists first
        const jsonImportBtn = document.getElementById('json-import-btn');
        if (jsonImportBtn) {
            jsonImportBtn.addEventListener('click', openJsonModal);
        }

        // Filters and search
        document.getElementById('filter-language').addEventListener('change', applyFilters);
        document.getElementById('filter-category').addEventListener('change', applyFilters);
        document.getElementById('search-templates').addEventListener('input', applyFilters);

        // Modal
        document.getElementById('modal-close').addEventListener('click', closeModal);
        document.getElementById('modal-cancel').addEventListener('click', closeModal);
        document.getElementById('modal-save').addEventListener('click', saveItem);
        
        // Close modal on backdrop click
        document.getElementById('modal').addEventListener('click', (e) => {
            if (e.target.id === 'modal') {
                closeModal();
            }
        });

        // JSON Modal - check if elements exist first
        const jsonModalClose = document.getElementById('json-modal-close');
        const jsonModalCancel = document.getElementById('json-modal-cancel');
        const jsonModalImport = document.getElementById('json-modal-import');
        const jsonInput = document.getElementById('json-input');
        const jsonModal = document.getElementById('json-modal');
        
        if (jsonModalClose) {
            jsonModalClose.addEventListener('click', closeJsonModal);
        }
        if (jsonModalCancel) {
            jsonModalCancel.addEventListener('click', closeJsonModal);
        }
        if (jsonModalImport) {
            jsonModalImport.addEventListener('click', handleJsonImport);
        }
        if (jsonInput) {
            jsonInput.addEventListener('input', validateJsonInput);
        }
        
        // Documentation editing event delegation (since elements are dynamically created)
        document.addEventListener('change', function(e) {
            if (e.target.id === 'template-documentation-type') {
                handleDocumentationTypeChange(e.target.value);
            }
        });
        
        document.addEventListener('click', function(e) {
            if (e.target.id === 'generate-doc-template') {
                generateDocumentationTemplate();
            } else if (e.target.id === 'preview-documentation') {
                previewDocumentation();
            }
        });
        if (jsonModal) {
            jsonModal.addEventListener('click', (e) => {
                if (e.target.id === 'json-modal') {
                    closeJsonModal();
                }
            });
        }

        // Event delegation for dynamic buttons
        document.addEventListener('click', handleButtonClick);
    }

    // Button click handler
    function handleButtonClick(event) {
        const button = event.target.closest('button[data-action], #create-first-template-btn, #create-first-category-btn, #create-first-language-btn');
        if (!button) return;

        // Handle special "create first" buttons
        if (button.id === 'create-first-template-btn') {
            openModal('template');
            return;
        }
        if (button.id === 'create-first-category-btn') {
            openModal('category');
            return;
        }
        if (button.id === 'create-first-language-btn') {
            openModal('language');
            return;
        }

        const action = button.dataset.action;
        if (!action) return;
        
        switch (action) {
            case 'edit-template':
                const templateId = button.dataset.templateId;
                editTemplate(templateId);
                break;
            case 'delete-template':
                const deleteTemplateId = button.dataset.templateId;
                deleteTemplate(deleteTemplateId);
                break;
            case 'edit-category':
                const categoryId = button.dataset.categoryId;
                editCategory(categoryId);
                break;
            case 'delete-category':
                const deleteCategoryId = button.dataset.categoryId;
                deleteCategory(deleteCategoryId);
                break;
            case 'edit-language':
                const languageId = button.dataset.languageId;
                editLanguage(languageId);
                break;
        }
    }

    // Data loading
    function loadData() {
        showLoading(true);
        vscode.postMessage({ type: 'loadData' });
    }

    function handleMessage(event) {
        const message = event.data;
        console.log('Received message:', message);
        
        switch (message.type) {
            case 'dataLoaded':
                currentData = message.data;
                console.log('Data loaded:', currentData);
                showLoading(false);
                updateFilters();
                renderCurrentTab();
                break;
            
            case 'error':
                console.error('Backend error:', message.message);
                showLoading(false);
                showError(message.message || '載入數據時發生未知錯誤');
                break;
            
            default:
                console.log('Unknown message type:', message.type);
        }
    }

    // Tab management
    function handleTabSwitch(event) {
        if (event.target.disabled) return;
        
        const tabName = event.target.dataset.tab;
        if (!tabName) return;

        // Update active nav item
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        event.target.classList.add('active');

        // Show corresponding tab content
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        
        const tabContent = document.getElementById(`${tabName}-tab`);
        if (tabContent) {
            tabContent.classList.add('active');
            currentTab = tabName;
            renderCurrentTab();
        }
    }

    // Rendering
    function renderCurrentTab() {
        switch (currentTab) {
            case 'templates':
                renderTemplates();
                break;
            case 'categories':
                renderCategories();
                break;
            case 'languages':
                renderLanguages();
                break;
        }
    }

    function renderTemplates() {
        const container = document.getElementById('templates-list');
        const templates = getFilteredTemplates();

        if (templates.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: var(--vscode-descriptionForeground);">
                    <p>沒有找到符合條件的模板</p>
                    <button class="btn btn-primary" id="create-first-template-btn">
                        <span class="icon">➕</span> 創建第一個模板
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = templates.map(template => {
            const category = currentData.categories.find(c => c.id === template.categoryId);
            const language = currentData.languages.find(l => l.id === template.language);
            
            return `
                <div class="data-item">
                    <div class="data-item-header">
                        <h3 class="data-item-title">${escapeHtml(template.title)}</h3>
                        <div class="data-item-actions">
                            <button class="btn btn-secondary" data-action="edit-template" data-template-id="${template.id}">
                                <span class="icon">✏️</span> 編輯
                            </button>
                            <button class="btn btn-danger" data-action="delete-template" data-template-id="${template.id}">
                                <span class="icon">🗑️</span> 刪除
                            </button>
                        </div>
                    </div>
                    
                    <div class="data-item-tags">
                        <span class="tag language">${language ? escapeHtml(language.displayName) : '未知語言'}</span>
                        <span class="tag category">${category ? escapeHtml(category.name) : '未知分類'}</span>
                        ${template.metadata?.difficulty ? `<span class="tag difficulty">${template.metadata.difficulty}</span>` : ''}
                    </div>
                    
                    <div class="data-item-meta">
                        ID: ${template.id} ${template.metadata?.version ? `• 版本: ${template.metadata.version}` : ''}
                        ${template.metadata?.author ? `• 作者: ${escapeHtml(template.metadata.author)}` : ''}
                    </div>
                    
                    <div class="data-item-description">
                        ${escapeHtml(template.description)}
                    </div>
                    
                    <div class="data-item-code">
${escapeHtml(template.code)}
                    </div>
                    
                    ${template.metadata?.tags && template.metadata.tags.length > 0 ? `
                        <div class="data-item-tags">
                            ${template.metadata.tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');
    }

    function renderCategories() {
        const container = document.getElementById('categories-list');
        const categories = currentData.categories;

        if (categories.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: var(--vscode-descriptionForeground);">
                    <p>沒有分類</p>
                    <button class="btn btn-primary" id="create-first-category-btn">
                        <span class="icon">➕</span> 創建第一個分類
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = categories.map(category => {
            const templateCount = currentData.templates.filter(t => t.categoryId === category.id).length;
            
            return `
                <div class="data-item">
                    <div class="data-item-header">
                        <h3 class="data-item-title">${escapeHtml(category.name)}</h3>
                        <div class="data-item-actions">
                            <button class="btn btn-secondary" data-action="edit-category" data-category-id="${category.id}">
                                <span class="icon">✏️</span> 編輯
                            </button>
                            <button class="btn btn-danger" data-action="delete-category" data-category-id="${category.id}" ${templateCount > 0 ? 'disabled title="無法刪除：有模板使用此分類"' : ''}>
                                <span class="icon">🗑️</span> 刪除
                            </button>
                        </div>
                    </div>
                    
                    <div class="data-item-meta">
                        ID: ${category.id} • Level: ${category.level} • 包含 ${templateCount} 個模板
                    </div>
                    
                    <div class="data-item-description">
                        ${escapeHtml(category.description)}
                    </div>
                </div>
            `;
        }).join('');
    }

    function renderLanguages() {
        const container = document.getElementById('languages-list');
        const languages = currentData.languages;

        if (languages.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: var(--vscode-descriptionForeground);">
                    <p>沒有語言</p>
                    <button class="btn btn-primary" id="create-first-language-btn">
                        <span class="icon">➕</span> 添加第一個語言
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = languages.map(language => {
            const templateCount = currentData.templates.filter(t => t.language === language.id).length;
            
            return `
                <div class="data-item">
                    <div class="data-item-header">
                        <h3 class="data-item-title">${escapeHtml(language.displayName)}</h3>
                        <div class="data-item-actions">
                            <button class="btn btn-secondary" data-action="edit-language" data-language-id="${language.id}">
                                <span class="icon">✏️</span> 編輯
                            </button>
                        </div>
                    </div>
                    
                    <div class="data-item-meta">
                        ID: ${language.id} • 副檔名: ${language.extension} • 包含 ${templateCount} 個模板
                    </div>
                </div>
            `;
        }).join('');
    }

    // Filtering
    function updateFilters() {
        // Update language filter
        const languageFilter = document.getElementById('filter-language');
        languageFilter.innerHTML = '<option value="">所有語言</option>' +
            currentData.languages.map(lang => `<option value="${lang.id}">${escapeHtml(lang.displayName)}</option>`).join('');

        // Update category filter
        const categoryFilter = document.getElementById('filter-category');
        categoryFilter.innerHTML = '<option value="">所有分類</option>' +
            currentData.categories.map(cat => `<option value="${cat.id}">${escapeHtml(cat.name)}</option>`).join('');
    }

    function getFilteredTemplates() {
        const languageFilter = document.getElementById('filter-language').value;
        const categoryFilter = document.getElementById('filter-category').value;
        const searchText = document.getElementById('search-templates').value.toLowerCase();

        return currentData.templates.filter(template => {
            // Language filter
            if (languageFilter && template.language !== languageFilter) return false;
            
            // Category filter
            if (categoryFilter && template.categoryId !== categoryFilter) return false;
            
            // Search filter
            if (searchText) {
                const searchableText = (template.title + ' ' + template.description + ' ' + template.code).toLowerCase();
                if (!searchableText.includes(searchText)) return false;
            }
            
            return true;
        });
    }

    function applyFilters() {
        if (currentTab === 'templates') {
            renderTemplates();
        }
    }

    // Modal management
    function openModal(type, item = null) {
        console.log('Opening modal:', type, item);
        editingItem = item;
        
        const modal = document.getElementById('modal');
        const title = document.getElementById('modal-title');
        const body = document.getElementById('modal-body');

        if (!modal || !title || !body) {
            console.error('Modal elements not found');
            return;
        }

        let titleText, bodyHTML;

        switch (type) {
            case 'template':
                titleText = item ? '編輯模板' : '創建新模板';
                bodyHTML = getTemplateForm(item);
                break;
            case 'category':
                titleText = item ? '編輯分類' : '創建新分類';
                bodyHTML = getCategoryForm(item);
                break;
            case 'language':
                titleText = item ? '編輯語言' : '創建新語言';
                bodyHTML = getLanguageForm(item);
                break;
            default:
                console.error('Unknown modal type:', type);
                return;
        }

        console.log('Setting modal content:', titleText);
        title.textContent = titleText;
        body.innerHTML = bodyHTML;
        modal.classList.add('active');
        modal.dataset.type = type;
        
        // Special handling for template modal - set documentation type and content
        if (type === 'template' && item && item.documentation) {
            setTimeout(() => {
                const docTypeSelect = document.getElementById('template-documentation-type');
                if (docTypeSelect) {
                    const docType = getDocumentationType(item.documentation);
                    docTypeSelect.value = docType;
                    handleDocumentationTypeChange(docType);
                }
            }, 50);
        }

        // Focus first input
        const firstInput = body.querySelector('input, textarea, select');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
    }

    function closeModal() {
        const modal = document.getElementById('modal');
        modal.classList.remove('active');
        editingItem = null;
    }

    // Form generators
    function getTemplateForm(template) {
        return `
            <div class="form-group">
                <label for="template-title">標題 *</label>
                <input type="text" id="template-title" value="${template ? escapeHtml(template.title) : ''}" required>
            </div>
            
            <div class="form-group">
                <label for="template-description">描述 *</label>
                <textarea id="template-description" rows="3" required>${template ? escapeHtml(template.description) : ''}</textarea>
            </div>
            
            <div class="form-group-inline">
                <div class="form-group">
                    <label for="template-language">語言 *</label>
                    <select id="template-language" required>
                        <option value="">選擇語言</option>
                        ${currentData.languages.map(lang => `
                            <option value="${lang.id}" ${template && template.language === lang.id ? 'selected' : ''}>
                                ${escapeHtml(lang.displayName)}
                            </option>
                        `).join('')}
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="template-category">分類 *</label>
                    <select id="template-category" required>
                        <option value="">選擇分類</option>
                        ${currentData.categories.map(cat => `
                            <option value="${cat.id}" ${template && template.categoryId === cat.id ? 'selected' : ''}>
                                ${escapeHtml(cat.name)}
                            </option>
                        `).join('')}
                    </select>
                </div>
            </div>
            
            <div class="form-group">
                <label for="template-code">程式碼 *</label>
                <textarea id="template-code" rows="10" style="font-family: monospace;" required>${template ? escapeHtml(template.code) : ''}</textarea>
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

    function getCategoryForm(category) {
        return `
            <div class="form-group">
                <label for="category-name">名稱 *</label>
                <input type="text" id="category-name" value="${category ? escapeHtml(category.name) : ''}" required>
            </div>
            
            <div class="form-group">
                <label for="category-description">描述 *</label>
                <textarea id="category-description" rows="3" required>${category ? escapeHtml(category.description) : ''}</textarea>
            </div>
            
            <div class="form-group">
                <label for="category-level">級別 *</label>
                <input type="number" id="category-level" min="1" max="10" value="${category ? category.level : 1}" required>
                <div class="form-help">1-10，數字越小表示越基礎</div>
            </div>
        `;
    }

    function getLanguageForm(language) {
        return `
            <div class="form-group">
                <label for="language-id">ID *</label>
                <input type="text" id="language-id" value="${language ? language.id : ''}" ${language ? 'readonly' : ''} required>
                <div class="form-help">語言的唯一識別碼，如：javascript, python, cpp</div>
            </div>
            
            <div class="form-group">
                <label for="language-name">名稱 *</label>
                <input type="text" id="language-name" value="${language ? language.name : ''}" required>
                <div class="form-help">程式語言的內部名稱</div>
            </div>
            
            <div class="form-group">
                <label for="language-display-name">顯示名稱 *</label>
                <input type="text" id="language-display-name" value="${language ? escapeHtml(language.displayName) : ''}" required>
                <div class="form-help">在界面上顯示的名稱</div>
            </div>
            
            <div class="form-group">
                <label for="language-extension">副檔名 *</label>
                <input type="text" id="language-extension" value="${language ? language.extension : ''}" required placeholder=".js">
                <div class="form-help">包含點號，如：.js, .py, .cpp</div>
            </div>
        `;
    }

    // Save functionality
    function saveItem() {
        const modal = document.getElementById('modal');
        const type = modal.dataset.type;
        
        try {
            let data, messageType, id;
            
            switch (type) {
                case 'template':
                    data = getTemplateData();
                    if (editingItem) {
                        messageType = 'updateTemplate';
                        id = editingItem.id;
                    } else {
                        messageType = 'createTemplate';
                    }
                    break;
                    
                case 'category':
                    data = getCategoryData();
                    if (editingItem) {
                        messageType = 'updateCategory';
                        id = editingItem.id;
                    } else {
                        messageType = 'createCategory';
                    }
                    break;
                    
                case 'language':
                    data = getLanguageData();
                    if (editingItem) {
                        messageType = 'updateLanguage';
                        id = editingItem.id;
                    } else {
                        messageType = 'createLanguage';
                    }
                    break;
            }

            const message = { type: messageType, data };
            if (id) {
                message[`${type}Id`] = id;
            }
            
            vscode.postMessage(message);
            closeModal();
            
        } catch (error) {
            vscode.postMessage({
                type: 'showError',
                message: error.message
            });
        }
    }

    function getTemplateData() {
        const title = document.getElementById('template-title').value.trim();
        const description = document.getElementById('template-description').value.trim();
        const language = document.getElementById('template-language').value;
        const categoryId = document.getElementById('template-category').value;
        const code = document.getElementById('template-code').value;
        const author = document.getElementById('template-author').value.trim();
        const difficulty = document.getElementById('template-difficulty').value;
        const tags = document.getElementById('template-tags').value
            .split(',')
            .map(tag => tag.trim())
            .filter(tag => tag.length > 0);

        if (!title) throw new Error('請輸入標題');
        if (!description) throw new Error('請輸入描述');
        if (!language) throw new Error('請選擇語言');
        if (!categoryId) throw new Error('請選擇分類');
        if (!code.trim()) throw new Error('請輸入程式碼');

        const data = {
            title,
            description,
            language,
            categoryId,
            code,
            metadata: {}
        };

        if (author) data.metadata.author = author;
        if (difficulty) data.metadata.difficulty = difficulty;
        if (tags.length > 0) data.metadata.tags = tags;
        
        // Handle documentation
        const docTypeSelect = document.getElementById('template-documentation-type');
        const docInput = document.getElementById('template-documentation');
        
        if (docTypeSelect && docInput && docTypeSelect.value && docInput.value.trim()) {
            data.documentation = docInput.value.trim();
        }

        return data;
    }

    function getCategoryData() {
        const name = document.getElementById('category-name').value.trim();
        const description = document.getElementById('category-description').value.trim();
        const level = parseInt(document.getElementById('category-level').value);

        if (!name) throw new Error('請輸入名稱');
        if (!description) throw new Error('請輸入描述');
        if (!level || level < 1 || level > 10) throw new Error('級別必須在1-10之間');

        return { name, description, level };
    }

    function getLanguageData() {
        const id = document.getElementById('language-id').value.trim().toLowerCase();
        const name = document.getElementById('language-name').value.trim();
        const displayName = document.getElementById('language-display-name').value.trim();
        const extension = document.getElementById('language-extension').value.trim();

        if (!id) throw new Error('請輸入ID');
        if (!/^[a-z0-9\-_]+$/.test(id)) throw new Error('ID只能包含小寫字母、數字、連字號和下劃線');
        if (!name) throw new Error('請輸入名稱');
        if (!displayName) throw new Error('請輸入顯示名稱');
        if (!extension) throw new Error('請輸入副檔名');
        if (!extension.startsWith('.')) throw new Error('副檔名必須以點號開頭');

        return { id, name, displayName, extension };
    }

    // Internal functions for editing items
    function editTemplate(templateId) {
        console.log('Editing template:', templateId);
        console.log('Available templates:', currentData.templates);
        const template = currentData.templates.find(t => t.id === templateId);
        if (template) {
            console.log('Found template:', template);
            openModal('template', template);
        } else {
            console.error('Template not found:', templateId);
        }
    }
    
    function deleteTemplate(templateId) {
        vscode.postMessage({
            type: 'deleteTemplate',
            templateId: templateId
        });
    }
    
    function editCategory(categoryId) {
        const category = currentData.categories.find(c => c.id === categoryId);
        if (category) {
            openModal('category', category);
        }
    }
    
    function deleteCategory(categoryId) {
        vscode.postMessage({
            type: 'deleteCategory',
            categoryId: categoryId
        });
    }
    
    function editLanguage(languageId) {
        const language = currentData.languages.find(l => l.id === languageId);
        if (language) {
            openModal('language', language);
        }
    }

    // Global functions for onclick handlers (kept for backward compatibility)
    window.openModal = openModal;

    // Import/Export
    function importTemplates() {
        vscode.postMessage({ type: 'importTemplates' });
    }

    function exportTemplates() {
        const filters = {};
        
        // Get selected filters
        const languageFilter = document.getElementById('filter-language').value;
        const categoryFilter = document.getElementById('filter-category').value;
        
        if (languageFilter) {
            filters.languageIds = [languageFilter];
        }
        if (categoryFilter) {
            filters.categoryIds = [categoryFilter];
        }
        
        vscode.postMessage({
            type: 'exportTemplates',
            filters: Object.keys(filters).length > 0 ? filters : undefined
        });
    }

    // Utility functions
    function showLoading(show) {
        const loading = document.getElementById('loading');
        if (show) {
            loading.classList.remove('hidden');
        } else {
            loading.classList.add('hidden');
        }
    }

    function escapeHtml(text) {
        if (typeof text !== 'string') return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // JSON Import functions
    function openJsonModal() {
        const jsonModal = document.getElementById('json-modal');
        if (!jsonModal) {
            console.error('JSON modal not found');
            return;
        }
        populateAvailableLanguagesAndCategories();
        clearJsonInput();
        jsonModal.classList.add('active');
        console.log('JSON modal opened');
    }

    function closeJsonModal() {
        const jsonModal = document.getElementById('json-modal');
        if (!jsonModal) {
            console.error('JSON modal not found');
            return;
        }
        jsonModal.classList.remove('active');
        clearJsonInput();
        console.log('JSON modal closed');
    }

    function populateAvailableLanguagesAndCategories() {
        const languagesDiv = document.getElementById('available-languages');
        const categoriesDiv = document.getElementById('available-categories');

        if (!languagesDiv || !categoriesDiv) {
            console.error('Available languages or categories div not found');
            return;
        }

        // Populate languages
        let languagesHtml = '';
        if (currentData.languages && currentData.languages.length > 0) {
            currentData.languages.forEach(lang => {
                languagesHtml += `<div class="info-list-item">
                    <span>${escapeHtml(lang.displayName)}</span>
                    <code>${escapeHtml(lang.id)}</code>
                </div>`;
            });
        } else {
            languagesHtml = '<div class="info-list-item">暫無可用語言</div>';
        }
        languagesDiv.innerHTML = languagesHtml;

        // Populate categories
        let categoriesHtml = '';
        if (currentData.categories && currentData.categories.length > 0) {
            currentData.categories.forEach(cat => {
                categoriesHtml += `<div class="info-list-item">
                    <span>${escapeHtml(cat.name)} (Level ${cat.level})</span>
                    <code>${escapeHtml(cat.id)}</code>
                </div>`;
            });
        } else {
            categoriesHtml = '<div class="info-list-item">暫無可用分類</div>';
        }
        categoriesDiv.innerHTML = categoriesHtml;
    }

    function clearJsonInput() {
        const jsonInput = document.getElementById('json-input');
        if (jsonInput) {
            jsonInput.value = '';
        }
        hideJsonValidationMessage();
    }

    function validateJsonInput() {
        const jsonInput = document.getElementById('json-input');
        const validationMessage = document.getElementById('json-validation-message');
        const importButton = document.getElementById('json-modal-import');
        
        if (!jsonInput || !importButton) {
            console.error('JSON input elements not found');
            return { valid: false, data: null };
        }
        
        const input = jsonInput.value.trim();
        
        if (!input) {
            hideJsonValidationMessage();
            importButton.disabled = false;
            return { valid: true, data: null };
        }

        try {
            const data = JSON.parse(input);
            const validation = validateTemplateData(data);
            
            if (validation.valid) {
                showJsonValidationMessage(`✅ JSON格式正確，發現 ${validation.templateCount} 個模板`, 'success');
                importButton.disabled = false;
                return { valid: true, data: data };
            } else {
                showJsonValidationMessage(`❌ ${validation.error}`, 'error');
                importButton.disabled = true;
                return { valid: false, data: null };
            }
        } catch (error) {
            showJsonValidationMessage(`❌ JSON格式錯誤: ${error.message}`, 'error');
            importButton.disabled = true;
            return { valid: false, data: null };
        }
    }

    function validateTemplateData(data) {
        let templates = [];
        
        // Check if it's a single template or array of templates
        if (Array.isArray(data)) {
            templates = data;
        } else if (typeof data === 'object' && data !== null) {
            // Check if it's a single template object
            if (data.title && data.code && data.language) {
                templates = [data];
            } else {
                return { valid: false, error: '不是有效的模板格式' };
            }
        } else {
            return { valid: false, error: '必須是物件或陣列' };
        }

        // Validate each template
        for (let i = 0; i < templates.length; i++) {
            const template = templates[i];
            const index = i + 1;
            
            if (!template.title || typeof template.title !== 'string') {
                return { valid: false, error: `模板 ${index}: 缺少有效的 title` };
            }
            if (!template.description || typeof template.description !== 'string') {
                return { valid: false, error: `模板 ${index}: 缺少有效的 description` };
            }
            if (!template.code || typeof template.code !== 'string') {
                return { valid: false, error: `模板 ${index}: 缺少有效的 code` };
            }
            if (!template.language || typeof template.language !== 'string') {
                return { valid: false, error: `模板 ${index}: 缺少有效的 language` };
            }
            if (!template.categoryId || typeof template.categoryId !== 'string') {
                return { valid: false, error: `模板 ${index}: 缺少有效的 categoryId` };
            }

            // Validate language and category exist
            const languageExists = currentData.languages && currentData.languages.some(l => l.id === template.language);
            const categoryExists = currentData.categories && currentData.categories.some(c => c.id === template.categoryId);
            
            if (!languageExists) {
                return { valid: false, error: `模板 ${index}: 語言 "${template.language}" 不存在` };
            }
            if (!categoryExists) {
                return { valid: false, error: `模板 ${index}: 分類 "${template.categoryId}" 不存在` };
            }
        }

        return { valid: true, templateCount: templates.length };
    }

    function showJsonValidationMessage(message, type) {
        const validationDiv = document.getElementById('json-validation-message');
        if (validationDiv) {
            validationDiv.textContent = message;
            validationDiv.className = type;
            validationDiv.style.display = 'block';
        }
    }

    function hideJsonValidationMessage() {
        const validationDiv = document.getElementById('json-validation-message');
        if (validationDiv) {
            validationDiv.style.display = 'none';
            validationDiv.className = '';
        }
    }

    // Documentation editing functions
    function handleDocumentationTypeChange(type) {
        const contentGroup = document.getElementById('documentation-content-group');
        const inputContainer = document.getElementById('documentation-input-container');
        
        if (!contentGroup || !inputContainer) return;
        
        if (type === '') {
            contentGroup.style.display = 'none';
            return;
        }
        
        contentGroup.style.display = 'block';
        
        let inputHTML = '';
        switch (type) {
            case 'markdown':
                inputHTML = `
                    <textarea id="template-documentation" rows="15" placeholder="# 模板標題\n\n## 功能簡介\n...\n\n## 模板內容\n...\n\n## 範例輸入\n...\n\n## 範例輸出\n..."></textarea>
                `;
                break;
            case 'file':
                inputHTML = `
                    <input type="text" id="template-documentation" placeholder="例如：./docs/hello-world.md 或 /path/to/doc.md">
                    <div class="form-help">請輸入 .md 檔案的相對或絕對路徑</div>
                `;
                break;
            case 'url':
                inputHTML = `
                    <input type="url" id="template-documentation" placeholder="例如：https://example.com/documentation.html">
                    <div class="form-help">請輸入外部網頁的完整 URL</div>
                `;
                break;
        }
        
        inputContainer.innerHTML = inputHTML;
        
        // Set existing value if editing template
        if (editingItem && editingItem.documentation) {
            const currentType = getDocumentationType(editingItem.documentation);
            if (currentType === type) {
                const input = document.getElementById('template-documentation');
                if (input) {
                    input.value = editingItem.documentation;
                }
            }
        }
    }
    
    function getDocumentationType(documentation) {
        if (!documentation) return '';
        
        // Check for URL
        if (documentation.startsWith('http://') || documentation.startsWith('https://')) {
            return 'url';
        }
        
        // Check for file path - must be a simple path, not multiline content
        const isLikelyFilePath = documentation.length < 500 && 
                                !documentation.includes('\n') && 
                                !documentation.includes('\r') &&
                                (documentation.endsWith('.md') || 
                                 (documentation.includes('/') || documentation.includes('\\')) &&
                                 !documentation.startsWith('#')); // Markdown usually starts with #
        
        if (isLikelyFilePath) {
            return 'file';
        }
        
        return 'markdown';
    }
    
    function generateDocumentationTemplate() {
        const titleInput = document.getElementById('template-title');
        const descriptionInput = document.getElementById('template-description');
        const codeInput = document.getElementById('template-code');
        const languageSelect = document.getElementById('template-language');
        const docInput = document.getElementById('template-documentation');
        
        if (!titleInput || !descriptionInput || !codeInput || !languageSelect || !docInput) return;
        
        const title = titleInput.value || '模板標題';
        const description = descriptionInput.value || '模板描述';
        const code = codeInput.value || '';
        const language = languageSelect.value || '';
        
        const template = `# ${title}

## 功能簡介
${description}

## 模板內容
\`\`\`${language}
${code}
\`\`\`

## 範例輸入
\`\`\`
(如果需要輸入，請在此提供範例輸入)
\`\`\`

## 範例輸出
\`\`\`
(請在此提供預期的程式輸出結果)
\`\`\`

## 重點說明
- 解釋關鍵概念和語法要點
- 提供注意事項和常見錯誤
- 建議延伸學習方向

## 相關模板
- 列出相關或進階的模板建議
`;
        
        docInput.value = template;
    }
    
    function previewDocumentation() {
        const docInput = document.getElementById('template-documentation');
        const typeSelect = document.getElementById('template-documentation-type');
        
        console.log('Preview documentation called');
        console.log('docInput:', docInput);
        console.log('typeSelect:', typeSelect);
        
        if (!docInput || !typeSelect) {
            if (!typeSelect) {
                showError('請先選擇說明文檔類型');
                return;
            }
            if (!docInput) {
                showError('找不到文檔輸入欄位，請先選擇說明文檔類型');
                return;
            }
            return;
        }
        
        const content = docInput.value;
        const type = typeSelect.value;
        
        console.log('Content:', content);
        console.log('Type:', type);
        
        if (!content) {
            showError('請先輸入說明文檔內容');
            return;
        }
        
        // Create a modal preview instead of new window
        showPreviewModal(content, type);
    }
    
    function showPreviewModal(content, type) {
        // Remove existing preview modal if any
        const existingModal = document.getElementById('preview-modal');
        if (existingModal) {
            existingModal.remove();
        }
        
        let previewContent;
        switch (type) {
            case 'markdown':
                // Render markdown to HTML for preview using the same logic as DocumentationProvider
                const renderedHtml = markdownToHtml(content);
                previewContent = `
                    <div class="preview-header">
                        <h2>📖 說明文檔預覽</h2>
                        <div class="preview-note">這是您的 Markdown 文檔的預覽效果</div>
                    </div>
                    <div class="documentation-content">
                        ${renderedHtml}
                    </div>
                `;
                break;
            case 'file':
                previewContent = `
                    <div class="preview-header">
                        <h2>📁 本地檔案路徑</h2>
                        <div class="preview-note">這是檔案路徑類型的預覽</div>
                    </div>
                    <div class="documentation-content">
                        <p><strong>檔案路徑：</strong> <code>${escapeHtml(content)}</code></p>
                        <p>此文檔將從指定的本地檔案載入。請確保檔案存在且可讀取。</p>
                    </div>
                `;
                break;
            case 'url':
                previewContent = `
                    <div class="preview-header">
                        <h2>🌐 外部 URL 連結</h2>
                        <div class="preview-note">這是外部連結類型的預覽</div>
                    </div>
                    <div class="documentation-content">
                        <p><strong>連結：</strong> <a href="${escapeHtml(content)}" target="_blank">${escapeHtml(content)}</a></p>
                        <p>此文檔將連結到外部網頁。用戶點擊說明按鈕時會開啟此連結。</p>
                        <p><a href="${escapeHtml(content)}" target="_blank">點擊測試連結</a></p>
                    </div>
                `;
                break;
        }
        
        // Create modal element
        const modal = document.createElement('div');
        modal.id = 'preview-modal';
        modal.innerHTML = `
            <div class="preview-modal-backdrop">
                <div class="preview-modal-content">
                    <div class="preview-modal-header">
                        <h3>文檔預覽 - ${editingItem ? escapeHtml(editingItem.title) : '新模板'}</h3>
                        <button class="preview-close-btn" title="關閉預覽">✕</button>
                    </div>
                    <div class="preview-modal-body">
                        ${previewContent}
                    </div>
                </div>
            </div>
        `;
        
        // Add to DOM
        document.body.appendChild(modal);
        
        // Add event listeners
        const backdrop = modal.querySelector('.preview-modal-backdrop');
        const closeBtn = modal.querySelector('.preview-close-btn');
        const modalContent = modal.querySelector('.preview-modal-content');
        
        // Close when clicking backdrop
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) {
                closePreviewModal();
            }
        });
        
        // Close when clicking close button
        closeBtn.addEventListener('click', closePreviewModal);
        
        // Prevent closing when clicking content
        modalContent.addEventListener('click', (e) => {
            e.stopPropagation();
        });
        
        // Close with ESC key
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                closePreviewModal();
                document.removeEventListener('keydown', handleEsc);
            }
        };
        document.addEventListener('keydown', handleEsc);
        
        // Store the handler for cleanup
        modal._escHandler = handleEsc;
        
        // Add modal styles if not already added
        if (!document.getElementById('preview-modal-styles')) {
            const style = document.createElement('style');
            style.id = 'preview-modal-styles';
            style.textContent = getPreviewModalStyles();
            document.head.appendChild(style);
        }
    }
    
    function closePreviewModal() {
        console.log('Closing preview modal'); // Debug log
        const modal = document.getElementById('preview-modal');
        if (modal) {
            // Clean up ESC key listener if stored
            if (modal._escHandler) {
                document.removeEventListener('keydown', modal._escHandler);
                console.log('ESC handler removed'); // Debug log
            }
            
            // Remove the modal element
            modal.remove();
            console.log('Preview modal removed'); // Debug log
        } else {
            console.log('Preview modal not found'); // Debug log
        }
    }
    
    function getPreviewModalStyles() {
        return `
            #preview-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .preview-modal-backdrop {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .preview-modal-content {
                background: var(--vscode-editor-background, #fff);
                color: var(--vscode-editor-foreground, #333);
                border-radius: 8px;
                max-width: 90vw;
                max-height: 90vh;
                width: 900px;
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
                display: flex;
                flex-direction: column;
            }
            
            .preview-modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 16px 20px;
                border-bottom: 1px solid var(--vscode-panel-border, #e1e4e8);
            }
            
            .preview-modal-header h3 {
                margin: 0;
                font-size: 18px;
                font-weight: 600;
            }
            
            .preview-close-btn {
                background: none;
                border: none;
                color: var(--vscode-editor-foreground, #333);
                font-size: 18px;
                cursor: pointer;
                padding: 8px;
                border-radius: 4px;
                line-height: 1;
            }
            
            .preview-close-btn:hover {
                background: var(--vscode-list-hoverBackground, #f0f0f0);
            }
            
            .preview-modal-body {
                padding: 20px;
                overflow-y: auto;
                max-height: calc(90vh - 80px);
            }
            
            /* Preview content styles */
            .preview-header {
                background: var(--vscode-editorWidget-background, #f1f3f4);
                border: 1px solid var(--vscode-panel-border, #dadce0);
                border-radius: 8px;
                padding: 16px;
                margin-bottom: 24px;
                text-align: center;
            }
            
            .preview-header h2 {
                margin: 0;
                color: var(--vscode-textLink-foreground, #1a73e8);
                border: none;
                padding: 0;
                font-size: 20px;
            }
            
            .preview-note {
                font-size: 14px;
                color: var(--vscode-descriptionForeground, #666);
                margin-top: 8px;
            }
            
            .documentation-content h1, .documentation-content h2, .documentation-content h3,
            .documentation-content h4, .documentation-content h5, .documentation-content h6 {
                margin-top: 24px;
                margin-bottom: 12px;
                font-weight: 600;
                line-height: 1.3;
                color: var(--vscode-editor-foreground, #333);
            }
            
            .documentation-content h1 { font-size: 28px; border-bottom: 2px solid var(--vscode-panel-border, #e1e4e8); padding-bottom: 8px; }
            .documentation-content h2 { font-size: 22px; border-bottom: 1px solid var(--vscode-panel-border, #e1e4e8); padding-bottom: 6px; }
            .documentation-content h3 { font-size: 18px; color: var(--vscode-textLink-foreground, #0366d6); }
            .documentation-content h4 { font-size: 16px; }
            
            .documentation-content pre {
                background: var(--vscode-textCodeBlock-background, #f6f8fa);
                border: 1px solid var(--vscode-panel-border, #e1e4e8);
                border-radius: 6px;
                padding: 16px;
                overflow-x: auto;
                margin: 16px 0;
                font-family: var(--vscode-editor-font-family, 'SF Mono', Monaco, 'Cascadia Code', 'Consolas', 'Courier New', monospace);
                font-size: 13px;
                line-height: 1.5;
            }
            
            .documentation-content pre code {
                background: none;
                padding: 0;
                border-radius: 0;
                font-size: inherit;
            }
            
            .documentation-content code {
                background: var(--vscode-textCodeBlock-background, #f6f8fa);
                padding: 2px 6px;
                border-radius: 3px;
                font-family: var(--vscode-editor-font-family, 'SF Mono', Monaco, 'Cascadia Code', 'Consolas', 'Courier New', monospace);
                font-size: 0.9em;
            }
            
            .documentation-content ul, .documentation-content ol { margin: 12px 0; padding-left: 24px; }
            .documentation-content li { margin: 6px 0; }
            .documentation-content a { color: var(--vscode-textLink-foreground, #0366d6); text-decoration: underline; }
            .documentation-content a:hover { color: var(--vscode-textLink-activeForeground, #0366d6); }
            .documentation-content p { margin: 12px 0; }
        `;
    }
    
    // Markdown to HTML conversion (same logic as DocumentationProvider)
    function markdownToHtml(markdown) {
        // Simple markdown to HTML conversion
        let html = markdown;
        
        // Headers
        html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');
        html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
        html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');
        
        // Code blocks
        html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
            const language = lang || '';
            return `<pre><code class="language-${language}">${escapeHtml(code.trim())}</code></pre>`;
        });
        
        // Inline code
        html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
        
        // Bold and italic
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        // Links
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
        
        // Lists
        html = html.replace(/^- (.*$)/gm, '<li>$1</li>');
        html = html.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');
        
        // Paragraphs
        html = html.replace(/\n\n/g, '</p><p>');
        html = '<p>' + html + '</p>';
        
        // Clean up empty paragraphs
        html = html.replace(/<p><\/p>/g, '');
        html = html.replace(/<p>(<h[1-6]>)/g, '$1');
        html = html.replace(/(<\/h[1-6]>)<\/p>/g, '$1');
        html = html.replace(/<p>(<pre>)/g, '$1');
        html = html.replace(/(<\/pre>)<\/p>/g, '$1');
        html = html.replace(/<p>(<ul>)/g, '$1');
        html = html.replace(/(<\/ul>)<\/p>/g, '$1');
        
        return html;
    }
    
    function handleJsonImport() {
        const validation = validateJsonInput();
        
        if (!validation.valid || !validation.data) {
            showError('請輸入有效的JSON格式');
            return;
        }

        const templates = Array.isArray(validation.data) ? validation.data : [validation.data];
        
        // Send batch create message to backend
        vscode.postMessage({
            type: 'batchCreateTemplates',
            templates: templates
        });

        closeJsonModal();
    }

    // Utility function to show error messages
    function showError(message) {
        console.error('Template Manager Error:', message);
        vscode.postMessage({
            type: 'showError',
            message: message
        });
    }

    // Message listener
    window.addEventListener('message', handleMessage);

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();