// TextBricks Manager JavaScript

(function() {
    const vscode = acquireVsCodeApi();

    // 使用共享工具函數（從 utils.js）
    // 確保 TextBricksUtils 已載入
    const utils = window.TextBricksUtils || {};
    const escapeHtml = utils.escapeHtml || (text => text);
    const renderMarkdown = utils.renderMarkdown || (text => text);
    const formatDate = utils.formatDate || (date => String(date));
    const showLoading = utils.showLoading || (() => {});

    // State
    let currentData = {
        // 傳統數據
        templates: [],
        languages: [],

        // 新的數據結構
        scope: {
            current: null,
            available: [],
            usageStats: null,
            favorites: []
        },
        topics: {
            hierarchy: null,
            statistics: null
        }
    };
    let currentTab = 'overview';
    let editingItem = null;
    let currentScope = null;
    let selectedTreeItem = null; // Track currently selected tree item

    // Initialize
    function init() {
        setupEventListeners();
        loadData();
        console.log('TextBricks Manager initialized');
    }

    function setupEventListeners() {
        // Tab navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', handleTabSwitch);
        });

        // Toolbar buttons - check if elements exist first
        const refreshBtn = document.getElementById('refresh-btn');
        const importBtn = document.getElementById('import-btn');
        const exportBtn = document.getElementById('export-btn');

        if (refreshBtn) refreshBtn.addEventListener('click', loadData);
        if (importBtn) importBtn.addEventListener('click', importTemplates);
        if (exportBtn) exportBtn.addEventListener('click', exportTemplates);

        // Quick action buttons - check if elements exist first
        const createTemplateBtn = document.getElementById('create-template-btn');
        const createTopicBtn = document.getElementById('create-topic-btn');
        const createLinkBtn = document.getElementById('create-link-btn');
        const createLanguageBtn = document.getElementById('create-language-btn');

        if (createTemplateBtn) createTemplateBtn.addEventListener('click', () => openModal('template'));
        if (createTopicBtn) createTopicBtn.addEventListener('click', () => openModal('topic'));
        if (createLinkBtn) createLinkBtn.addEventListener('click', () => openModal('link'));
        if (createLanguageBtn) createLanguageBtn.addEventListener('click', () => openModal('language'));

        // Scope management buttons
        const scopeSelector = document.getElementById('scope-selector');
        if (scopeSelector) {
            scopeSelector.addEventListener('change', handleScopeSwitch);
        }

        const createScopeBtn = document.getElementById('create-scope-btn');
        if (createScopeBtn) {
            createScopeBtn.addEventListener('click', () => openModal('scope'));
        }

        const exportScopeBtn = document.getElementById('export-scope-btn');
        if (exportScopeBtn) {
            exportScopeBtn.addEventListener('click', exportScope);
        }

        const importScopeBtn = document.getElementById('import-scope-btn');
        if (importScopeBtn) {
            importScopeBtn.addEventListener('click', importScope);
        }

        const clearStatsBtn = document.getElementById('clear-stats-btn');
        if (clearStatsBtn) {
            clearStatsBtn.addEventListener('click', clearUsageStats);
        }
        
        // JSON import button - check if exists first
        const jsonImportBtn = document.getElementById('json-import-btn');
        if (jsonImportBtn) {
            jsonImportBtn.addEventListener('click', openJsonModal);
        }

        // Content management filters and search
        const contentLangFilter = document.getElementById('content-filter-language');
        const contentTopicFilter = document.getElementById('content-filter-topic');
        const contentSearch = document.getElementById('search-content');

        if (contentLangFilter) {
            contentLangFilter.addEventListener('change', updateContentFilters);
        }
        if (contentTopicFilter) {
            contentTopicFilter.addEventListener('change', updateContentFilters);
        }
        if (contentSearch) {
            contentSearch.addEventListener('input', updateContentFilters);
        }

        // Legacy filters for backward compatibility
        const legacyLangFilter = document.getElementById('filter-language');
        const legacySearch = document.getElementById('search-templates');

        if (legacyLangFilter) {
            legacyLangFilter.addEventListener('change', applyFilters);
        }
        if (legacySearch) {
            legacySearch.addEventListener('input', applyFilters);
        }

        // Favorites filters
        const favLangFilter = document.getElementById('favorites-filter-language');
        const favTopicFilter = document.getElementById('favorites-filter-topic');
        const favSearch = document.getElementById('search-favorites');

        if (favLangFilter) {
            favLangFilter.addEventListener('change', () => {
                if (currentTab === 'favorites') updateFavoritesList();
            });
        }

        if (favTopicFilter) {
            favTopicFilter.addEventListener('change', () => {
                if (currentTab === 'favorites') updateFavoritesList();
            });
        }

        if (favSearch) {
            favSearch.addEventListener('input', () => {
                if (currentTab === 'favorites') updateFavoritesList();
            });
        }

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

        // Settings/Data Location Management
        const refreshLocationInfoBtn = document.getElementById('refresh-location-info-btn');
        const openLocationBtn = document.getElementById('open-location-btn');
        const validateCustomPathBtn = document.getElementById('validate-custom-path-btn');
        const customPathInput = document.getElementById('custom-path-input');
        const applyCustomLocationBtn = document.getElementById('apply-custom-location-btn');
        const resetToSystemDefaultBtn = document.getElementById('reset-to-system-default-btn');

        if (refreshLocationInfoBtn) {
            refreshLocationInfoBtn.addEventListener('click', refreshDataLocationInfo);
        }
        if (openLocationBtn) {
            openLocationBtn.addEventListener('click', openDataLocation);
        }
        if (validateCustomPathBtn) {
            validateCustomPathBtn.addEventListener('click', validateCustomPath);
        }
        if (customPathInput) {
            customPathInput.addEventListener('input', () => {
                // Enable apply button only if path is not empty
                if (applyCustomLocationBtn) {
                    applyCustomLocationBtn.disabled = !customPathInput.value.trim();
                }
            });
        }
        if (applyCustomLocationBtn) {
            applyCustomLocationBtn.addEventListener('click', applyCustomLocation);
        }
        if (resetToSystemDefaultBtn) {
            resetToSystemDefaultBtn.addEventListener('click', resetToSystemDefault);
        }

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
            if (e.target.id === 'topic-documentation-type') {
                handleTopicDocumentationTypeChange(e.target.value);
            }
        });
        
        document.addEventListener('click', function(e) {
            if (e.target.id === 'generate-doc-template') {
                generateDocumentationTemplate();
            } else if (e.target.id === 'preview-documentation') {
                previewDocumentation();
            } else if (e.target.id === 'generate-topic-doc-template') {
                generateTopicDocumentationTemplate();
            } else if (e.target.id === 'preview-topic-documentation') {
                previewTopicDocumentation();
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

        // Event delegation for topic input changes
        document.addEventListener('input', function(e) {
            if (e.target.id === 'template-topic') {
                handleTopicInputChange(e.target.value);
            }
        });

        // Event delegation for topic selection changes
        document.addEventListener('change', function(e) {
            if (e.target.id === 'template-topic') {
                handleTopicSelectChange(e.target.value);
            }
        });

        // Event delegation for create topic button
        document.addEventListener('click', function(e) {
            if (e.target.id === 'create-topic-from-template') {
                e.preventDefault();
                handleCreateTopicFromTemplate();
            }
        });
    }

    // Button click handler
    function handleButtonClick(event) {
        const button = event.target.closest('button[data-action], #create-first-template-btn, #create-first-topic-btn, #create-first-language-btn');
        if (!button) return;

        // Handle special "create first" buttons
        if (button.id === 'create-first-template-btn') {
            openModal('template');
            return;
        }
        if (button.id === 'create-first-topic-btn') {
            openModal('topic');
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
            case 'edit-topic':
                const topicId = button.dataset.topicId;
                editTopic(topicId);
                break;
            case 'delete-topic':
                const deleteTopicId = button.dataset.topicId;
                deleteTopic(deleteTopicId);
                break;
            case 'view-topic-doc':
                const viewTopicId = button.dataset.topicId;
                viewTopicDocumentation(viewTopicId);
                break;
            case 'edit-language':
                const languageId = button.dataset.languageId;
                editLanguage(languageId);
                break;
            case 'create-template-in-topic':
                const createTopicId = button.dataset.topicId;
                createTemplateInTopic(createTopicId);
                break;
            case 'use-template':
                const useTemplateId = button.dataset.templateId;
                useTemplate(useTemplateId);
                break;
            case 'show-template-details':
                const showTemplateId = button.dataset.templateId;
                showTemplateDetails(showTemplateId);
                break;
            case 'open-modal':
                const modalType = button.dataset.modalType;
                openModal(modalType);
                break;
            case 'toggle-favorite':
                const favoriteTopicId = button.dataset.topicId;
                toggleFavorite(favoriteTopicId);
                break;
            case 'view-template':
                const viewTemplateId = button.dataset.templateId;
                viewTemplate(viewTemplateId);
                break;
            case 'remove-from-favorites':
                const removeItemId = button.dataset.itemId;
                removeFromFavorites(removeItemId);
                break;
            case 'render-content-tree':
                renderContentTree();
                break;
            case 'view-documentation':
                const docTemplateId = button.dataset.templateId;
                showDocumentationModal(docTemplateId);
                break;
            case 'view-topic-documentation':
                const docTopicId = button.dataset.topicId;
                showTopicDocumentationModal(docTopicId);
                break;
        }
    }

    // Data loading
    function loadData() {
        console.log('Starting to load data...');
        showLoading(true);
        vscode.postMessage({ type: 'loadData' });
    }

    function handleMessage(event) {
        const message = event.data;
        console.log('Received message:', message);

        switch (message.type) {
            case 'dataLoaded':
                currentData = message.data || {};
                console.log('Data loaded:', currentData);

                // 確保數據結構完整性
                currentData.templates = currentData.templates || [];
                currentData.languages = currentData.languages || [];

                if (!currentData.scope) {
                    currentData.scope = {
                        current: { id: 'local', name: '本機範圍', type: 'local' },
                        available: [{ id: 'local', name: '本機範圍', type: 'local' }],
                        usageStats: null,
                        favorites: []
                    };
                }

                if (!currentData.topics) {
                    currentData.topics = {
                        hierarchy: null,
                        statistics: { totalTopics: 0, activeTopics: 0 }
                    };
                }

                // 更新當前 scope 引用
                currentScope = currentData.scope.current;

                showLoading(false);
                updateScopeSelector();
                updateFilters();
                renderCurrentTab();

                // If template modal is open, refresh topic list
                const modal = document.getElementById('modal');
                if (modal && modal.classList.contains('active') && modal.dataset.type === 'template') {
                    const topicSelect = document.getElementById('template-topic');
                    if (topicSelect) {
                        const currentValue = topicSelect.value;
                        // Regenerate topic options
                        const options = getExistingTopics().map(topicName => {
                            return `<option value="${escapeHtml(topicName)}" ${currentValue === topicName ? 'selected' : ''}>${escapeHtml(getTopicDisplayName(topicName))}</option>`;
                        }).join('');
                        topicSelect.innerHTML = `<option value="">選擇現有主題...</option>${options}`;
                        if (currentValue) {
                            topicSelect.value = currentValue;
                        }
                    }
                }
                break;

            // 資料位置管理訊息處理
            case 'dataLocationInfo':
                updateCurrentLocationInfo(message.data);
                break;

            case 'availableLocations':
                updateAvailableLocations(message.data);
                break;

            case 'pathValidationResult':
                showValidationResult(message.data);
                break;

            case 'dataLocationChanged':
                // 重新整理資料位置資訊
                refreshDataLocationInfo();
                vscode.postMessage({
                    type: 'showInfo',
                    message: '資料位置已成功變更'
                });
                break;

            case 'dataLocationReset':
                // 重新整理資料位置資訊
                refreshDataLocationInfo();
                vscode.postMessage({
                    type: 'showInfo',
                    message: '已重設為系統預設位置'
                });
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
            case 'overview':
                renderOverview();
                break;
            case 'content':
                renderContentManagement();
                break;
            case 'templates':
                // Backward compatibility - redirect to content
                currentTab = 'content';
                showTab('content');
                renderContentManagement();
                break;
            case 'topics':
                // Backward compatibility - redirect to content
                currentTab = 'content';
                showTab('content');
                renderContentManagement();
                break;
            case 'languages':
                renderLanguages();
                break;
            case 'favorites':
                renderFavoritesTab();
                break;
            case 'stats':
                renderStatsTab();
                break;
            case 'settings':
                renderSettingsTab();
                break;
        }
    }

    function renderTemplates() {
        const container = document.getElementById('templates-list');
        const templates = getFilteredTemplates();

        // Render topics statistics
        renderTopicsStats();

        if (templates.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: var(--vscode-descriptionForeground);">
                    <p>沒有找到符合條件的模板</p>
                    <button class="btn btn-primary" id="create-first-template-btn">
                        <span class="icon">＋</span> 創建第一個模板
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = templates.map(template => {
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
                        <span class="tag topic">${template.topic ? escapeHtml(getTopicDisplayName(template.topic)) : '未知主題'}</span>
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

    function renderTopicsStats() {
        const statsContainer = document.getElementById('topics-stats');
        if (!statsContainer) return;

        const topicsStats = getTopicsStatistics();

        if (topicsStats.length === 0) {
            statsContainer.innerHTML = `
                <div class="stats-card">
                    <h4>主題統計</h4>
                    <p style="color: var(--vscode-descriptionForeground);">尚無模板，主題統計將在創建模板後顯示。</p>
                </div>
            `;
            return;
        }

        const statsHtml = topicsStats.map(stat => `
            <div class="topic-stat-item">
                <span class="topic-name">${escapeHtml(getTopicDisplayName(stat.topic))}</span>
                <span class="topic-count">${stat.count} 個模板</span>
            </div>
        `).join('');

        statsContainer.innerHTML = `
            <div class="stats-card">
                <h4>主題統計 (${topicsStats.length} 個主題)</h4>
                <div class="topics-stats-list">
                    ${statsHtml}
                </div>
            </div>
        `;
    }

    function getTopicsStatistics() {
        if (!currentData.templates) return [];

        const topicCounts = {};
        currentData.templates.forEach(template => {
            const topic = template.topic || '未知主題';
            topicCounts[topic] = (topicCounts[topic] || 0) + 1;
        });

        return Object.entries(topicCounts)
            .map(([topic, count]) => ({ topic, count }))
            .sort((a, b) => b.count - a.count); // 按模板數量降序排列
    }

    function renderTopics() {
        const container = document.getElementById('topics-list');

        // Extract topics from the hierarchy structure
        let topics = [];
        if (currentData.topics?.hierarchy?.topicsMap) {
            if (currentData.topics.hierarchy.topicsMap instanceof Map) {
                topics = Array.from(currentData.topics.hierarchy.topicsMap.values());
            } else if (typeof currentData.topics.hierarchy.topicsMap === 'object') {
                topics = Object.values(currentData.topics.hierarchy.topicsMap);
            }
        }

        // Fallback to topic lookup cache if available
        if (topics.length === 0 && window.topicLookup && window.topicLookup.size > 0) {
            topics = Array.from(window.topicLookup.values());
        }

        if (topics.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: var(--vscode-descriptionForeground);">
                    <p>沒有主題</p>
                    <button class="btn btn-primary" id="create-first-topic-btn">
                        <span class="icon">＋</span> 創建第一個主題
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = topics.map(topic => {
            // 使用改進的模板匹配邏輯來計算模板數量
            const topicName = topic.name;
            const possibleMatches = [
                topicName,
                topic.id,
            ];
            if (topic.parent) {
                possibleMatches.push(`${topic.parent}/${topicName}`);
            }

            const templateCount = currentData.templates.filter(t => {
                return possibleMatches.some(match =>
                    t.topic === match ||
                    t.topic.endsWith(`/${topicName}`) ||
                    t.topic === topicName
                );
            }).length;

            return `
                <div class="data-item">
                    <div class="data-item-header">
                        <h3 class="data-item-title">${escapeHtml(topic.displayName || topic.name)}</h3>
                        <div class="data-item-actions">
                            <button class="btn btn-secondary" data-action="edit-topic" data-topic-id="${topic.id}">
                                <span class="icon">✏️</span> 編輯
                            </button>
                            <button class="btn btn-danger" data-action="delete-topic" data-topic-id="${topic.id}">
                                <span class="icon">🗑️</span> 刪除
                            </button>
                        </div>
                    </div>

                    <div class="data-item-meta">
                        ID: ${topic.id} • 包含 ${templateCount} 個模板
                        ${topic.createdAt ? `• 創建時間: ${new Date(topic.createdAt).toLocaleDateString()}` : ''}
                    </div>

                    <div class="data-item-description">
                        ${escapeHtml(topic.description)}
                    </div>

                    <div class="topic-details">
                        <div class="topic-details-row">
                            ${topic.color || topic.icon ? `
                                <div class="topic-info-tags">
                                    ${topic.icon ? `<span class="topic-info-tag topic-icon-tag">${topic.icon}</span>` : ''}
                                    ${topic.color ? `<span class="topic-info-tag topic-color-tag" style="background-color: ${topic.color}; color: white;">${topic.color}</span>` : ''}
                                </div>
                            ` : ''}

                            ${topic.documentation ? `
                                <button class="btn btn-info btn-small" data-action="view-topic-doc" data-topic-id="${topic.id}">
                                    <span class="icon">📖</span> 查看詳細說明
                                </button>
                            ` : ''}
                        </div>
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
                        <span class="icon">＋</span> 添加第一個語言
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
        // Update language filter for templates
        const languageFilter = document.getElementById('filter-language');
        if (languageFilter) {
            languageFilter.innerHTML = '<option value="">所有語言</option>' +
                currentData.languages.map(lang => `<option value="${lang.id}">${escapeHtml(lang.displayName)}</option>`).join('');
        }

        // Update favorites filters
        const favLangFilter = document.getElementById('favorites-filter-language');
        if (favLangFilter) {
            favLangFilter.innerHTML = '<option value="">所有語言</option>' +
                currentData.languages.map(lang => `<option value="${lang.id}">${escapeHtml(lang.displayName)}</option>`).join('');
        }

        const favTopicFilter = document.getElementById('favorites-filter-topic');
        if (favTopicFilter) {
            const topics = [...new Set(currentData.templates.map(t => t.topic))].filter(Boolean);
            favTopicFilter.innerHTML = '<option value="">所有主題</option>' +
                topics.map(topic => `<option value="${escapeHtml(topic)}">${escapeHtml(getTopicDisplayName(topic))}</option>`).join('');
        }
    }

    function getFilteredTemplates() {
        const languageFilter = document.getElementById('filter-language').value;
        const searchText = document.getElementById('search-templates').value.toLowerCase();

        return currentData.templates.filter(template => {
            // Language filter
            if (languageFilter && template.language !== languageFilter) return false;

            // Search filter
            if (searchText) {
                const searchableText = (template.title + ' ' + template.description + ' ' + template.code + ' ' + (template.topic || '')).toLowerCase();
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
            case 'topic':
                titleText = item ? '編輯主題' : '創建新主題';
                bodyHTML = getTopicForm(item);
                break;
            case 'link':
                titleText = item ? '編輯連結' : '創建新連結';
                bodyHTML = getLinkForm(item);
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

        // Special handling for topic modal - set documentation type and content
        if (type === 'topic' && item && item.documentation) {
            setTimeout(() => {
                const docTypeSelect = document.getElementById('topic-documentation-type');
                if (docTypeSelect) {
                    const docType = getDocumentationType(item.documentation);
                    docTypeSelect.value = docType;
                    handleTopicDocumentationTypeChange(docType);
                }
            }, 50);
        }

        // Initialize topic selection if editing template
        if (type === 'template' && item && item.topic) {
            setTimeout(() => {
                const select = document.getElementById('template-topic');
                if (select) {
                    // Check if topic exists in options
                    const optionExists = Array.from(select.options).some(opt => opt.value === item.topic);
                    if (optionExists) {
                        select.value = item.topic;
                    } else {
                        // Topic doesn't exist in options, add it as an option
                        const newOption = document.createElement('option');
                        newOption.value = item.topic;
                        newOption.textContent = getTopicDisplayName(item.topic);
                        newOption.selected = true;
                        select.appendChild(newOption);
                    }

                    // Trigger change to show hint
                    handleTopicSelectChange(select.value);
                }
            }, 50);
        }

        // Special handling for link modal - setup target options
        if (type === 'link') {
            setTimeout(() => {
                initializeLinkForm();

                // Set current topic display info
                const currentTopicDisplay = document.getElementById('current-topic-display');
                if (currentTopicDisplay) {
                    // TODO: Get current selected topic from context
                    currentTopicDisplay.textContent = '將自動設定為當前選擇的主題';
                }

                // Add browse button event listener
                const browseBtn = document.getElementById('browse-target-btn');
                if (browseBtn) {
                    browseBtn.addEventListener('click', openTargetBrowser);
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
                    <label for="template-topic">主題 *</label>
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <select id="template-topic" style="flex: 1;" required>
                            <option value="">選擇現有主題...</option>
                            ${getExistingTopics().map(topicName => {
                                return `<option value="${escapeHtml(topicName)}" ${template && template.topic === topicName ? 'selected' : ''}>${escapeHtml(getTopicDisplayName(topicName))}</option>`;
                            }).join('')}
                        </select>
                        <button type="button" id="create-topic-from-template" class="btn btn-secondary btn-small">+ 新增主題</button>
                    </div>
                    <div class="form-help">可選擇現有主題或點擊「新增主題」創建新主題。</div>
                    <div id="topic-description-hint" style="font-size: 12px; color: var(--vscode-descriptionForeground); margin-top: 5px; padding: 8px; background: var(--vscode-editorWidget-background); border-radius: 4px; display: none;"></div>
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


    function getTopicForm(topic) {
        return `
            <div class="form-group">
                <label for="topic-name">主題名稱 *</label>
                <input type="text" id="topic-name" value="${topic ? escapeHtml(topic.name) : ''}" required>
                <div class="form-help">主題的顯示名稱，如：基礎、進階、演算法</div>
            </div>

            <div class="form-group">
                <label for="topic-description">主題簡介 *</label>
                <textarea id="topic-description" rows="2" required>${topic ? escapeHtml(topic.description) : ''}</textarea>
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

    function getLinkForm(link) {
        return `
            <div class="form-group">
                <label for="link-id">連結 ID *</label>
                <input type="text" id="link-id" value="${link ? escapeHtml(link.id) : ''}" required>
                <div class="form-help">連結的唯一識別符，如：advanced-pointer-link</div>
            </div>

            <div class="form-group">
                <label for="link-title">連結標題 *</label>
                <input type="text" id="link-title" value="${link ? escapeHtml(link.title) : ''}" required>
                <div class="form-help">連結的顯示標題，如：Python 基礎、進階指標教學</div>
            </div>

            <div class="form-group">
                <label for="link-target">目標路徑 *</label>
                <div class="target-selector-container">
                    <select id="link-target" required>
                        <option value="">選擇目標...</option>
                    </select>
                    <button type="button" id="browse-target-btn" class="btn btn-secondary btn-small">
                        <span class="icon">🗂️</span> 瀏覽
                    </button>
                </div>
                <div class="form-help">選擇連結要指向的主題或子主題，或點擊「瀏覽」以樹狀結構選擇</div>
            </div>

            <div class="form-group">
                <label for="link-language">關聯語言</label>
                <select id="link-language">
                    <option value="">自動偵測...</option>
                    ${getExistingLanguages().map(lang => {
                        return `<option value="${lang.id}" ${link && link.language === lang.id ? 'selected' : ''}>${escapeHtml(lang.displayName)}</option>`;
                    }).join('')}
                </select>
                <div class="form-help">指定這個連結關聯的程式語言（選填）</div>
            </div>

            <div class="form-group">
                <label for="link-description">連結描述 *</label>
                <textarea id="link-description" rows="2" required>${link ? escapeHtml(link.description) : ''}</textarea>
                <div class="form-help">描述這個連結的用途，如：快速跳轉到進階指標主題</div>
            </div>

            <div class="current-topic-info">
                <p><strong>將保存到主題：</strong>
                   <select id="current-topic-selector" required>
                       <option value="">選擇主題...</option>
                   </select>
                </p>
                <div class="form-help">此連結將會新增到選擇的主題的 links 資料夾中</div>
            </div>
        `;
    }

    // Initialize link form with target options
    function initializeLinkForm() {
        const targetSelect = document.getElementById('link-target');
        const currentTopicSelector = document.getElementById('current-topic-selector');

        if (!targetSelect || !currentTopicSelector) return;

        // Clear existing options
        targetSelect.innerHTML = '<option value="">選擇目標...</option>';
        currentTopicSelector.innerHTML = '<option value="">選擇主題...</option>';

        // Get all available topics from the hierarchy
        const allTopics = getAllAvailableTopics();

        // Populate target options (all topics and templates)
        allTopics.forEach(topic => {
            const optionElement = document.createElement('option');
            optionElement.value = topic.path;
            optionElement.textContent = topic.fullDisplayPath;
            targetSelect.appendChild(optionElement);
        });

        // Populate current topic selector (only topics, not templates)
        const topicsOnly = allTopics.filter(topic => !topic.isTemplate);
        topicsOnly.forEach(topic => {
            const optionElement = document.createElement('option');
            optionElement.value = topic.path;
            optionElement.textContent = topic.fullDisplayPath;
            currentTopicSelector.appendChild(optionElement);
        });
    }

    // Get all available topics with their paths for link targets
    function getAllAvailableTopics() {
        const topics = [];

        if (currentData && currentData.topics && currentData.topics.hierarchy) {
            // Use hierarchy.roots instead of topicsMap
            const collectTopicsFromHierarchy = (nodes) => {
                nodes.forEach(node => {
                    if (node.topic) {
                        const topic = node.topic;
                        const path = topic.path ? topic.path.join('/') : topic.name;
                        // Generate full display path using displayNames
                        const fullDisplayPath = getTopicPath(topic);

                        topics.push({
                            path: path,
                            displayName: topic.displayName,
                            fullDisplayPath: fullDisplayPath,
                            name: topic.name,
                            id: topic.id
                        });

                        // Also add templates for this topic
                        const templates = getTemplatesForTopic(topic);
                        templates.forEach(template => {
                            const templatePath = `${path}/templates/${template.id}`;
                            // Display path without "templates" - just show as part of the topic
                            const templateDisplayPath = `${fullDisplayPath}/${template.title}`;

                            topics.push({
                                path: templatePath,
                                displayName: `📄 ${template.title}`,
                                fullDisplayPath: templateDisplayPath,
                                name: template.id,
                                id: template.id,
                                isTemplate: true
                            });
                        });
                    }

                    // Recursively collect from children
                    if (node.children && node.children.length > 0) {
                        collectTopicsFromHierarchy(node.children);
                    }
                });
            };

            if (currentData.topics.hierarchy.roots) {
                collectTopicsFromHierarchy(currentData.topics.hierarchy.roots);
            }
        }

        return topics.sort((a, b) => a.fullDisplayPath.localeCompare(b.fullDisplayPath));
    }

    // Open target browser modal
    function openTargetBrowser() {
        const browserModal = document.createElement('div');
        browserModal.className = 'modal active target-browser-modal';
        browserModal.innerHTML = `
            <div class="modal-backdrop"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h2>選擇目標主題</h2>
                    <button class="modal-close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="target-browser-content">
                        <div class="browser-tree" id="target-browser-tree">
                            <div class="loading">載入中...</div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" id="cancel-target-btn">取消</button>
                    <button class="btn btn-primary" id="select-target-btn" disabled>選擇</button>
                </div>
            </div>
        `;

        document.body.appendChild(browserModal);

        // Add event listeners for modal buttons
        const closeBtn = browserModal.querySelector('.modal-close-btn');
        const cancelBtn = browserModal.querySelector('#cancel-target-btn');
        const modalBackdrop = browserModal.querySelector('.modal-backdrop');

        if (closeBtn) {
            closeBtn.addEventListener('click', closeTargetBrowser);
        }
        if (cancelBtn) {
            cancelBtn.addEventListener('click', closeTargetBrowser);
        }
        if (modalBackdrop) {
            modalBackdrop.addEventListener('click', closeTargetBrowser);
        }

        // Load topic tree
        setTimeout(() => {
            loadTargetBrowserTree();
        }, 100);
    }

    // Close target browser modal
    window.closeTargetBrowser = function() {
        const browserModal = document.querySelector('.target-browser-modal');
        if (browserModal) {
            browserModal.remove();
        }
    }

    // Load the topic tree for browsing
    function loadTargetBrowserTree() {
        const treeContainer = document.getElementById('target-browser-tree');
        if (!treeContainer) {
            console.error('Tree container not found!');
            return;
        }

        console.log('=== DEBUGGING TARGET BROWSER ===');
        console.log('currentData:', currentData);
        console.log('currentData.topics:', currentData?.topics);
        console.log('currentData.topics.hierarchy:', currentData?.topics?.hierarchy);
        console.log('currentData.templates:', currentData?.templates);

        let treeHTML = '';

        if (currentData && currentData.topics && currentData.topics.hierarchy) {
            console.log('Hierarchy structure:', JSON.stringify(currentData.topics.hierarchy, null, 2));
            console.log('Hierarchy properties:', Object.keys(currentData.topics.hierarchy));
            console.log('Building hierarchy HTML...');
            treeHTML = buildTopicHierarchyHTML();
            console.log('Final HTML length:', treeHTML.length);

        } else {
            console.log('No hierarchy data available');
            treeHTML = `
                <div class="debug-info">
                    <p>除錯資訊：</p>
                    <p>currentData: ${currentData ? '存在' : '不存在'}</p>
                    <p>currentData.topics: ${currentData?.topics ? '存在' : '不存在'}</p>
                    <p>currentData.topics.hierarchy: ${currentData?.topics?.hierarchy ? '存在' : '不存在'}</p>
                </div>
            `;
        }

        treeContainer.innerHTML = treeHTML;
        console.log('Tree container updated with HTML');

        // Add event listeners to tree items after HTML is set
        addTreeEventListeners();
    }

    // Add event listeners to tree items
    function addTreeEventListeners() {
        const treeContainer = document.getElementById('target-browser-tree');
        if (!treeContainer) return;

        // Add click listeners for tree items (topic and template selection)
        treeContainer.querySelectorAll('.tree-item').forEach(item => {
            item.addEventListener('click', function(event) {
                // Don't select if clicking on toggle button
                if (event.target.classList.contains('tree-toggle')) {
                    return;
                }
                selectTarget(this);
            });
        });

        // Add click listeners for toggle buttons
        treeContainer.querySelectorAll('.tree-toggle').forEach(toggle => {
            toggle.addEventListener('click', function(event) {
                event.stopPropagation();
                toggleTopicNode(this, event);
            });
        });
    }

    // Build HTML for the topic hierarchy with templates
    function buildTopicHierarchyHTML() {
        const hierarchy = currentData.topics.hierarchy;
        let html = '';

        console.log('Using hierarchy.roots:', hierarchy.roots);

        if (hierarchy.roots && hierarchy.roots.length > 0) {
            // Build tree from roots array
            hierarchy.roots.forEach(rootNode => {
                html += renderTopicNodeFromHierarchy(rootNode, 0);
            });
        }

        console.log('Generated HTML:', html);
        return html;
    }

    // Render a topic node from hierarchy structure with its subtopics and templates
    function renderTopicNodeFromHierarchy(hierarchyNode, depth) {
        if (!hierarchyNode || !hierarchyNode.topic) {
            return '';
        }

        const topic = hierarchyNode.topic;
        const children = hierarchyNode.children || [];
        const indent = depth * 20;
        const hasChildren = children.length > 0;

        let html = `
            <div class="tree-node" style="margin-left: ${indent}px">
                <div class="tree-item topic-item" data-path="${getTopicPath(topic)}" data-type="topic">
                    ${hasChildren ? `<span class="tree-toggle">▼</span>` : '<span class="tree-spacer"></span>'}
                    <span class="tree-icon">🏷️</span>
                    <span class="tree-label">${topic.displayName}</span>
                </div>
                <div class="tree-children">
        `;

        // Add templates for this topic
        const templates = getTemplatesForTopic(topic);
        templates.forEach(template => {
            html += `
                <div class="tree-item template-item" data-path="${getTopicPath(topic)}/templates/${template.id}" data-type="template" style="margin-left: ${indent + 20}px">
                    <span class="tree-spacer"></span>
                    <span class="tree-icon">📄</span>
                    <span class="tree-label">${template.title}</span>
                </div>
            `;
        });

        // Add children recursively
        if (hasChildren) {
            children.forEach(childNode => {
                html += renderTopicNodeFromHierarchy(childNode, depth + 1);
            });
        }

        html += `
                </div>
            </div>
        `;

        return html;
    }

    // Render a topic node with its subtopics and templates
    function renderTopicNode(topic, topicsMap, depth) {
        const indent = depth * 20;
        const hasChildren = topic.subtopics && topic.subtopics.length > 0;

        let html = `
            <div class="tree-node" style="margin-left: ${indent}px">
                <div class="tree-item topic-item" data-path="${getTopicPath(topic)}" data-type="topic" onclick="selectTarget(this)">
                    ${hasChildren ? `<span class="tree-toggle" onclick="toggleTopicNode(this, event)">▼</span>` : '<span class="tree-spacer"></span>'}
                    <span class="tree-icon">🏷️</span>
                    <span class="tree-label">${topic.displayName}</span>
                    <span class="tree-path">${getTopicPath(topic)}</span>
                </div>
                <div class="tree-children">
        `;

        // Add templates for this topic
        const templates = getTemplatesForTopic(topic);
        templates.forEach(template => {
            html += `
                <div class="tree-item template-item" data-path="${getTopicPath(topic)}/templates/${template.id}" data-type="template" onclick="selectTarget(this)" style="margin-left: ${indent + 20}px">
                    <span class="tree-spacer"></span>
                    <span class="tree-icon">📄</span>
                    <span class="tree-label">${template.title}</span>
                    <span class="tree-path">${getTopicPath(topic)}/templates/${template.id}</span>
                </div>
            `;
        });

        // Add subtopics recursively
        if (hasChildren) {
            topic.subtopics.forEach(subtopicName => {
                const subtopic = findTopicByName(subtopicName, topicsMap);
                if (subtopic) {
                    html += renderTopicNode(subtopic, topicsMap, depth + 1);
                }
            });
        }

        html += `
                </div>
            </div>
        `;

        return html;
    }

    // Render a topic node from object-based topicsMap
    function renderTopicNodeFromObject(topic, topicsMap, depth) {
        const indent = depth * 20;
        const hasChildren = topic.subtopics && topic.subtopics.length > 0;

        let html = `
            <div class="tree-node" style="margin-left: ${indent}px">
                <div class="tree-item topic-item" data-path="${getTopicPath(topic)}" data-type="topic" onclick="selectTarget(this)">
                    ${hasChildren ? `<span class="tree-toggle" onclick="toggleTopicNode(this, event)">▼</span>` : '<span class="tree-spacer"></span>'}
                    <span class="tree-icon">🏷️</span>
                    <span class="tree-label">${topic.displayName}</span>
                    <span class="tree-path">${getTopicPath(topic)}</span>
                </div>
                <div class="tree-children">
        `;

        // Add templates for this topic
        const templates = getTemplatesForTopic(topic);
        templates.forEach(template => {
            html += `
                <div class="tree-item template-item" data-path="${getTopicPath(topic)}/templates/${template.id}" data-type="template" onclick="selectTarget(this)" style="margin-left: ${indent + 20}px">
                    <span class="tree-spacer"></span>
                    <span class="tree-icon">📄</span>
                    <span class="tree-label">${template.title}</span>
                    <span class="tree-path">${getTopicPath(topic)}/templates/${template.id}</span>
                </div>
            `;
        });

        // Add subtopics recursively
        if (hasChildren) {
            topic.subtopics.forEach(subtopicName => {
                const subtopic = findTopicByNameInObject(subtopicName, topicsMap);
                if (subtopic) {
                    html += renderTopicNodeFromObject(subtopic, topicsMap, depth + 1);
                }
            });
        }

        html += `
                </div>
            </div>
        `;

        return html;
    }

    // Find topic by name in object-based topics map
    function findTopicByNameInObject(name, topicsMap) {
        return Object.values(topicsMap).find(topic => topic.name === name) || null;
    }

    // Build tree structure from templates when hierarchy is empty
    function buildTreeFromTemplates() {
        if (!currentData.templates || currentData.templates.length === 0) {
            return '<div class="no-data">沒有模板數據</div>';
        }

        console.log('Building tree from templates:', currentData.templates);

        // Group templates by language and topic
        const grouped = {};
        currentData.templates.forEach(template => {
            const language = template.language;
            const topic = template.topic || 'default';

            if (!grouped[language]) {
                grouped[language] = {};
            }
            if (!grouped[language][topic]) {
                grouped[language][topic] = [];
            }
            grouped[language][topic].push(template);
        });

        let html = '';

        // Build HTML for each language
        Object.keys(grouped).sort().forEach(language => {
            html += `
                <div class="tree-node">
                    <div class="tree-item topic-item" data-path="${language}" data-type="topic" onclick="selectTarget(this)">
                        <span class="tree-toggle" onclick="toggleTopicNode(this, event)">▼</span>
                        <span class="tree-icon">💬</span>
                        <span class="tree-label">${getLanguageDisplayName(language)}</span>
                        <span class="tree-path">${language}</span>
                    </div>
                    <div class="tree-children">
            `;

            // Add topics for this language
            Object.keys(grouped[language]).sort().forEach(topicName => {
                if (topicName !== language) { // Only show if topic is different from language
                    const topicPath = `${language}/${topicName}`;
                    const topicObj = topics.find(t => t.id === topicName || t.displayName === topicName);
                    html += `
                        <div class="tree-item topic-item" data-path="${topicPath}" data-type="topic" onclick="selectTarget(this)" style="margin-left: 20px">
                            <span class="tree-toggle" onclick="toggleTopicNode(this, event)">▼</span>
                            <span class="tree-icon">🏷️</span>
                            <span class="tree-label">${topicObj?.displayName || topicName}</span>
                            <span class="tree-path">${getDisplayPath(topicPath)}</span>
                        </div>
                        <div class="tree-children">
                    `;
                } else {
                    // Direct children for language-level templates
                    html += '<div class="tree-children">';
                }

                // Add templates
                grouped[language][topicName].forEach(template => {
                    const templatePath = `${language}/${topicName}/templates/${template.id}`;
                    const indent = topicName !== language ? 40 : 20;
                    html += `
                        <div class="tree-item template-item" data-path="${templatePath}" data-type="template" onclick="selectTarget(this)" style="margin-left: ${indent}px">
                            <span class="tree-spacer"></span>
                            <span class="tree-icon">📄</span>
                            <span class="tree-label">${template.title}</span>
                            <span class="tree-path">${templatePath}</span>
                        </div>
                    `;
                });

                if (topicName !== language) {
                    html += '</div>'; // Close topic children
                }
            });

            html += `
                    </div>
                </div>
            `;
        });

        console.log('Generated HTML from templates:', html);
        return html;
    }

    // Get language display name from language data
    function getLanguageDisplayName(languageId) {
        const languageData = currentData.languages?.find(lang => lang.id === languageId);
        return languageData?.displayName || languageId.charAt(0).toUpperCase() + languageId.slice(1);
    }

    // Get topic display name by path
    function getTopicDisplayName(topicPath) {
        if (!topicPath) return '';

        let topics = [];
        if (currentData.topics?.hierarchy?.topicsMap) {
            if (currentData.topics.hierarchy.topicsMap instanceof Map) {
                topics = Array.from(currentData.topics.hierarchy.topicsMap.values());
            } else if (typeof currentData.topics.hierarchy.topicsMap === 'object') {
                topics = Object.values(currentData.topics.hierarchy.topicsMap);
            }
        } else if (window.topicLookup) {
            topics = Array.from(window.topicLookup.values());
        }

        const topic = topics.find(t => t.path?.join('/') === topicPath || t.id === topicPath);
        return topic?.displayName || topicPath;
    }

    // Convert path string to displayName format
    function getDisplayPath(pathString) {
        if (!pathString) return '';

        let topics = [];
        if (currentData.topics?.hierarchy?.topicsMap) {
            if (currentData.topics.hierarchy.topicsMap instanceof Map) {
                topics = Array.from(currentData.topics.hierarchy.topicsMap.values());
            } else if (typeof currentData.topics.hierarchy.topicsMap === 'object') {
                topics = Object.values(currentData.topics.hierarchy.topicsMap);
            }
        } else if (window.topicLookup) {
            topics = Array.from(window.topicLookup.values());
        }

        const pathParts = pathString.split('/');
        const displayParts = [];

        for (let i = 0; i < pathParts.length; i++) {
            const partialPath = pathParts.slice(0, i + 1);
            const topic = topics.find(t => t.id === partialPath[partialPath.length - 1] || t.path?.join('/') === partialPath.join('/'));
            if (topic && topic.displayName) {
                displayParts.push(topic.displayName);
            } else {
                displayParts.push(pathParts[i]);
            }
        }

        return displayParts.join('/');
    }

    // Get topic path for display using displayName hierarchy
    function getTopicPath(topic) {
        // Build path from topic hierarchy using displayName
        if (topic.path && topic.path.length > 0) {
            // For each path segment, find the corresponding topic and use its displayName
            const pathSegments = [];
            let currentPath = [];

            for (const pathSegment of topic.path) {
                currentPath.push(pathSegment);
                // Find topic for this path segment
                const topicForSegment = findTopicByPath(currentPath);
                if (topicForSegment && topicForSegment.displayName) {
                    pathSegments.push(topicForSegment.displayName);
                } else {
                    pathSegments.push(pathSegment); // fallback to original segment
                }
            }

            return pathSegments.join('/');
        }

        // Fallback to displayName or name
        return topic.displayName || topic.name;
    }

    // Helper function to find topic by path array
    function findTopicByPath(pathArray) {
        if (!currentData || !currentData.topics || !currentData.topics.hierarchy) return null;

        // Search in hierarchy for topic with matching path
        const searchInNodes = (nodes, targetPath) => {
            for (const node of nodes) {
                if (node.topic && node.topic.path &&
                    JSON.stringify(node.topic.path) === JSON.stringify(targetPath)) {
                    return node.topic;
                }
                if (node.children && node.children.length > 0) {
                    const found = searchInNodes(node.children, targetPath);
                    if (found) return found;
                }
            }
            return null;
        };

        return searchInNodes(currentData.topics.hierarchy.roots || [], pathArray);
    }

    // Generate full display path from data path (like "c/basic" -> "C 語言/基礎語法")
    function generateFullDisplayPathFromDataPath(dataPath) {
        if (!dataPath) return '';

        // Split the data path and find corresponding topics
        const pathParts = dataPath.split('/');
        const displayParts = [];
        let currentPath = [];

        for (const part of pathParts) {
            currentPath.push(part);
            const topic = findTopicByPath(currentPath);
            if (topic && topic.displayName) {
                displayParts.push(topic.displayName);
            } else {
                displayParts.push(part); // fallback to original part
            }
        }

        return displayParts.join('/');
    }

    // Find topic by name in the topics map
    function findTopicByName(name, topicsMap) {
        if (topicsMap instanceof Map) {
            for (let topic of topicsMap.values()) {
                if (topic.name === name) {
                    return topic;
                }
            }
        }
        return null;
    }

    // Get templates for a specific topic
    function getTemplatesForTopic(topic) {
        if (!currentData.templates) return [];

        const topicPath = getTopicPath(topic);
        const topicDataPath = topic.path ? topic.path.join('/') : topic.name;

        const matchedTemplates = currentData.templates.filter(template => {
            // Match by topic name, display path, or data path
            return template.topic === topic.name ||
                   template.topic === topicPath ||
                   template.topic === topicDataPath;
        });
        return matchedTemplates;
    }

    // This function is no longer needed as we display the full hierarchy

    // Toggle topic node expansion
    window.toggleTopicNode = function(toggleElement, event) {
        event.stopPropagation(); // Prevent selecting the topic

        const treeNode = toggleElement.closest('.tree-node');
        const childrenContainer = treeNode.querySelector('.tree-children');

        if (childrenContainer.style.display === 'none') {
            childrenContainer.style.display = 'block';
            toggleElement.textContent = '▼';
        } else {
            childrenContainer.style.display = 'none';
            toggleElement.textContent = '▶';
        }
    }

    // Select a target in the browser
    window.selectTarget = function(item) {
        console.log('selectTarget called with:', item);
        // Remove previous selection
        document.querySelectorAll('.tree-item.selected').forEach(el => {
            el.classList.remove('selected');
        });

        // Add selection to current item
        item.classList.add('selected');
        console.log('Item selected, path:', item.dataset.path);

        // Enable select button
        const selectBtn = document.getElementById('select-target-btn');
        if (selectBtn) {
            selectBtn.disabled = false;

            // Remove any existing listeners to avoid duplicates
            const newSelectBtn = selectBtn.cloneNode(true);
            selectBtn.parentNode.replaceChild(newSelectBtn, selectBtn);

            newSelectBtn.addEventListener('click', () => {
                const selectedPath = item.dataset.path;
                const selectedType = item.dataset.type;
                const selectedLabel = item.querySelector('.tree-label').textContent;

                // Generate full display path for the selected item
                let fullDisplayPath;
                if (selectedType === 'template') {
                    // For templates, construct full path: Topic Full Path/Template Name (without "templates")
                    const topicPath = selectedPath.replace(/\/templates\/.*$/, '');
                    const topicFullPath = generateFullDisplayPathFromDataPath(topicPath);
                    fullDisplayPath = `${topicFullPath}/${selectedLabel}`;
                } else {
                    // For topics, generate full display path
                    fullDisplayPath = generateFullDisplayPathFromDataPath(selectedPath);
                }

                // Update the main form
                const targetSelect = document.getElementById('link-target');
                if (targetSelect) {
                    // Add option if it doesn't exist
                    let optionExists = Array.from(targetSelect.options).some(opt => opt.value === selectedPath);
                    if (!optionExists) {
                        const newOption = document.createElement('option');
                        newOption.value = selectedPath;
                        newOption.textContent = fullDisplayPath;
                        targetSelect.appendChild(newOption);
                    }
                    targetSelect.value = selectedPath;
                }

                window.closeTargetBrowser();
            });
        }
    }

    function getExistingTemplates() {
        if (currentData && currentData.templates && Array.isArray(currentData.templates)) {
            return currentData.templates;
        }
        return [];
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

                case 'topic':
                    data = getTopicData();
                    if (editingItem) {
                        messageType = 'updateTopic';
                        id = editingItem.id;
                    } else {
                        messageType = 'createTopic';
                    }
                    break;

                case 'link':
                    data = getLinkData();
                    if (editingItem) {
                        messageType = 'updateLink';
                        id = editingItem.id;
                    } else {
                        messageType = 'createLink';
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

            console.log('Sending message to VS Code:', message);
            vscode.postMessage(message);
            closeModal();
            
        } catch (error) {
            vscode.postMessage({
                type: 'showError',
                message: error.message
            });
        }
    }

    function getExistingTopics() {
        const topicsFromTemplates = currentData.templates ?
            currentData.templates.map(t => t.topic).filter(t => t) : [];

        // Extract topics from hierarchy structure
        let managedTopics = [];
        if (currentData.topics?.hierarchy?.topicsMap) {
            if (currentData.topics.hierarchy.topicsMap instanceof Map) {
                managedTopics = Array.from(currentData.topics.hierarchy.topicsMap.values()).map(t => t.name);
            } else if (typeof currentData.topics.hierarchy.topicsMap === 'object') {
                managedTopics = Object.values(currentData.topics.hierarchy.topicsMap).map(t => t.name);
            }
        }

        // Also check our topic lookup cache
        if (window.topicLookup && window.topicLookup.size > 0) {
            const cachedTopics = Array.from(window.topicLookup.values()).map(t => t.name);
            managedTopics = [...managedTopics, ...cachedTopics];
        }

        const allTopics = new Set([...topicsFromTemplates, ...managedTopics]);
        return Array.from(allTopics).sort();
    }

    function getExistingLanguages() {
        // Get languages from current data
        if (currentData && currentData.languages && Array.isArray(currentData.languages)) {
            return currentData.languages;
        }

        // Try to get languages from templates if available
        if (currentData && currentData.templates && Array.isArray(currentData.templates)) {
            const languagesFromTemplates = currentData.templates
                .map(t => t.language)
                .filter(lang => lang)
                .map(lang => ({ id: lang, displayName: lang }));

            // Remove duplicates
            const uniqueLanguages = languagesFromTemplates.filter((lang, index, self) =>
                index === self.findIndex(l => l.id === lang.id)
            );

            if (uniqueLanguages.length > 0) {
                return uniqueLanguages;
            }
        }

        // Return empty array if no data is available
        return [];
    }

    function getTemplateData() {
        const title = document.getElementById('template-title').value.trim();
        const description = document.getElementById('template-description').value.trim();
        const language = document.getElementById('template-language').value;
        const topic = document.getElementById('template-topic').value.trim();
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
        if (!topic) throw new Error('請輸入主題');
        if (!code.trim()) throw new Error('請輸入程式碼');

        const data = {
            title,
            description,
            language,
            topic,
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

    function getTopicData() {
        const name = document.getElementById('topic-name').value.trim();
        const description = document.getElementById('topic-description').value.trim();
        const color = document.getElementById('topic-color').value;
        const icon = document.getElementById('topic-icon').value.trim();

        if (!name) throw new Error('請輸入主題名稱');
        if (!description) throw new Error('請輸入主題簡介');

        const data = {
            name,
            description
        };

        // Handle documentation based on type selection
        const docTypeSelect = document.getElementById('topic-documentation-type');
        const docInput = document.getElementById('topic-documentation');

        if (docTypeSelect && docInput && docTypeSelect.value && docInput.value.trim()) {
            data.documentation = docInput.value.trim();
        }

        if (color && color !== '#007acc') data.color = color;
        if (icon) data.icon = icon;

        return data;
    }

    function getLinkData() {
        const id = document.getElementById('link-id').value.trim();
        const title = document.getElementById('link-title').value.trim();
        const target = document.getElementById('link-target').value.trim();
        const language = document.getElementById('link-language').value.trim();
        const description = document.getElementById('link-description').value.trim();

        if (!id) throw new Error('請輸入連結 ID');
        if (!title) throw new Error('請輸入連結標題');
        if (!target) throw new Error('請選擇目標路徑');
        if (!description) throw new Error('請輸入連結描述');

        // Validate ID format
        if (!/^[a-zA-Z0-9\-_]+$/.test(id)) {
            throw new Error('連結 ID 只能包含英文字母、數字、連字號和下劃線');
        }

        // Get the current topic from the selector
        const currentTopicSelector = document.getElementById('current-topic-selector');
        const currentTopic = currentTopicSelector ? currentTopicSelector.value.trim() : 'general';

        if (!currentTopic) {
            throw new Error('請選擇要保存連結的主題');
        }

        const data = {
            type: 'link',
            id: id,
            title,
            target,
            description,
            currentTopic: currentTopic
        };

        // Add language if specified or auto-detect from target
        if (language) {
            data.language = language;
        } else {
            // Try to auto-detect language from target path
            const targetParts = target.split('/');
            const possibleLanguage = targetParts[0];
            const languages = getExistingLanguages();
            const foundLanguage = languages.find(lang => lang.id === possibleLanguage);
            if (foundLanguage) {
                data.language = foundLanguage.id;
            }
        }

        return data;
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
    
    
    function editTopic(topicId) {
        const topic = findTopicById(topicId);
        if (topic) {
            openModal('topic', topic);
        }
    }

    function deleteTopic(topicId) {
        vscode.postMessage({
            type: 'deleteTopic',
            topicId: topicId
        });
    }

    function viewTopicDocumentation(topicId) {
        const topic = findTopicById(topicId);
        if (topic && topic.documentation) {
            // 創建文件查看模態窗口
            showLegacyDocumentationModal(topic.name, topic.documentation);
        }
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

        if (languageFilter) {
            filters.languageIds = [languageFilter];
        }

        vscode.postMessage({
            type: 'exportTemplates',
            filters: Object.keys(filters).length > 0 ? filters : undefined
        });
    }

    // Utility functions
    // showLoading, escapeHtml, renderMarkdown 現在從 TextBricksUtils 導入

    // 保留原有的 renderMarkdown 實現作為內部函數（如果與 utils 不同）
    function renderMarkdownLocal(text) {
        if (!text) return '';

        // Simple markdown rendering - convert common markdown syntax to HTML
        let html = escapeHtml(text);

        // Headers
        html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');
        html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
        html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');

        // Bold and italic
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

        // Code blocks
        html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
        html = html.replace(/`(.*?)`/g, '<code>$1</code>');

        // Links
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');

        // Line breaks
        html = html.replace(/\n/g, '<br>');

        return html;
    }

    // Template Documentation Modal
    function showDocumentationModal(templateId) {
        const template = currentData.templates?.find(t => t.id === templateId);
        if (!template || !template.documentation) {
            console.warn('Template or documentation not found for ID:', templateId);
            return;
        }

        createDocumentationModal(
            `${template.title} - 說明文件`,
            template.documentation
        );
    }

    // Topic Documentation Modal
    function showTopicDocumentationModal(topicId) {
        const topic = findTopicById(topicId);
        if (!topic || !topic.documentation) {
            console.warn('Topic or documentation not found for ID:', topicId);
            return;
        }

        createDocumentationModal(
            `${topic.displayName || topic.name} - 主題說明文件`,
            topic.documentation
        );
    }

    // Generic Documentation Modal Creator
    function createDocumentationModal(title, documentation) {
        // Create modal backdrop
        const modalBackdrop = document.createElement('div');
        modalBackdrop.className = 'modal-backdrop documentation-modal-backdrop';
        modalBackdrop.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            padding: 20px;
        `;

        // Create modal content
        const modalContent = document.createElement('div');
        modalContent.className = 'documentation-modal-content';
        modalContent.style.cssText = `
            background: var(--dark-bg);
            border-radius: 8px;
            border: 1px solid var(--border-color);
            max-width: 800px;
            max-height: 80vh;
            width: 100%;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        `;

        // Create modal header
        const modalHeader = document.createElement('div');
        modalHeader.className = 'documentation-modal-header';
        modalHeader.style.cssText = `
            padding: 16px 20px;
            border-bottom: 1px solid var(--border-color);
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: var(--light-bg);
        `;

        const modalTitle = document.createElement('h3');
        modalTitle.style.cssText = `
            margin: 0;
            color: var(--text-color);
            font-size: 1.2em;
        `;
        modalTitle.textContent = title;

        const closeButton = document.createElement('button');
        closeButton.style.cssText = `
            background: none;
            border: none;
            color: var(--muted-text);
            font-size: 1.5em;
            cursor: pointer;
            padding: 4px 8px;
            border-radius: 4px;
        `;
        closeButton.textContent = '×';
        closeButton.addEventListener('click', () => {
            document.body.removeChild(modalBackdrop);
        });

        modalHeader.appendChild(modalTitle);
        modalHeader.appendChild(closeButton);

        // Create modal body
        const modalBody = document.createElement('div');
        modalBody.className = 'documentation-modal-body';
        modalBody.style.cssText = `
            padding: 20px;
            overflow-y: auto;
            flex: 1;
        `;

        const docContent = document.createElement('div');
        docContent.className = 'doc-content';
        // Use the same preview format as the edit modal
        const renderedHtml = markdownToHtml(documentation);
        docContent.innerHTML = `
            <div class="preview-header">
                <h2>📖 說明文檔預覽</h2>
                <div class="preview-note">這是您的 Markdown 文檔的預覽效果</div>
            </div>
            <div class="documentation-content">
                ${renderedHtml}
            </div>
        `;

        modalBody.appendChild(docContent);

        // Assemble modal
        modalContent.appendChild(modalHeader);
        modalContent.appendChild(modalBody);
        modalBackdrop.appendChild(modalContent);

        // Add to DOM
        document.body.appendChild(modalBackdrop);

        // Close on backdrop click
        modalBackdrop.addEventListener('click', (e) => {
            if (e.target === modalBackdrop) {
                document.body.removeChild(modalBackdrop);
            }
        });

        // Prevent content click from closing modal
        modalContent.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        // ESC key support
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                document.body.removeChild(modalBackdrop);
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
    }

    // JSON Import functions
    function openJsonModal() {
        const jsonModal = document.getElementById('json-modal');
        if (!jsonModal) {
            console.error('JSON modal not found');
            return;
        }
        populateAvailableLanguages();
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

    function populateAvailableLanguages() {
        const languagesDiv = document.getElementById('available-languages');

        if (!languagesDiv) {
            console.error('Available languages div not found');
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
            if (!template.topic || typeof template.topic !== 'string') {
                return { valid: false, error: `模板 ${index}: 缺少有效的 topic` };
            }

            // Validate language exists
            const languageExists = currentData.languages && currentData.languages.some(l => l.id === template.language);

            if (!languageExists) {
                return { valid: false, error: `模板 ${index}: 語言 "${template.language}" 不存在` };
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
            inputContainer.innerHTML = ''; // Clear any existing input
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

    function handleTopicDocumentationTypeChange(type) {
        const contentGroup = document.getElementById('topic-documentation-content-group');
        const inputContainer = document.getElementById('topic-documentation-input-container');

        if (!contentGroup || !inputContainer) return;

        if (type === '') {
            contentGroup.style.display = 'none';
            inputContainer.innerHTML = ''; // Clear any existing input
            return;
        }

        contentGroup.style.display = 'block';

        let inputHTML = '';
        switch (type) {
            case 'markdown':
                inputHTML = `
                    <textarea id="topic-documentation" rows="15" placeholder="# 主題名稱\n\n## 主題簡介\n這個主題包含了...\n\n## 內容概覽\n- 核心概念\n- 實用範例\n- 進階技巧\n\n## 使用指南\n建議先掌握..."></textarea>
                `;
                break;
            case 'file':
                inputHTML = `
                    <input type="text" id="topic-documentation" placeholder="例如：./docs/basic-concepts.md 或 /path/to/topic-doc.md">
                    <div class="form-help">請輸入 .md 檔案的相對或絕對路徑</div>
                `;
                break;
            case 'url':
                inputHTML = `
                    <input type="url" id="topic-documentation" placeholder="例如：https://example.com/topic-guide.html">
                    <div class="form-help">請輸入外部網頁的完整 URL</div>
                `;
                break;
        }

        inputContainer.innerHTML = inputHTML;

        // Set existing value if editing topic
        if (editingItem && editingItem.documentation) {
            const currentType = getDocumentationType(editingItem.documentation);
            if (currentType === type) {
                const input = document.getElementById('topic-documentation');
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

    function generateTopicDocumentationTemplate() {
        const titleInput = document.getElementById('topic-name');
        const descriptionInput = document.getElementById('topic-description');
        const docInput = document.getElementById('topic-documentation');

        if (!titleInput || !descriptionInput || !docInput) return;

        const title = titleInput.value || '主題名稱';
        const description = descriptionInput.value || '主題描述';

        const template = `# ${title}

## 主題簡介
${description}

## 內容概覽
這個主題包含了以下內容：

- **核心概念**：基本原理和重要概念
- **實用範例**：實際應用和程式範例
- **進階技巧**：高級用法和最佳實踐

## 相關技術
- 相關技術1
- 相關技術2

## 使用指南
1. **基礎瞭解**：掌握基本概念和語法
2. **實際操作**：參考範例程式進行實作
3. **深入探索**：嘗試不同的應用場景
4. **最佳實踐**：遵循業界標準和建議

## 相關主題
- 相關主題1
- 相關主題2

## 參考資料
- 官方文檔
- 推薦教程
- 實用工具`;

        docInput.value = template;
    }

    function previewTopicDocumentation() {
        const docInput = document.getElementById('topic-documentation');
        const typeSelect = document.getElementById('topic-documentation-type');

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

        if (!content) {
            showError('請先輸入說明文檔內容');
            return;
        }

        // Create a modal preview instead of new window
        showTopicPreviewModal(content, type);
    }

    function showTopicPreviewModal(content, type) {
        // Use unified preview modal
        showUnifiedPreviewModal(content, type, '主題說明文檔預覽');
    }

    // Unified preview modal function to prevent conflicts
    function showUnifiedPreviewModal(content, type, title = '預覽') {
        // Remove any existing preview modal first
        const existingModal = document.getElementById('preview-modal');
        if (existingModal) {
            // Clean up existing event listeners
            if (existingModal._keydownHandler) {
                document.removeEventListener('keydown', existingModal._keydownHandler);
            }
            existingModal.remove();
        }

        let previewContent;
        switch (type) {
            case 'markdown':
                const renderedHtml = markdownToHtml(content);
                previewContent = `
                    <div class="preview-header">
                        <h2>📖 ${title} - Markdown</h2>
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
                        <h2>📄 ${title} - 檔案路徑</h2>
                        <div class="preview-note">這是您指定的檔案路徑</div>
                    </div>
                    <div class="file-path-preview">
                        <div class="path-display"><code>${escapeHtml(content)}</code></div>
                        <div class="path-note">注意：確保此檔案存在且可讀取</div>
                    </div>
                `;
                break;
            case 'url':
                previewContent = `
                    <div class="preview-header">
                        <h2>🌐 ${title} - 外部連結</h2>
                        <div class="preview-note">這是您指定的外部連結</div>
                    </div>
                    <div class="url-preview">
                        <div class="url-display">
                            <a href="${escapeHtml(content)}" target="_blank" rel="noopener noreferrer">${escapeHtml(content)}</a>
                        </div>
                        <div class="url-note">點擊連結可在新視窗中開啟</div>
                    </div>
                `;
                break;
            default:
                previewContent = `
                    <div class="preview-header">
                        <h2>⚠️ 無法預覽</h2>
                        <div class="preview-note">請先選擇說明文檔類型</div>
                    </div>
                `;
        }

        // Create modal with higher z-index to ensure it appears above edit modals
        const modal = document.createElement('div');
        modal.id = 'preview-modal';
        modal.className = 'modal';
        modal.style.zIndex = '10000'; // Higher than edit modal
        modal.innerHTML = `
            <div class="preview-modal-backdrop" style="z-index: 9999;"></div>
            <div class="preview-modal-content" style="z-index: 10001;">
                <div class="preview-modal-header">
                    <h3>${title}</h3>
                    <button class="preview-close-btn" title="關閉預覽">✕</button>
                </div>
                <div class="preview-modal-body">
                    ${previewContent}
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary preview-ok-btn">確定</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Set up close functionality
        const closeModal = () => {
            if (modal._keydownHandler) {
                document.removeEventListener('keydown', modal._keydownHandler);
            }
            modal.remove();
        };

        // Add event listeners with proper cleanup
        const closeBtn = modal.querySelector('.preview-close-btn');
        const okBtn = modal.querySelector('.preview-ok-btn');
        const backdrop = modal.querySelector('.preview-modal-backdrop');

        if (closeBtn) closeBtn.addEventListener('click', closeModal);
        if (okBtn) okBtn.addEventListener('click', closeModal);
        if (backdrop) {
            backdrop.addEventListener('click', (e) => {
                if (e.target === backdrop) {
                    closeModal();
                }
            });
        }

        // ESC key handler
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                closeModal();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        modal._keydownHandler = handleKeyDown;
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
        // Use unified preview modal with template title
        const title = editingItem ? `模板文檔預覽 - ${editingItem.title}` : '模板文檔預覽 - 新模板';
        showUnifiedPreviewModal(content, type, title);
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

    function handleTopicInputChange(topicName) {
        const hintDiv = document.getElementById('topic-description-hint');
        if (!hintDiv || !currentData.topics) return;

        const managedTopic = findTopicByName(topicName.trim());
        if (managedTopic && managedTopic.description) {
            hintDiv.textContent = `💡 ${managedTopic.description}`;
            hintDiv.style.display = 'block';
        } else {
            hintDiv.style.display = 'none';
        }
    }

    function handleTopicSelectChange(selectedValue) {
        const hintDiv = document.getElementById('topic-description-hint');

        if (selectedValue && hintDiv && currentData.topics) {
            // Show topic description hint
            const managedTopic = findTopicByName(selectedValue);
            if (managedTopic && managedTopic.description) {
                hintDiv.textContent = `💡 ${managedTopic.description}`;
                hintDiv.style.display = 'block';
            } else {
                hintDiv.style.display = 'none';
            }
        } else if (hintDiv) {
            hintDiv.style.display = 'none';
        }
    }

    function handleCreateTopicFromTemplate() {
        // Store current template modal state
        const currentModal = document.getElementById('modal');
        const currentModalData = {
            type: currentModal.dataset.type,
            editing: editingItem
        };

        // Open topic creation modal
        openModal('topic', null);

        // After topic is created, we need to refresh the topic list in template modal
        // This will be handled by the data reload after topic creation
    }

    function showLegacyDocumentationModal(title, documentation) {
        // 創建文件模態窗口
        const docModal = document.createElement('div');
        docModal.className = 'modal documentation-modal';
        docModal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            z-index: 1000;
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        docModal.innerHTML = `
            <div class="modal-content" style="
                max-width: 800px;
                width: 90%;
                max-height: 80vh;
                background: var(--bg-color);
                border-radius: 8px;
                border: 1px solid var(--border-color);
                overflow: hidden;
                display: flex;
                flex-direction: column;
            ">
                <div class="modal-header" style="
                    padding: 16px 20px;
                    border-bottom: 1px solid var(--border-color);
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    background: var(--light-bg);
                ">
                    <h3 style="margin: 0; color: var(--text-color); font-size: 1.2em;">${escapeHtml(title)} - 詳細說明</h3>
                    <button class="btn btn-text doc-modal-close" style="
                        background: none;
                        border: none;
                        color: var(--muted-text);
                        font-size: 1.5em;
                        cursor: pointer;
                        padding: 4px 8px;
                        border-radius: 4px;
                    ">✕</button>
                </div>
                <div class="modal-body" style="
                    overflow-y: auto;
                    max-height: 60vh;
                    padding: 20px;
                    flex: 1;
                ">
                    <div class="documentation-content doc-content">
                        <div class="preview-header">
                            <h2>📖 說明文檔預覽</h2>
                            <div class="preview-note">這是您的 Markdown 文檔的預覽效果</div>
                        </div>
                        <div class="documentation-content">
                            ${markdownToHtml(documentation)}
                        </div>
                    </div>
                </div>
                <div class="modal-footer" style="
                    padding: 16px 20px;
                    border-top: 1px solid var(--border-color);
                    background: var(--light-bg);
                    display: flex;
                    justify-content: flex-end;
                ">
                    <button class="btn btn-secondary doc-modal-close">關閉</button>
                </div>
            </div>
        `;

        document.body.appendChild(docModal);

        // 綁定關閉事件
        docModal.querySelectorAll('.doc-modal-close').forEach(closeBtn => {
            closeBtn.addEventListener('click', () => {
                document.body.removeChild(docModal);
            });
        });

        // 點擊背景關閉
        docModal.addEventListener('click', (e) => {
            if (e.target === docModal) {
                document.body.removeChild(docModal);
            }
        });
    }

    function markdownToHtml(markdown) {
        // 簡單的 Markdown 轉換，處理基本格式
        if (!markdown || typeof markdown !== 'string') {
            return '';
        }

        return markdown
            .replace(/### (.*$)/gim, '<h3>$1</h3>')
            .replace(/## (.*$)/gim, '<h2>$1</h2>')
            .replace(/# (.*$)/gim, '<h1>$1</h1>')
            .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/gim, '<em>$1</em>')
            .replace(/^\- (.*$)/gim, '<li>$1</li>')
            .replace(/(<li>.*<\/li>)/gims, '<ul>$1</ul>')
            .replace(/\n/gim, '<br>');
    }

    // ==================== Scope Management ====================

    function updateScopeSelector() {
        const scopeSelector = document.getElementById('scope-selector');
        const scopeDisplay = document.getElementById('current-scope-display');

        if (!currentData.scope) return;

        // 更新 scope 選擇器
        if (scopeSelector && currentData.scope.available) {
            scopeSelector.innerHTML = currentData.scope.available.map(scope =>
                `<option value="${scope.id}" ${scope.id === currentScope?.id ? 'selected' : ''}>${scope.name}</option>`
            ).join('');
        }

        // 更新當前 scope 顯示
        if (scopeDisplay && currentScope) {
            scopeDisplay.textContent = currentScope.name || currentScope.id;
        }
    }

    function handleScopeSwitch(event) {
        const newScopeId = event.target.value;
        if (newScopeId !== currentScope?.id) {
            vscode.postMessage({
                type: 'switchScope',
                scopeId: newScopeId
            });
        }
    }

    function exportScope() {
        vscode.postMessage({
            type: 'exportScope',
            options: {
                includeTemplates: true,
                includeStats: true
            }
        });
    }

    function importScope() {
        vscode.postMessage({
            type: 'importScope'
        });
    }

    function clearUsageStats() {
        if (confirm('確定要清除所有使用統計嗎？此操作無法恢復。')) {
            vscode.postMessage({
                type: 'clearUsageStats'
            });
        }
    }

    function addToFavorites(itemId) {
        vscode.postMessage({
            type: 'addToFavorites',
            itemId: itemId
        });
    }

    function removeFromFavorites(itemId) {
        vscode.postMessage({
            type: 'removeFromFavorites',
            itemId: itemId
        });
    }

    function toggleFavorite(itemId) {
        const isFavorite = currentData.scope?.favorites?.includes(itemId);
        if (isFavorite) {
            removeFromFavorites(itemId);
        } else {
            addToFavorites(itemId);
        }
    }

    // ==================== Topic Management ====================

    function renderTopicHierarchy() {
        const container = document.getElementById('topics-list');
        if (!container || !currentData.topics?.hierarchy) return;

        const { roots } = currentData.topics.hierarchy;
        if (!roots || roots.length === 0) {
            container.innerHTML = '<div class="empty-state">尚未建立任何主題</div>';
            return;
        }

        const html = `
            <div class="topic-hierarchy">
                ${roots.map(renderTopicNode).join('')}
            </div>
        `;
        container.innerHTML = html;

        // 綁定事件
        bindTopicEvents(container);
    }

    function renderTopicNode(node, depth = 0) {
        const topic = node.topic;
        const hasChildren = node.children && node.children.length > 0;
        const indent = depth * 20;
        const isFavorite = currentData.scope?.favorites?.includes(topic.id);

        return `
            <div class="topic-node" data-topic-id="${topic.id}" style="padding-left: ${indent}px;">
                <div class="topic-header">
                    ${hasChildren ?
                        `<button class="topic-toggle ${node.topic.display.collapsed ? 'collapsed' : ''}" data-topic-id="${topic.id}">
                            ${node.topic.display.collapsed ? '▶' : '▼'}
                        </button>` :
                        '<span class="topic-spacer"></span>'
                    }
                    <span class="topic-icon" style="color: ${topic.display.color}">${topic.display.icon}</span>
                    <span class="topic-name">${escapeHtml(topic.displayName)}</span>
                    <span class="topic-stats">${node.directTemplates} 模板</span>
                    <div class="topic-actions">
                        <button class="btn-icon favorite-btn ${isFavorite ? 'active' : ''}"
                                title="${isFavorite ? '取消收藏' : '加入收藏'}"
                                data-action="toggle-favorite" data-topic-id="${topic.id}">
                            ${isFavorite ? '❤️' : '♡'}
                        </button>
                        <button class="btn-icon edit-btn" title="編輯主題" data-action="edit-topic" data-topic-id="${topic.id}">✏️</button>
                        <button class="btn-icon delete-btn" title="刪除主題" data-action="delete-topic" data-topic-id="${topic.id}">🗑️</button>
                    </div>
                </div>
                ${hasChildren && !topic.display.collapsed ?
                    `<div class="topic-children">
                        ${node.children.map(child => renderTopicNode(child, depth + 1)).join('')}
                    </div>` :
                    ''
                }
            </div>
        `;
    }

    function bindTopicEvents(container) {
        // 摺疊/展開處理
        container.querySelectorAll('.topic-toggle').forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                e.stopPropagation();
                const topicId = toggle.dataset.topicId;
                toggleTopicCollapse(topicId);
            });
        });
    }

    function toggleTopicCollapse(topicId) {
        const topic = findTopicInHierarchy(topicId);
        if (topic) {
            const newCollapsed = !topic.topic.display.collapsed;
            vscode.postMessage({
                type: 'updateTopic',
                topicId: topicId,
                data: {
                    display: { collapsed: newCollapsed }
                }
            });
        }
    }

    function findTopicInHierarchy(topicId) {
        if (!currentData.topics?.hierarchy?.roots) return null;

        function search(nodes) {
            for (const node of nodes) {
                if (node.topic.id === topicId) return node;
                if (node.children) {
                    const found = search(node.children);
                    if (found) return found;
                }
            }
            return null;
        }

        return search(currentData.topics.hierarchy.roots);
    }

    function editTopic(topicId) {
        const topic = findTopicInHierarchy(topicId)?.topic;
        if (topic) {
            openModal('topic', topic);
        }
    }

    function deleteTopic(topicId) {
        const topic = findTopicInHierarchy(topicId)?.topic;
        if (topic && confirm(`確定要刪除主題 "${topic.displayName}" 嗎？`)) {
            vscode.postMessage({
                type: 'deleteTopic',
                topicId: topicId,
                deleteChildren: false
            });
        }
    }

    function moveTopic(topicId, newParentId, newOrder) {
        vscode.postMessage({
            type: 'moveTopic',
            operation: {
                topicId,
                newParentId,
                newOrder
            }
        });
    }

    // ==================== Statistics and Overview ====================

    function renderOverview() {
        console.log('Rendering overview tab...');

        // 確保總覽頁面是活躍的
        showTab('overview');

        // 更新統計數據到已有的 HTML 結構中
        updateOverviewStats();
        updateRecentActivity();

        console.log('Overview tab rendered successfully');
    }

    function updateOverviewStats() {
        const scopeStats = currentData.scope?.usageStats;
        const topicStats = currentData.topics?.statistics;
        const templatesCount = currentData.templates?.length || 0;
        const languagesCount = currentData.languages?.length || 0;
        const favoritesCount = currentData.scope?.favorites?.length || 0;

        // 更新統計數字到對應的元素
        updateStatValue('total-templates', templatesCount);
        updateStatValue('favorite-templates', favoritesCount);
        updateStatValue('total-topics', topicStats?.totalTopics || 0);
        updateStatValue('active-topics', topicStats?.activeTopics || topicStats?.totalTopics || 0);
        updateStatValue('total-languages', languagesCount);

        // 更新最常用語言
        const mostUsedLang = getMostUsedLanguage();
        updateStatValue('most-used-language', mostUsedLang || '-');
    }

    function updateStatValue(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value;
        }
    }

    function getMostUsedLanguage() {
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
        const language = currentData.languages?.find(l => l.id === mostUsedLang);
        return language ? language.name : mostUsedLang;
    }

    function updateRecentActivity() {
        const recentContainer = document.getElementById('recent-templates');
        if (!recentContainer) return;

        const usageStats = currentData.scope?.usageStats;
        const recentTemplates = usageStats?.recentTemplates || usageStats?.mostUsedTemplates || [];

        if (recentTemplates.length === 0) {
            recentContainer.innerHTML = '<p class="no-data">尚無最近使用的模板</p>';
            return;
        }

        const html = recentTemplates.slice(0, 5).map(template => {
            const templateData = currentData.templates?.find(t => t.id === template.id || t.title === template.title);
            if (!templateData) return '';

            return `
                <div class="recent-item">
                    <div class="recent-item-info">
                        <div class="recent-item-title">${escapeHtml(templateData.title)}</div>
                        <div class="recent-item-meta">${escapeHtml(templateData.language)} • ${escapeHtml(getTopicDisplayName(templateData.topic))}</div>
                    </div>
                    <div class="recent-item-usage">${template.usage || 1} 次使用</div>
                </div>
            `;
        }).filter(Boolean).join('');

        recentContainer.innerHTML = html || '<p class="no-data">尚無最近使用的模板</p>';
    }

    function renderFavoritesTab() {
        console.log('Rendering favorites tab...');

        // 確保收藏頁面是活躍的
        showTab('favorites');

        // 更新收藏統計和列表到已有的 HTML 結構中
        updateFavoritesStats();
        updateFavoritesList();

        console.log('Favorites tab rendered successfully');
    }

    function updateFavoritesStats() {
        const favorites = currentData.scope?.favorites || [];
        const totalCount = favorites.length;

        // 更新總收藏數
        updateStatValue('total-favorites', totalCount);

        // 計算當前語言收藏數
        const currentLanguageFilter = document.getElementById('favorites-filter-language')?.value || '';
        let languageCount = totalCount;

        if (currentLanguageFilter) {
            const languageFavorites = favorites.filter(itemId => {
                const template = currentData.templates?.find(t => t.id === itemId || t.title === itemId);
                return template && template.language === currentLanguageFilter;
            });
            languageCount = languageFavorites.length;
        }

        updateStatValue('favorites-by-language', languageCount);
    }

    function updateFavoritesList() {
        const container = document.getElementById('favorites-list');
        if (!container) return;

        const favorites = currentData.scope?.favorites || [];

        if (favorites.length === 0) {
            container.innerHTML = '<p class="no-data">尚無收藏的模板</p>';
            return;
        }

        // 獲取篩選條件
        const languageFilter = document.getElementById('favorites-filter-language')?.value || '';
        const topicFilter = document.getElementById('favorites-filter-topic')?.value || '';
        const searchFilter = document.getElementById('search-favorites')?.value?.toLowerCase() || '';

        // 篩選收藏項目
        const filteredFavorites = favorites.filter(itemId => {
            const template = currentData.templates?.find(t => t.id === itemId || t.title === itemId);
            if (!template) return false;

            // 語言篩選
            if (languageFilter && template.language !== languageFilter) return false;

            // 主題篩選
            if (topicFilter && template.topic !== topicFilter) return false;

            // 搜索篩選
            if (searchFilter && !template.title.toLowerCase().includes(searchFilter)) return false;

            return true;
        });

        const html = filteredFavorites.map(itemId => {
            const template = currentData.templates?.find(t => t.id === itemId || t.title === itemId);
            if (!template) return '';

            return `
                <div class="favorite-item">
                    <div class="data-item">
                        <div class="data-item-header">
                            <h3>${escapeHtml(template.title)}</h3>
                            <div class="favorite-badge">收藏</div>
                        </div>
                        <p class="description">${escapeHtml(template.description || '無描述')}</p>
                        <div class="data-item-meta">
                            <span class="language-tag">${escapeHtml(template.language)}</span>
                            <span class="topic-tag">${escapeHtml(getTopicDisplayName(template.topic))}</span>
                        </div>
                        <div class="data-item-actions">
                            <button class="btn btn-primary btn-small" data-action="view-template" data-template-id="${template.id}">查看</button>
                            <button class="btn btn-secondary btn-small" data-action="edit-template" data-template-id="${template.id}">編輯</button>
                            <button class="btn btn-warning btn-small" data-action="remove-from-favorites" data-item-id="${itemId}">取消收藏</button>
                        </div>
                    </div>
                </div>
            `;
        }).filter(Boolean).join('');

        container.innerHTML = html || '<p class="no-data">沒有符合篩選條件的收藏模板</p>';
    }

    // ==================== Content Management ====================

    function renderContentManagement() {
        console.log('Rendering content management...');

        // 確保內容管理頁面是活躍的
        showTab('content');

        // 初始化內容管理界面
        setupContentManagementEventListeners();
        updateContentFilters();
        renderContentTree();

        console.log('Content management rendered successfully');
    }

    function setupContentManagementEventListeners() {
        // View mode toggle
        const treeViewBtn = document.getElementById('tree-view-btn');
        const listViewBtn = document.getElementById('list-view-btn');

        if (treeViewBtn && listViewBtn) {
            treeViewBtn.addEventListener('click', () => switchContentView('tree'));
            listViewBtn.addEventListener('click', () => switchContentView('list'));
        }

        // Tree actions
        const addTopicBtn = document.getElementById('add-topic-btn');
        const addTemplateBtn = document.getElementById('add-template-btn');
        const addLinkBtn = document.getElementById('add-link-btn');
        const expandAllBtn = document.getElementById('expand-all-btn');
        const collapseAllBtn = document.getElementById('collapse-all-btn');

        if (addTopicBtn) {
            addTopicBtn.addEventListener('click', () => openModal('topic'));
        }
        if (addTemplateBtn) {
            addTemplateBtn.addEventListener('click', () => openModal('template'));
        }
        if (addLinkBtn) {
            addLinkBtn.addEventListener('click', () => openModal('link'));
        }
        if (expandAllBtn) {
            expandAllBtn.addEventListener('click', expandAllNodes);
        }
        if (collapseAllBtn) {
            collapseAllBtn.addEventListener('click', collapseAllNodes);
        }

        // Content filters
        const contentFilterLanguage = document.getElementById('content-filter-language');
        const searchContent = document.getElementById('search-content');

        if (contentFilterLanguage) {
            contentFilterLanguage.addEventListener('change', updateContentFilters);
        }

        if (searchContent) {
            searchContent.addEventListener('input', updateContentFilters);
        }
    }

    function updateContentFilters() {
        // Update language filter options
        const languageFilter = document.getElementById('content-filter-language');
        if (languageFilter && currentData.languages) {
            languageFilter.innerHTML = '<option value="">所有語言</option>' +
                currentData.languages.map(lang => `<option value="${lang.id}">${escapeHtml(lang.displayName)}</option>`).join('');
        }

        // Update topic filter options
        const topicFilter = document.getElementById('content-filter-topic');
        if (topicFilter && currentData.templates) {
            const topics = [...new Set(currentData.templates.map(t => t.topic).filter(Boolean))].sort();
            topicFilter.innerHTML = '<option value="">所有主題</option>' +
                topics.map(topic => `<option value="${escapeHtml(topic)}">${escapeHtml(getTopicDisplayName(topic))}</option>`).join('');
        }

        // Apply current filters to update the tree display
        filterContentTree();
    }

    function switchContentView(viewType) {
        const treeView = document.getElementById('content-tree-view');
        const listView = document.getElementById('content-list-view');
        const treeBtn = document.getElementById('tree-view-btn');
        const listBtn = document.getElementById('list-view-btn');

        if (viewType === 'tree') {
            treeView?.classList.add('active');
            listView?.classList.remove('active');
            treeBtn?.classList.add('active');
            listBtn?.classList.remove('active');
        } else {
            treeView?.classList.remove('active');
            listView?.classList.add('active');
            treeBtn?.classList.remove('active');
            listBtn?.classList.add('active');

            // Render list view content
            renderTemplates();
            renderTopicHierarchy();
        }
    }

    function renderContentTree() {
        const container = document.getElementById('content-tree');
        if (!container) return;

        try {
            // Show loading state
            container.innerHTML = '<div class="loading-state">載入中...</div>';

            // Build tree structure from current data
            const treeData = buildContentTreeData();

            // Store tree data globally for link search
            window.treeData = treeData;

            if (!treeData || treeData.length === 0) {
                container.innerHTML = `
                    <div class="no-data">
                        <div class="no-data-icon">📁</div>
                        <div class="no-data-text">尚無主題或模板數據</div>
                        <div class="no-data-help">
                            開始創建您的第一個主題來組織代碼模板，或直接創建模板。
                        </div>
                        <div class="no-data-actions">
                            <button class="btn btn-primary btn-small" data-action="open-modal" data-modal-type="topic">
                                <span class="icon">🏷️</span> 新增主題
                            </button>
                            <button class="btn btn-secondary btn-small" data-action="open-modal" data-modal-type="template">
                                <span class="icon">📄</span> 新增模板
                            </button>
                        </div>
                        <div class="usage-tips">
                            <small>💡 提示：雙擊項目可編輯，右鍵點擊查看更多選項</small>
                        </div>
                    </div>
                `;
                return;
            }

            const html = treeData.map(node => renderTreeNode(node, 0)).join('');
            container.innerHTML = html;

            // Setup tree interactions
            setupTreeInteractions();

            // Add keyboard navigation support
            setupTreeKeyboardNavigation();

            // Restore previous selection or set default selection to first item if available
            setTimeout(() => {
                restoreTreeSelection(container);
            }, 100);

        } catch (error) {
            console.error('Error rendering content tree:', error);
            container.innerHTML = `
                <div class="error-state">
                    <div class="error-icon">⚠️</div>
                    <div class="error-text">載入失敗</div>
                    <button class="btn btn-secondary btn-small" data-action="render-content-tree">重試</button>
                </div>
            `;
        }
    }

    function buildContentTreeData() {
        const templates = currentData.templates || [];
        const topics = currentData.topics?.hierarchy || null;

        console.log('Building content tree data...');
        console.log('Templates:', templates.length);
        console.log('Templates data:', templates);

        // 檢查每個模板的topic字段
        templates.forEach((template, index) => {
            console.log(`Template ${index}: "${template.title}" -> topic: "${template.topic}"`);
        });
        console.log('Topics hierarchy:', topics);

        // If we have hierarchical topics, use them
        if (topics && topics.roots) {
            console.log('Using hierarchical topics:', topics.roots);
            const result = topics.roots.map(root => buildTreeNodeFromTopic(root));
            console.log('Built tree from hierarchy:', result);
            return result;
        }

        // Otherwise, build a simple structure from templates
        // console.log('Building from templates...');
        const topicMap = new Map();

        templates.forEach(template => {
            const topicName = template.topic || '未分類';

            // Check if topic contains subtopic information (e.g., "C語言/基礎語法")
            const topicParts = topicName.split('/');
            const mainTopic = topicParts[0];
            const subTopic = topicParts[1];

            console.log(`Processing template: ${template.title}, topic: ${topicName}, parts:`, topicParts);

            // Ensure main topic exists
            if (!topicMap.has(mainTopic)) {
                topicMap.set(mainTopic, {
                    id: mainTopic,
                    name: mainTopic,
                    type: 'topic',
                    templates: [],
                    children: [],
                    subTopics: new Map()
                });
            }

            const mainTopicData = topicMap.get(mainTopic);

            if (subTopic) {
                // Has subtopic
                if (!mainTopicData.subTopics.has(subTopic)) {
                    mainTopicData.subTopics.set(subTopic, {
                        id: `${mainTopic}/${subTopic}`,
                        name: subTopic,
                        type: 'topic',
                        templates: [],
                        children: []
                    });
                }
                mainTopicData.subTopics.get(subTopic).templates.push(template);
            } else {
                // Direct template under main topic
                mainTopicData.templates.push(template);
            }
        });

        console.log('Topic map:', topicMap);

        return Array.from(topicMap.values()).map(topic => {
            const children = [];

            // Add subtopics as children
            if (topic.subTopics && topic.subTopics.size > 0) {
                Array.from(topic.subTopics.values()).forEach(subTopic => {
                    console.log(`Building subtopic: ${subTopic.name}, templates:`, subTopic.templates);
                    children.push({
                        ...subTopic,
                        expanded: true,
                        children: subTopic.templates.map(template => ({
                            id: template.id,
                            name: template.title,
                            type: 'template',
                            data: template,
                            children: []
                        }))
                    });
                });
            }

            // Add direct templates
            topic.templates.forEach(template => {
                children.push({
                    id: template.id,
                    name: template.title,
                    type: 'template',
                    data: template,
                    children: []
                });
            });

            return {
                id: topic.id,
                name: topic.name,
                type: topic.type,
                expanded: true,
                children: children
            };
        });
    }

    function findParentTopic(topicNode) {
        // This is a simple helper to find parent - in a real implementation
        // you might need to traverse the hierarchy
        return topicNode.parent || null;
    }

    function buildTreeNodeFromTopic(topicNode) {
        const node = {
            id: topicNode.topic.id,
            name: topicNode.topic.displayName || topicNode.topic.name,
            type: 'topic',
            data: topicNode.topic,
            children: [],
            expanded: !topicNode.topic.display?.collapsed
        };

        // Store topic data for later lookup
        if (!window.topicLookup) {
            window.topicLookup = new Map();
        }
        window.topicLookup.set(topicNode.topic.id, topicNode.topic);
        console.log('Stored topic for lookup:', topicNode.topic.id, topicNode.topic);

        // Add child topics
        if (topicNode.children) {
            node.children.push(...topicNode.children.map(child => buildTreeNodeFromTopic(child)));
        }

        // Add templates for this topic
        // ID 和 path 是完全不同的格式，需要建立正確的對應關係
        const topicId = topicNode.topic.id;
        const topicName = topicNode.topic.name;

        // 先輸出當前主題的詳細信息，以便調試
        console.log(`Processing topic: "${topicName}" (ID: "${topicId}")`);
        console.log(`Topic node:`, topicNode.topic);

        // 基於主題名稱和可能的路徑格式來匹配模板
        // 不做 dash 到 slash 的轉換，而是基於實際的對應關係
        const possibleMatches = [
            topicName,              // 直接使用主題名稱: basic
            topicId,                // 直接使用 ID: c-basic
        ];

        // 如果有父主題，也嘗試包含父主題路徑
        if (topicNode.parent && topicNode.parent.topic) {
            const parentName = topicNode.parent.topic.name;
            possibleMatches.push(`${parentName}/${topicName}`);  // 例如: c/basic
        }

        const templates = currentData.templates?.filter(t => {
            return possibleMatches.some(match =>
                t.topic === match ||
                t.topic.endsWith(`/${topicName}`) ||  // 匹配結尾是 /topicName 的路徑
                t.topic === topicName  // 直接名稱匹配
            );
        }) || [];

        console.log(`Trying matches:`, possibleMatches);
        console.log(`Available template topics:`, currentData.templates?.map(t => t.topic) || []);
        console.log(`Found ${templates.length} templates:`, templates.map(t => `"${t.title}" (topic: "${t.topic}")"`));

        templates.forEach(template => {
            node.children.push({
                id: template.id,
                name: template.title,
                type: 'template',
                data: template,
                children: [],
                parent: node
            });
        });

        // Add links for this topic
        const topicLinks = topicNode.topic.loadedLinks || [];
        console.log(`Found ${topicLinks.length} links for topic ${topicName}:`, topicLinks);

        topicLinks.forEach(link => {
            node.children.push({
                id: link.id,
                name: link.title,
                type: 'link',
                data: link,
                children: [],
                parent: node
            });
        });

        return node;
    }

    function renderTreeNode(node, depth) {
        const hasChildren = node.children && node.children.length > 0;
        const isExpanded = node.expanded === true || (node.expanded !== false && depth === 0); // 頂層節點默認展開
        let icon;
        switch (node.type) {
            case 'topic':
                icon = node.data?.display?.icon || getTopicIcon(node.name);
                break;
            case 'template':
                icon = '📄';
                break;
            case 'link':
                icon = '🔗';
                break;
            default:
                icon = '📄';
        }

        const toggleClass = hasChildren ?
            (isExpanded ? 'expanded' : 'collapsed') : 'leaf';

        console.log(`Rendering node: ${node.name}, type: ${node.type}, hasChildren: ${hasChildren}, isExpanded: ${isExpanded}, depth: ${depth}`);
        if (hasChildren) {
            console.log(`Children for ${node.name}:`, node.children.map(c => c.name));
        }

        return `
            <div class="tree-node" data-id="${node.id}" data-type="${node.type}" data-expanded="${isExpanded}">
                <div class="tree-item ${node.type}" style="padding-left: ${depth * 16}px">
                    <span class="tree-toggle ${toggleClass}"></span>
                    <span class="tree-icon">${icon}</span>
                    <span class="tree-label">${escapeHtml(node.displayName || node.name)}</span>
                    ${hasChildren && node.type === 'topic' ?
                        `<span class="tree-count">${node.children.length}</span>` : ''}
                </div>
                ${hasChildren ? `
                    <div class="tree-children ${isExpanded ? '' : 'collapsed'}" style="display: ${isExpanded ? 'block' : 'none'}">
                        ${node.children.map(child => renderTreeNode(child, depth + 1)).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    }

    function setupTreeInteractions() {
        const container = document.getElementById('content-tree');
        if (!container) return;

        container.addEventListener('click', (e) => {
            // console.log('Tree container clicked', e.target);
            const toggle = e.target.closest('.tree-toggle');
            const item = e.target.closest('.tree-item');

            if (toggle && !toggle.classList.contains('leaf')) {
                // console.log('Toggle clicked');
                // Toggle expand/collapse
                const node = toggle.closest('.tree-node');
                const children = node.querySelector('.tree-children');

                if (children) {
                    const isExpanded = toggle.classList.contains('expanded');
                    // console.log('Toggle clicked - current state:', isExpanded ? 'expanded' : 'collapsed');

                    if (isExpanded) {
                        // Collapse
                        toggle.classList.remove('expanded');
                        toggle.classList.add('collapsed');
                        children.classList.add('collapsed');
                        children.style.display = 'none';
                        node.dataset.expanded = 'false';
                        // console.log('Collapsed');
                    } else {
                        // Expand
                        toggle.classList.remove('collapsed');
                        toggle.classList.add('expanded');
                        children.classList.remove('collapsed');
                        children.style.display = 'block';
                        node.dataset.expanded = 'true';
                        // console.log('Expanded');
                    }
                }

                e.stopPropagation();
            } else if (item) {
                console.log('Tree item clicked:', item);
                // Select item and show details
                selectTreeItem(item);
            }
        });

        // Add double-click to edit
        container.addEventListener('dblclick', (e) => {
            const item = e.target.closest('.tree-item');
            if (item) {
                const node = item.closest('.tree-node');
                const itemId = node.dataset.id;
                const itemType = node.dataset.type;

                if (itemType === 'topic') {
                    editTopic(itemId);
                } else if (itemType === 'template') {
                    editTemplate(itemId);
                }
            }
        });

        // Add right-click context menu
        container.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            const item = e.target.closest('.tree-item');
            if (item) {
                showContextMenu(e, item);
            }
        });

        // Close context menu when clicking elsewhere
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.context-menu')) {
                closeContextMenu();
            }
        });
    }

    function setupTreeKeyboardNavigation() {
        const container = document.getElementById('content-tree');
        if (!container) return;

        container.setAttribute('tabindex', '0'); // Make container focusable

        container.addEventListener('keydown', (e) => {
            const selected = container.querySelector('.tree-item.selected');
            if (!selected) return;

            let nextItem = null;

            switch (e.key) {
                case 'ArrowDown':
                    nextItem = getNextTreeItem(selected);
                    break;
                case 'ArrowUp':
                    nextItem = getPreviousTreeItem(selected);
                    break;
                case 'ArrowRight':
                    expandTreeNode(selected);
                    break;
                case 'ArrowLeft':
                    collapseTreeNode(selected);
                    break;
                case 'Enter':
                case ' ':
                    e.preventDefault();
                    selected.click();
                    break;
                case 'F2':
                    e.preventDefault();
                    const node = selected.closest('.tree-node');
                    const itemType = node.dataset.type;
                    const itemId = node.dataset.id;
                    if (itemType === 'topic') {
                        renameTopic(itemId);
                    }
                    break;
            }

            if (nextItem) {
                e.preventDefault();
                selectTreeItem(nextItem);
                nextItem.scrollIntoView({ block: 'nearest' });
            }
        });
    }

    function getNextTreeItem(currentItem) {
        const allItems = document.querySelectorAll('.tree-item');
        const currentIndex = Array.from(allItems).indexOf(currentItem);
        return allItems[currentIndex + 1] || null;
    }

    function getPreviousTreeItem(currentItem) {
        const allItems = document.querySelectorAll('.tree-item');
        const currentIndex = Array.from(allItems).indexOf(currentItem);
        return allItems[currentIndex - 1] || null;
    }

    function expandTreeNode(item) {
        const node = item.closest('.tree-node');
        const toggle = node.querySelector('.tree-toggle');
        const children = node.querySelector('.tree-children');

        if (toggle && children && toggle.classList.contains('collapsed')) {
            toggle.classList.remove('collapsed');
            toggle.classList.add('expanded');
            children.classList.remove('collapsed');
        }
    }

    function collapseTreeNode(item) {
        const node = item.closest('.tree-node');
        const toggle = node.querySelector('.tree-toggle');
        const children = node.querySelector('.tree-children');

        if (toggle && children && toggle.classList.contains('expanded')) {
            toggle.classList.remove('expanded');
            toggle.classList.add('collapsed');
            children.classList.add('collapsed');
        }
    }

    function selectTreeItem(item) {
        console.log('selectTreeItem called with:', item);

        // Remove previous selection
        document.querySelectorAll('.tree-item.selected').forEach(el => {
            el.classList.remove('selected');
        });

        // Add selection to clicked item
        item.classList.add('selected');

        // Get item data
        const node = item.closest('.tree-node');
        const itemId = node.dataset.id;
        const itemType = node.dataset.type;

        // Add topic color for dynamic theming
        const itemPath = item.getAttribute('data-path');
        if (itemType === 'topic') {
            let topics = [];
            if (currentData.topics?.hierarchy?.topicsMap) {
                if (currentData.topics.hierarchy.topicsMap instanceof Map) {
                    topics = Array.from(currentData.topics.hierarchy.topicsMap.values());
                } else if (typeof currentData.topics.hierarchy.topicsMap === 'object') {
                    topics = Object.values(currentData.topics.hierarchy.topicsMap);
                }
            } else if (window.topicLookup) {
                topics = Array.from(window.topicLookup.values());
            }

            const topic = topics.find(t => t.id === itemPath || t.id === itemPath.split('/').pop());
            if (topic?.display?.color) {
                item.style.setProperty('--selected-topic-color', topic.display.color);
            }
        }

        // Save current selection state
        selectedTreeItem = { id: itemId, type: itemType };
        console.log('selectTreeItem - itemId:', itemId, 'itemType:', itemType, '(saved for restore)');

        // Show item details
        showContentDetails(itemId, itemType);
    }

    function restoreTreeSelection(container) {
        console.log('restoreTreeSelection called with selectedTreeItem:', selectedTreeItem);

        let itemToSelect = null;

        // Try to restore previous selection
        if (selectedTreeItem) {
            const targetNode = container.querySelector(`[data-id="${selectedTreeItem.id}"][data-type="${selectedTreeItem.type}"]`);
            if (targetNode) {
                itemToSelect = targetNode.querySelector('.tree-item');
                console.log('Found previous selected item:', selectedTreeItem.id, selectedTreeItem.type);
            } else {
                console.log('Previous selected item not found:', selectedTreeItem.id, selectedTreeItem.type);
            }
        }

        // Fallback to first item if restore failed
        if (!itemToSelect) {
            itemToSelect = container.querySelector('.tree-item');
            console.log('Fallback to first tree item:', itemToSelect ? 'found' : 'not found');
        }

        // Select the item
        if (itemToSelect) {
            selectTreeItem(itemToSelect);
        }
    }

    function showContentDetails(itemId, itemType) {
        console.log('showContentDetails called with:', itemId, itemType);
        const container = document.getElementById('content-details');
        if (!container) {
            console.error('content-details container not found');
            return;
        }

        console.log('Container found:', container);

        if (itemType === 'topic') {
            console.log('Showing topic details');
            showTopicDetails(itemId, container);
        } else if (itemType === 'template') {
            console.log('Showing template details');
            showTemplateDetails(itemId, container);
        } else if (itemType === 'link') {
            console.log('Showing link details');
            showLinkDetails(itemId, container);
        } else {
            console.warn('Unknown item type:', itemType);
        }
    }

    function showTopicDetails(topicId, container) {
        console.log('showTopicDetails called with:', topicId, container);
        // Find topic data
        const topic = findTopicById(topicId);
        console.log('Found topic:', topic);
        if (!topic) {
            console.warn('Topic not found for ID:', topicId);
            return;
        }

        // 使用改進的模板匹配邏輯，與樹節點構建時一致
        const topicName = topic.name;

        // 基於主題名稱和可能的路徑格式來匹配模板
        const possibleMatches = [
            topicName,              // 直接使用主題名稱: basic
            topicId,                // 直接使用 ID: c-basic
        ];

        // 如果有父主題，也嘗試包含父主題路徑
        if (topic.parent) {
            const parentName = topic.parent;
            possibleMatches.push(`${parentName}/${topicName}`);  // 例如: c/basic
        }

        const templates = currentData.templates?.filter(t => {
            return possibleMatches.some(match =>
                t.topic === match ||
                t.topic.endsWith(`/${topicName}`) ||  // 匹配結尾是 /topicName 的路徑
                t.topic === topicName  // 直接名稱匹配
            );
        }) || [];

        console.log(`Topic details - trying matches for "${topicName}":`, possibleMatches);
        console.log(`Topic details - found ${templates.length} templates:`, templates.map(t => `"${t.title}" (topic: "${t.topic}")"`));

        const html = `
            <div class="content-details-header">
                <div class="details-title">
                    <span class="details-icon">${topic.display?.icon || '🏷️'}</span>
                    <h3>${escapeHtml(topic.displayName || topic.name)}</h3>
                </div>
                <div class="details-actions">
                    <button class="btn btn-secondary btn-small" data-action="edit-topic" data-topic-id="${topicId}">
                        <span class="icon">✏️</span> 編輯
                    </button>
                    <button class="btn btn-success btn-small" data-action="create-template-in-topic" data-topic-id="${topicId}">
                        <span class="icon">＋</span> 新增模板
                    </button>
                    ${topic.documentation ? `
                        <button class="btn btn-info btn-small" data-action="view-topic-documentation" data-topic-id="${topicId}">
                            <span class="icon">📖</span> 說明文件
                        </button>
                    ` : ''}
                </div>
            </div>

            <div class="content-details-body">
                <div class="details-section">
                    <h4>描述</h4>
                    <p>${escapeHtml(topic.description || '無描述')}</p>
                </div>

                <div class="details-section">
                    <h4>模板 (${templates.length})</h4>
                    <div class="templates-grid">
                        ${templates.length === 0 ?
                            '<p class="no-data">此主題尚無模板</p>' :
                            templates.map(template => `
                                <div class="template-card" data-action="show-template-details" data-template-id="${template.id}">
                                    <div class="template-header">
                                        <span class="template-icon">📄</span>
                                        <span class="template-title">${escapeHtml(template.title)}</span>
                                    </div>
                                    <div class="template-meta">
                                        <span class="language-tag">${escapeHtml(template.language)}</span>
                                    </div>
                                </div>
                            `).join('')
                        }
                    </div>
                </div>
            </div>
        `;

        console.log('Setting topic details HTML:', html.substring(0, 200) + '...');
        container.innerHTML = html;
        console.log('Topic details HTML set successfully');
    }

    function showTemplateDetails(templateId, container) {
        if (!container) {
            container = document.getElementById('content-details');
        }

        const template = currentData.templates?.find(t => t.id === templateId);
        if (!template) return;

        const html = `
            <div class="content-details-header">
                <div class="details-title">
                    <span class="details-icon">📄</span>
                    <h3>${escapeHtml(template.title)}</h3>
                </div>
                <div class="details-actions">
                    <button class="btn btn-secondary btn-small" data-action="edit-template" data-template-id="${templateId}">
                        <span class="icon">✏️</span> 編輯
                    </button>
                    <button class="btn btn-primary btn-small" data-action="use-template" data-template-id="${templateId}">
                        <span class="icon">📋</span> 使用
                    </button>
                    ${template.documentation ? `
                        <button class="btn btn-info btn-small" data-action="view-documentation" data-template-id="${templateId}">
                            <span class="icon">📖</span> 說明文件
                        </button>
                    ` : ''}
                </div>
            </div>

            <div class="content-details-body">
                <div class="details-section">
                    <h4>描述</h4>
                    <p>${escapeHtml(template.description)}</p>
                </div>

                <div class="details-section">
                    <h4>資訊</h4>
                    <div class="template-meta-grid">
                        <div class="meta-item">
                            <span class="meta-label">語言:</span>
                            <span class="meta-value">${escapeHtml(template.language)}</span>
                        </div>
                        <div class="meta-item">
                            <span class="meta-label">主題:</span>
                            <span class="meta-value">${escapeHtml(getTopicDisplayName(template.topic))}</span>
                        </div>
                        ${template.metadata?.lastUsedAt ? `
                            <div class="meta-item">
                                <span class="meta-label">最後使用:</span>
                                <span class="meta-value">${new Date(template.metadata.lastUsedAt).toLocaleDateString()}</span>
                            </div>
                        ` : ''}
                    </div>
                </div>

                <div class="details-section">
                    <h4>程式碼</h4>
                    <div class="code-preview">
                        <pre><code>${escapeHtml(template.code)}</code></pre>
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = html;
    }

    function showLinkDetails(linkId, container) {
        if (!container) {
            container = document.getElementById('content-details');
        }

        // Find the link data from the tree structure
        const link = findLinkById(linkId);
        if (!link) {
            console.warn('Link not found for ID:', linkId);
            container.innerHTML = '<p>連結資料未找到</p>';
            return;
        }

        const html = `
            <div class="content-details-header">
                <div class="details-title">
                    <span class="details-icon">🔗</span>
                    <h3>${escapeHtml(link.title)}</h3>
                </div>
                <div class="details-actions">
                    <button class="btn btn-secondary btn-small" data-action="edit-link" data-link-id="${linkId}">
                        <span class="icon">✏️</span> 編輯
                    </button>
                    <button class="btn btn-danger btn-small" data-action="delete-link" data-link-id="${linkId}">
                        <span class="icon">🗑️</span> 刪除
                    </button>
                </div>
            </div>

            <div class="content-details-body">
                <div class="details-section">
                    <h4>描述</h4>
                    <p>${escapeHtml(link.description || '無描述')}</p>
                </div>

                <div class="details-section">
                    <h4>連結資訊</h4>
                    <div class="template-meta-grid">
                        <div class="meta-item">
                            <span class="meta-label">連結ID:</span>
                            <span class="meta-value">${escapeHtml(link.id)}</span>
                        </div>
                        <div class="meta-item">
                            <span class="meta-label">目標路徑:</span>
                            <span class="meta-value">${escapeHtml(link.target)}</span>
                        </div>
                        ${link.language ? `
                            <div class="meta-item">
                                <span class="meta-label">語言:</span>
                                <span class="meta-value">${escapeHtml(link.language)}</span>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = html;
    }

    function findLinkById(linkId) {
        console.log('findLinkById called with:', linkId);

        // First try to search in tree data if available
        if (window.treeData && window.treeData.length > 0) {
            function searchTreeForLink(nodes) {
                for (const node of nodes) {
                    if (node.type === 'link' && node.id === linkId) {
                        console.log('Found link in tree:', node.data);
                        return node.data;
                    }
                    if (node.children && node.children.length > 0) {
                        const found = searchTreeForLink(node.children);
                        if (found) return found;
                    }
                }
                return null;
            }

            const link = searchTreeForLink(window.treeData);
            if (link) {
                return link;
            }
        }

        // Alternative: search through all topics' loadedLinks
        if (currentData.topics?.hierarchy?.topicsMap) {
            let topicsToSearch = [];

            if (currentData.topics.hierarchy.topicsMap instanceof Map) {
                topicsToSearch = Array.from(currentData.topics.hierarchy.topicsMap.values());
            } else if (typeof currentData.topics.hierarchy.topicsMap === 'object') {
                topicsToSearch = Object.values(currentData.topics.hierarchy.topicsMap);
            }

            for (const topic of topicsToSearch) {
                if (topic.loadedLinks) {
                    const link = topic.loadedLinks.find(l => l.id === linkId);
                    if (link) {
                        console.log('Found link in topic loadedLinks:', link);
                        return link;
                    }
                }
            }
        }

        console.warn('Link not found in tree data or topic loadedLinks for ID:', linkId);
        return null;
    }

    // Helper function to get all topics as an array
    function getAllTopics() {
        let topics = [];
        if (currentData.topics?.hierarchy?.topicsMap) {
            if (currentData.topics.hierarchy.topicsMap instanceof Map) {
                topics = Array.from(currentData.topics.hierarchy.topicsMap.values());
            } else if (typeof currentData.topics.hierarchy.topicsMap === 'object') {
                topics = Object.values(currentData.topics.hierarchy.topicsMap);
            }
        }
        return topics;
    }

    // Helper function to find topic by name
    function findTopicByName(topicName) {
        const topics = getAllTopics();
        return topics.find(t => t.name === topicName);
    }

    function findTopicById(topicId) {
        console.log('findTopicById called with:', topicId);
        console.log('currentData.topics:', currentData.topics);

        // Check our own topic lookup first
        if (window.topicLookup && window.topicLookup.has(topicId)) {
            const topic = window.topicLookup.get(topicId);
            console.log('Found topic in lookup:', topic);
            return topic;
        }

        // Search in hierarchy first
        if (currentData.topics?.hierarchy?.topicsMap) {
            console.log('Searching in topicsMap:', currentData.topics.hierarchy.topicsMap);
            // Check if it's a Map object
            if (currentData.topics.hierarchy.topicsMap instanceof Map) {
                const topic = currentData.topics.hierarchy.topicsMap.get(topicId);
                if (topic) {
                    console.log('Found topic in Map:', topic);
                    return topic;
                }
            } else if (typeof currentData.topics.hierarchy.topicsMap === 'object') {
                // Handle as regular object
                const topic = currentData.topics.hierarchy.topicsMap[topicId];
                if (topic) {
                    console.log('Found topic in Object:', topic);
                    return topic;
                }
            }
        }

        // Search by matching topic name in templates
        const templates = currentData.templates?.filter(t => t.topic === topicId) || [];

        if (templates.length > 0) {
            const topicData = {
                id: topicId,
                name: topicId,
                displayName: topicId,
                description: `包含 ${templates.length} 個模板`,
                display: {
                    icon: getTopicIcon(topicId)
                }
            };
            return topicData;
        }

        return null;
    }

    function getTopicIcon(topicName) {
        const topicLower = topicName.toLowerCase();
        if (topicLower.includes('python')) return '🐍';
        if (topicLower.includes('javascript')) return '⚡';
        if (topicLower.includes('c語言') || topicLower.includes('c++')) return '⚙️';
        if (topicLower.includes('java')) return '☕';
        if (topicLower.includes('html')) return '🌐';
        if (topicLower.includes('css')) return '🎨';
        return '🏷️';
    }

    function expandAllNodes() {
        document.querySelectorAll('.tree-toggle.collapsed').forEach(toggle => {
            toggle.classList.remove('collapsed');
            toggle.classList.add('expanded');

            const node = toggle.closest('.tree-node');
            const children = node.querySelector('.tree-children');
            if (children) {
                children.classList.remove('collapsed');
            }
        });
    }

    function collapseAllNodes() {
        document.querySelectorAll('.tree-toggle.expanded').forEach(toggle => {
            toggle.classList.remove('expanded');
            toggle.classList.add('collapsed');

            const node = toggle.closest('.tree-node');
            const children = node.querySelector('.tree-children');
            if (children) {
                children.classList.add('collapsed');
            }
        });
    }

    function filterContentTree() {
        const languageFilter = document.getElementById('content-filter-language')?.value || '';
        const searchFilter = document.getElementById('search-content')?.value?.toLowerCase() || '';

        document.querySelectorAll('.tree-node').forEach(node => {
            const itemType = node.dataset.type;
            const itemId = node.dataset.id;
            let shouldShow = true;

            if (itemType === 'template') {
                const template = currentData.templates?.find(t => t.id === itemId);
                if (template) {
                    // Language filter
                    if (languageFilter && template.language !== languageFilter) {
                        shouldShow = false;
                    }

                    // Search filter
                    if (searchFilter) {
                        const searchText = (template.title + ' ' + template.description).toLowerCase();
                        if (!searchText.includes(searchFilter)) {
                            shouldShow = false;
                        }
                    }
                }
            } else if (itemType === 'topic') {
                // For topics, check if any child templates match
                if (languageFilter || searchFilter) {
                    const hasMatchingTemplates = hasMatchingChildTemplates(node, languageFilter, searchFilter);
                    shouldShow = hasMatchingTemplates;
                }
            }

            node.style.display = shouldShow ? 'block' : 'none';
        });
    }

    function hasMatchingChildTemplates(topicNode, languageFilter, searchFilter) {
        const children = topicNode.querySelectorAll('.tree-node[data-type="template"]');

        for (const child of children) {
            const templateId = child.dataset.id;
            const template = currentData.templates?.find(t => t.id === templateId);

            if (template) {
                let matches = true;

                if (languageFilter && template.language !== languageFilter) {
                    matches = false;
                }

                if (searchFilter) {
                    const searchText = (template.title + ' ' + template.description).toLowerCase();
                    if (!searchText.includes(searchFilter)) {
                        matches = false;
                    }
                }

                if (matches) {
                    return true;
                }
            }
        }

        return false;
    }

    // Helper functions for actions
    function editTopic(topicId) {
        const topic = findTopicById(topicId);
        if (topic) {
            openModal('topic', topic);
        }
    }

    function createTemplateInTopic(topicId) {
        const topic = findTopicById(topicId);
        if (topic) {
            openModal('template', { topic: topic.name });
        }
    }

    function showContextMenu(event, item) {
        closeContextMenu(); // Close any existing menu

        const node = item.closest('.tree-node');
        const itemId = node.dataset.id;
        const itemType = node.dataset.type;

        const menu = document.createElement('div');
        menu.className = 'context-menu';
        menu.innerHTML = getContextMenuHTML(itemId, itemType);

        // Position the menu
        menu.style.left = `${event.pageX}px`;
        menu.style.top = `${event.pageY}px`;

        document.body.appendChild(menu);

        // Adjust position if menu goes off screen
        const rect = menu.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        if (rect.right > viewportWidth) {
            menu.style.left = `${event.pageX - rect.width}px`;
        }
        if (rect.bottom > viewportHeight) {
            menu.style.top = `${event.pageY - rect.height}px`;
        }

        // Add event listeners to menu items
        menu.addEventListener('click', (e) => {
            const menuItem = e.target.closest('.context-menu-item');
            if (menuItem) {
                const action = menuItem.dataset.action;
                if (action) {
                    handleContextMenuAction(action, itemId, itemType);
                    closeContextMenu();
                }
            }
        });

        // Auto-close after 10 seconds
        setTimeout(() => {
            closeContextMenu();
        }, 10000);
    }

    function closeContextMenu() {
        const existingMenu = document.querySelector('.context-menu');
        if (existingMenu) {
            existingMenu.remove();
        }
    }

    function getContextMenuHTML(itemId, itemType) {
        if (itemType === 'topic') {
            return `
                <div class="context-menu-item" data-action="edit-topic">
                    <span class="context-menu-icon">✏️</span>
                    <span>編輯主題</span>
                </div>
                <div class="context-menu-item" data-action="add-template">
                    <span class="context-menu-icon">＋</span>
                    <span>新增模板</span>
                </div>
                <div class="context-menu-item" data-action="add-subtopic">
                    <span class="context-menu-icon">🏷️</span>
                    <span>新增子主題</span>
                </div>
                <div class="context-menu-separator"></div>
                <div class="context-menu-item" data-action="rename-topic">
                    <span class="context-menu-icon">📝</span>
                    <span>重新命名</span>
                </div>
                <div class="context-menu-item" data-action="duplicate-topic">
                    <span class="context-menu-icon">📋</span>
                    <span>複製主題</span>
                </div>
                <div class="context-menu-separator"></div>
                <div class="context-menu-item danger" data-action="delete-topic">
                    <span class="context-menu-icon">🗑️</span>
                    <span>刪除主題</span>
                </div>
            `;
        } else if (itemType === 'template') {
            const template = currentData.templates?.find(t => t.id === itemId);
            const isFavorite = currentData.scope?.favorites?.includes(itemId);

            return `
                <div class="context-menu-item" data-action="use-template">
                    <span class="context-menu-icon">▶️</span>
                    <span>使用模板</span>
                </div>
                <div class="context-menu-item" data-action="edit-template">
                    <span class="context-menu-icon">✏️</span>
                    <span>編輯模板</span>
                </div>
                <div class="context-menu-item" data-action="duplicate-template">
                    <span class="context-menu-icon">📋</span>
                    <span>複製模板</span>
                </div>
                <div class="context-menu-separator"></div>
                <div class="context-menu-item" data-action="toggle-favorite">
                    <span class="context-menu-icon">${isFavorite ? '💔' : '❤️'}</span>
                    <span>${isFavorite ? '移除收藏' : '加入收藏'}</span>
                </div>
                <div class="context-menu-item" data-action="preview-template">
                    <span class="context-menu-icon">👁️</span>
                    <span>預覽模板</span>
                </div>
                <div class="context-menu-separator"></div>
                <div class="context-menu-item danger" data-action="delete-template">
                    <span class="context-menu-icon">🗑️</span>
                    <span>刪除模板</span>
                </div>
            `;
        }
        return '';
    }

    function handleContextMenuAction(action, itemId, itemType) {
        switch (action) {
            case 'edit-topic':
                editTopic(itemId);
                break;
            case 'add-template':
                createTemplateInTopic(itemId);
                break;
            case 'add-subtopic':
                createSubtopic(itemId);
                break;
            case 'rename-topic':
                renameTopic(itemId);
                break;
            case 'duplicate-topic':
                duplicateTopic(itemId);
                break;
            case 'delete-topic':
                deleteTopic(itemId);
                break;
            case 'use-template':
                useTemplate(itemId);
                break;
            case 'edit-template':
                editTemplate(itemId);
                break;
            case 'duplicate-template':
                duplicateTemplate(itemId);
                break;
            case 'toggle-favorite':
                toggleFavorite(itemId);
                break;
            case 'preview-template':
                previewTemplate(itemId);
                break;
            case 'delete-template':
                deleteTemplate(itemId);
                break;
        }
    }

    function useTemplate(templateId) {
        vscode.postMessage({
            type: 'useTemplate',
            templateId: templateId
        });
    }

    function clearAllFavorites() {
        if (confirm('確定要清空所有收藏嗎？')) {
            const favorites = [...(currentData.scope?.favorites || [])];
            favorites.forEach(itemId => removeFromFavorites(itemId));
        }
    }

    // Additional helper functions for context menu actions
    function createSubtopic(parentTopicId) {
        const parentTopic = findTopicById(parentTopicId);
        if (parentTopic) {
            openModal('topic', { parent: parentTopic.name });
        }
    }

    function renameTopic(topicId) {
        const topic = findTopicById(topicId);
        if (topic) {
            const newName = prompt('請輸入新的主題名稱：', topic.name);
            if (newName && newName.trim() && newName !== topic.name) {
                vscode.postMessage({
                    type: 'updateTopic',
                    topicId: topicId,
                    data: { ...topic, name: newName.trim() }
                });
            }
        }
    }

    function duplicateTopic(topicId) {
        const topic = findTopicById(topicId);
        if (topic) {
            const newName = prompt('請輸入複製後的主題名稱：', `${topic.name} 副本`);
            if (newName && newName.trim()) {
                vscode.postMessage({
                    type: 'duplicateTopic',
                    topicId: topicId,
                    newName: newName.trim()
                });
            }
        }
    }

    function deleteTopic(topicId) {
        const topic = findTopicById(topicId);
        if (topic) {
            // 使用改進的模板匹配邏輯來查找相關模板
            const topicName = topic.name;
            const possibleMatches = [
                topicName,
                topicId,
            ];
            if (topic.parent) {
                possibleMatches.push(`${topic.parent}/${topicName}`);
            }

            const templates = currentData.templates?.filter(t => {
                return possibleMatches.some(match =>
                    t.topic === match ||
                    t.topic.endsWith(`/${topicName}`) ||
                    t.topic === topicName
                );
            }) || [];
            let confirmMessage = `確定要刪除主題「${topic.name}」嗎？`;

            if (templates.length > 0) {
                confirmMessage += `\n此主題包含 ${templates.length} 個模板，刪除後這些模板將移到「未分類」主題。`;
            }

            if (confirm(confirmMessage)) {
                vscode.postMessage({
                    type: 'deleteTopic',
                    topicId: topicId
                });
            }
        }
    }

    function editTemplate(templateId) {
        const template = currentData.templates?.find(t => t.id === templateId);
        if (template) {
            openModal('template', template);
        }
    }

    function duplicateTemplate(templateId) {
        const template = currentData.templates?.find(t => t.id === templateId);
        if (template) {
            const newTitle = prompt('請輸入複製後的模板標題：', `${template.title} 副本`);
            if (newTitle && newTitle.trim()) {
                vscode.postMessage({
                    type: 'duplicateTemplate',
                    templateId: templateId,
                    newTitle: newTitle.trim()
                });
            }
        }
    }

    function toggleFavorite(templateId) {
        const isFavorite = currentData.scope?.favorites?.includes(templateId);
        if (isFavorite) {
            removeFromFavorites(templateId);
        } else {
            addToFavorites(templateId);
        }
    }

    function previewTemplate(templateId) {
        const template = currentData.templates?.find(t => t.id === templateId);
        if (template) {
            showPreview(template);
        }
    }

    function deleteTemplate(templateId) {
        const template = currentData.templates?.find(t => t.id === templateId);
        if (template) {
            if (confirm(`確定要刪除模板「${template.title}」嗎？`)) {
                vscode.postMessage({
                    type: 'deleteTemplate',
                    templateId: templateId
                });
            }
        }
    }

    function renderStatsTab() {
        console.log('Rendering stats tab...');

        // 確保統計頁面是活躍的
        showTab('stats');

        // 更新統計數據到已有的 HTML 結構中
        updateTemplateUsageStats();
        updateLanguageUsageStats();
        updateTopicUsageStats();

        console.log('Stats tab rendered successfully');
    }

    function updateTemplateUsageStats() {
        const container = document.getElementById('template-usage-list');
        if (!container) return;

        const scopeStats = currentData.scope?.usageStats;
        const templates = scopeStats?.mostUsedTemplates || [];

        if (templates.length === 0) {
            container.innerHTML = '<p class="no-data">尚無使用統計數據</p>';
            return;
        }

        const total = templates.reduce((sum, item) => sum + (item.usage || 0), 0);
        const html = templates.slice(0, 10).map((item, index) => {
            const percentage = total > 0 ? Math.round((item.usage / total) * 100) : 0;

            return `
                <div class="usage-item">
                    <div class="usage-item-info">
                        <div class="usage-item-name">${escapeHtml(item.title || item.id)}</div>
                        <div class="usage-item-details">
                            ${escapeHtml(item.language || '未知語言')} • ${escapeHtml(getTopicDisplayName(item.topic || '未分類'))}
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

    function updateLanguageUsageStats() {
        const container = document.getElementById('language-usage-list');
        if (!container) return;

        const scopeStats = currentData.scope?.usageStats;
        const languageUsage = scopeStats?.languageUsage || {};

        const entries = Object.entries(languageUsage).sort((a, b) => b[1] - a[1]);

        if (entries.length === 0) {
            container.innerHTML = '<p class="no-data">尚無語言使用統計</p>';
            return;
        }

        const total = entries.reduce((sum, [, usage]) => sum + usage, 0);
        const html = entries.slice(0, 8).map(([langId, usage]) => {
            const language = currentData.languages?.find(l => l.id === langId);
            const langName = language ? language.name : langId;
            const percentage = total > 0 ? Math.round((usage / total) * 100) : 0;

            return `
                <div class="usage-item">
                    <div class="usage-item-info">
                        <div class="usage-item-name">${escapeHtml(langName)}</div>
                        <div class="usage-item-details">${langId}</div>
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

    function updateTopicUsageStats() {
        const container = document.getElementById('topic-usage-list');
        if (!container) return;

        const scopeStats = currentData.scope?.usageStats;
        const topicUsage = scopeStats?.topicUsage || {};

        const entries = Object.entries(topicUsage).sort((a, b) => b[1] - a[1]);

        if (entries.length === 0) {
            container.innerHTML = '<p class="no-data">尚無主題使用統計</p>';
            return;
        }

        const total = entries.reduce((sum, [, usage]) => sum + usage, 0);
        const html = entries.slice(0, 8).map(([topicName, usage]) => {
            const percentage = total > 0 ? Math.round((usage / total) * 100) : 0;

            return `
                <div class="usage-item">
                    <div class="usage-item-info">
                        <div class="usage-item-name">${escapeHtml(topicName)}</div>
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

    function viewFavoriteItem(itemId) {
        // 查找並顯示收藏項目的詳細信息
        const template = currentData.templates?.find(t => t.id === itemId);
        if (template) {
            openModal('template', template);
        } else {
            // 可能是主題或其他類型的項目
            vscode.postMessage({
                type: 'showInfo',
                message: `項目 "${itemId}" 的詳細信息`
            });
        }
    }

    // 更新 showTab 函數來處理新的標籤
    function showTab(tabName) {
        // 隱藏所有標籤內容
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });

        // 顯示選中的標籤
        const targetTab = document.getElementById(`${tabName}-tab`);
        if (targetTab) {
            targetTab.classList.add('active');
        }

        // 更新導航狀態
        document.querySelectorAll('.nav-item').forEach(nav => {
            nav.classList.remove('active');
        });

        const targetNav = document.querySelector(`[data-tab="${tabName}"]`);
        if (targetNav) {
            targetNav.classList.add('active');
        }

        currentTab = tabName;
    }

    // Utility function to show error messages
    function showError(message) {
        console.error('TextBricks Manager Error:', message);
        vscode.postMessage({
            type: 'showError',
            message: message
        });
    }

    // ==================== 資料位置管理功能 ====================

    // 刷新資料位置資訊
    function refreshDataLocationInfo() {
        vscode.postMessage({ type: 'getDataLocationInfo' });
        vscode.postMessage({ type: 'getAvailableLocations' });
    }

    // 開啟資料位置
    function openDataLocation() {
        vscode.postMessage({ type: 'openDataLocation' });
    }

    // 驗證自定義路徑
    function validateCustomPath() {
        const customPath = document.getElementById('custom-path-input').value.trim();
        if (!customPath) {
            showValidationResult({ isValid: false, errors: ['請輸入路徑'] });
            return;
        }

        vscode.postMessage({
            type: 'validateDataPath',
            path: customPath
        });
    }

    // 套用自定義位置
    function applyCustomLocation() {
        const customPath = document.getElementById('custom-path-input').value.trim();
        const migrateData = document.getElementById('migrate-data-checkbox').checked;
        const createBackup = document.getElementById('create-backup-checkbox').checked;

        if (!customPath) {
            showError('請輸入有效的路徑');
            return;
        }

        vscode.postMessage({
            type: 'changeDataLocation',
            locationPath: customPath,
            options: {
                migrateData: migrateData,
                createBackup: createBackup
            }
        });
    }

    // 重設為系統預設位置
    function resetToSystemDefault() {
        vscode.postMessage({ type: 'resetToSystemDefault' });
    }

    // 處理可用位置點擊
    function handleLocationClick(locationData) {
        if (locationData.available) {
            vscode.postMessage({
                type: 'changeDataLocation',
                locationPath: locationData.path,
                options: {
                    migrateData: true,
                    createBackup: true
                }
            });
        }
    }

    // 顯示驗證結果
    function showValidationResult(validation) {
        const validationElement = document.getElementById('custom-path-validation');
        const applyButton = document.getElementById('apply-custom-location-btn');

        if (!validationElement) return;

        validationElement.style.display = 'block';

        if (validation.isValid) {
            validationElement.className = 'validation-result success';
            validationElement.innerHTML = `
                <div class="validation-item">
                    <span class="validation-icon">✅</span>
                    <span>路徑有效</span>
                </div>
                <div class="validation-details">
                    <div>可用空間: ${formatBytes(validation.availableSpace)}</div>
                    <div>需要空間: ${formatBytes(validation.requiredSpace)}</div>
                </div>
            `;
            if (applyButton) applyButton.disabled = false;
        } else {
            validationElement.className = 'validation-result error';
            validationElement.innerHTML = `
                <div class="validation-item">
                    <span class="validation-icon">❌</span>
                    <span>路徑無效</span>
                </div>
                <div class="validation-errors">
                    ${validation.errors.map(error => `<div>• ${error}</div>`).join('')}
                </div>
            `;
            if (applyButton) applyButton.disabled = true;
        }

        if (validation.warnings && validation.warnings.length > 0) {
            validationElement.innerHTML += `
                <div class="validation-warnings">
                    ${validation.warnings.map(warning => `<div class="warning">⚠️ ${warning}</div>`).join('')}
                </div>
            `;
        }
    }

    // 更新目前位置資訊顯示
    function updateCurrentLocationInfo(locationInfo) {
        const nameElement = document.getElementById('current-location-name');
        const pathElement = document.getElementById('current-location-path');
        const sizeElement = document.getElementById('location-size');
        const freeSpaceElement = document.getElementById('location-free-space');
        const scopesCountElement = document.getElementById('location-scopes-count');

        if (nameElement) nameElement.textContent = locationInfo.name || '未知位置';
        if (pathElement) pathElement.textContent = locationInfo.path || '-';
        if (sizeElement) sizeElement.textContent = formatBytes(locationInfo.size || 0);
        if (freeSpaceElement) freeSpaceElement.textContent = formatBytes(locationInfo.freeSpace || 0);
        if (scopesCountElement) scopesCountElement.textContent = (locationInfo.scopes?.length || 0).toString();
    }

    // 更新可用位置列表
    function updateAvailableLocations(locations) {
        const container = document.getElementById('available-locations');
        if (!container) return;

        if (!locations || locations.length === 0) {
            container.innerHTML = '<div class="no-data">沒有可用的位置選項</div>';
            return;
        }

        container.innerHTML = locations.map(location => `
            <div class="location-option ${location.available ? 'available' : 'unavailable'} ${location.recommended ? 'recommended' : ''}"
                 onclick="handleLocationClick(${JSON.stringify(location).replace(/"/g, '&quot;')})">
                <div class="location-option-header">
                    <div class="location-option-icon">
                        ${location.type === 'system' ? '🏠' :
                          location.type === 'vscode' ? '💻' :
                          location.type === 'workspace' ? '📁' : '📂'}
                    </div>
                    <div class="location-option-info">
                        <div class="location-option-name">${location.name}</div>
                        <div class="location-option-path">${location.path}</div>
                        <div class="location-option-description">${location.description}</div>
                    </div>
                    <div class="location-option-status">
                        ${location.recommended ? '<span class="badge recommended">推薦</span>' : ''}
                        ${location.available ? '<span class="badge available">可用</span>' : '<span class="badge unavailable">不可用</span>'}
                        ${location.migrationRequired ? '<span class="badge migration">需要遷移</span>' : ''}
                    </div>
                </div>
            </div>
        `).join('');
    }

    // 格式化位元組大小
    function formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // 渲染設定頁面
    function renderSettingsTab() {
        // 當設定頁面激活時，自動載入資料位置資訊
        refreshDataLocationInfo();
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