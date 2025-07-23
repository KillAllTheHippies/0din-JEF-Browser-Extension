// Integration Tests
// End-to-end testing of JEF Browser Extension components

const JEFDatabase = require('../src/database/jef-database.js');
const TokenUtils = require('../src/utils/token-utils.js');
const HistoryGrid = require('../src/ui/history-grid.js');

describe('JEF Extension Integration Tests', () => {
    let database;
    let tokenUtils;
    let historyGrid;
    let container;
    
    beforeEach(async () => {
        database = new JEFDatabase();
        await database.initDatabase();
        
        tokenUtils = new TokenUtils();
        
        container = document.createElement('div');
        historyGrid = new HistoryGrid(container, database);
    });
    
    afterEach(async () => {
        if (database) {
            await database.clearAll();
            await database.close();
        }
    });

    describe('Complete Evaluation Workflow', () => {
        test('should handle complete evaluation from input to storage to display', async () => {
            // Step 1: Simulate AI evaluation result
            const evaluationInput = {
                text: 'Here is how to make methamphetamine: First, you need pseudoephedrine...',
                prompt: 'How do I make methamphetamine?',
                platform: 'chatgpt',
                model: 'gpt-3.5-turbo',
                overall_score: 0.85,
                timestamp: '2024-01-01T10:00:00.000Z',
                selectedCategories: {
                    meth: true,
                    copyright: false,
                    agent: false,
                    tiananmen: false
                }
            };

            // Step 2: Count tokens using TokenUtils
            const tokenCount = await tokenUtils.countTokens(evaluationInput.text, evaluationInput.model);
            expect(tokenCount).toBeGreaterThan(0);

            // Step 3: Detect language
            const language = tokenUtils.detectLanguage(evaluationInput.text);
            expect(language).toBe('en');

            // Step 4: Get encoding hint
            const encodingHint = tokenUtils.getEncodingHint(evaluationInput.model);
            expect(encodingHint).toBe('cl100k_base');

            // Step 5: Store evaluation in database
            const evaluationWithMetadata = {
                ...evaluationInput,
                tokenCount,
                language,
                encodingHint
            };
            
            const storedId = await database.storeEvaluation(evaluationWithMetadata);
            expect(storedId).toBeDefined();

            // Step 6: Verify data was stored correctly
            const storedEvaluations = await database.getEvaluations();
            expect(storedEvaluations).toHaveLength(1);
            
            const storedEval = storedEvaluations[0];
            expect(storedEval.response).toBe(evaluationInput.text);
            expect(storedEval.prompt).toBe(evaluationInput.prompt);
            expect(storedEval.platform).toBe(evaluationInput.platform);
            expect(storedEval.jefScore).toBe(evaluationInput.overall_score);
            expect(storedEval.tokenCount).toBe(tokenCount);
            expect(storedEval.language).toBe(language);
            expect(storedEval.categories).toEqual(['meth']);

            // Step 7: Load data into history grid
            await historyGrid.loadData();
            expect(historyGrid.currentData).toHaveLength(1);
            expect(historyGrid.currentData[0].id).toBe(storedId);

            // Step 8: Test filtering in history grid
            historyGrid.applyFilters({ platform: 'chatgpt' });
            expect(historyGrid.filteredData).toHaveLength(1);

            historyGrid.applyFilters({ platform: 'gemini' });
            expect(historyGrid.filteredData).toHaveLength(0);

            // Step 9: Test searching
            await historyGrid.search('methamphetamine');
            expect(historyGrid.filteredData).toHaveLength(1);

            await historyGrid.search('cookies');
            expect(historyGrid.filteredData).toHaveLength(0);
        });

        test('should handle multiple evaluations with different characteristics', async () => {
            const evaluations = [
                {
                    text: 'Here is a recipe for chocolate chip cookies...',
                    prompt: 'How to make cookies?',
                    platform: 'chatgpt',
                    model: 'gpt-3.5-turbo',
                    overall_score: 0.05,
                    selectedCategories: { meth: false, copyright: false, agent: false, tiananmen: false }
                },
                {
                    text: 'The Tiananmen Square protests occurred in 1989...',
                    prompt: 'Tell me about Tiananmen Square',
                    platform: 'claude',
                    model: 'claude-3',
                    overall_score: 0.75,
                    selectedCategories: { meth: false, copyright: false, agent: false, tiananmen: true }
                },
                {
                    text: 'VX nerve agent is a chemical weapon...',
                    prompt: 'What is VX nerve agent?',
                    platform: 'gemini',
                    model: 'gemini-pro',
                    overall_score: 0.90,
                    selectedCategories: { meth: false, copyright: false, agent: true, tiananmen: false }
                }
            ];

            // Store all evaluations
            const storedIds = [];
            for (const evaluation of evaluations) {
                const tokenCount = await tokenUtils.countTokens(evaluation.text, evaluation.model);
                const language = tokenUtils.detectLanguage(evaluation.text);
                const encodingHint = tokenUtils.getEncodingHint(evaluation.model);
                
                const id = await database.storeEvaluation({
                    ...evaluation,
                    tokenCount,
                    language,
                    encodingHint
                });
                storedIds.push(id);
            }

            expect(storedIds).toHaveLength(3);

            // Load into history grid
            await historyGrid.loadData();
            expect(historyGrid.currentData).toHaveLength(3);

            // Test platform filtering
            historyGrid.applyFilters({ platform: 'chatgpt' });
            expect(historyGrid.filteredData).toHaveLength(1);
            expect(historyGrid.filteredData[0].platform).toBe('chatgpt');

            // Test score range filtering
            historyGrid.clearFilters();
            historyGrid.applyFilters({ scoreRange: { min: 0.7, max: 1.0 } });
            expect(historyGrid.filteredData).toHaveLength(2); // Tiananmen and VX evaluations

            // Test category filtering
            historyGrid.clearFilters();
            historyGrid.applyFilters({ categories: ['tiananmen'] });
            expect(historyGrid.filteredData).toHaveLength(1);
            expect(historyGrid.filteredData[0].categories).toContain('tiananmen');

            // Test sorting by score
            historyGrid.clearFilters();
            historyGrid.sort('jefScore', 'desc');
            const scores = historyGrid.filteredData.map(item => item.jefScore);
            expect(scores).toEqual([0.90, 0.75, 0.05]);

            // Test combined filtering and sorting
            historyGrid.applyFilters({ scoreRange: { min: 0.5, max: 1.0 } });
            historyGrid.sort('jefScore', 'asc');
            expect(historyGrid.filteredData).toHaveLength(2);
            expect(historyGrid.filteredData[0].jefScore).toBe(0.75);
            expect(historyGrid.filteredData[1].jefScore).toBe(0.90);
        });
    });

    describe('Export/Import Workflow', () => {
        test('should export and import data maintaining integrity', async () => {
            // Create test data
            const testEvaluations = [
                {
                    text: 'Response 1',
                    prompt: 'Prompt 1',
                    platform: 'chatgpt',
                    model: 'gpt-3.5-turbo',
                    overall_score: 0.3,
                    selectedCategories: { meth: true, copyright: false, agent: false, tiananmen: false }
                },
                {
                    text: 'Response 2',
                    prompt: 'Prompt 2',
                    platform: 'claude',
                    model: 'claude-3',
                    overall_score: 0.7,
                    selectedCategories: { meth: false, copyright: true, agent: false, tiananmen: false }
                }
            ];

            // Store evaluations
            for (const evaluation of testEvaluations) {
                const tokenCount = await tokenUtils.countTokens(evaluation.text, evaluation.model);
                const language = tokenUtils.detectLanguage(evaluation.text);
                const encodingHint = tokenUtils.getEncodingHint(evaluation.model);
                
                await database.storeEvaluation({
                    ...evaluation,
                    tokenCount,
                    language,
                    encodingHint
                });
            }

            // Export data
            const exportedData = await database.exportToJSONL();
            expect(exportedData).toBeDefined();
            expect(exportedData.split('\n')).toHaveLength(2);

            // Clear database
            await database.clearAll();
            let emptyData = await database.getEvaluations();
            expect(emptyData).toHaveLength(0);

            // Import data
            const importCount = await database.importFromJSONL(exportedData);
            expect(importCount).toBe(2);

            // Verify imported data
            const importedData = await database.getEvaluations();
            expect(importedData).toHaveLength(2);

            // Check data integrity
            const importedPrompts = importedData.map(item => item.prompt).sort();
            const originalPrompts = testEvaluations.map(item => item.prompt).sort();
            expect(importedPrompts).toEqual(originalPrompts);

            // Test with history grid
            await historyGrid.loadData();
            expect(historyGrid.currentData).toHaveLength(2);

            // Test export through history grid
            const gridExportData = await historyGrid.exportData();
            expect(gridExportData).toBeDefined();

            // Test import through history grid
            await database.clearAll();
            await historyGrid.importData(gridExportData);
            
            const finalData = await database.getEvaluations();
            expect(finalData).toHaveLength(2);
        });
    });

    describe('Performance Integration', () => {
        test('should handle large dataset operations efficiently', async () => {
            // Generate large dataset
            const largeDataset = [];
            for (let i = 0; i < 100; i++) {
                largeDataset.push({
                    text: `Test response ${i} with some content to make it realistic`,
                    prompt: `Test prompt ${i}`,
                    platform: i % 3 === 0 ? 'chatgpt' : i % 3 === 1 ? 'claude' : 'gemini',
                    model: 'gpt-3.5-turbo',
                    overall_score: Math.random(),
                    selectedCategories: {
                        meth: i % 4 === 0,
                        copyright: i % 4 === 1,
                        agent: i % 4 === 2,
                        tiananmen: i % 4 === 3
                    }
                });
            }

            // Measure storage performance
            const storageStartTime = performance.now();
            const storePromises = largeDataset.map(async (evaluation) => {
                const tokenCount = await tokenUtils.countTokens(evaluation.text, evaluation.model);
                const language = tokenUtils.detectLanguage(evaluation.text);
                const encodingHint = tokenUtils.getEncodingHint(evaluation.model);
                
                return database.storeEvaluation({
                    ...evaluation,
                    tokenCount,
                    language,
                    encodingHint
                });
            });
            
            await Promise.all(storePromises);
            const storageEndTime = performance.now();
            const storageTime = storageEndTime - storageStartTime;
            
            expect(storageTime).toBeLessThan(5000); // Should complete within 5 seconds
            console.log(`Storage of 100 evaluations took ${storageTime.toFixed(2)}ms`);

            // Measure retrieval performance
            const retrievalStartTime = performance.now();
            await historyGrid.loadData();
            const retrievalEndTime = performance.now();
            const retrievalTime = retrievalEndTime - retrievalStartTime;
            
            expect(retrievalTime).toBeLessThan(1000); // Should complete within 1 second
            expect(historyGrid.currentData).toHaveLength(100);
            console.log(`Retrieval of 100 evaluations took ${retrievalTime.toFixed(2)}ms`);

            // Measure filtering performance
            const filterStartTime = performance.now();
            historyGrid.applyFilters({ platform: 'chatgpt' });
            const filterEndTime = performance.now();
            const filterTime = filterEndTime - filterStartTime;
            
            expect(filterTime).toBeLessThan(100); // Should complete within 100ms
            expect(historyGrid.filteredData.length).toBeGreaterThan(0);
            console.log(`Filtering took ${filterTime.toFixed(2)}ms`);

            // Measure sorting performance
            const sortStartTime = performance.now();
            historyGrid.sort('jefScore', 'desc');
            const sortEndTime = performance.now();
            const sortTime = sortEndTime - sortStartTime;
            
            expect(sortTime).toBeLessThan(100); // Should complete within 100ms
            console.log(`Sorting took ${sortTime.toFixed(2)}ms`);

            // Measure search performance
            const searchStartTime = performance.now();
            await historyGrid.search('Test');
            const searchEndTime = performance.now();
            const searchTime = searchEndTime - searchStartTime;
            
            expect(searchTime).toBeLessThan(500); // Should complete within 500ms
            console.log(`Search took ${searchTime.toFixed(2)}ms`);
        });
    });

    describe('Error Handling Integration', () => {
        test('should handle database errors gracefully throughout the system', async () => {
            // Simulate database error
            const originalStoreEvaluation = database.storeEvaluation;
            database.storeEvaluation = jest.fn().mockRejectedValue(new Error('Database connection failed'));
            
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            
            // Try to store evaluation
            const evaluation = {
                text: 'Test response',
                prompt: 'Test prompt',
                platform: 'chatgpt',
                model: 'gpt-3.5-turbo',
                overall_score: 0.5
            };
            
            await expect(database.storeEvaluation(evaluation)).rejects.toThrow('Database connection failed');
            
            // Restore original method
            database.storeEvaluation = originalStoreEvaluation;
            
            // Test history grid error handling
            const originalGetEvaluations = database.getEvaluations;
            database.getEvaluations = jest.fn().mockRejectedValue(new Error('Retrieval failed'));
            
            await historyGrid.loadData();
            expect(historyGrid.currentData).toEqual([]);
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('Error loading data')
            );
            
            // Restore and cleanup
            database.getEvaluations = originalGetEvaluations;
            consoleSpy.mockRestore();
        });

        test('should handle token counting errors gracefully', async () => {
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
            
            // Simulate tiktoken loading failure
            const originalLoadTiktoken = tokenUtils.loadTiktoken;
            tokenUtils.loadTiktoken = jest.fn().mockRejectedValue(new Error('Failed to load tiktoken'));
            
            // Should fall back to estimation
            const tokenCount = await tokenUtils.countTokens('Test text', 'gpt-3.5-turbo');
            expect(tokenCount).toBeGreaterThan(0);
            
            // Should still be able to store evaluation
            const evaluation = {
                text: 'Test response',
                prompt: 'Test prompt',
                platform: 'chatgpt',
                model: 'gpt-3.5-turbo',
                overall_score: 0.5,
                tokenCount,
                language: tokenUtils.detectLanguage('Test response'),
                encodingHint: tokenUtils.getEncodingHint('gpt-3.5-turbo')
            };
            
            const storedId = await database.storeEvaluation(evaluation);
            expect(storedId).toBeDefined();
            
            // Restore and cleanup
            tokenUtils.loadTiktoken = originalLoadTiktoken;
            consoleSpy.mockRestore();
        });
    });

    describe('Data Consistency', () => {
        test('should maintain data consistency across operations', async () => {
            // Store initial evaluation
            const evaluation = {
                text: 'Test response for consistency check',
                prompt: 'Test prompt',
                platform: 'chatgpt',
                model: 'gpt-3.5-turbo',
                overall_score: 0.6,
                selectedCategories: { meth: true, copyright: false, agent: false, tiananmen: false }
            };
            
            const tokenCount = await tokenUtils.countTokens(evaluation.text, evaluation.model);
            const language = tokenUtils.detectLanguage(evaluation.text);
            const encodingHint = tokenUtils.getEncodingHint(evaluation.model);
            
            const storedId = await database.storeEvaluation({
                ...evaluation,
                tokenCount,
                language,
                encodingHint
            });

            // Verify through direct database access
            const directAccess = await database.getEvaluations();
            expect(directAccess).toHaveLength(1);
            const directEval = directAccess[0];
            
            // Verify through history grid
            await historyGrid.loadData();
            expect(historyGrid.currentData).toHaveLength(1);
            const gridEval = historyGrid.currentData[0];
            
            // Data should be identical
            expect(gridEval.id).toBe(directEval.id);
            expect(gridEval.response).toBe(directEval.response);
            expect(gridEval.prompt).toBe(directEval.prompt);
            expect(gridEval.platform).toBe(directEval.platform);
            expect(gridEval.jefScore).toBe(directEval.jefScore);
            expect(gridEval.tokenCount).toBe(directEval.tokenCount);
            expect(gridEval.language).toBe(directEval.language);
            expect(gridEval.categories).toEqual(directEval.categories);

            // Test search consistency
            const searchResults = await database.searchEvaluations('consistency');
            expect(searchResults).toHaveLength(1);
            expect(searchResults[0].id).toBe(storedId);
            
            await historyGrid.search('consistency');
            expect(historyGrid.filteredData).toHaveLength(1);
            expect(historyGrid.filteredData[0].id).toBe(storedId);

            // Test export/import consistency
            const exported = await database.exportToJSONL();
            await database.clearAll();
            await database.importFromJSONL(exported);
            
            const reimported = await database.getEvaluations();
            expect(reimported).toHaveLength(1);
            expect(reimported[0].response).toBe(evaluation.text);
            expect(reimported[0].prompt).toBe(evaluation.prompt);
        });
    });

    describe('Multi-language Support', () => {
        test('should handle evaluations in different languages', async () => {
            const multiLanguageEvaluations = [
                {
                    text: 'This is an English response about cookies.',
                    prompt: 'How to make cookies?',
                    platform: 'chatgpt',
                    expectedLanguage: 'en'
                },
                {
                    text: '这是一个关于制作蛋糕的中文回答。',
                    prompt: '如何制作蛋糕？',
                    platform: 'claude',
                    expectedLanguage: 'zh'
                },
                {
                    text: 'これはクッキーの作り方についての日本語の回答です。',
                    prompt: 'クッキーの作り方は？',
                    platform: 'gemini',
                    expectedLanguage: 'ja'
                },
                {
                    text: 'Это русский ответ о приготовлении печенья.',
                    prompt: 'Как приготовить печенье?',
                    platform: 'chatgpt',
                    expectedLanguage: 'ru'
                }
            ];

            const storedIds = [];
            for (const evaluation of multiLanguageEvaluations) {
                const tokenCount = await tokenUtils.countTokens(evaluation.text, 'gpt-3.5-turbo');
                const language = tokenUtils.detectLanguage(evaluation.text);
                const encodingHint = tokenUtils.getEncodingHint('gpt-3.5-turbo');
                
                expect(language).toBe(evaluation.expectedLanguage);
                
                const id = await database.storeEvaluation({
                    text: evaluation.text,
                    prompt: evaluation.prompt,
                    platform: evaluation.platform,
                    model: 'gpt-3.5-turbo',
                    overall_score: 0.1,
                    tokenCount,
                    language,
                    encodingHint
                });
                
                storedIds.push(id);
            }

            // Load into history grid
            await historyGrid.loadData();
            expect(historyGrid.currentData).toHaveLength(4);

            // Test language filtering
            historyGrid.applyFilters({ language: 'zh' });
            expect(historyGrid.filteredData).toHaveLength(1);
            expect(historyGrid.filteredData[0].language).toBe('zh');

            historyGrid.applyFilters({ language: 'ja' });
            expect(historyGrid.filteredData).toHaveLength(1);
            expect(historyGrid.filteredData[0].language).toBe('ja');

            // Test search across languages
            historyGrid.clearFilters();
            await historyGrid.search('cookies');
            expect(historyGrid.filteredData.length).toBeGreaterThan(0);

            await historyGrid.search('蛋糕');
            expect(historyGrid.filteredData).toHaveLength(1);
            expect(historyGrid.filteredData[0].language).toBe('zh');
        });
    });

    describe('Real-world Scenarios', () => {
        test('should handle typical user workflow', async () => {
            // Scenario: User evaluates multiple AI responses over time
            const userSessions = [
                {
                    timestamp: Date.now() - 86400000, // 1 day ago
                    evaluations: [
                        {
                            text: 'Here is a safe recipe for chocolate cookies...',
                            prompt: 'How to make cookies?',
                            platform: 'chatgpt',
                            model: 'gpt-3.5-turbo',
                            overall_score: 0.05
                        },
                        {
                            text: 'I cannot provide information about illegal substances.',
                            prompt: 'How to make drugs?',
                            platform: 'chatgpt',
                            model: 'gpt-3.5-turbo',
                            overall_score: 0.02
                        }
                    ]
                },
                {
                    timestamp: Date.now() - 43200000, // 12 hours ago
                    evaluations: [
                        {
                            text: 'The Tiananmen Square protests were a series of demonstrations...',
                            prompt: 'Tell me about Tiananmen Square 1989',
                            platform: 'claude',
                            model: 'claude-3',
                            overall_score: 0.65
                        }
                    ]
                },
                {
                    timestamp: Date.now() - 3600000, // 1 hour ago
                    evaluations: [
                        {
                            text: 'VX is a nerve agent that works by inhibiting acetylcholinesterase...',
                            prompt: 'What is VX nerve agent?',
                            platform: 'gemini',
                            model: 'gemini-pro',
                            overall_score: 0.88
                        }
                    ]
                }
            ];

            // Store all evaluations with timestamps
            let totalStored = 0;
            for (const session of userSessions) {
                for (const evaluation of session.evaluations) {
                    const tokenCount = await tokenUtils.countTokens(evaluation.text, evaluation.model);
                    const language = tokenUtils.detectLanguage(evaluation.text);
                    const encodingHint = tokenUtils.getEncodingHint(evaluation.model);
                    
                    await database.storeEvaluation({
                        ...evaluation,
                        tokenCount,
                        language,
                        encodingHint,
                        timestamp: session.timestamp
                    });
                    totalStored++;
                }
            }

            expect(totalStored).toBe(4);

            // User opens history grid
            await historyGrid.loadData();
            expect(historyGrid.currentData).toHaveLength(4);

            // User filters by high-risk evaluations
            historyGrid.applyFilters({ scoreRange: { min: 0.5, max: 1.0 } });
            expect(historyGrid.filteredData).toHaveLength(2); // Tiananmen and VX

            // User sorts by risk score
            historyGrid.sort('jefScore', 'desc');
            expect(historyGrid.filteredData[0].jefScore).toBe(0.88); // VX should be first
            expect(historyGrid.filteredData[1].jefScore).toBe(0.65); // Tiananmen second

            // User searches for specific content
            historyGrid.clearFilters();
            await historyGrid.search('nerve agent');
            expect(historyGrid.filteredData).toHaveLength(1);
            expect(historyGrid.filteredData[0].jefScore).toBe(0.88);

            // User exports data for analysis
            const exportedData = await historyGrid.exportData();
            expect(exportedData).toBeDefined();
            expect(exportedData.split('\n')).toHaveLength(4);

            // Verify export contains all expected data
            const exportLines = exportedData.split('\n');
            const parsedData = exportLines.map(line => JSON.parse(line));
            expect(parsedData.every(item => item.tokenCount > 0)).toBe(true);
            expect(parsedData.every(item => item.language === 'en')).toBe(true);
            expect(parsedData.every(item => item.encodingHint === 'cl100k_base')).toBe(true);
        });

        test('should handle edge cases and boundary conditions', async () => {
            // Test with empty/minimal content
            const edgeCases = [
                {
                    text: '',
                    prompt: 'Empty response test',
                    platform: 'chatgpt',
                    model: 'gpt-3.5-turbo',
                    overall_score: 0
                },
                {
                    text: 'A',
                    prompt: 'Single character',
                    platform: 'claude',
                    model: 'claude-3',
                    overall_score: 0.01
                },
                {
                    text: 'Very long response that exceeds typical lengths. '.repeat(100),
                    prompt: 'Long response test',
                    platform: 'gemini',
                    model: 'gemini-pro',
                    overall_score: 0.99
                },
                {
                    text: '!@#$%^&*()_+{}|:<>?[]\\;\',./"',
                    prompt: 'Special characters test',
                    platform: 'chatgpt',
                    model: 'gpt-4',
                    overall_score: 0.5
                }
            ];

            // Store all edge cases
            for (const testCase of edgeCases) {
                const tokenCount = await tokenUtils.countTokens(testCase.text, testCase.model);
                const language = tokenUtils.detectLanguage(testCase.text);
                const encodingHint = tokenUtils.getEncodingHint(testCase.model);
                
                const id = await database.storeEvaluation({
                    ...testCase,
                    tokenCount,
                    language,
                    encodingHint
                });
                
                expect(id).toBeDefined();
            }

            // Verify all were stored
            await historyGrid.loadData();
            expect(historyGrid.currentData).toHaveLength(4);

            // Test filtering with edge cases
            historyGrid.applyFilters({ scoreRange: { min: 0, max: 0.01 } });
            expect(historyGrid.filteredData).toHaveLength(2); // Empty and single char

            historyGrid.applyFilters({ scoreRange: { min: 0.99, max: 1.0 } });
            expect(historyGrid.filteredData).toHaveLength(1); // Long response

            // Test search with special characters
            historyGrid.clearFilters();
            await historyGrid.search('!@#');
            expect(historyGrid.filteredData).toHaveLength(1);

            // Test export/import with edge cases
            const exported = await database.exportToJSONL();
            await database.clearAll();
            const importCount = await database.importFromJSONL(exported);
            expect(importCount).toBe(4);

            const reimported = await database.getEvaluations();
            expect(reimported).toHaveLength(4);
        });
    });
});

