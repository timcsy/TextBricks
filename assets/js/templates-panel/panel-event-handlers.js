// Panel Event Handlers - 面板事件處理器
// 負責處理模板面板的各種事件（點擊、標籤切換、收藏等）

(function() {
    'use strict';

    /**
     * Panel Event Handlers 類
     * 處理模板面板的主要用戶交互事件
     */
    class PanelEventHandlers {
        constructor(context) {
            this.context = context;
        }

        /**
         * 處理卡片點擊事件（模板、主題、連結卡片）
         */
        handleClick(event) {
            const templateCard = event.target.closest('.template-card');
            const topicCard = event.target.closest('.topic-card');
            const linkCard = event.target.closest('.link-card');

            // Handle template card clicks
            if (templateCard) {
                // Prevent default behavior for button clicks
                if (event.target.closest('.action-btn') || event.target.closest('.favorite-btn')) {
                    return;
                }

                const templatePath = templateCard.dataset.templatePath;
                if (templatePath) {
                    // Single click - copy template
                    const templateOps = this.context.getTemplateOperations();
                    templateOps.copyTemplate(templatePath);

                    // Visual feedback
                    templateCard.style.animation = 'none';
                    setTimeout(() => {
                        templateCard.style.animation = 'templateInsert 0.3s ease';
                    }, 10);
                }
                return;
            }

            // Handle topic card clicks (navigate to topic)
            if (topicCard) {
                // Prevent default behavior for button clicks
                if (event.target.closest('.action-btn') || event.target.closest('.favorite-btn') || event.target.closest('.navigate-btn')) {
                    return;
                }

                const topicPath = topicCard.dataset.topicPath;
                if (topicPath) {
                    const navigationHandler = this.context.getNavigationHandler();
                    navigationHandler.navigateToTopic(topicPath);

                    // Visual feedback
                    topicCard.style.animation = 'none';
                    setTimeout(() => {
                        topicCard.style.animation = 'cardClick 0.2s ease';
                    }, 10);
                }
                return;
            }

            // Handle link card clicks (navigate to link target)
            if (linkCard) {
                // Prevent default behavior for button clicks
                if (event.target.closest('.action-btn') || event.target.closest('.favorite-btn') || event.target.closest('.navigate-btn')) {
                    return;
                }

                const linkTarget = linkCard.dataset.linkTarget;
                if (linkTarget) {
                    if (linkTarget.startsWith('http')) {
                        // External link
                        const vscode = this.context.getVSCode();
                        vscode.postMessage({
                            type: 'openExternalLink',
                            url: linkTarget
                        });
                    } else {
                        // Topic link
                        const navigationHandler = this.context.getNavigationHandler();
                        navigationHandler.navigateToTopic(linkTarget);
                    }

                    // Visual feedback
                    linkCard.style.animation = 'none';
                    setTimeout(() => {
                        linkCard.style.animation = 'cardClick 0.2s ease';
                    }, 10);
                }
                return;
            }
        }

        /**
         * 處理操作按鈕點擊事件
         */
        handleButtonClick(event) {
            if (!event.target.closest('.action-btn')) return;

            event.stopPropagation(); // Prevent card click

            const button = event.target.closest('.action-btn');

            // Handle back button (topic navigation)
            if (button.classList.contains('topic-back-btn')) {
                const navigationHandler = this.context.getNavigationHandler();
                navigationHandler.navigateBack();
                // Visual feedback for back button
                const icon = button.querySelector('.icon');
                const originalText = icon.textContent;
                icon.textContent = '⏳';
                setTimeout(() => {
                    icon.textContent = originalText;
                }, 1000);
                return;
            }

            const templateCard = button.closest('.template-card');

            if (!templateCard) return; // Not a template card button

            const templatePath = templateCard.dataset.templatePath;
            const templateOps = this.context.getTemplateOperations();

            if (button.classList.contains('insert-btn')) {
                templateOps.insertTemplate(templatePath);
                // Visual feedback for insert button
                const icon = button.querySelector('.icon');
                const originalText = icon.textContent;
                icon.textContent = '✅';
                setTimeout(() => {
                    icon.textContent = originalText;
                }, 1000);
            } else if (button.classList.contains('doc-btn')) {
                templateOps.showDocumentation(templatePath);
                // Visual feedback for documentation button
                const icon = button.querySelector('.icon');
                const originalText = icon.textContent;
                icon.textContent = '📖';
                button.style.opacity = '0.7';
                setTimeout(() => {
                    icon.textContent = originalText;
                    button.style.opacity = '';
                }, 1000);
            }
        }

        /**
         * 處理主題文檔按鈕點擊
         */
        handleTopicDocumentationClick(event) {
            const topicDocBtn = event.target.closest('.topic-doc-btn');
            const docBtn = event.target.closest('.doc-btn');

            if (!topicDocBtn && !docBtn) return;

            event.preventDefault();
            event.stopPropagation();

            const templateOps = this.context.getTemplateOperations();

            // Handle topic documentation button
            if (topicDocBtn) {
                const topicName = topicDocBtn.dataset.topicName;
                if (topicName) {
                    templateOps.showTopicDocumentation(topicName);
                }
            }

            // Handle doc button from topic/link cards
            if (docBtn) {
                const topicName = docBtn.dataset.topicName;
                const linkId = docBtn.dataset.linkId;

                if (topicName) {
                    templateOps.showTopicDocumentation(topicName);
                } else if (linkId) {
                    // For link cards with documentation, we could show link documentation
                    // For now, treat it similarly to topic documentation
                    console.log('Link documentation not yet implemented for:', linkId);
                }
            }

            // No visual feedback needed - just the hover animation is enough
        }

        /**
         * 處理標籤切換
         */
        handleTabClick(event) {
            const tabBtn = event.target.closest('.tab-btn');
            if (!tabBtn) return;

            event.preventDefault();
            event.stopPropagation();

            const targetTab = tabBtn.dataset.tab;
            const tabNavigation = tabBtn.closest('.tab-navigation');
            const recommendedContainer = tabNavigation.nextElementSibling;
            const recommendedTopic = tabNavigation.closest('.recommended-topic');

            // Check if clicked tab is already active
            const isCurrentlyActive = tabBtn.classList.contains('active');

            if (isCurrentlyActive) {
                // Toggle collapse state of entire recommended area
                const isCollapsed = recommendedContainer.classList.contains('collapsed');

                if (isCollapsed) {
                    // Expand
                    recommendedContainer.classList.remove('collapsed');
                    tabNavigation.classList.remove('collapsed');
                    console.log('Expanded recommended area');
                } else {
                    // Collapse
                    recommendedContainer.classList.add('collapsed');
                    tabNavigation.classList.add('collapsed');
                    console.log('Collapsed recommended area');
                }
            } else {
                // Normal tab switching behavior
                // Remove active class from all tab buttons in this navigation
                tabNavigation.querySelectorAll('.tab-btn').forEach(btn => {
                    btn.classList.remove('active');
                });

                // Add active class to clicked tab button
                tabBtn.classList.add('active');

                // Hide all tab content in this container
                recommendedContainer.querySelectorAll('.tab-content').forEach(content => {
                    content.classList.remove('active');
                });

                // Show target tab content
                const targetContent = recommendedContainer.querySelector(`[data-tab-content="${targetTab}"]`);
                if (targetContent) {
                    targetContent.classList.add('active');
                }

                // Ensure area is expanded when switching tabs
                recommendedContainer.classList.remove('collapsed');
                tabNavigation.classList.remove('collapsed');

                console.log('Tab switched to:', targetTab);
            }
        }

        /**
         * 處理收藏按鈕點擊
         */
        handleFavoriteClick(event) {
            const favoriteBtn = event.target.closest('.favorite-btn');
            if (!favoriteBtn) return;

            event.preventDefault();
            event.stopPropagation();

            const itemId = favoriteBtn.dataset.itemId;
            if (!itemId) return;

            // Get the icon span inside the button
            const iconSpan = favoriteBtn.querySelector('.icon');
            if (!iconSpan) return;

            // Toggle favorite status visually first for immediate feedback
            const isFavorite = iconSpan.textContent.trim() === '❤️';

            if (isFavorite) {
                iconSpan.textContent = '♡';
                favoriteBtn.title = '加入收藏';
            } else {
                iconSpan.textContent = '❤️';
                favoriteBtn.title = '取消收藏';
            }

            // Send message to backend to toggle favorite
            const vscode = this.context.getVSCode();
            vscode.postMessage({
                type: 'toggleFavorite',
                itemId: itemId
            });

            console.log('Toggle favorite for item:', itemId, isFavorite ? 'removed' : 'added');
        }

        /**
         * 處理收藏狀態切換的後端響應
         */
        handleFavoriteToggled(itemId, isFavorite) {
            // Update all favorite buttons for this item to reflect the new state
            // But skip updating buttons that already have the correct state to avoid conflicts
            const favoriteButtons = document.querySelectorAll(`[data-item-id="${itemId}"]`);

            favoriteButtons.forEach(button => {
                const iconSpan = button.querySelector('.icon');
                if (iconSpan) {
                    const currentState = iconSpan.textContent.trim() === '❤️';
                    // Only update if the state is different from what we expect
                    if (currentState !== isFavorite) {
                        iconSpan.textContent = isFavorite ? '❤️' : '♡';
                        button.title = isFavorite ? '取消收藏' : '加入收藏';
                    }
                }
            });

            // Handle favorites tab updates (regardless of whether it's currently visible)
            const favoritesTab = document.querySelector('[data-tab-content="favorites"]');
            const isTabActive = favoritesTab && favoritesTab.classList.contains('active');

            if (favoritesTab) {
                if (!isFavorite) {
                    // Remove the card from favorites tab if unfavorited
                    // Find the card that contains a favorite button with the matching itemId
                    const cardToRemove = favoritesTab.querySelector(`[data-item-id="${itemId}"]`)?.closest('.template-card, .topic-card, .link-card');

                    if (cardToRemove) {
                        // Add fade out animation only if tab is currently visible
                        if (isTabActive) {
                            cardToRemove.style.transition = 'opacity 0.3s ease';
                            cardToRemove.style.opacity = '0';

                            // Remove the card after animation
                            setTimeout(() => {
                                cardToRemove.remove();

                                // Check if favorites tab is now empty (check for all card types)
                                const remainingCards = favoritesTab.querySelectorAll('.template-card, .topic-card, .link-card');
                                if (remainingCards.length === 0) {
                                    favoritesTab.innerHTML = '<div class="empty-state">還沒有收藏任何項目</div>';
                                }
                            }, 300);
                        } else {
                            // Remove immediately if tab is not visible
                            cardToRemove.remove();

                            // Check if favorites tab is now empty
                            const remainingCards = favoritesTab.querySelectorAll('.template-card, .topic-card, .link-card');
                            if (remainingCards.length === 0) {
                                favoritesTab.innerHTML = '<div class="empty-state">還沒有收藏任何項目</div>';
                            }
                        }
                    }
                } else {
                    // Item was favorited - refresh favorites tab content
                    // We need to request updated favorites content from backend
                    const vscode = this.context.getVSCode();
                    vscode.postMessage({
                        type: 'refreshFavoritesTab'
                    });
                }
            }
        }

        /**
         * 更新收藏標籤內容
         */
        updateFavoritesTabContent(newContent) {
            const favoritesTab = document.querySelector('[data-tab-content="favorites"]');
            if (favoritesTab) {
                // Add fade transition
                favoritesTab.style.transition = 'opacity 0.2s ease';
                favoritesTab.style.opacity = '0.5';

                setTimeout(() => {
                    favoritesTab.innerHTML = newContent;
                    favoritesTab.style.opacity = '1';

                    // Remove transition after animation
                    setTimeout(() => {
                        favoritesTab.style.transition = '';
                    }, 200);
                }, 100);
            }
        }

        /**
         * 處理全局點擊（用於隱藏工具提示）
         */
        handleGlobalClick(event) {
            // Only hide tooltip if clicking outside of tooltip area
            const tooltip = event.target.closest('.template-tooltip');

            const tooltipManager = this.context.getTooltipManager();
            if (!tooltip && tooltipManager.getCurrentTooltip()) {
                console.log('Global click outside tooltip - hiding');
                tooltipManager.forceHideTooltip();
            }
        }
    }

    // 導出到全局（用於模組化）
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = PanelEventHandlers;
    } else {
        window.PanelEventHandlers = PanelEventHandlers;
    }
})();
