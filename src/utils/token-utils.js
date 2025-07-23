// Token Extraction and Metadata Utilities
// Handles tokenization, language detection, and encoding for JEF analytics

class TokenUtils {
    constructor() {
        this.tiktoken = null;
        this.encoding = null;
        this.initTiktoken();
    }

    async initTiktoken() {
        try {
            // Load tiktoken dynamically
            if (typeof tiktoken === 'undefined') {
                await this.loadTiktoken();
            }
            
            // Initialize with cl100k_base encoding (GPT-3.5/4)
            this.encoding = tiktoken.get_encoding('cl100k_base');
            console.log('TokenUtils: tiktoken initialized successfully');
        } catch (error) {
            console.warn('TokenUtils: Failed to load tiktoken, using fallback estimation:', error);
        }
    }

    async loadTiktoken() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/tiktoken@1.0.10/dist/tiktoken.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    /**
     * Extract token count from text
     * @param {string} text - Input text
     * @param {string} encodingHint - Encoding type hint
     * @returns {number} - Token count
     */
    getTokenCount(text, encodingHint = 'cl100k_base') {
        if (!text) return 0;
        
        try {
            if (this.encoding && encodingHint === 'cl100k_base') {
                const tokens = this.encoding.encode(text);
                return tokens.length;
            }
        } catch (error) {
            console.warn('TokenUtils: tiktoken encoding failed, using estimation:', error);
        }
        
        // Fallback estimation
        return this.estimateTokenCount(text);
    }

    /**
     * Get tokenized representation with IDs
     * @param {string} text - Input text
     * @param {string} encodingHint - Encoding type hint
     * @returns {Array<number>} - Token IDs
     */
    getTokenIds(text, encodingHint = 'cl100k_base') {
        if (!text) return [];
        
        try {
            if (this.encoding && encodingHint === 'cl100k_base') {
                return this.encoding.encode(text);
            }
        } catch (error) {
            console.warn('TokenUtils: tiktoken tokenization failed:', error);
        }
        
        // Fallback: create pseudo token IDs
        return this.createPseudoTokenIds(text);
    }

    /**
     * Decode token IDs back to text
     * @param {Array<number>} tokenIds - Token IDs
     * @param {string} encodingHint - Encoding type hint
     * @returns {string} - Decoded text
     */
    decodeTokens(tokenIds, encodingHint = 'cl100k_base') {
        if (!tokenIds || tokenIds.length === 0) return '';
        
        try {
            if (this.encoding && encodingHint === 'cl100k_base') {
                return this.encoding.decode(tokenIds);
            }
        } catch (error) {
            console.warn('TokenUtils: tiktoken decoding failed:', error);
        }
        
        return '[Token decoding unavailable]';
    }

    /**
     * Generate token colors for visualization
     * @param {Array<number>} tokenIds - Token IDs
     * @returns {Array<string>} - HSL color strings
     */
    generateTokenColors(tokenIds) {
        return tokenIds.map(tokenId => {
            // Hash token ID to HSL color
            const hue = (tokenId * 137.508) % 360; // Golden angle for good distribution
            const saturation = 70; // Fixed saturation for consistency
            const lightness = 85; // Light colors for readability
            return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
        });
    }

    /**
     * Create token diff between two texts
     * @param {string} text1 - First text
     * @param {string} text2 - Second text
     * @param {string} encodingHint - Encoding type hint
     * @returns {Object} - Diff result with token-level changes
     */
    createTokenDiff(text1, text2, encodingHint = 'cl100k_base') {
        const tokens1 = this.getTokenIds(text1, encodingHint);
        const tokens2 = this.getTokenIds(text2, encodingHint);
        
        // Simple Myers diff algorithm implementation
        const diff = this.myersDiff(tokens1, tokens2);
        
        return {
            tokens1,
            tokens2,
            diff,
            colors1: this.generateTokenColors(tokens1),
            colors2: this.generateTokenColors(tokens2)
        };
    }

    /**
     * Detect language from text
     * @param {string} text - Input text
     * @returns {string} - Language code
     */
    detectLanguage(text) {
        if (!text) return 'unknown';
        
        const textSample = text.substring(0, 1000); // Sample first 1000 chars
        
        // Character-based language detection
        const patterns = {
            'zh': /[\u4e00-\u9fff]/,           // Chinese
            'ja': /[\u3040-\u309f\u30a0-\u30ff]/, // Japanese
            'ko': /[\uac00-\ud7af]/,           // Korean
            'ar': /[\u0600-\u06ff]/,           // Arabic
            'ru': /[\u0400-\u04ff]/,           // Russian
            'th': /[\u0e00-\u0e7f]/,           // Thai
            'hi': /[\u0900-\u097f]/,           // Hindi
        };
        
        for (const [lang, pattern] of Object.entries(patterns)) {
            if (pattern.test(textSample)) {
                return lang;
            }
        }
        
        // Default to English for Latin scripts
        return 'en';
    }

    /**
     * Determine appropriate encoding hint based on platform/model
     * @param {string} platform - Platform name
     * @param {string} model - Model name
     * @returns {string} - Encoding hint
     */
    getEncodingHint(platform, model) {
        // Map platforms/models to their tokenization schemes
        const encodingMap = {
            'chatgpt': 'cl100k_base',
            'gpt-4': 'cl100k_base',
            'gpt-3.5': 'cl100k_base',
            'claude': 'cl100k_base', // Claude uses similar tokenization
            'gemini': 'cl100k_base', // Approximation
            'qwen': 'cl100k_base',   // Approximation
            'deepseek': 'cl100k_base', // Approximation
            'copilot': 'cl100k_base',
            'grok': 'cl100k_base'
        };
        
        return encodingMap[platform] || encodingMap[model] || 'cl100k_base';
    }