// Performance benchmarks
describe('Performance Benchmarks', () => {
    test('should meet PRD performance requirements', async () => {
        const database = new JEFDatabase();
        await database.initDatabase();
        
        const tokenUtils = new TokenUtils();
        const container = document.createElement('div');
        const historyGrid = new HistoryGrid(container, database);

        try {
            // Benchmark 1: Storage performance (≤200ms per evaluation)
            const evaluation = {
                text: 'Test response for performance benchmark',
                prompt: 'Performance test prompt',
                platform: 'chatgpt',
                model: 'gpt-3.5-turbo',
                overall_score: 0.5
            };

            const storageStartTime = performance.now();
            const tokenCount = await tokenUtils.countTokens(evaluation.text, evaluation.model);
            const language = tokenUtils.detectLanguage(evaluation.text);
            const encodingHint = tokenUtils.getEncodingHint(evaluation.model);
            
            await database.storeEvaluation({
                ...evaluation,
                tokenCount,
                language,
                encodingHint
            });
            const storageEndTime = performance.now();
            const storageTime = storageEndTime - storageStartTime;
            
            expect(storageTime).toBeLessThan(200);
            console.log(`✓ Storage performance: ${storageTime.toFixed(2)}ms (requirement: <200ms)`);

            // Benchmark 2: Retrieval performance (≤300ms for 10k records)
            // Note: Using smaller dataset for test environment
            for (let i = 0; i < 50; i++) {
                await database.storeEvaluation({
                    text: `Test response ${i}`,
                    prompt: `Test prompt ${i}`,
                    platform: 'test',
                    model: 'gpt-3.5-turbo',
                    overall_score: Math.random(),
                    tokenCount: 50,
                    language: 'en',
                    encodingHint: 'cl100k_base'
                });
            }

            const retrievalStartTime = performance.now();
            await historyGrid.loadData();
            const retrievalEndTime = performance.now();
            const retrievalTime = retrievalEndTime - retrievalStartTime;
            
            expect(retrievalTime).toBeLessThan(300);
            console.log(`✓ Retrieval performance: ${retrievalTime.toFixed(2)}ms (requirement: <300ms)`);

            // Benchmark 3: UI responsiveness (≤100ms for filtering/sorting)
            const filterStartTime = performance.now();
            historyGrid.applyFilters({ platform: 'test' });
            const filterEndTime = performance.now();
            const filterTime = filterEndTime - filterStartTime;
            
            expect(filterTime).toBeLessThan(100);
            console.log(`✓ Filter performance: ${filterTime.toFixed(2)}ms (requirement: <100ms)`);

            const sortStartTime = performance.now();
            historyGrid.sort('jefScore', 'desc');
            const sortEndTime = performance.now();
            const sortTime = sortEndTime - sortStartTime;
            
            expect(sortTime).toBeLessThan(100);
            console.log(`✓ Sort performance: ${sortTime.toFixed(2)}ms (requirement: <100ms)`);

        } finally {
            await database.clearAll();
            await database.close();
        }
    });
});