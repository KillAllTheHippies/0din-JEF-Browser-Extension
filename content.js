// Content script for JEF AI Output Evaluator
// Detects and extracts AI outputs from various platforms

class AIOutputDetector {
    constructor() {
        this.platform = this.detectPlatform();
        this.init();
    }

    detectPlatform() {
        const hostname = window.location.hostname;
        
        if (hostname.includes('openai.com') || hostname.includes('chatgpt.com')) {
            return 'chatgpt';
        } else if (hostname.includes('gemini.google.com') || hostname.includes('bard.google.com')) {
            return 'gemini';
        } else if (hostname.includes('qwen.ai')) {
            return 'qwen';
        } else if (hostname.includes('deepseek.com')) {
            return 'deepseek';
        } else if (hostname.includes('claude.ai')) {
            return 'claude';
        }
        return 'unknown';
    }

    init() {
        this.createJEFButton();
        this.setupMessageListener();
    }

    createJEFButton() {
        // Create floating JEF evaluation button
        const button = document.createElement('div');
        button.id = 'jef-eval-button';
        button.innerHTML = `
            <div class="jef-button-content">
                <span class="jef-icon">🛡️</span>
                <span class="jef-text">JEF Eval</span>
            </div>
        `;
        button.title = 'Evaluate AI output with JEF';
        button.addEventListener('click', () => this.evaluateLatestOutput());
        
        document.body.appendChild(button);
    }

    getLatestAIOutput() {
        let output = '';
        
        switch (this.platform) {
            case 'chatgpt':
                output = this.getChatGPTOutput();
                break;
            case 'gemini':
                output = this.getGeminiOutput();
                break;
            case 'qwen':
                output = this.getQwenOutput();
                break;
            case 'deepseek':
                output = this.getDeepSeekOutput();
                break;
            case 'claude':
                output = this.getClaudeOutput();
                break;
            default:
                output = this.getGenericOutput();
        }
        
        return output;
    }

    getChatGPTOutput() {
        // ChatGPT/OpenAI selectors
        const selectors = [
            '[data-message-author-role="assistant"] .markdown',
            '[data-message-author-role="assistant"] div[class*="markdown"]',
            '.group\\/conversation-turn[data-testid*="conversation-turn"] .markdown',
            '.group.w-full .markdown'
        ];
        
        return this.extractFromSelectors(selectors);
    }

    getGeminiOutput() {
        // Gemini/Bard selectors
        const selectors = [
            '[data-response-index] .markdown',
            '.model-response-text',
            '[class*="response"] .markdown',
            '.response-container .markdown'
        ];
        
        return this.extractFromSelectors(selectors);
    }

    getQwenOutput() {
        // Qwen selectors - based on actual HTML structure
        const selectors = [
            '.markdown-body',
            '.message-content',
            '[class*="markdown"]',
            '.ai-response .content',
            '.response-text'
        ];
        
        return this.extractFromSelectors(selectors);
    }

    getDeepSeekOutput() {
        // DeepSeek selectors - based on actual HTML structure
        const selectors = [
            '.ds-markdown.ds-markdown--block',
            '.ds-markdown',
            '._48edb25 .ds-markdown',
            '[class*="markdown"]',
            '.message-content'
        ];
        
        return this.extractFromSelectors(selectors);
    }

    getClaudeOutput() {
        // Claude selectors - based on actual HTML structure
        const selectors = [
            '[data-testid="conversation-turn"] .font-claude-message',
            '.font-claude-message',
            '[data-testid*="conversation-turn"] .prose',
            '.prose',
            '[role="assistant"] .prose'
        ];
        
        return this.extractFromSelectors(selectors);
    }

    getGenericOutput() {
        // Generic fallback selectors
        const selectors = [
            '.assistant-message',
            '.ai-message',
            '.response-text',
            '.message-content',
            '[role="assistant"]',
            '.markdown'
        ];
        
        return this.extractFromSelectors(selectors);
    }

    extractFromSelectors(selectors) {
        for (const selector of selectors) {
            const elements = document.querySelectorAll(selector);
            if (elements.length > 0) {
                // Get the last (most recent) response
                const lastElement = elements[elements.length - 1];
                const text = lastElement.innerText || lastElement.textContent;
                if (text && text.trim().length > 10) {
                    return text.trim();
                }
            }
        }
        return '';
    }

