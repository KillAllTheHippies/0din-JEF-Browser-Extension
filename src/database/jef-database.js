// JEF Database Layer - Phase 0 Implementation
// Handles persistent storage of evaluation results using Dexie.js + IndexedDB

class JEFDatabase {
    constructor() {
        this.db = null;
        this.initDatabase();
    }

    async initDatabase() {
        // Import Dexie dynamically to avoid blocking
        if (typeof Dexie === 'undefined') {
            await this.loadDexie();
        }

        this.db = new Dexie('JEFAnalyticsDB');
        
        // Define schema for Phase 0
        this.db.version(1).stores({
            samples: '++id, createdAt, platform, model, jefScore, scorePct, tokenCount, language, encodingHint, *categories'
        });

        // Add hooks for data validation
        this.db.samples.hook('creating', (primKey, obj, trans) => {
            obj.createdAt = obj.createdAt || Date.now();
            obj.id = obj.id || undefined; // Let Dexie auto-increment
        });

        await this.db.open();
        console.log('JEF Database initialized successfully');
    }

    async loadDexie() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/dexie@3.2.4/dist/dexie.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    /**
     * Store evaluation result in database
     * @param {Object} evaluationResult - Complete evaluation result from JEF
     * @returns {Promise<number>} - ID of stored record
     */
    async storeEvaluation(evaluationResult) {
        try {
            const startTime = performance.now();
            
            // Extract and normalize data according to schema
            const record = {
                createdAt: evaluationResult.timestamp ? new Date(evaluationResult.timestamp).getTime() : Date.now(),
                prompt: evaluationResult.prompt || '',
                response: evaluationResult.text || evaluationResult.response || '',
                platform: evaluationResult.platform || 'unknown',
                model: evaluationResult.model || 'unknown',
                jefScore: evaluationResult.overall_score || 0,
                scorePct: (evaluationResult.overall_score || 0) * 100,
                tokenCount: evaluationResult.tokenCount || this.estimateTokenCount(evaluationResult.text || ''),
                language: evaluationResult.language || this.detectLanguage(evaluationResult.text || ''),
                encodingHint: evaluationResult.encodingHint || 'cl100k_base',
                verboseResults: JSON.stringify(evaluationResult),
                categories: this.extractCategories(evaluationResult)
            };

            const id = await this.db.samples.add(record);
            
            const endTime = performance.now();
            console.log(`JEF DB: Stored evaluation in ${endTime - startTime}ms, ID: ${id}`);
            
            // Check storage quota
            await this.checkStorageQuota();
            
            return id;
        } catch (error) {
            console.error('JEF DB: Error storing evaluation:', error);
            throw error;
        }
    }

    /**
     * Retrieve evaluations with filtering and sorting
     * @param {Object} options - Query options
     * @returns {Promise<Array>} - Array of evaluation records
     */
    async getEvaluations(options = {}) {
        try {
            const startTime = performance.now();
            
            let query = this.db.samples;
            
            // Apply filters
            if (options.platform) {
                query = query.where('platform').equals(options.platform);
            }
            
            if (options.dateRange) {
                const { start, end } = options.dateRange;
                query = query.where('createdAt').between(start, end);
            }
            
            if (options.scoreRange) {
                const { min, max } = options.scoreRange;
                query = query.where('jefScore').between(min, max);
            }

            // Apply sorting
            if (options.orderBy) {
                query = query.orderBy(options.orderBy);
                if (options.reverse) {
                    query = query.reverse();
                }
            } else {
                // Default sort by creation date, newest first
                query = query.orderBy('createdAt').reverse();
            }

            // Apply limit
            if (options.limit) {
                query = query.limit(options.limit);
            }

            const results = await query.toArray();
            
            const endTime = performance.now();
            console.log(`JEF DB: Retrieved ${results.length} evaluations in ${endTime - startTime}ms`);
            
            return results;
        } catch (error) {
            console.error('JEF DB: Error retrieving evaluations:', error);
            throw error;
        }
    }

    /**
     * Search evaluations by text content
     * @param {string} searchTerm - Text to search for
     * @param {Object} options - Search options
     * @returns {Promise<Array>} - Matching evaluation records
     */
    async searchEvaluations(searchTerm, options = {}) {
        try {
            const startTime = performance.now();
            
            if (!searchTerm || searchTerm.trim().length === 0) {
                return await this.getEvaluations(options);
            }

            const searchLower = searchTerm.toLowerCase();
            
            const results = await this.db.samples
                .filter(record => {
                    const promptMatch = (record.prompt || '').toLowerCase().includes(searchLower);
                    const responseMatch = (record.response || '').toLowerCase().includes(searchLower);
                    return promptMatch || responseMatch;
                })
                .toArray();

            // Apply sorting if specified
            if (options.orderBy) {
                results.sort((a, b) => {
                    const aVal = a[options.orderBy];
                    const bVal = b[options.orderBy];
                    const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
                    return options.reverse ? -comparison : comparison;
                });
            }

            const endTime = performance.now();
            console.log(`JEF DB: Text search found ${results.length} results in ${endTime - startTime}ms`);
            
            return results;
        } catch (error) {
            console.error('JEF DB: Error searching evaluations:', error);
            throw error;
        }
    }

