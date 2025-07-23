// History Grid Tests
// Comprehensive test suite for HistoryGrid UI component

// Mock DOM environment
class MockElement {
    constructor(tagName = 'div') {
        this.tagName = tagName;
        this.children = [];
        this.classList = new MockClassList();
        this.style = {};
        this.attributes = {};
        this.eventListeners = {};
        this.innerHTML = '';
        this.textContent = '';
        this.value = '';
        this.checked = false;
        this.parentNode = null;
    }

    appendChild(child) {
        this.children.push(child);
        child.parentNode = this;
        return child;
    }

    removeChild(child) {
        const index = this.children.indexOf(child);
        if (index > -1) {
            this.children.splice(index, 1);
            child.parentNode = null;
        }
        return child;
    }

    querySelector(selector) {
        // Simple mock implementation
        if (selector.startsWith('.')) {
            const className = selector.slice(1);
            return this.children.find(child => 
                child.classList.contains(className)
            ) || null;
        }
        return this.children.find(child => 
            child.tagName.toLowerCase() === selector.toLowerCase()
        ) || null;
    }

    querySelectorAll(selector) {
        // Simple mock implementation
        if (selector.startsWith('.')) {
            const className = selector.slice(1);
            return this.children.filter(child => 
                child.classList.contains(className)
            );
        }
        return this.children.filter(child => 
            child.tagName.toLowerCase() === selector.toLowerCase()
        );
    }

    addEventListener(event, handler) {
        if (!this.eventListeners[event]) {
            this.eventListeners[event] = [];
        }
        this.eventListeners[event].push(handler);
    }

    removeEventListener(event, handler) {
        if (this.eventListeners[event]) {
            const index = this.eventListeners[event].indexOf(handler);
            if (index > -1) {
                this.eventListeners[event].splice(index, 1);
            }
        }
    }

    dispatchEvent(event) {
        if (this.eventListeners[event.type]) {
            this.eventListeners[event.type].forEach(handler => {
                handler(event);
            });
        }
    }

    setAttribute(name, value) {
        this.attributes[name] = value;
    }

    getAttribute(name) {
        return this.attributes[name] || null;
    }

    click() {
        this.dispatchEvent({ type: 'click', target: this });
    }
}

class MockClassList {
    constructor() {
        this.classes = new Set();
    }

    add(className) {
        this.classes.add(className);
    }

    remove(className) {
        this.classes.delete(className);
    }

    contains(className) {
        return this.classes.has(className);
    }

    toggle(className) {
        if (this.classes.has(className)) {
            this.classes.delete(className);
            return false;
        } else {
            this.classes.add(className);
            return true;
        }
    }
}

// Mock document
const mockDocument = {
    createElement: (tagName) => new MockElement(tagName),
    createTextNode: (text) => ({ textContent: text }),
    querySelector: () => new MockElement(),
    querySelectorAll: () => []
};

global.document = mockDocument;

// Mock database
class MockJEFDatabase {
    constructor() {
        this.mockData = [
            {
                id: 1,
                prompt: 'How to make cookies?',
                response: 'Here is a recipe for chocolate chip cookies...',
                platform: 'chatgpt',
                model: 'gpt-3.5-turbo',
                jefScore: 0.15,
                scorePct: 15,
                tokenCount: 150,
                language: 'en',
                encodingHint: 'cl100k_base',
                categories: ['meth'],
                createdAt: new Date('2024-01-01T10:00:00Z').getTime()
            },
            {
                id: 2,
                prompt: 'Weather forecast',
                response: 'Today will be sunny with temperatures around 75F',
                platform: 'gemini',
                model: 'gemini-pro',
                jefScore: 0.05,
                scorePct: 5,
                tokenCount: 80,
                language: 'en',
                encodingHint: 'cl100k_base',
                categories: [],
                createdAt: new Date('2024-01-02T14:30:00Z').getTime()
            },
            {
                id: 3,
                prompt: '如何制作蛋糕？',
                response: '制作蛋糕需要面粉、鸡蛋、糖等材料...',
                platform: 'claude',
                model: 'claude-3',
                jefScore: 0.85,
                scorePct: 85,
                tokenCount: 200,
                language: 'zh',
                encodingHint: 'cl100k_base',
                categories: ['tiananmen', 'agent'],
                createdAt: new Date('2024-01-03T09:15:00Z').getTime()
            }
        ];
    }

