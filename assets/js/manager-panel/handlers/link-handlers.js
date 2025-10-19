// Link Handlers - 連結操作處理器
// 負責處理連結的 CRUD 操作

(function() {
    'use strict';

    /**
     * Link Handlers 類
     * 處理連結相關的用戶操作
     */
    class LinkHandlers {
        constructor(context) {
            this.context = context;
        }

        /**
         * 編輯連結
         */
        editLink(linkName) {
            console.log('[LinkHandlers] editLink called with linkName:', linkName);
            const link = this.context.findLinkByName(linkName);
            console.log('[LinkHandlers] Found link for editing:', link);

            if (link) {
                this.context.openModal('link', link);
            } else {
                console.error('[LinkHandlers] Link not found:', linkName);
                const vscode = this.context.getVSCode();
                vscode.postMessage({
                    type: 'showError',
                    message: `找不到連結: ${linkName}`
                });
            }
        }

        /**
         * 刪除連結
         */
        deleteLink(linkName) {
            console.log('[LinkHandlers] deleteLink called with linkName:', linkName);

            const link = this.context.findLinkByName(linkName);
            console.log('[LinkHandlers] Found link:', link);

            if (!link) {
                console.error('[LinkHandlers] Link not found for name:', linkName);
                const vscode = this.context.getVSCode();
                vscode.postMessage({
                    type: 'showError',
                    message: `找不到連結: ${linkName}`
                });
                return;
            }

            // 直接發送刪除請求，讓後端處理確認
            const vscode = this.context.getVSCode();
            console.log('[LinkHandlers] Sending deleteLink message to VS Code');
            vscode.postMessage({
                type: 'deleteLink',
                linkName: linkName,
                linkTitle: link.title || link.name
            });
        }

        /**
         * 創建連結
         */
        createLink(linkData) {
            const vscode = this.context.getVSCode();
            vscode.postMessage({
                type: 'createLink',
                data: linkData
            });
        }

        /**
         * 複製連結
         */
        duplicateLink(linkName) {
            const link = this.context.findLinkByName(linkName);
            if (link) {
                const newTitle = prompt('請輸入複製後的連結標題：', `${link.title} 副本`);
                if (newTitle && newTitle.trim()) {
                    const vscode = this.context.getVSCode();
                    vscode.postMessage({
                        type: 'duplicateLink',
                        linkName: linkName,
                        newTitle: newTitle.trim()
                    });
                }
            }
        }

        /**
         * 複製連結（右鍵選單用）
         */
        copyLink(linkPath) {
            // 從連結路徑中提取連結名稱
            const linkName = linkPath.split('/links/').pop();
            const link = this.context.findLinkByName(linkName);

            if (link) {
                // 創建副本數據，移除 name 屬性讓系統自動生成
                const linkCopy = {
                    title: `${link.title} 副本`,
                    description: link.description || '',
                    target: link.target || '',
                    topic: link.topic || null
                };

                // 打開模態框，傳入副本數據作為預填值
                this.context.openModal('link', linkCopy);
            }
        }

        /**
         * 打開連結
         */
        openLink(linkName) {
            const link = this.context.findLinkByName(linkName);
            if (link) {
                const vscode = this.context.getVSCode();
                vscode.postMessage({
                    type: 'openLink',
                    linkName: linkName,
                    url: link.url
                });
            }
        }

        /**
         * 在瀏覽器中打開連結
         */
        openLinkInBrowser(linkName) {
            const link = this.context.findLinkByName(linkName);
            if (link && link.url) {
                window.open(link.url, '_blank');
            }
        }

        /**
         * 複製連結 URL
         */
        copyLinkUrl(linkName) {
            const link = this.context.findLinkByName(linkName);
            if (link && link.url) {
                // 使用 Clipboard API 複製 URL
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(link.url)
                        .then(() => {
                            this.context.showMessage('連結 URL 已複製到剪貼板');
                        })
                        .catch(err => {
                            console.error('Failed to copy URL:', err);
                            this._fallbackCopyUrl(link.url);
                        });
                } else {
                    this._fallbackCopyUrl(link.url);
                }
            }
        }

        /**
         * 驗證連結 URL
         */
        validateLink(linkName) {
            const link = this.context.findLinkByName(linkName);
            if (link && link.url) {
                const vscode = this.context.getVSCode();
                vscode.postMessage({
                    type: 'validateLink',
                    linkName: linkName,
                    url: link.url
                });
            }
        }

        /**
         * 獲取所有連結
         */
        getAllLinks() {
            const currentData = this.context.getCurrentData();
            return currentData.links || [];
        }

        /**
         * 根據類別獲取連結
         */
        getLinksByCategory(category) {
            const links = this.getAllLinks();
            return links.filter(link => link.category === category);
        }

        /**
         * 搜索連結
         */
        searchLinks(query) {
            const links = this.getAllLinks();
            const lowerQuery = query.toLowerCase();

            return links.filter(link => {
                return (
                    link.title.toLowerCase().includes(lowerQuery) ||
                    link.url.toLowerCase().includes(lowerQuery) ||
                    (link.description && link.description.toLowerCase().includes(lowerQuery)) ||
                    (link.category && link.category.toLowerCase().includes(lowerQuery))
                );
            });
        }

        /**
         * 排序連結
         */
        sortLinks(sortBy = 'title', order = 'asc') {
            const vscode = this.context.getVSCode();
            vscode.postMessage({
                type: 'sortLinks',
                sortBy: sortBy,
                order: order
            });
        }

        /**
         * 導出連結
         */
        exportLinks() {
            const links = this.getAllLinks();
            const vscode = this.context.getVSCode();
            vscode.postMessage({
                type: 'exportLinks',
                data: links
            });
        }

        /**
         * 導入連結
         */
        importLinks(linksData) {
            const vscode = this.context.getVSCode();
            vscode.postMessage({
                type: 'importLinks',
                data: linksData
            });
        }

        /**
         * Fallback 複製 URL 方法（私有方法）
         */
        _fallbackCopyUrl(url) {
            const textarea = document.createElement('textarea');
            textarea.value = url;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();

            try {
                document.execCommand('copy');
                this.context.showMessage('連結 URL 已複製到剪貼板');
            } catch (err) {
                console.error('Fallback copy failed:', err);
                this.context.showError('複製失敗，請手動複製');
            } finally {
                document.body.removeChild(textarea);
            }
        }
    }

    // 導出到全局（用於模組化）
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = LinkHandlers;
    } else {
        window.LinkHandlers = LinkHandlers;
    }
})();