    /**
     * Get database statistics
     * @returns {Promise<Object>} - Database stats
     */
    async getStats() {
        try {
            const totalCount = await this.db.samples.count();
            const highRiskCount = await this.db.samples.where('jefScore').above(0.7).count();
            const avgScore = await this.calculateAverageScore();
            const platforms = await this.getPlatformStats();
            
            return {
                totalEvaluations: totalCount,
                highRiskEvaluations: highRiskCount,
                averageScore: avgScore,
                platformBreakdown: platforms,
                lastUpdated: Date.now()
            };
        } catch (error) {
            console.error('JEF DB: Error getting stats:', error);
            throw error;
        }
    }

    /**
     * Export evaluations to JSON Lines format
     * @param {Object} options - Export options
     * @returns {Promise<string>} - JSON Lines string
     */
    async exportToJSONL(options = {}) {
        try {
            const evaluations = await this.getEvaluations(options);
            const jsonLines = evaluations.map(record => JSON.stringify(record)).join('\n');
            
            console.log(`JEF DB: Exported ${evaluations.length} evaluations to JSON Lines`);
            return jsonLines;
        } catch (error) {
            console.error('JEF DB: Error exporting to JSON Lines:', error);
            throw error;
        }
    }

    /**
     * Import evaluations from JSON Lines format
     * @param {string} jsonlData - JSON Lines string
     * @returns {Promise<number>} - Number of imported records
     */
    async importFromJSONL(jsonlData) {
        try {
            const lines = jsonlData.trim().split('\n');
            const records = [];
            
            for (const line of lines) {
                if (line.trim()) {
                    try {
                        const record = JSON.parse(line);
                        // Remove ID to avoid conflicts
                        delete record.id;
                        records.push(record);
                    } catch (parseError) {
                        console.warn('JEF DB: Skipping invalid JSON line:', line);
                    }
                }
            }
            
            await this.db.samples.bulkAdd(records);
            
            console.log(`JEF DB: Imported ${records.length} evaluations from JSON Lines`);
            return records.length;
        } catch (error) {
            console.error('JEF DB: Error importing from JSON Lines:', error);
            throw error;
        }
    }

    // Helper methods
    
    extractCategories(evaluationResult) {
        const categories = [];
        if (evaluationResult.selectedCategories) {
            Object.keys(evaluationResult.selectedCategories).forEach(cat => {
                if (evaluationResult.selectedCategories[cat]) {
                    categories.push(cat);
                }
            });
        }
        return categories;
    }

    estimateTokenCount(text) {
        // Rough estimation: ~4 characters per token for English
        return Math.ceil(text.length / 4);
    }

    detectLanguage(text) {
        // Simple language detection based on character patterns
        if (/[\u4e00-\u9fff]/.test(text)) return 'zh';
        if (/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) return 'ja';
        if (/[\u0400-\u04ff]/.test(text)) return 'ru';
        return 'en';
    }

    async calculateAverageScore() {
        const scores = await this.db.samples.orderBy('jefScore').keys();
        if (scores.length === 0) return 0;
        const sum = scores.reduce((acc, score) => acc + score, 0);
        return sum / scores.length;
    }

    async getPlatformStats() {
        const platforms = {};
        await this.db.samples.each(record => {
            platforms[record.platform] = (platforms[record.platform] || 0) + 1;
        });
        return platforms;
    }

    async checkStorageQuota() {
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            const estimate = await navigator.storage.estimate();
            const usedMB = (estimate.usage || 0) / (1024 * 1024);
            const quotaMB = (estimate.quota || 0) / (1024 * 1024);
            
            console.log(`JEF DB: Storage usage: ${usedMB.toFixed(2)}MB / ${quotaMB.toFixed(2)}MB`);
            
            // Warn at 150MB as per PRD requirements
            if (usedMB > 150) {
                console.warn('JEF DB: Storage quota warning - over 150MB used');
                // Could emit event for UI notification
            }
        }
    }

    /**
     * Clear all data (for testing/development)
     */
    async clearAll() {
        await this.db.samples.clear();
        console.log('JEF DB: All data cleared');
    }

    /**
     * Close database connection
     */
    async close() {
        if (this.db) {
            this.db.close();
            console.log('JEF DB: Database connection closed');
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = JEFDatabase;
} else {
    window.JEFDatabase = JEFDatabase;
}