    async evaluateLatestOutput() {
        const output = this.getLatestAIOutput();
        
        if (!output) {
            this.showNotification('No AI output found on this page', 'error');
            return;
        }

        this.showNotification('Evaluating output with JEF...', 'info');
        
        try {
            // Get user's selected category from storage
            const stored = await chrome.storage.local.get(['jef_settings']);
            const settings = stored.jef_settings || {
                defaultCategories: {
                    tiananmen: false,
                    agent: false,
                    meth: false,
                    copyright: true  // Default to Copyright
                }
            };
            
            // Send to background script for JEF evaluation
            const response = await chrome.runtime.sendMessage({
                action: 'evaluateOutput',
                text: output,
                platform: this.platform,
                url: window.location.href,
                categories: settings.defaultCategories
            });
            
            if (response.success) {
                this.showJEFResults(response.results);
            } else {
                this.showNotification('Evaluation failed: ' + response.error, 'error');
            }
        } catch (error) {
            this.showNotification('Error: ' + error.message, 'error');
        }
    }

    showJEFResults(results) {
        // Create results modal
        const modal = document.createElement('div');
        modal.id = 'jef-results-modal';
        modal.innerHTML = `
            <div class="jef-modal-content">
                <div class="jef-modal-header">
                    <h3>🛡️ JEF Evaluation Results</h3>
                    <button class="jef-close-btn">&times;</button>
                </div>
                <div class="jef-modal-body">
                    <div class="jef-detailed-scores">
                        <h4>JEF Analysis Results:</h4>
                        ${this.formatDetailedResults(results)}
                    </div>
                    <div class="jef-text-preview">
                        <h4>Analyzed Text (first 200 chars):</h4>
                        <p class="text-preview">${results.text.substring(0, 200)}...</p>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close modal functionality
        modal.querySelector('.jef-close-btn').addEventListener('click', () => {
            modal.remove();
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    formatDetailedResults(results) {
        let html = '<div class="jef-test-results">';
        let hasResults = false;
        
        // Only show results for selected categories
        if (results.selectedCategories && results.selectedCategories.tiananmen && results.tiananmen_score !== undefined) {
            html += `<div class="test-result">
                <span class="test-name">🏛️ Tiananmen Square:</span>
                <span class="test-score ${this.getScoreClass(results.tiananmen_score)}">${results.tiananmen_score.toFixed(2)}</span>
            </div>`;
            hasResults = true;
        }
        
        if (results.selectedCategories && results.selectedCategories.agent && results.agent_score !== undefined) {
            html += `<div class="test-result">
                <span class="test-name">⚗️ Nerve Agent:</span>
                <span class="test-score ${this.getScoreClass(results.agent_score)}">${results.agent_score.toFixed(2)}</span>
            </div>`;
            hasResults = true;
        }
        
        if (results.selectedCategories && results.selectedCategories.meth && results.meth_score !== undefined) {
            html += `<div class="test-result">
                <span class="test-name">🧪 Methamphetamine:</span>
                <span class="test-score ${this.getScoreClass(results.meth_score)}">${results.meth_score.toFixed(2)}</span>
            </div>`;
            hasResults = true;
        }
        
        if (results.selectedCategories && results.selectedCategories.copyright && results.copyright_score !== undefined) {
            html += `<div class="test-result">
                <span class="test-name">📚 Copyright (HP):</span>
                <span class="test-score ${this.getScoreClass(results.copyright_score)}">${results.copyright_score.toFixed(2)}</span>
            </div>`;
            hasResults = true;
        }
        
        if (!hasResults) {
            html += '<div class="no-results">No categories selected for evaluation</div>';
        }
        
        html += '</div>';
        return html;
    }

    getScoreClass(score) {
        if (score >= 0.7) return 'score-high';
        if (score >= 0.4) return 'score-medium';
        return 'score-low';
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `jef-notification jef-${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    setupMessageListener() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.action === 'getLatestOutput') {
                const output = this.getLatestAIOutput();
                sendResponse({ output, platform: this.platform });
            }
        });
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new AIOutputDetector();
    });
} else {
    new AIOutputDetector();
}
