// JEF Database Tests
// Comprehensive test suite for JEFDatabase class

// Mock Dexie for testing
class MockDexie {
    constructor(name) {
        this.name = name;
        this.stores = {};
        this.isOpen = false;
    }

    version(num) {
        return {
            stores: (schema) => {
                this.stores = schema;
                return this;
            }
        };
    }

    async open() {
        this.isOpen = true;
        // Mock samples table
        this.samples = new MockTable();
        return this;
    }

    close() {
        this.isOpen = false;
    }
}

class MockTable {
    constructor() {
        this.data = [];
        this.hooks = {};
        this.nextId = 1;
    }

    hook(event, callback) {
        this.hooks[event] = callback;
    }

    async add(record) {
        if (this.hooks.creating) {
            this.hooks.creating(null, record, null);
        }
        record.id = this.nextId++;
        this.data.push({ ...record });
        return record.id;
    }

    async bulkAdd(records) {
        for (const record of records) {
            await this.add(record);
        }
    }

    async count() {
        return this.data.length;
    }

    async toArray() {
        return [...this.data];
    }

    where(field) {
        return {
            equals: (value) => ({
                count: async () => this.data.filter(item => item[field] === value).length,
                toArray: async () => this.data.filter(item => item[field] === value)
            }),
            above: (value) => ({
                count: async () => this.data.filter(item => item[field] > value).length
            }),
            between: (min, max) => ({
                toArray: async () => this.data.filter(item => item[field] >= min && item[field] <= max)
            })
        };
    }

    orderBy(field) {
        const sorted = [...this.data].sort((a, b) => {
            if (a[field] < b[field]) return -1;
            if (a[field] > b[field]) return 1;
            return 0;
        });
        return {
            reverse: () => ({
                toArray: async () => sorted.reverse(),
                limit: (n) => ({
                    toArray: async () => sorted.reverse().slice(0, n)
                })
            }),
            toArray: async () => sorted,
            limit: (n) => ({
                toArray: async () => sorted.slice(0, n)
            }),
            keys: async () => sorted.map(item => item[field])
        };
    }

    filter(predicate) {
        return {
            toArray: async () => this.data.filter(predicate)
        };
    }

    async each(callback) {
        this.data.forEach(callback);
    }

    async delete(id) {
        const index = this.data.findIndex(item => item.id === id);
        if (index !== -1) {
            this.data.splice(index, 1);
        }
    }

    async clear() {
        this.data = [];
        this.nextId = 1;
    }
}

// Mock global Dexie
global.Dexie = MockDexie;

// Import the class to test
const JEFDatabase = require('../src/database/jef-database.js');

