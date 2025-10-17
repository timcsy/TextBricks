// Settings Renderer - 設定頁面渲染
// 負責渲染設定頁面的所有內容

(function() {
    'use strict';

    /**
     * Settings Renderer 類
     * 處理設定頁面的渲染邏輯
     */
    class SettingsRenderer {
        constructor(context) {
            this.context = context;
        }

        /**
         * 渲染設定頁面
         */
        render() {
            // 確保設定頁面是活躍的

            // 當設定頁面激活時，自動載入資料位置資訊
            this.refreshDataLocationInfo();
        }

        /**
         * 刷新資料位置資訊
         */
        refreshDataLocationInfo() {
            const vscode = this.context.getVSCode();
            vscode.postMessage({ type: 'getDataLocationInfo' });
            vscode.postMessage({ type: 'getAvailableLocations' });
        }

        /**
         * 開啟資料位置
         */
        openDataLocation() {
            const vscode = this.context.getVSCode();
            vscode.postMessage({ type: 'openDataLocation' });
        }

        /**
         * 驗證自定義路徑
         */
        validateCustomPath() {
            const customPath = document.getElementById('custom-path-input')?.value.trim();
            if (!customPath) {
                this._showValidationResult({ isValid: false, errors: ['請輸入路徑'] });
                return;
            }

            const vscode = this.context.getVSCode();
            vscode.postMessage({
                type: 'validateDataPath',
                path: customPath
            });
        }

        /**
         * 套用自定義位置
         */
        applyCustomLocation() {
            const customPath = document.getElementById('custom-path-input')?.value.trim();
            const migrateData = document.getElementById('migrate-data-checkbox')?.checked;
            const createBackup = document.getElementById('create-backup-checkbox')?.checked;

            if (!customPath) {
                this.context.showError('請輸入有效的路徑');
                return;
            }

            const vscode = this.context.getVSCode();
            vscode.postMessage({
                type: 'changeDataLocation',
                locationPath: customPath,
                options: {
                    migrateData: migrateData,
                    createBackup: createBackup
                }
            });
        }

        /**
         * 重設為系統預設位置
         */
        resetToSystemDefault() {
            const vscode = this.context.getVSCode();
            vscode.postMessage({ type: 'resetToSystemDefault' });
        }

        /**
         * 更新目前位置資訊顯示
         */
        updateCurrentLocationInfo(locationInfo) {
            const nameElement = document.getElementById('current-location-name');
            const pathElement = document.getElementById('current-location-path');
            const sizeElement = document.getElementById('location-size');
            const freeSpaceElement = document.getElementById('location-free-space');
            const scopesCountElement = document.getElementById('location-scopes-count');

            if (nameElement) nameElement.textContent = locationInfo.name || '未知位置';
            if (pathElement) pathElement.textContent = locationInfo.path || '-';
            if (sizeElement) sizeElement.textContent = this._formatBytes(locationInfo.size || 0);
            if (freeSpaceElement) freeSpaceElement.textContent = this._formatBytes(locationInfo.freeSpace || 0);
            if (scopesCountElement) scopesCountElement.textContent = (locationInfo.scopes?.length || 0).toString();
        }

        /**
         * 更新可用位置列表
         */
        updateAvailableLocations(locations) {
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

        /**
         * 顯示驗證結果（私有方法）
         */
        _showValidationResult(validation) {
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
                        <div>可用空間: ${this._formatBytes(validation.availableSpace)}</div>
                        <div>需要空間: ${this._formatBytes(validation.requiredSpace)}</div>
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

        /**
         * 格式化位元組大小（私有方法）
         */
        _formatBytes(bytes) {
            if (bytes === 0) return '0 Bytes';

            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));

            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        }
    }

    // 導出到全局（用於模組化）
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = SettingsRenderer;
    } else {
        window.SettingsRenderer = SettingsRenderer;
    }
})();
