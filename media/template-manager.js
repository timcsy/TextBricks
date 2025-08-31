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

    // Message listener
    window.addEventListener('message', handleMessage);

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();