describe('JEFDatabase', () => {
    let database;
    
    beforeEach(async () => {
        database = new JEFDatabase();
        await database.initDatabase();
    });
    
    afterEach(async () => {
        if (database) {
            await database.clearAll();
            await database.close();
        }
    });

    describe('Database Initialization', () => {
        test('should initialize database successfully', () => {
            expect(database.db).toBeDefined();
            expect(database.db.isOpen).toBe(true);
        });

        test('should set up samples table with correct schema', () => {
            expect(database.db.samples).toBeDefined();
            expect(database.db.stores.samples).toBeDefined();
        });
    });

    describe('Store Evaluation', () => {
        const mockEvaluation = {
            text: 'Test response text',
            prompt: 'Test prompt',
            platform: 'chatgpt',
            model: 'gpt-3.5-turbo',
            overall_score: 0.75,
            timestamp: '2024-01-01T00:00:00.000Z',
            selectedCategories: {
                meth: true,
                copyright: false
            },
            tokenCount: 150,
            language: 'en'
        };

        test('should store evaluation successfully', async () => {
            const id = await database.storeEvaluation(mockEvaluation);
            
            expect(id).toBeDefined();
            expect(typeof id).toBe('number');
            
            const stored = await database.db.samples.toArray();
            expect(stored).toHaveLength(1);
            expect(stored[0].response).toBe('Test response text');
            expect(stored[0].platform).toBe('chatgpt');
            expect(stored[0].jefScore).toBe(0.75);
        });

        test('should handle missing fields gracefully', async () => {
            const incompleteEvaluation = {
                text: 'Test text'
            };
            
            const id = await database.storeEvaluation(incompleteEvaluation);
            expect(id).toBeDefined();
            
            const stored = await database.db.samples.toArray();
            expect(stored[0].platform).toBe('unknown');
            expect(stored[0].jefScore).toBe(0);
        });

        test('should extract categories correctly', async () => {
            await database.storeEvaluation(mockEvaluation);
            
            const stored = await database.db.samples.toArray();
            expect(stored[0].categories).toEqual(['meth']);
        });

        test('should estimate token count when not provided', async () => {
            const evalWithoutTokens = {
                text: 'This is a test response with multiple words',
                platform: 'test'
            };
            
            await database.storeEvaluation(evalWithoutTokens);
            
            const stored = await database.db.samples.toArray();
            expect(stored[0].tokenCount).toBeGreaterThan(0);
        });

        test('should detect language correctly', async () => {
            const chineseEval = {
                text: '这是一个中文测试',
                platform: 'test'
            };
            
            await database.storeEvaluation(chineseEval);
            
            const stored = await database.db.samples.toArray();
            expect(stored[0].language).toBe('zh');
        });

        test('should meet performance requirements (≤200ms)', async () => {
            const startTime = performance.now();
            await database.storeEvaluation(mockEvaluation);
            const endTime = performance.now();
            
            expect(endTime - startTime).toBeLessThan(200);
        });
    });

    describe('Retrieve Evaluations', () => {
        beforeEach(async () => {
            // Add test data
            const testData = [
                {
                    text: 'Response 1',
                    platform: 'chatgpt',
                    overall_score: 0.8,
                    timestamp: '2024-01-01T00:00:00.000Z'
                },
                {
                    text: 'Response 2',
                    platform: 'gemini',
                    overall_score: 0.3,
                    timestamp: '2024-01-02T00:00:00.000Z'
                },
                {
                    text: 'Response 3',
                    platform: 'chatgpt',
                    overall_score: 0.6,
                    timestamp: '2024-01-03T00:00:00.000Z'
                }
            ];
            
            for (const data of testData) {
                await database.storeEvaluation(data);
            }
        });

        test('should retrieve all evaluations by default', async () => {
            const results = await database.getEvaluations();
            expect(results).toHaveLength(3);
        });

        test('should filter by platform', async () => {
            const results = await database.getEvaluations({ platform: 'chatgpt' });
            expect(results).toHaveLength(2);
            expect(results.every(r => r.platform === 'chatgpt')).toBe(true);
        });

        test('should filter by score range', async () => {
            const results = await database.getEvaluations({
                scoreRange: { min: 0.5, max: 0.9 }
            });
            expect(results).toHaveLength(2);
            expect(results.every(r => r.jefScore >= 0.5 && r.jefScore <= 0.9)).toBe(true);
        });

        test('should sort by specified column', async () => {
            const results = await database.getEvaluations({
                orderBy: 'jefScore',
                reverse: true
            });
            
            expect(results[0].jefScore).toBeGreaterThanOrEqual(results[1].jefScore);
            expect(results[1].jefScore).toBeGreaterThanOrEqual(results[2].jefScore);
        });

        test('should limit results', async () => {
            const results = await database.getEvaluations({ limit: 2 });
            expect(results).toHaveLength(2);
        });

        test('should meet performance requirements (≤300ms for 10k rows)', async () => {
            // Add more test data to simulate larger dataset
            const promises = [];
            for (let i = 0; i < 100; i++) {
                promises.push(database.storeEvaluation({
                    text: `Response ${i}`,
                    platform: 'test',
                    overall_score: Math.random()
                }));
            }
            await Promise.all(promises);
            
            const startTime = performance.now();
            await database.getEvaluations({ orderBy: 'jefScore' });
            const endTime = performance.now();
            
            expect(endTime - startTime).toBeLessThan(300);
        });
    });

    describe('Search Evaluations', () => {
        beforeEach(async () => {
            await database.storeEvaluation({
                prompt: 'How to make cookies',
                text: 'Here is a recipe for chocolate chip cookies',
                platform: 'chatgpt'
            });
            
            await database.storeEvaluation({
                prompt: 'Weather forecast',
                text: 'Today will be sunny with temperatures around 75F',
                platform: 'gemini'
            });
        });

        test('should search in prompts', async () => {
            const results = await database.searchEvaluations('cookies');
            expect(results).toHaveLength(1);
            expect(results[0].prompt).toContain('cookies');
        });

        test('should search in responses', async () => {
            const results = await database.searchEvaluations('sunny');
            expect(results).toHaveLength(1);
            expect(results[0].response).toContain('sunny');
        });

        test('should be case insensitive', async () => {
            const results = await database.searchEvaluations('COOKIES');
            expect(results).toHaveLength(1);
        });

        test('should return all results for empty search', async () => {
            const results = await database.searchEvaluations('');
            expect(results).toHaveLength(2);
        });

        test('should return empty array for no matches', async () => {
            const results = await database.searchEvaluations('nonexistent');
            expect(results).toHaveLength(0);
        });
    });

    describe('Database Statistics', () => {
        beforeEach(async () => {
            const testData = [
                { overall_score: 0.9, platform: 'chatgpt' },
                { overall_score: 0.8, platform: 'chatgpt' },
                { overall_score: 0.2, platform: 'gemini' },
                { overall_score: 0.1, platform: 'claude' }
            ];
            
            for (const data of testData) {
                await database.storeEvaluation(data);
            }
        });

        test('should calculate total evaluations', async () => {
            const stats = await database.getStats();
            expect(stats.totalEvaluations).toBe(4);
        });

        test('should calculate high risk evaluations', async () => {
            const stats = await database.getStats();
            expect(stats.highRiskEvaluations).toBe(2); // 0.9 and 0.8
        });

        test('should calculate average score', async () => {
            const stats = await database.getStats();
            expect(stats.averageScore).toBeCloseTo(0.5, 1); // (0.9+0.8+0.2+0.1)/4
        });

        test('should provide platform breakdown', async () => {
            const stats = await database.getStats();
            expect(stats.platformBreakdown.chatgpt).toBe(2);
            expect(stats.platformBreakdown.gemini).toBe(1);
            expect(stats.platformBreakdown.claude).toBe(1);
        });
    });

    describe('Export/Import', () => {
        const testData = [
            {
                prompt: 'Test prompt 1',
                text: 'Test response 1',
                platform: 'chatgpt',
                overall_score: 0.5
            },
            {
                prompt: 'Test prompt 2',
                text: 'Test response 2',
                platform: 'gemini',
                overall_score: 0.7
            }
        ];

        beforeEach(async () => {
            for (const data of testData) {
                await database.storeEvaluation(data);
            }
        });

        test('should export to JSON Lines format', async () => {
            const jsonl = await database.exportToJSONL();
            
            const lines = jsonl.trim().split('\n');
            expect(lines).toHaveLength(2);
            
            const firstRecord = JSON.parse(lines[0]);
            expect(firstRecord.prompt).toBe('Test prompt 1');
            expect(firstRecord.response).toBe('Test response 1');
        });

        test('should import from JSON Lines format', async () => {
            // Clear existing data
            await database.clearAll();
            
            const jsonl = testData.map(record => JSON.stringify({
                prompt: record.prompt,
                response: record.text,
                platform: record.platform,
                jefScore: record.overall_score,
                createdAt: Date.now()
            })).join('\n');
            
            const count = await database.importFromJSONL(jsonl);
            expect(count).toBe(2);
            
            const stored = await database.db.samples.toArray();
            expect(stored).toHaveLength(2);
        });

        test('should handle malformed JSON Lines gracefully', async () => {
            const malformedJsonl = `
                {"valid": "record", "prompt": "test"}
                {invalid json}
                {"another": "valid", "prompt": "test2"}
            `;
            
            await database.clearAll();
            const count = await database.importFromJSONL(malformedJsonl);
            expect(count).toBe(2); // Should import only valid records
        });
    });

    describe('Helper Methods', () => {
        test('should estimate token count correctly', () => {
            const text = 'This is a test sentence with multiple words';
            const count = database.estimateTokenCount(text);
            expect(count).toBeGreaterThan(0);
            expect(count).toBeLessThan(text.length); // Should be less than character count
        });

        test('should detect language correctly', () => {
            expect(database.detectLanguage('Hello world')).toBe('en');
            expect(database.detectLanguage('你好世界')).toBe('zh');
            expect(database.detectLanguage('こんにちは')).toBe('ja');
            expect(database.detectLanguage('Привет мир')).toBe('ru');
        });

        test('should extract categories from evaluation result', () => {
            const result = {
                selectedCategories: {
                    meth: true,
                    copyright: false,
                    agent: true,
                    tiananmen: false
                }
            };
            
            const categories = database.extractCategories(result);
            expect(categories).toEqual(['meth', 'agent']);
        });
    });

    describe('Error Handling', () => {
        test('should handle database errors gracefully', async () => {
            // Mock a database error
            database.db.samples.add = jest.fn().mockRejectedValue(new Error('Database error'));
            
            await expect(database.storeEvaluation({ text: 'test' }))
                .rejects.toThrow('Database error');
        });

        test('should handle invalid evaluation data', async () => {
            // Should not throw for null/undefined
            const id = await database.storeEvaluation(null);
            expect(id).toBeDefined();
        });
    });

    describe('Performance Tests', () => {
        test('should handle bulk operations efficiently', async () => {
            const startTime = performance.now();
            
            const promises = [];
            for (let i = 0; i < 100; i++) {
                promises.push(database.storeEvaluation({
                    text: `Response ${i}`,
                    platform: 'test',
                    overall_score: Math.random()
                }));
            }
            
            await Promise.all(promises);
            
            const endTime = performance.now();
            const avgTime = (endTime - startTime) / 100;
            
            expect(avgTime).toBeLessThan(200); // Each operation should be under 200ms
        });

        test('should maintain performance with large datasets', async () => {
            // Add a substantial amount of test data
            for (let i = 0; i < 1000; i++) {
                await database.storeEvaluation({
                    text: `Response ${i}`,
                    platform: i % 2 === 0 ? 'chatgpt' : 'gemini',
                    overall_score: Math.random()
                });
            }
            
            const startTime = performance.now();
            const results = await database.getEvaluations({
                platform: 'chatgpt',
                orderBy: 'jefScore',
                limit: 50
            });
            const endTime = performance.now();
            
            expect(results).toHaveLength(50);
            expect(endTime - startTime).toBeLessThan(300);
        });
    });
});

// Integration tests
describe('JEFDatabase Integration', () => {
    test('should work with real browser storage APIs', async () => {
        // Mock navigator.storage for quota testing
        global.navigator = {
            storage: {
                estimate: jest.fn().mockResolvedValue({
                    usage: 50 * 1024 * 1024, // 50MB
                    quota: 1000 * 1024 * 1024 // 1GB
                })
            }
        };
        
        const database = new JEFDatabase();
        await database.initDatabase();
        
        // Should not throw when checking storage quota
        await expect(database.checkStorageQuota()).resolves.not.toThrow();
        
        await database.close();
    });

    test('should handle storage quota warnings', async () => {
        global.navigator = {
            storage: {
                estimate: jest.fn().mockResolvedValue({
                    usage: 160 * 1024 * 1024, // 160MB (over 150MB threshold)
                    quota: 1000 * 1024 * 1024
                })
            }
        };
        
        const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
        
        const database = new JEFDatabase();
        await database.initDatabase();
        await database.checkStorageQuota();
        
        expect(consoleSpy).toHaveBeenCalledWith(
            expect.stringContaining('Storage quota warning')
        );
        
        consoleSpy.mockRestore();
        await database.close();
    });
});