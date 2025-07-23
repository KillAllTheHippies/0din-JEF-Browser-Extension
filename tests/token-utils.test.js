// Token Utils Tests
// Comprehensive test suite for TokenUtils class

// Mock tiktoken for testing
const mockTiktoken = {
    encoding_for_model: jest.fn(),
    get_encoding: jest.fn()
};

const mockEncoding = {
    encode: jest.fn(),
    decode: jest.fn(),
    free: jest.fn()
};

// Mock dynamic import
jest.mock('tiktoken', () => mockTiktoken, { virtual: true });

// Import the class to test
const TokenUtils = require('../src/utils/token-utils.js');

describe('TokenUtils', () => {
    let tokenUtils;
    
    beforeEach(() => {
        tokenUtils = new TokenUtils();
        jest.clearAllMocks();
        
        // Reset mock implementations
        mockTiktoken.encoding_for_model.mockReturnValue(mockEncoding);
        mockTiktoken.get_encoding.mockReturnValue(mockEncoding);
        mockEncoding.encode.mockReturnValue([1, 2, 3, 4, 5]);
        mockEncoding.decode.mockReturnValue('decoded text');
    });

    describe('Initialization', () => {
        test('should initialize with tiktoken not loaded', () => {
            expect(tokenUtils.tiktokenLoaded).toBe(false);
            expect(tokenUtils.tiktoken).toBeNull();
        });

        test('should load tiktoken successfully', async () => {
            await tokenUtils.loadTiktoken();
            
            expect(tokenUtils.tiktokenLoaded).toBe(true);
            expect(tokenUtils.tiktoken).toBe(mockTiktoken);
        });

        test('should handle tiktoken loading failure gracefully', async () => {
            // Mock import failure
            const originalImport = global.import;
            global.import = jest.fn().mockRejectedValue(new Error('Import failed'));
            
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
            
            await tokenUtils.loadTiktoken();
            
            expect(tokenUtils.tiktokenLoaded).toBe(false);
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('Failed to load tiktoken')
            );
            
            global.import = originalImport;
            consoleSpy.mockRestore();
        });
    });

    describe('Token Counting', () => {
        const testText = 'This is a test sentence for token counting.';
        
        test('should count tokens with tiktoken when available', async () => {
            await tokenUtils.loadTiktoken();
            
            const count = await tokenUtils.countTokens(testText, 'gpt-3.5-turbo');
            
            expect(mockTiktoken.encoding_for_model).toHaveBeenCalledWith('gpt-3.5-turbo');
            expect(mockEncoding.encode).toHaveBeenCalledWith(testText);
            expect(count).toBe(5); // Mock returns array of 5 elements
        });

        test('should fall back to estimation when tiktoken unavailable', async () => {
            // Don't load tiktoken
            const count = await tokenUtils.countTokens(testText, 'gpt-3.5-turbo');
            
            expect(count).toBeGreaterThan(0);
            expect(count).toBeLessThan(testText.length);
            expect(mockTiktoken.encoding_for_model).not.toHaveBeenCalled();
        });

        test('should handle different models correctly', async () => {
            await tokenUtils.loadTiktoken();
            
            await tokenUtils.countTokens(testText, 'gpt-4');
            expect(mockTiktoken.encoding_for_model).toHaveBeenCalledWith('gpt-4');
            
            await tokenUtils.countTokens(testText, 'text-davinci-003');
            expect(mockTiktoken.encoding_for_model).toHaveBeenCalledWith('text-davinci-003');
        });

        test('should handle unknown models with fallback encoding', async () => {
            await tokenUtils.loadTiktoken();
            mockTiktoken.encoding_for_model.mockImplementation(() => {
                throw new Error('Unknown model');
            });
            
            await tokenUtils.countTokens(testText, 'unknown-model');
            
            expect(mockTiktoken.get_encoding).toHaveBeenCalledWith('cl100k_base');
        });

        test('should handle empty text', async () => {
            await tokenUtils.loadTiktoken();
            mockEncoding.encode.mockReturnValue([]);
            
            const count = await tokenUtils.countTokens('', 'gpt-3.5-turbo');
            expect(count).toBe(0);
        });

        test('should handle very long text efficiently', async () => {
            const longText = 'word '.repeat(10000);
            
            const startTime = performance.now();
            const count = await tokenUtils.countTokens(longText, 'gpt-3.5-turbo');
            const endTime = performance.now();
            
            expect(count).toBeGreaterThan(0);
            expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
        });

        test('should provide accurate estimation fallback', async () => {
            const testCases = [
                { text: 'Hello world', expectedRange: [2, 4] },
                { text: 'This is a longer sentence with more words.', expectedRange: [8, 12] },
                { text: 'Short', expectedRange: [1, 2] }
            ];
            
            for (const testCase of testCases) {
                const count = await tokenUtils.countTokens(testCase.text, 'gpt-3.5-turbo');
                expect(count).toBeGreaterThanOrEqual(testCase.expectedRange[0]);
                expect(count).toBeLessThanOrEqual(testCase.expectedRange[1]);
            }
        });
    });

    describe('Language Detection', () => {
        test('should detect English correctly', () => {
            const testCases = [
                'Hello world',
                'This is a test sentence in English.',
                'The quick brown fox jumps over the lazy dog.'
            ];
            
            testCases.forEach(text => {
                expect(tokenUtils.detectLanguage(text)).toBe('en');
            });
        });

        test('should detect Chinese correctly', () => {
            const testCases = [
                '你好世界',
                '这是一个中文测试句子。',
                '中华人民共和国'
            ];
            
            testCases.forEach(text => {
                expect(tokenUtils.detectLanguage(text)).toBe('zh');
            });
        });

        test('should detect Japanese correctly', () => {
            const testCases = [
                'こんにちは',
                'これは日本語のテストです。',
                'ひらがなカタカナ漢字'
            ];
            
            testCases.forEach(text => {
                expect(tokenUtils.detectLanguage(text)).toBe('ja');
            });
        });

        test('should detect Korean correctly', () => {
            const testCases = [
                '안녕하세요',
                '이것은 한국어 테스트입니다.',
                '한글 테스트'
            ];
            
            testCases.forEach(text => {
                expect(tokenUtils.detectLanguage(text)).toBe('ko');
            });
        });

        test('should detect Russian correctly', () => {
            const testCases = [
                'Привет мир',
                'Это тест на русском языке.',
                'Русский алфавит'
            ];
            
            testCases.forEach(text => {
                expect(tokenUtils.detectLanguage(text)).toBe('ru');
            });
        });

        test('should detect Spanish correctly', () => {
            const testCases = [
                'Hola mundo',
                'Esta es una prueba en español.',
                'El gato está en la mesa.'
            ];
            
            testCases.forEach(text => {
                expect(tokenUtils.detectLanguage(text)).toBe('es');
            });
        });

        test('should detect French correctly', () => {
            const testCases = [
                'Bonjour le monde',
                'Ceci est un test en français.',
                'Le chat est sur la table.'
            ];
            
            testCases.forEach(text => {
                expect(tokenUtils.detectLanguage(text)).toBe('fr');
            });
        });

        test('should handle mixed language text', () => {
            const mixedText = 'Hello 你好 こんにちは';
            const detected = tokenUtils.detectLanguage(mixedText);
            expect(['en', 'zh', 'ja']).toContain(detected);
        });

        test('should default to English for unknown text', () => {
            const unknownText = '123456 !@#$%^';
            expect(tokenUtils.detectLanguage(unknownText)).toBe('en');
        });

        test('should handle empty text', () => {
            expect(tokenUtils.detectLanguage('')).toBe('en');
            expect(tokenUtils.detectLanguage(null)).toBe('en');
            expect(tokenUtils.detectLanguage(undefined)).toBe('en');
        });
    });

    describe('Encoding Hint Detection', () => {
        test('should detect cl100k_base for GPT models', () => {
            const gptModels = [
                'gpt-3.5-turbo',
                'gpt-4',
                'gpt-4-turbo',
                'gpt-3.5-turbo-16k'
            ];
            
            gptModels.forEach(model => {
                expect(tokenUtils.getEncodingHint(model)).toBe('cl100k_base');
            });
        });

        test('should detect p50k_base for older models', () => {
            const olderModels = [
                'text-davinci-003',
                'text-davinci-002',
                'code-davinci-002'
            ];
            
            olderModels.forEach(model => {
                expect(tokenUtils.getEncodingHint(model)).toBe('p50k_base');
            });
        });

        test('should default to cl100k_base for unknown models', () => {
            const unknownModels = [
                'unknown-model',
                'custom-model',
                'future-gpt-5'
            ];
            
            unknownModels.forEach(model => {
                expect(tokenUtils.getEncodingHint(model)).toBe('cl100k_base');
            });
        });

        test('should handle null/undefined model', () => {
            expect(tokenUtils.getEncodingHint(null)).toBe('cl100k_base');
            expect(tokenUtils.getEncodingHint(undefined)).toBe('cl100k_base');
            expect(tokenUtils.getEncodingHint('')).toBe('cl100k_base');
        });
    });

    describe('Token Diffing', () => {
        beforeEach(async () => {
            await tokenUtils.loadTiktoken();
        });

        test('should calculate token diff correctly', async () => {
            const text1 = 'Hello world';
            const text2 = 'Hello beautiful world';
            
            mockEncoding.encode
                .mockReturnValueOnce([1, 2]) // text1
                .mockReturnValueOnce([1, 3, 2]); // text2
            
            const diff = await tokenUtils.getTokenDiff(text1, text2, 'gpt-3.5-turbo');
            
            expect(diff.text1Tokens).toBe(2);
            expect(diff.text2Tokens).toBe(3);
            expect(diff.difference).toBe(1);
            expect(diff.percentageChange).toBeCloseTo(50, 1);
        });

        test('should handle identical texts', async () => {
            const text = 'Same text';
            mockEncoding.encode.mockReturnValue([1, 2, 3]);
            
            const diff = await tokenUtils.getTokenDiff(text, text, 'gpt-3.5-turbo');
            
            expect(diff.difference).toBe(0);
            expect(diff.percentageChange).toBe(0);
        });

        test('should handle empty texts', async () => {
            mockEncoding.encode.mockReturnValue([]);
            
            const diff = await tokenUtils.getTokenDiff('', '', 'gpt-3.5-turbo');
            
            expect(diff.text1Tokens).toBe(0);
            expect(diff.text2Tokens).toBe(0);
            expect(diff.difference).toBe(0);
            expect(diff.percentageChange).toBe(0);
        });

        test('should calculate percentage correctly for zero baseline', async () => {
            mockEncoding.encode
                .mockReturnValueOnce([]) // empty text1
                .mockReturnValueOnce([1, 2, 3]); // text2
            
            const diff = await tokenUtils.getTokenDiff('', 'New text', 'gpt-3.5-turbo');
            
            expect(diff.percentageChange).toBe(Infinity);
        });
    });

    describe('Context Window Data', () => {
        test('should provide context window data for known models', () => {
            const testCases = [
                { model: 'gpt-3.5-turbo', expected: 4096 },
                { model: 'gpt-3.5-turbo-16k', expected: 16384 },
                { model: 'gpt-4', expected: 8192 },
                { model: 'gpt-4-32k', expected: 32768 },
                { model: 'text-davinci-003', expected: 4097 }
            ];
            
            testCases.forEach(testCase => {
                const data = tokenUtils.getContextWindowData(testCase.model);
                expect(data.maxTokens).toBe(testCase.expected);
                expect(data.model).toBe(testCase.model);
            });
        });

        test('should provide default context window for unknown models', () => {
            const data = tokenUtils.getContextWindowData('unknown-model');
            expect(data.maxTokens).toBe(4096);
            expect(data.model).toBe('unknown-model');
        });

        test('should calculate usage percentage correctly', () => {
            const data = tokenUtils.getContextWindowData('gpt-3.5-turbo');
            data.usedTokens = 1024;
            
            expect(data.usagePercentage).toBeCloseTo(25, 1); // 1024/4096 = 25%
            expect(data.remainingTokens).toBe(3072);
        });

        test('should handle edge cases for usage calculation', () => {
            const data = tokenUtils.getContextWindowData('gpt-3.5-turbo');
            
            // Test with zero usage
            data.usedTokens = 0;
            expect(data.usagePercentage).toBe(0);
            expect(data.remainingTokens).toBe(4096);
            
            // Test with full usage
            data.usedTokens = 4096;
            expect(data.usagePercentage).toBe(100);
            expect(data.remainingTokens).toBe(0);
            
            // Test with over usage
            data.usedTokens = 5000;
            expect(data.usagePercentage).toBeGreaterThan(100);
            expect(data.remainingTokens).toBeLessThan(0);
        });
    });

    describe('Pseudo Token IDs', () => {
        test('should generate consistent pseudo token IDs', () => {
            const text = 'Hello world';
            const ids1 = tokenUtils.generatePseudoTokenIds(text);
            const ids2 = tokenUtils.generatePseudoTokenIds(text);
            
            expect(ids1).toEqual(ids2);
        });

        test('should generate different IDs for different texts', () => {
            const text1 = 'Hello world';
            const text2 = 'Goodbye world';
            
            const ids1 = tokenUtils.generatePseudoTokenIds(text1);
            const ids2 = tokenUtils.generatePseudoTokenIds(text2);
            
            expect(ids1).not.toEqual(ids2);
        });

        test('should handle empty text', () => {
            const ids = tokenUtils.generatePseudoTokenIds('');
            expect(ids).toEqual([]);
        });

        test('should generate reasonable number of token IDs', () => {
            const text = 'This is a test sentence with multiple words.';
            const ids = tokenUtils.generatePseudoTokenIds(text);
            
            expect(ids.length).toBeGreaterThan(0);
            expect(ids.length).toBeLessThan(text.length);
            expect(ids.every(id => typeof id === 'number')).toBe(true);
        });
    });

    describe('Performance Tests', () => {
        test('should count tokens efficiently for large text', async () => {
            const largeText = 'word '.repeat(10000);
            
            const startTime = performance.now();
            await tokenUtils.countTokens(largeText, 'gpt-3.5-turbo');
            const endTime = performance.now();
            
            expect(endTime - startTime).toBeLessThan(1000);
        });

        test('should detect language efficiently', () => {
            const largeText = 'This is a very long English text. '.repeat(1000);
            
            const startTime = performance.now();
            tokenUtils.detectLanguage(largeText);
            const endTime = performance.now();
            
            expect(endTime - startTime).toBeLessThan(100);
        });

        test('should handle concurrent token counting', async () => {
            await tokenUtils.loadTiktoken();
            
            const texts = Array.from({ length: 10 }, (_, i) => `Test text ${i}`);
            
            const startTime = performance.now();
            const promises = texts.map(text => 
                tokenUtils.countTokens(text, 'gpt-3.5-turbo')
            );
            await Promise.all(promises);
            const endTime = performance.now();
            
            expect(endTime - startTime).toBeLessThan(500);
        });
    });

    describe('Error Handling', () => {
        test('should handle tiktoken encoding errors gracefully', async () => {
            await tokenUtils.loadTiktoken();
            mockEncoding.encode.mockImplementation(() => {
                throw new Error('Encoding error');
            });
            
            const count = await tokenUtils.countTokens('test text', 'gpt-3.5-turbo');
            
            // Should fall back to estimation
            expect(count).toBeGreaterThan(0);
        });

        test('should handle invalid model names', async () => {
            await tokenUtils.loadTiktoken();
            
            const count = await tokenUtils.countTokens('test', null);
            expect(count).toBeGreaterThan(0);
            
            const count2 = await tokenUtils.countTokens('test', undefined);
            expect(count2).toBeGreaterThan(0);
        });

        test('should handle non-string input gracefully', async () => {
            const testInputs = [null, undefined, 123, {}, []];
            
            for (const input of testInputs) {
                const count = await tokenUtils.countTokens(input, 'gpt-3.5-turbo');
                expect(count).toBe(0);
            }
        });
    });

    describe('Integration Tests', () => {
        test('should work with real-world text samples', async () => {
            const realWorldTexts = [
                'How do I bake a chocolate cake?',
                'The weather today is sunny with a high of 75°F.',
                'Please explain quantum computing in simple terms.',
                'What are the benefits of renewable energy sources?'
            ];
            
            for (const text of realWorldTexts) {
                const count = await tokenUtils.countTokens(text, 'gpt-3.5-turbo');
                const language = tokenUtils.detectLanguage(text);
                const encoding = tokenUtils.getEncodingHint('gpt-3.5-turbo');
                
                expect(count).toBeGreaterThan(0);
                expect(language).toBe('en');
                expect(encoding).toBe('cl100k_base');
            }
        });

        test('should provide consistent results across multiple calls', async () => {
            const text = 'Consistent test text for multiple calls.';
            const model = 'gpt-3.5-turbo';
            
            const results = [];
            for (let i = 0; i < 5; i++) {
                const count = await tokenUtils.countTokens(text, model);
                const language = tokenUtils.detectLanguage(text);
                results.push({ count, language });
            }
            
            // All results should be identical
            const firstResult = results[0];
            results.forEach(result => {
                expect(result.count).toBe(firstResult.count);
                expect(result.language).toBe(firstResult.language);
            });
        });
    });
});

// Mock browser environment tests
describe('TokenUtils Browser Environment', () => {
    test('should work in browser environment without Node.js APIs', async () => {
        // Mock browser environment
        const originalProcess = global.process;
        delete global.process;
        
        const tokenUtils = new TokenUtils();
        
        // Should still work with fallback methods
        const count = await tokenUtils.countTokens('test text', 'gpt-3.5-turbo');
        const language = tokenUtils.detectLanguage('test text');
        
        expect(count).toBeGreaterThan(0);
        expect(language).toBe('en');
        
        global.process = originalProcess;
    });

    test('should handle dynamic import failures in browser', async () => {
        const originalImport = global.import;
        global.import = undefined;
        
        const tokenUtils = new TokenUtils();
        await tokenUtils.loadTiktoken();
        
        expect(tokenUtils.tiktokenLoaded).toBe(false);
        
        global.import = originalImport;
    });
});