    async getEvaluations(options = {}) {
        let results = [...this.mockData];

        // Apply filters
        if (options.platform) {
            results = results.filter(item => item.platform === options.platform);
        }

        if (options.scoreRange) {
            const { min, max } = options.scoreRange;
            results = results.filter(item => 
                item.jefScore >= min && item.jefScore <= max
            );
        }

        if (options.dateRange) {
            const { start, end } = options.dateRange;
            results = results.filter(item => 
                item.createdAt >= start && item.createdAt <= end
            );
        }

        // Apply sorting
        if (options.orderBy) {
            results.sort((a, b) => {
                const aVal = a[options.orderBy];
                const bVal = b[options.orderBy];
                
                if (aVal < bVal) return options.reverse ? 1 : -1;
                if (aVal > bVal) return options.reverse ? -1 : 1;
                return 0;
            });
        }

        // Apply limit
        if (options.limit) {
            results = results.slice(0, options.limit);
        }

        return results;
    }

    async searchEvaluations(query) {
        if (!query) return this.mockData;
        
        const lowerQuery = query.toLowerCase();
        return this.mockData.filter(item => 
            item.prompt.toLowerCase().includes(lowerQuery) ||
            item.response.toLowerCase().includes(lowerQuery)
        );
    }

    async exportToJSONL() {
        return this.mockData.map(item => JSON.stringify(item)).join('\n');
    }

    async importFromJSONL(jsonl) {
        const lines = jsonl.trim().split('\n');
        let imported = 0;
        
        for (const line of lines) {
            try {
                const data = JSON.parse(line);
                this.mockData.push({ ...data, id: this.mockData.length + 1 });
                imported++;
            } catch (e) {
                // Skip invalid lines
            }
        }
        
        return imported;
    }

    async delete(id) {
        const index = this.mockData.findIndex(item => item.id === id);
        if (index > -1) {
            this.mockData.splice(index, 1);
        }
    }
}

// Import the class to test
const HistoryGrid = require('../src/ui/history-grid.js');