    /**
     * Extract metadata from evaluation context
     * @param {Object} context - Evaluation context
     * @returns {Object} - Extracted metadata
     */
    extractMetadata(context) {
        const { text, platform, model, url } = context;
        
        return {
            tokenCount: this.getTokenCount(text),
            language: this.detectLanguage(text),
            encodingHint: this.getEncodingHint(platform, model),
            textLength: text ? text.length : 0,
            wordCount: text ? text.split(/\s+/).length : 0,
            platform,
            model: model || this.inferModelFromPlatform(platform),
            url,
            timestamp: Date.now()
        };
    }

    /**
     * Create context window visualization data
     * @param {string} text - Input text
     * @param {number} windowSize - Context window size (default 4096)
     * @param {string} encodingHint - Encoding type hint
     * @returns {Object} - Visualization data
     */
    createContextWindowData(text, windowSize = 4096, encodingHint = 'cl100k_base') {
        const tokenIds = this.getTokenIds(text, encodingHint);
        const totalTokens = tokenIds.length;
        
        // Calculate window boundaries
        const windows = [];
        for (let i = 0; i < totalTokens; i += windowSize) {
            const end = Math.min(i + windowSize, totalTokens);
            windows.push({
                start: i,
                end: end,
                tokens: tokenIds.slice(i, end),
                utilization: (end - i) / windowSize
            });
        }
        
        return {
            totalTokens,
            windowSize,
            windows,
            overflow: totalTokens > windowSize,
            utilizationPct: Math.min(100, (totalTokens / windowSize) * 100)
        };
    }

    // Helper methods
    
    estimateTokenCount(text) {
        // Improved estimation based on language
        const language = this.detectLanguage(text);
        
        // Different languages have different token densities
        const ratios = {
            'en': 4,    // ~4 chars per token for English
            'zh': 1.5,  // Chinese characters are more token-dense
            'ja': 2,    // Japanese mixed scripts
            'ko': 2.5,  // Korean
            'ar': 3,    // Arabic
            'ru': 3.5   // Russian
        };
        
        const ratio = ratios[language] || 4;
        return Math.ceil(text.length / ratio);
    }

    createPseudoTokenIds(text) {
        // Create deterministic pseudo token IDs for fallback
        const words = text.split(/\s+/);
        return words.map(word => {
            let hash = 0;
            for (let i = 0; i < word.length; i++) {
                const char = word.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash; // Convert to 32-bit integer
            }
            return Math.abs(hash) % 50000; // Keep in reasonable range
        });
    }

    myersDiff(seq1, seq2) {
        // Simplified Myers diff algorithm for token sequences
        const m = seq1.length;
        const n = seq2.length;
        const max = m + n;
        
        const v = new Array(2 * max + 1);
        v[max + 1] = 0;
        
        const trace = [];
        
        for (let d = 0; d <= max; d++) {
            trace.push([...v]);
            
            for (let k = -d; k <= d; k += 2) {
                let x;
                if (k === -d || (k !== d && v[max + k - 1] < v[max + k + 1])) {
                    x = v[max + k + 1];
                } else {
                    x = v[max + k - 1] + 1;
                }
                
                let y = x - k;
                
                while (x < m && y < n && seq1[x] === seq2[y]) {
                    x++;
                    y++;
                }
                
                v[max + k] = x;
                
                if (x >= m && y >= n) {
                    return this.buildDiffFromTrace(trace, seq1, seq2, d);
                }
            }
        }
        
        return [];
    }

    buildDiffFromTrace(trace, seq1, seq2, d) {
        // Build diff operations from Myers algorithm trace
        const diff = [];
        let x = seq1.length;
        let y = seq2.length;
        
        for (let i = d; i >= 0; i--) {
            const v = trace[i];
            const k = x - y;
            const max = seq1.length + seq2.length;
            
            let prevK;
            if (k === -i || (k !== i && v[max + k - 1] < v[max + k + 1])) {
                prevK = k + 1;
            } else {
                prevK = k - 1;
            }
            
            const prevX = v[max + prevK];
            const prevY = prevX - prevK;
            
            while (x > prevX && y > prevY) {
                diff.unshift({ type: 'equal', token1: seq1[x - 1], token2: seq2[y - 1] });
                x--;
                y--;
            }
            
            if (i > 0) {
                if (x > prevX) {
                    diff.unshift({ type: 'delete', token1: seq1[x - 1] });
                    x--;
                } else {
                    diff.unshift({ type: 'insert', token2: seq2[y - 1] });
                    y--;
                }
            }
        }
        
        return diff;
    }

    inferModelFromPlatform(platform) {
        const modelMap = {
            'chatgpt': 'gpt-3.5-turbo',
            'gemini': 'gemini-pro',
            'claude': 'claude-3',
            'qwen': 'qwen-turbo',
            'deepseek': 'deepseek-chat',
            'copilot': 'gpt-4',
            'grok': 'grok-1'
        };
        
        return modelMap[platform] || 'unknown';
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TokenUtils;
} else {
    window.TokenUtils = TokenUtils;
}