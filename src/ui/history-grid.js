// History Grid UI Component
// Provides multi-column sorting, filtering, and search for JEF evaluation history

class HistoryGrid {
    constructor(container, database) {
        this.container = container;
        this.database = database;
        this.data = [];
        this.filteredData = [];
        this.sortConfig = { column: 'createdAt', direction: 'desc' };
        this.filters = {};
        this.searchTerm = '';
        this.pageSize = 50;
        this.currentPage = 0;
        
        this.init();
    }

    async init() {
        this.createGridHTML();
        this.setupEventListeners();
        await this.loadData();
        this.render();
    }

    createGridHTML() {
        this.container.innerHTML = `
            <div class="jef-history-grid">
                <div class="grid-header">
                    <div class="grid-controls">
                        <div class="search-box">
                            <input type="text" id="history-search" placeholder="Search prompts and responses..." />
                            <button id="search-btn">🔍</button>
                        </div>
                        <div class="filter-controls">
                            <select id="platform-filter">
                                <option value="">All Platforms</option>
                            </select>
                            <select id="score-filter">
                                <option value="">All Scores</option>
                                <option value="high">High Risk (≥0.7)</option>
                                <option value="medium">Medium Risk (0.4-0.7)</option>
                                <option value="low">Low Risk (<0.4)</option>
                            </select>
                            <input type="date" id="date-from" title="From Date" />
                            <input type="date" id="date-to" title="To Date" />
                        </div>
                        <div class="grid-actions">
                            <button id="export-btn">📤 Export</button>
                            <button id="import-btn">📥 Import</button>
                            <input type="file" id="import-file" accept=".jsonl,.json" style="display: none" />
                            <button id="clear-filters-btn">🗑️ Clear Filters</button>
                        </div>
                    </div>
                    <div class="grid-stats">
                        <span id="total-count">0 evaluations</span>
                        <span id="filtered-count"></span>
                    </div>
                </div>
                
                <div class="grid-table-container">
                    <table class="grid-table">
                        <thead>
                            <tr>
                                <th data-column="createdAt" class="sortable">Date <span class="sort-indicator">↓</span></th>
                                <th data-column="platform" class="sortable">Platform <span class="sort-indicator"></span></th>
                                <th data-column="jefScore" class="sortable">JEF Score <span class="sort-indicator"></span></th>
                                <th data-column="tokenCount" class="sortable">Tokens <span class="sort-indicator"></span></th>
                                <th data-column="language" class="sortable">Language <span class="sort-indicator"></span></th>
                                <th data-column="prompt" class="sortable">Prompt <span class="sort-indicator"></span></th>
                                <th data-column="response" class="sortable">Response <span class="sort-indicator"></span></th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="grid-tbody">
                        </tbody>
                    </table>
                </div>
                
                <div class="grid-pagination">
                    <button id="prev-page" disabled>← Previous</button>
                    <span id="page-info">Page 1 of 1</span>
                    <button id="next-page" disabled>Next →</button>
                    <select id="page-size">
                        <option value="25">25 per page</option>
                        <option value="50" selected>50 per page</option>
                        <option value="100">100 per page</option>
                    </select>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        // Search
        const searchInput = this.container.querySelector('#history-search');
        const searchBtn = this.container.querySelector('#search-btn');
        
        searchInput.addEventListener('input', this.debounce(() => {
            this.searchTerm = searchInput.value;
            this.applyFilters();
        }, 300));
        
        searchBtn.addEventListener('click', () => {
            this.searchTerm = searchInput.value;
            this.applyFilters();
        });

        // Filters
        this.container.querySelector('#platform-filter').addEventListener('change', (e) => {
            this.filters.platform = e.target.value;
            this.applyFilters();
        });
        
        this.container.querySelector('#score-filter').addEventListener('change', (e) => {
            this.filters.scoreRange = e.target.value;
            this.applyFilters();
        });
        
        this.container.querySelector('#date-from').addEventListener('change', (e) => {
            this.filters.dateFrom = e.target.value;
            this.applyFilters();
        });
        
        this.container.querySelector('#date-to').addEventListener('change', (e) => {
            this.filters.dateTo = e.target.value;
            this.applyFilters();
        });

        // Clear filters
        this.container.querySelector('#clear-filters-btn').addEventListener('click', () => {
            this.clearFilters();
        });

        // Sorting
        this.container.querySelectorAll('th.sortable').forEach(th => {
            th.addEventListener('click', () => {
                const column = th.dataset.column;
                this.sort(column);
            });
        });

        // Pagination
        this.container.querySelector('#prev-page').addEventListener('click', () => {
            if (this.currentPage > 0) {
                this.currentPage--;
                this.render();
            }
        });
        
        this.container.querySelector('#next-page').addEventListener('click', () => {
            const maxPage = Math.ceil(this.filteredData.length / this.pageSize) - 1;
            if (this.currentPage < maxPage) {
                this.currentPage++;
                this.render();
            }
        });
        
        this.container.querySelector('#page-size').addEventListener('change', (e) => {
            this.pageSize = parseInt(e.target.value);
            this.currentPage = 0;
            this.render();
        });

        // Export/Import
        this.container.querySelector('#export-btn').addEventListener('click', () => {
            this.exportData();
        });
        
        this.container.querySelector('#import-btn').addEventListener('click', () => {
            this.container.querySelector('#import-file').click();
        });
        
        this.container.querySelector('#import-file').addEventListener('change', (e) => {
            this.importData(e.target.files[0]);
        });
    }

    async loadData() {
        try {
            this.data = await this.database.getEvaluations({ limit: 10000 }); // Load recent data
            this.filteredData = [...this.data];
            this.populateFilterOptions();
        } catch (error) {
            console.error('HistoryGrid: Error loading data:', error);
            this.showError('Failed to load evaluation history');
        }
    }

    populateFilterOptions() {
        // Populate platform filter
        const platformFilter = this.container.querySelector('#platform-filter');
        const platforms = [...new Set(this.data.map(item => item.platform))].sort();
        
        // Clear existing options except "All Platforms"
        platformFilter.innerHTML = '<option value="">All Platforms</option>';
        
        platforms.forEach(platform => {
            const option = document.createElement('option');
            option.value = platform;
            option.textContent = platform.charAt(0).toUpperCase() + platform.slice(1);
            platformFilter.appendChild(option);
        });
    }

    async applyFilters() {
        const startTime = performance.now();
        
        let filtered = [...this.data];

        // Text search
        if (this.searchTerm) {
            const searchLower = this.searchTerm.toLowerCase();
            filtered = filtered.filter(item => {
                const promptMatch = (item.prompt || '').toLowerCase().includes(searchLower);
                const responseMatch = (item.response || '').toLowerCase().includes(searchLower);
                return promptMatch || responseMatch;
            });
        }

        // Platform filter
        if (this.filters.platform) {
            filtered = filtered.filter(item => item.platform === this.filters.platform);
        }

        // Score range filter
        if (this.filters.scoreRange) {
            switch (this.filters.scoreRange) {
                case 'high':
                    filtered = filtered.filter(item => item.jefScore >= 0.7);
                    break;
                case 'medium':
                    filtered = filtered.filter(item => item.jefScore >= 0.4 && item.jefScore < 0.7);
                    break;
                case 'low':
                    filtered = filtered.filter(item => item.jefScore < 0.4);
                    break;
            }
        }

        // Date range filter
        if (this.filters.dateFrom || this.filters.dateTo) {
            const fromDate = this.filters.dateFrom ? new Date(this.filters.dateFrom).getTime() : 0;
            const toDate = this.filters.dateTo ? new Date(this.filters.dateTo).getTime() + 86400000 : Date.now(); // +1 day
            
            filtered = filtered.filter(item => {
                const itemDate = item.createdAt;
                return itemDate >= fromDate && itemDate <= toDate;
            });
        }

        this.filteredData = filtered;
        this.currentPage = 0; // Reset to first page
        
        const endTime = performance.now();
        console.log(`HistoryGrid: Filtered ${this.data.length} → ${filtered.length} items in ${endTime - startTime}ms`);
        
        this.render();
    }

    sort(column) {
        if (this.sortConfig.column === column) {
            // Toggle direction
            this.sortConfig.direction = this.sortConfig.direction === 'asc' ? 'desc' : 'asc';
        } else {
            // New column
            this.sortConfig.column = column;
            this.sortConfig.direction = 'asc';
        }

        const startTime = performance.now();
        
        this.filteredData.sort((a, b) => {
            let aVal = a[column];
            let bVal = b[column];
            
            // Handle different data types
            if (column === 'createdAt') {
                aVal = new Date(aVal).getTime();
                bVal = new Date(bVal).getTime();
            } else if (typeof aVal === 'string') {
                aVal = aVal.toLowerCase();
                bVal = bVal.toLowerCase();
            }
            
            let comparison = 0;
            if (aVal < bVal) comparison = -1;
            else if (aVal > bVal) comparison = 1;
            
            return this.sortConfig.direction === 'desc' ? -comparison : comparison;
        });
        
        const endTime = performance.now();
        console.log(`HistoryGrid: Sorted ${this.filteredData.length} items by ${column} in ${endTime - startTime}ms`);
        
        this.updateSortIndicators();
        this.render();
    }

    updateSortIndicators() {
        // Clear all indicators
        this.container.querySelectorAll('.sort-indicator').forEach(indicator => {
            indicator.textContent = '';
        });
        
        // Set current indicator
        const currentHeader = this.container.querySelector(`th[data-column="${this.sortConfig.column}"] .sort-indicator`);
        if (currentHeader) {
            currentHeader.textContent = this.sortConfig.direction === 'asc' ? '↑' : '↓';
        }
    }

    render() {
        const startTime = performance.now();
        
        // Calculate pagination
        const totalPages = Math.ceil(this.filteredData.length / this.pageSize);
        const startIndex = this.currentPage * this.pageSize;
        const endIndex = Math.min(startIndex + this.pageSize, this.filteredData.length);
        const pageData = this.filteredData.slice(startIndex, endIndex);

        // Render table body
        const tbody = this.container.querySelector('#grid-tbody');
        tbody.innerHTML = pageData.map(item => this.renderRow(item)).join('');

        // Update stats
        this.container.querySelector('#total-count').textContent = `${this.data.length} evaluations`;
        const filteredCount = this.container.querySelector('#filtered-count');
        if (this.filteredData.length !== this.data.length) {
            filteredCount.textContent = `(${this.filteredData.length} filtered)`;
            filteredCount.style.display = 'inline';
        } else {
            filteredCount.style.display = 'none';
        }

        // Update pagination
        this.container.querySelector('#page-info').textContent = 
            `Page ${this.currentPage + 1} of ${Math.max(1, totalPages)}`;
        
        this.container.querySelector('#prev-page').disabled = this.currentPage === 0;
        this.container.querySelector('#next-page').disabled = this.currentPage >= totalPages - 1;

        // Add row event listeners
        this.setupRowEventListeners();
        
        const endTime = performance.now();
        console.log(`HistoryGrid: Rendered ${pageData.length} rows in ${endTime - startTime}ms`);
    }

    renderRow(item) {
        const date = new Date(item.createdAt).toLocaleString();
        const scoreClass = this.getScoreClass(item.jefScore);
        const promptPreview = this.truncateText(item.prompt || '', 50);
        const responsePreview = this.truncateText(item.response || '', 50);
        
        return `
            <tr data-id="${item.id}">
                <td class="date-cell" title="${date}">${this.formatRelativeTime(item.createdAt)}</td>
                <td class="platform-cell">
                    <span class="platform-badge platform-${item.platform}">${item.platform}</span>
                </td>
                <td class="score-cell">
                    <span class="score-badge ${scoreClass}">${item.jefScore.toFixed(3)}</span>
                </td>
                <td class="token-cell">${item.tokenCount || 0}</td>
                <td class="language-cell">${item.language || 'unknown'}</td>
                <td class="prompt-cell" title="${this.escapeHtml(item.prompt || '')}">${promptPreview}</td>
                <td class="response-cell" title="${this.escapeHtml(item.response || '')}">${responsePreview}</td>
                <td class="actions-cell">
                    <button class="view-btn" data-id="${item.id}" title="View Details">👁️</button>
                    <button class="diff-btn" data-id="${item.id}" title="Token Diff">🔍</button>
                    <button class="delete-btn" data-id="${item.id}" title="Delete">🗑️</button>
                </td>
            </tr>
        `;
    }

    setupRowEventListeners() {
        // View details
        this.container.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.dataset.id);
                this.viewDetails(id);
            });
        });

        // Token diff
        this.container.querySelectorAll('.diff-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.dataset.id);
                this.showTokenDiff(id);
            });
        });

        // Delete
        this.container.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.dataset.id);
                this.deleteItem(id);
            });
        });
    }

    async viewDetails(id) {
        const item = this.data.find(d => d.id === id);
        if (!item) return;

        // Create modal for detailed view
        const modal = this.createModal('Evaluation Details', `
            <div class="detail-view">
                <div class="detail-header">
                    <div class="detail-meta">
                        <span><strong>Date:</strong> ${new Date(item.createdAt).toLocaleString()}</span>
                        <span><strong>Platform:</strong> ${item.platform}</span>
                        <span><strong>Score:</strong> <span class="${this.getScoreClass(item.jefScore)}">${item.jefScore.toFixed(3)}</span></span>
                        <span><strong>Tokens:</strong> ${item.tokenCount || 0}</span>
                        <span><strong>Language:</strong> ${item.language || 'unknown'}</span>
                    </div>
                </div>
                <div class="detail-content">
                    <div class="detail-section">
                        <h4>Prompt</h4>
                        <pre class="detail-text">${this.escapeHtml(item.prompt || 'No prompt available')}</pre>
                    </div>
                    <div class="detail-section">
                        <h4>Response</h4>
                        <pre class="detail-text">${this.escapeHtml(item.response || 'No response available')}</pre>
                    </div>
                    <div class="detail-section">
                        <h4>Verbose Results</h4>
                        <pre class="detail-json">${JSON.stringify(JSON.parse(item.verboseResults || '{}'), null, 2)}</pre>
                    </div>
                </div>
            </div>
        `);
    }

    async showTokenDiff(id) {
        // For now, show a placeholder - will be implemented in Phase 1
        const modal = this.createModal('Token Diff Viewer', `
            <div class="token-diff-placeholder">
                <p>🚧 Token diff visualization will be available in Phase 1</p>
                <p>This feature will show:</p>
                <ul>
                    <li>Token-level differences between prompt and response</li>
                    <li>Color-coded tokens based on token IDs</li>
                    <li>Myers diff algorithm visualization</li>
                </ul>
            </div>
        `);
    }

    async deleteItem(id) {
        if (!confirm('Are you sure you want to delete this evaluation?')) return;
        
        try {
            await this.database.db.samples.delete(id);
            await this.loadData();
            this.applyFilters();
            this.showSuccess('Evaluation deleted successfully');
        } catch (error) {
            console.error('HistoryGrid: Error deleting item:', error);
            this.showError('Failed to delete evaluation');
        }
    }

    clearFilters() {
        this.filters = {};
        this.searchTerm = '';
        
        // Reset UI
        this.container.querySelector('#history-search').value = '';
        this.container.querySelector('#platform-filter').value = '';
        this.container.querySelector('#score-filter').value = '';
        this.container.querySelector('#date-from').value = '';
        this.container.querySelector('#date-to').value = '';
        
        this.applyFilters();
    }

    async exportData() {
        try {
            const jsonl = await this.database.exportToJSONL();
            const blob = new Blob([jsonl], { type: 'application/jsonl' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `jef-evaluations-${new Date().toISOString().split('T')[0]}.jsonl`;
            a.click();
            
            URL.revokeObjectURL(url);
            this.showSuccess('Data exported successfully');
        } catch (error) {
            console.error('HistoryGrid: Export error:', error);
            this.showError('Failed to export data');
        }
    }

    async importData(file) {
        if (!file) return;
        
        try {
            const text = await file.text();
            const count = await this.database.importFromJSONL(text);
            
            await this.loadData();
            this.applyFilters();
            
            this.showSuccess(`Imported ${count} evaluations successfully`);
        } catch (error) {
            console.error('HistoryGrid: Import error:', error);
            this.showError('Failed to import data');
        }
    }

    // Utility methods
    
    getScoreClass(score) {
        if (score >= 0.7) return 'score-high';
        if (score >= 0.4) return 'score-medium';
        return 'score-low';
    }

    truncateText(text, maxLength) {
        if (!text) return '';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    formatRelativeTime(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return new Date(timestamp).toLocaleDateString();
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    createModal(title, content) {
        const modal = document.createElement('div');
        modal.className = 'jef-modal';
        modal.innerHTML = `
            <div class="modal-backdrop"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button class="modal-close">×</button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
            </div>
        `;
        
        modal.querySelector('.modal-close').addEventListener('click', () => {
            modal.remove();
        });
        
        modal.querySelector('.modal-backdrop').addEventListener('click', () => {
            modal.remove();
        });
        
        document.body.appendChild(modal);
        return modal;
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `jef-notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    async refresh() {
        await this.loadData();
        this.applyFilters();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HistoryGrid;
} else {
    window.HistoryGrid = HistoryGrid;
}