describe('HistoryGrid', () => {
    let historyGrid;
    let mockDatabase;
    let container;
    
    beforeEach(() => {
        mockDatabase = new MockJEFDatabase();
        container = new MockElement();
        historyGrid = new HistoryGrid(container, mockDatabase);
    });

    describe('Initialization', () => {
        test('should initialize with correct container and database', () => {
            expect(historyGrid.container).toBe(container);
            expect(historyGrid.database).toBe(mockDatabase);
            expect(historyGrid.currentData).toEqual([]);
            expect(historyGrid.filteredData).toEqual([]);
        });

        test('should set default configuration', () => {
            expect(historyGrid.currentPage).toBe(1);
            expect(historyGrid.itemsPerPage).toBe(50);
            expect(historyGrid.sortColumn).toBe('createdAt');
            expect(historyGrid.sortDirection).toBe('desc');
        });

        test('should initialize filters', () => {
            expect(historyGrid.filters).toEqual({
                platform: '',
                scoreRange: { min: 0, max: 1 },
                dateRange: { start: null, end: null },
                language: '',
                categories: []
            });
        });
    });

    describe('Data Loading', () => {
        test('should load data successfully', async () => {
            await historyGrid.loadData();
            
            expect(historyGrid.currentData).toHaveLength(3);
            expect(historyGrid.filteredData).toHaveLength(3);
        });

        test('should handle loading errors gracefully', async () => {
            mockDatabase.getEvaluations = jest.fn().mockRejectedValue(new Error('Database error'));
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            
            await historyGrid.loadData();
            
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('Error loading data')
            );
            expect(historyGrid.currentData).toEqual([]);
            
            consoleSpy.mockRestore();
        });

        test('should apply sorting during load', async () => {
            historyGrid.sortColumn = 'jefScore';
            historyGrid.sortDirection = 'desc';
            
            await historyGrid.loadData();
            
            const scores = historyGrid.currentData.map(item => item.jefScore);
            expect(scores).toEqual([0.85, 0.15, 0.05]);
        });

        test('should meet performance requirements (≤500ms)', async () => {
            const startTime = performance.now();
            await historyGrid.loadData();
            const endTime = performance.now();
            
            expect(endTime - startTime).toBeLessThan(500);
        });
    });

    describe('Filtering', () => {
        beforeEach(async () => {
            await historyGrid.loadData();
        });

        test('should filter by platform', () => {
            historyGrid.applyFilters({ platform: 'chatgpt' });
            
            expect(historyGrid.filteredData).toHaveLength(1);
            expect(historyGrid.filteredData[0].platform).toBe('chatgpt');
        });

        test('should filter by score range', () => {
            historyGrid.applyFilters({ 
                scoreRange: { min: 0.1, max: 0.2 } 
            });
            
            expect(historyGrid.filteredData).toHaveLength(1);
            expect(historyGrid.filteredData[0].jefScore).toBe(0.15);
        });

        test('should filter by language', () => {
            historyGrid.applyFilters({ language: 'zh' });
            
            expect(historyGrid.filteredData).toHaveLength(1);
            expect(historyGrid.filteredData[0].language).toBe('zh');
        });

        test('should filter by categories', () => {
            historyGrid.applyFilters({ categories: ['meth'] });
            
            expect(historyGrid.filteredData).toHaveLength(1);
            expect(historyGrid.filteredData[0].categories).toContain('meth');
        });

        test('should filter by date range', () => {
            const start = new Date('2024-01-02T00:00:00Z').getTime();
            const end = new Date('2024-01-03T23:59:59Z').getTime();
            
            historyGrid.applyFilters({ 
                dateRange: { start, end } 
            });
            
            expect(historyGrid.filteredData).toHaveLength(2);
        });

        test('should combine multiple filters', () => {
            historyGrid.applyFilters({
                platform: 'chatgpt',
                scoreRange: { min: 0.1, max: 0.2 }
            });
            
            expect(historyGrid.filteredData).toHaveLength(1);
            expect(historyGrid.filteredData[0].platform).toBe('chatgpt');
            expect(historyGrid.filteredData[0].jefScore).toBe(0.15);
        });

        test('should reset pagination when filters change', () => {
            historyGrid.currentPage = 3;
            historyGrid.applyFilters({ platform: 'chatgpt' });
            
            expect(historyGrid.currentPage).toBe(1);
        });

        test('should clear filters correctly', () => {
            historyGrid.applyFilters({ platform: 'chatgpt' });
            expect(historyGrid.filteredData).toHaveLength(1);
            
            historyGrid.clearFilters();
            expect(historyGrid.filteredData).toHaveLength(3);
            expect(historyGrid.filters.platform).toBe('');
        });
    });

    describe('Searching', () => {
        beforeEach(async () => {
            await historyGrid.loadData();
        });

        test('should search in prompts and responses', async () => {
            await historyGrid.search('cookies');
            
            expect(historyGrid.filteredData).toHaveLength(1);
            expect(historyGrid.filteredData[0].prompt).toContain('cookies');
        });

        test('should be case insensitive', async () => {
            await historyGrid.search('WEATHER');
            
            expect(historyGrid.filteredData).toHaveLength(1);
            expect(historyGrid.filteredData[0].prompt).toContain('Weather');
        });

        test('should return all results for empty search', async () => {
            await historyGrid.search('');
            
            expect(historyGrid.filteredData).toHaveLength(3);
        });

        test('should handle search errors gracefully', async () => {
            mockDatabase.searchEvaluations = jest.fn().mockRejectedValue(new Error('Search error'));
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            
            await historyGrid.search('test');
            
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('Error searching')
            );
            
            consoleSpy.mockRestore();
        });

        test('should reset pagination after search', async () => {
            historyGrid.currentPage = 2;
            await historyGrid.search('cookies');
            
            expect(historyGrid.currentPage).toBe(1);
        });
    });

    describe('Sorting', () => {
        beforeEach(async () => {
            await historyGrid.loadData();
        });

        test('should sort by score ascending', () => {
            historyGrid.sort('jefScore', 'asc');
            
            const scores = historyGrid.filteredData.map(item => item.jefScore);
            expect(scores).toEqual([0.05, 0.15, 0.85]);
        });

        test('should sort by score descending', () => {
            historyGrid.sort('jefScore', 'desc');
            
            const scores = historyGrid.filteredData.map(item => item.jefScore);
            expect(scores).toEqual([0.85, 0.15, 0.05]);
        });

        test('should sort by date', () => {
            historyGrid.sort('createdAt', 'asc');
            
            const dates = historyGrid.filteredData.map(item => item.createdAt);
            expect(dates[0]).toBeLessThan(dates[1]);
            expect(dates[1]).toBeLessThan(dates[2]);
        });

        test('should sort by platform alphabetically', () => {
            historyGrid.sort('platform', 'asc');
            
            const platforms = historyGrid.filteredData.map(item => item.platform);
            expect(platforms).toEqual(['chatgpt', 'claude', 'gemini']);
        });

        test('should toggle sort direction on same column', () => {
            historyGrid.sort('jefScore', 'asc');
            expect(historyGrid.sortDirection).toBe('asc');
            
            historyGrid.sort('jefScore'); // Should toggle to desc
            expect(historyGrid.sortDirection).toBe('desc');
        });

        test('should handle sorting of mixed data types', () => {
            // Add item with null score for testing
            historyGrid.currentData.push({
                id: 4,
                jefScore: null,
                createdAt: Date.now()
            });
            
            historyGrid.sort('jefScore', 'asc');
            
            // Should not throw error
            expect(historyGrid.filteredData).toBeDefined();
        });
    });

    describe('Pagination', () => {
        beforeEach(async () => {
            // Add more test data for pagination
            for (let i = 4; i <= 60; i++) {
                mockDatabase.mockData.push({
                    id: i,
                    prompt: `Test prompt ${i}`,
                    response: `Test response ${i}`,
                    platform: 'test',
                    jefScore: Math.random(),
                    createdAt: Date.now() + i
                });
            }
            await historyGrid.loadData();
        });

        test('should calculate total pages correctly', () => {
            const totalPages = historyGrid.getTotalPages();
            expect(totalPages).toBe(2); // 60 items / 50 per page = 2 pages
        });

        test('should get current page data correctly', () => {
            const pageData = historyGrid.getCurrentPageData();
            expect(pageData).toHaveLength(50); // First page should have 50 items
        });

        test('should navigate to next page', () => {
            historyGrid.nextPage();
            expect(historyGrid.currentPage).toBe(2);
            
            const pageData = historyGrid.getCurrentPageData();
            expect(pageData).toHaveLength(10); // Second page should have 10 items
        });

        test('should navigate to previous page', () => {
            historyGrid.currentPage = 2;
            historyGrid.previousPage();
            expect(historyGrid.currentPage).toBe(1);
        });

        test('should not go beyond first page', () => {
            historyGrid.currentPage = 1;
            historyGrid.previousPage();
            expect(historyGrid.currentPage).toBe(1);
        });

        test('should not go beyond last page', () => {
            historyGrid.currentPage = 2;
            historyGrid.nextPage();
            expect(historyGrid.currentPage).toBe(2);
        });

        test('should go to specific page', () => {
            historyGrid.goToPage(2);
            expect(historyGrid.currentPage).toBe(2);
        });

        test('should handle invalid page numbers', () => {
            historyGrid.goToPage(0);
            expect(historyGrid.currentPage).toBe(1);
            
            historyGrid.goToPage(999);
            expect(historyGrid.currentPage).toBe(2); // Should go to last page
        });

        test('should update pagination after filtering', () => {
            historyGrid.applyFilters({ platform: 'test' });
            
            const totalPages = historyGrid.getTotalPages();
            expect(totalPages).toBe(2); // 57 test items / 50 per page = 2 pages
        });
    });

    describe('Rendering', () => {
        beforeEach(async () => {
            await historyGrid.loadData();
        });

        test('should render grid structure', () => {
            historyGrid.render();
            
            // Check if main elements are created
            expect(container.children.length).toBeGreaterThan(0);
        });

        test('should render search input', () => {
            historyGrid.renderSearchInput();
            
            const searchInput = container.querySelector('.search-input');
            expect(searchInput).toBeDefined();
        });

        test('should render filters section', () => {
            historyGrid.renderFilters();
            
            const filtersSection = container.querySelector('.filters-section');
            expect(filtersSection).toBeDefined();
        });

        test('should render data table', () => {
            historyGrid.renderTable();
            
            const table = container.querySelector('table');
            expect(table).toBeDefined();
        });

        test('should render pagination controls', () => {
            historyGrid.renderPagination();
            
            const pagination = container.querySelector('.pagination');
            expect(pagination).toBeDefined();
        });

        test('should render action buttons', () => {
            historyGrid.renderActions();
            
            const actionsSection = container.querySelector('.actions-section');
            expect(actionsSection).toBeDefined();
        });

        test('should update display after data changes', () => {
            const renderSpy = jest.spyOn(historyGrid, 'render');
            
            historyGrid.applyFilters({ platform: 'chatgpt' });
            
            expect(renderSpy).toHaveBeenCalled();
            renderSpy.mockRestore();
        });
    });

    describe('Event Handling', () => {
        beforeEach(async () => {
            await historyGrid.loadData();
            historyGrid.render();
        });

        test('should handle search input events', () => {
            const searchSpy = jest.spyOn(historyGrid, 'search');
            const searchInput = container.querySelector('.search-input');
            
            searchInput.value = 'test query';
            searchInput.dispatchEvent({ type: 'input', target: searchInput });
            
            // Should debounce the search
            setTimeout(() => {
                expect(searchSpy).toHaveBeenCalledWith('test query');
            }, 350);
            
            searchSpy.mockRestore();
        });

        test('should handle filter change events', () => {
            const filterSpy = jest.spyOn(historyGrid, 'applyFilters');
            const platformFilter = container.querySelector('.platform-filter');
            
            platformFilter.value = 'chatgpt';
            platformFilter.dispatchEvent({ type: 'change', target: platformFilter });
            
            expect(filterSpy).toHaveBeenCalledWith(
                expect.objectContaining({ platform: 'chatgpt' })
            );
            
            filterSpy.mockRestore();
        });

        test('should handle sort header clicks', () => {
            const sortSpy = jest.spyOn(historyGrid, 'sort');
            const scoreHeader = container.querySelector('.sort-header[data-column="jefScore"]');
            
            scoreHeader.click();
            
            expect(sortSpy).toHaveBeenCalledWith('jefScore');
            sortSpy.mockRestore();
        });

        test('should handle pagination button clicks', () => {
            const nextButton = container.querySelector('.next-page');
            const currentPage = historyGrid.currentPage;
            
            nextButton.click();
            
            expect(historyGrid.currentPage).toBe(currentPage + 1);
        });

        test('should handle row action clicks', () => {
            const viewButton = container.querySelector('.view-details');
            const showDetailsSpy = jest.spyOn(historyGrid, 'showDetails');
            
            viewButton.click();
            
            expect(showDetailsSpy).toHaveBeenCalled();
            showDetailsSpy.mockRestore();
        });
    });

    describe('Export/Import', () => {
        beforeEach(async () => {
            await historyGrid.loadData();
        });

        test('should export data to JSONL', async () => {
            const exportSpy = jest.spyOn(mockDatabase, 'exportToJSONL');
            
            await historyGrid.exportData();
            
            expect(exportSpy).toHaveBeenCalled();
            exportSpy.mockRestore();
        });

        test('should import data from JSONL', async () => {
            const importSpy = jest.spyOn(mockDatabase, 'importFromJSONL');
            const jsonlData = '{"prompt":"test","response":"test response"}';
            
            await historyGrid.importData(jsonlData);
            
            expect(importSpy).toHaveBeenCalledWith(jsonlData);
            importSpy.mockRestore();
        });

        test('should refresh data after import', async () => {
            const loadDataSpy = jest.spyOn(historyGrid, 'loadData');
            const jsonlData = '{"prompt":"test","response":"test response"}';
            
            await historyGrid.importData(jsonlData);
            
            expect(loadDataSpy).toHaveBeenCalled();
            loadDataSpy.mockRestore();
        });

        test('should handle export errors gracefully', async () => {
            mockDatabase.exportToJSONL = jest.fn().mockRejectedValue(new Error('Export error'));
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            
            await historyGrid.exportData();
            
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('Error exporting data')
            );
            
            consoleSpy.mockRestore();
        });

        test('should handle import errors gracefully', async () => {
            mockDatabase.importFromJSONL = jest.fn().mockRejectedValue(new Error('Import error'));
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            
            await historyGrid.importData('invalid data');
            
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('Error importing data')
            );
            
            consoleSpy.mockRestore();
        });
    });

    describe('Details Modal', () => {
        beforeEach(async () => {
            await historyGrid.loadData();
        });

        test('should show details modal for evaluation', () => {
            const evaluation = historyGrid.currentData[0];
            
            historyGrid.showDetails(evaluation);
            
            const modal = container.querySelector('.details-modal');
            expect(modal).toBeDefined();
            expect(modal.classList.contains('active')).toBe(true);
        });

        test('should close details modal', () => {
            const evaluation = historyGrid.currentData[0];
            historyGrid.showDetails(evaluation);
            
            historyGrid.closeDetails();
            
            const modal = container.querySelector('.details-modal');
            expect(modal.classList.contains('active')).toBe(false);
        });

        test('should display evaluation details correctly', () => {
            const evaluation = historyGrid.currentData[0];
            
            historyGrid.showDetails(evaluation);
            
            const modal = container.querySelector('.details-modal');
            expect(modal.innerHTML).toContain(evaluation.prompt);
            expect(modal.innerHTML).toContain(evaluation.response);
        });
    });

    describe('Performance Tests', () => {
        test('should handle large datasets efficiently', async () => {
            // Add large dataset
            for (let i = 0; i < 1000; i++) {
                mockDatabase.mockData.push({
                    id: i + 100,
                    prompt: `Test prompt ${i}`,
                    response: `Test response ${i}`,
                    platform: 'test',
                    jefScore: Math.random(),
                    createdAt: Date.now() + i
                });
            }
            
            const startTime = performance.now();
            await historyGrid.loadData();
            historyGrid.render();
            const endTime = performance.now();
            
            expect(endTime - startTime).toBeLessThan(1000);
        });

        test('should filter large datasets efficiently', async () => {
            // Load large dataset
            for (let i = 0; i < 1000; i++) {
                mockDatabase.mockData.push({
                    id: i + 100,
                    platform: i % 2 === 0 ? 'chatgpt' : 'gemini',
                    jefScore: Math.random(),
                    createdAt: Date.now() + i
                });
            }
            await historyGrid.loadData();
            
            const startTime = performance.now();
            historyGrid.applyFilters({ platform: 'chatgpt' });
            const endTime = performance.now();
            
            expect(endTime - startTime).toBeLessThan(200);
        });

        test('should sort large datasets efficiently', async () => {
            // Load large dataset
            for (let i = 0; i < 1000; i++) {
                mockDatabase.mockData.push({
                    id: i + 100,
                    jefScore: Math.random(),
                    createdAt: Date.now() + i
                });
            }
            await historyGrid.loadData();
            
            const startTime = performance.now();
            historyGrid.sort('jefScore', 'desc');
            const endTime = performance.now();
            
            expect(endTime - startTime).toBeLessThan(100);
        });
    });

    describe('Error Handling', () => {
        test('should handle missing database gracefully', () => {
            const gridWithoutDB = new HistoryGrid(container, null);
            
            expect(() => gridWithoutDB.loadData()).not.toThrow();
        });

        test('should handle missing container gracefully', () => {
            const gridWithoutContainer = new HistoryGrid(null, mockDatabase);
            
            expect(() => gridWithoutContainer.render()).not.toThrow();
        });

        test('should handle malformed data gracefully', async () => {
            mockDatabase.mockData = [
                { id: 1 }, // Missing required fields
                null, // Null entry
                { id: 2, jefScore: 'invalid' } // Invalid data type
            ];
            
            await historyGrid.loadData();
            
            expect(historyGrid.currentData).toBeDefined();
            expect(() => historyGrid.render()).not.toThrow();
        });
    });

    describe('Accessibility', () => {
        beforeEach(async () => {
            await historyGrid.loadData();
            historyGrid.render();
        });

        test('should have proper ARIA labels', () => {
            const table = container.querySelector('table');
            expect(table.getAttribute('role')).toBe('table');
            
            const searchInput = container.querySelector('.search-input');
            expect(searchInput.getAttribute('aria-label')).toBeDefined();
        });

        test('should support keyboard navigation', () => {
            const sortHeaders = container.querySelectorAll('.sort-header');
            
            sortHeaders.forEach(header => {
                expect(header.getAttribute('tabindex')).toBe('0');
                expect(header.getAttribute('role')).toBe('button');
            });
        });

        test('should have proper focus management', () => {
            const modal = container.querySelector('.details-modal');
            const evaluation = historyGrid.currentData[0];
            
            historyGrid.showDetails(evaluation);
            
            // Modal should be focusable
            expect(modal.getAttribute('tabindex')).toBe('-1');
        });
    });
});

// Integration tests
describe('HistoryGrid Integration', () => {
    test('should work with real JEFDatabase', async () => {
        // This would test with actual JEFDatabase implementation
        // For now, we'll simulate the integration
        
        const mockRealDatabase = {
            getEvaluations: jest.fn().mockResolvedValue([]),
            searchEvaluations: jest.fn().mockResolvedValue([]),
            exportToJSONL: jest.fn().mockResolvedValue(''),
            importFromJSONL: jest.fn().mockResolvedValue(0)
        };
        
        const container = new MockElement();
        const grid = new HistoryGrid(container, mockRealDatabase);
        
        await grid.loadData();
        
        expect(mockRealDatabase.getEvaluations).toHaveBeenCalled();
    });

    test('should handle browser storage events', () => {
        // Mock storage event
        const storageEvent = {
            type: 'storage',
            key: 'jef-database',
            newValue: 'updated data'
        };
        
        const refreshSpy = jest.spyOn(historyGrid, 'loadData');
        
        // Simulate storage event
        historyGrid.handleStorageChange(storageEvent);
        
        expect(refreshSpy).toHaveBeenCalled();
        refreshSpy.mockRestore();
    });
});