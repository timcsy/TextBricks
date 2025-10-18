// Navigation Handler - 導航處理器
// 負責處理所有導航相關的功能

(function() {
    'use strict';

    /**
     * Navigation Handler 類
     * 處理主題導航、麵包屑、頁面導航和主題折疊
     */
    class NavigationHandler {
        constructor(context) {
            this.context = context;
        }

        /**
         * 導航到特定主題
         */
        navigateToTopic(topicPath) {
            const vscode = this.context.getVSCode();
            vscode.postMessage({
                type: 'navigateToTopic',
                topicPath: topicPath
            });

            console.log('Navigate to topic:', topicPath);
        }

        /**
         * 導航返回上一頁
         */
        navigateBack() {
            const vscode = this.context.getVSCode();
            vscode.postMessage({
                type: 'navigateBack'
            });

            console.log('Navigate back');
        }

        /**
         * 處理導航按鈕點擊
         */
        handleNavigationClick(event) {
            const navigateBtn = event.target.closest('.navigate-btn');
            if (!navigateBtn) return;

            event.stopPropagation(); // Prevent card click

            const topicCard = navigateBtn.closest('.topic-card');
            const linkCard = navigateBtn.closest('.link-card');

            if (topicCard) {
                // Handle topic navigation
                const topicPath = topicCard.dataset.topicPath;
                if (topicPath) {
                    this.navigateToTopic(topicPath);

                    // Visual feedback
                    const icon = navigateBtn.querySelector('.icon');
                    const originalText = icon.textContent;
                    icon.textContent = '⏳';
                    setTimeout(() => {
                        icon.textContent = originalText;
                    }, 1000);
                }
            } else if (linkCard) {
                // Handle link navigation
                const linkTarget = linkCard.dataset.linkTarget;
                if (linkTarget) {
                    // Check if it's a topic link or external link
                    if (linkTarget.startsWith('http')) {
                        // External link - open in browser
                        const vscode = this.context.getVSCode();
                        vscode.postMessage({
                            type: 'openExternalLink',
                            url: linkTarget
                        });
                    } else {
                        // Topic link - navigate to topic
                        this.navigateToTopic(linkTarget);
                    }

                    // Visual feedback
                    const icon = navigateBtn.querySelector('.icon');
                    const originalText = icon.textContent;
                    icon.textContent = '⏳';
                    setTimeout(() => {
                        icon.textContent = originalText;
                    }, 1000);
                }
            } else {
                // Handle topic group navigation (main topic navigation)
                const topicGroup = navigateBtn.closest('.topic-group');
                if (topicGroup) {
                    const topicPath = navigateBtn.dataset.topicPath;
                    if (topicPath) {
                        this.navigateToTopic(topicPath);

                        // Visual feedback
                        const icon = navigateBtn.querySelector('.icon');
                        const originalText = icon.textContent;
                        icon.textContent = '⏳';
                        setTimeout(() => {
                            icon.textContent = originalText;
                        }, 1000);
                    }
                }
            }
        }

        /**
         * 處理麵包屑導航點擊
         */
        handleBreadcrumbClick(event) {
            const breadcrumbItem = event.target.closest('.breadcrumb-item.clickable');
            if (!breadcrumbItem) return;

            event.stopPropagation(); // Prevent other click handlers
            event.preventDefault();

            const navigationPath = breadcrumbItem.dataset.navigatePath;

            // Navigate to the specified path
            if (navigationPath === '') {
                // Navigate to root/home (empty path means go to root)
                this.navigateToTopic('');
            } else {
                // Navigate to specific topic
                this.navigateToTopic(navigationPath);
            }

            // Visual feedback for breadcrumb click
            const originalOpacity = breadcrumbItem.style.opacity;
            breadcrumbItem.style.opacity = '0.5';
            setTimeout(() => {
                breadcrumbItem.style.opacity = originalOpacity;
            }, 200);
        }

        /**
         * 處理頁面導航按鈕點擊（前進/後退）
         */
        handlePageNavigationClick(event) {
            const navBtn = event.target.closest('.nav-btn:not(.disabled)');
            if (!navBtn) return;

            event.stopPropagation();
            event.preventDefault();

            const action = navBtn.dataset.action;
            if (action) {
                // Send history navigation message
                const vscode = this.context.getVSCode();
                vscode.postMessage({
                    type: action
                });

                // Visual feedback for navigation button click
                const icon = navBtn.querySelector('.nav-icon');
                const originalContent = icon.textContent;

                // Add loading state
                icon.textContent = '⏳';
                navBtn.style.opacity = '0.6';

                // Restore original state after a short delay
                setTimeout(() => {
                    icon.textContent = originalContent;
                    navBtn.style.opacity = '1';
                }, 300);

                console.log('History navigation:', action);
            }
        }

        /**
         * 處理主題折疊/展開切換
         */
        handleTopicToggle(event) {
            // Don't toggle if clicking on topic documentation button
            const topicDocBtn = event.target.closest('.topic-doc-btn');
            if (topicDocBtn) return;

            // Don't toggle if clicking on navigation button
            const navigateBtn = event.target.closest('.topic-navigate-btn');
            if (navigateBtn) return;

            // Don't toggle if clicking on any action button or favorite button
            const actionBtn = event.target.closest('.action-btn');
            const favoriteBtn = event.target.closest('.favorite-btn');
            if (actionBtn || favoriteBtn) return;

            const topicHeader = event.target.closest('.topic-header');
            if (!topicHeader) return;

            event.stopPropagation();

            const topicGroup = topicHeader.closest('.topic-group');
            const templatesGrid = topicGroup.querySelector('.templates-grid');
            const recommendedContainer = topicGroup.querySelector('.recommended-templates-container');

            // Toggle collapsed state
            topicHeader.classList.toggle('collapsed');
            if (templatesGrid) {
                templatesGrid.classList.toggle('collapsed');
            }
            if (recommendedContainer) {
                recommendedContainer.classList.toggle('collapsed');
            }

            console.log('Toggle topic:', topicGroup.dataset.topic);
        }
    }

    // 導出到全局（用於模組化）
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = NavigationHandler;
    } else {
        window.NavigationHandler = NavigationHandler;
    }
})();
