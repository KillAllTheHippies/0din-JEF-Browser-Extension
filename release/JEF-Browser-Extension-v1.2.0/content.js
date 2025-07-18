// Content script for JEF AI Output Evaluator
// Detects and extracts AI outputs from various platforms

class AIOutputDetector {
    constructor() {
        this.platform = this.detectPlatform();
        this.init();
    }

    detectPlatform() {
        const hostname = window.location.hostname;
        const url = window.location.href;
        
        console.log('JEF: Detecting platform for hostname:', hostname);
        console.log('JEF: Full URL:', url);
        
        if (hostname.includes('openai.com') || hostname.includes('chatgpt.com')) {
            console.log('JEF: Detected ChatGPT platform');
            return 'chatgpt';
        } else if (hostname.includes('gemini.google.com') || hostname.includes('bard.google.com')) {
            console.log('JEF: Detected Gemini platform');
            return 'gemini';
        } else if (hostname.includes('qwen.ai')) {
            console.log('JEF: Detected Qwen platform');
            return 'qwen';
        } else if (hostname.includes('deepseek.com')) {
            console.log('JEF: Detected DeepSeek platform');
            return 'deepseek';
        } else if (hostname.includes('claude.ai')) {
            console.log('JEF: Detected Claude platform');
            return 'claude';
        } else if (hostname.includes('copilot.microsoft.com')) {
            console.log('JEF: Detected Microsoft Copilot platform');
            return 'copilot';
        }
        
        console.log('JEF: Unknown platform detected');
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
            case 'copilot':
                output = this.getCopilotOutput();
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

    getCopilotOutput() {
        // Microsoft Copilot selectors - updated for actual Copilot interface
        console.log('JEF: Getting Copilot output with specialized logic');
        
        // First try specific Copilot selectors based on actual structure
        const specificSelectors = [
            // Target the actual AI message structure found in debug
            '[class*="ai-message-item"]',
            '.group\/ai-message-item',
            '[id*="content-"]',
            '[class*="break-words"]',
            '[class*="space-y-3"].break-words',
            // Original selectors as fallback
            '[data-testid="copilot-response"]',
            '[data-testid="message-content"]',
            '.copilot-response',
            '.message-content',
            '.response-content',
            '[role="assistant"]',
            '.conversation-content',
            '.chat-message-content',
            '.message-text',
            '.response-text',
            '[class*="message"][class*="content"]',
            '[class*="response"][class*="content"]',
            '[class*="chat"][class*="content"]',
            '.markdown',
            '.prose',
            'div[class*="markdown"]',
            'div[class*="prose"]'
        ];
        
        // Try specific selectors first
        const specificResult = this.extractFromSelectors(specificSelectors);
        if (specificResult) {
            return specificResult;
        }
        
        // Fallback: Try to find the main content area and extract multiple paragraphs
        console.log('JEF: Using fallback strategy for Copilot');
        
        // Strategy A: Look for the most recent message/response area
        const recentMessageSelectors = [
            // Look for elements that might contain the latest response
            'div:last-child p',
            'div:last-of-type p',
            '[class*="message"]:last-child',
            '[class*="response"]:last-child',
            '[class*="conversation"]:last-child',
            // Look for the main conversation area
            '[class*="conversation"] > div:last-child',
            '[class*="chat"] > div:last-child',
            '[class*="messages"] > div:last-child'
        ];
        
        for (const selector of recentMessageSelectors) {
            try {
                const elements = document.querySelectorAll(selector);
                if (elements.length > 0) {
                    const lastElement = elements[elements.length - 1];
                    const allText = lastElement.innerText || lastElement.textContent;
                    
                    if (allText && allText.trim().length > 100) {
                        console.log('JEF: Found recent message with selector:', selector);
                        console.log('JEF: Text length:', allText.length);
                        return allText.trim();
                    }
                }
            } catch (error) {
                console.log('JEF: Error with recent message selector:', selector, error);
            }
        }
        
        // Strategy B: Look for content containers that might hold the full response
        const containerSelectors = [
            'main',
            '[role="main"]',
            '.main-content',
            '.chat-container',
            '.conversation-container',
            '.content-container'
        ];
        
        for (const containerSelector of containerSelectors) {
            const containers = document.querySelectorAll(containerSelector);
            if (containers.length > 0) {
                const container = containers[containers.length - 1];
                const paragraphs = container.querySelectorAll('p');
                
                if (paragraphs.length > 0) {
                    // Get the last few paragraphs that likely contain the AI response
                    const lastParagraphs = Array.from(paragraphs).slice(-5); // Get last 5 paragraphs
                    const combinedText = lastParagraphs
                        .map(p => p.innerText || p.textContent)
                        .filter(text => text && text.trim().length > 10)
                        .join('\n\n');
                    
                    if (combinedText.length > 20) {
                        console.log('JEF: Found combined text from container:', combinedText.substring(0, 100));
                        return combinedText;
                    }
                }
            }
        }
        
        // Final fallback: Get all paragraphs and try to find the AI response
        const allParagraphs = document.querySelectorAll('p');
        if (allParagraphs.length > 0) {
            console.log('JEF: Found', allParagraphs.length, 'paragraphs total');
            
            // Strategy 1: Try to find the main content area by looking for the longest continuous text
            let bestText = '';
            let bestLength = 0;
            
            // Look for groups of consecutive paragraphs that might be the AI response
            for (let startIdx = 0; startIdx < allParagraphs.length; startIdx++) {
                for (let endIdx = startIdx + 1; endIdx <= allParagraphs.length && endIdx <= startIdx + 20; endIdx++) {
                    const paragraphGroup = Array.from(allParagraphs).slice(startIdx, endIdx);
                    const groupText = paragraphGroup
                        .map(p => p.innerText || p.textContent)
                        .filter(text => text && text.trim().length > 5)
                        .join('\n\n');
                    
                    if (groupText.length > bestLength && groupText.length > 100) {
                        bestText = groupText;
                        bestLength = groupText.length;
                    }
                }
            }
            
            if (bestText.length > 100) {
                console.log('JEF: Found best text group with length:', bestLength);
                console.log('JEF: Best text preview:', bestText.substring(0, 200));
                return bestText;
            }
            
            // Strategy 2: Get all meaningful paragraphs (fallback)
            const allMeaningfulText = Array.from(allParagraphs)
                .map(p => p.innerText || p.textContent)
                .filter(text => text && text.trim().length > 10)
                .join('\n\n');
            
            if (allMeaningfulText.length > 50) {
                console.log('JEF: Using all meaningful paragraphs, length:', allMeaningfulText.length);
                return allMeaningfulText;
            }
        }
        
        // Final brute force strategy: Search all elements for the longest text content
        console.log('JEF: Using brute force text extraction for Copilot');
        
        const allElements = document.querySelectorAll('*');
        let longestText = '';
        let longestLength = 0;
        
        allElements.forEach(el => {
            try {
                const text = el.innerText || el.textContent;
                if (text && text.length > 100) {
                    // Check if this looks like an AI message container
                    const isAIContainer = el.id.includes('content-') || 
                                         el.className.includes('ai-message') ||
                                         el.className.includes('break-words') ||
                                         el.className.includes('space-y-3');
                    
                    // For AI containers, always consider them regardless of children
                    // For other elements, check if they have significant children
                    let shouldConsider = false;
                    
                    if (isAIContainer) {
                        shouldConsider = true;
                        console.log('JEF: Found AI container element:', {
                            tagName: el.tagName,
                            className: el.className,
                            id: el.id,
                            length: text.length,
                            preview: text.substring(0, 100)
                        });
                    } else {
                        // For non-AI containers, check if they have significant children
                        const childElements = el.querySelectorAll('*');
                        const hasSignificantChildren = Array.from(childElements).some(child => {
                            const childText = child.innerText || child.textContent;
                            return childText && childText.length > 50;
                        });
                        shouldConsider = !hasSignificantChildren;
                    }
                    
                    if (shouldConsider && text.length > longestLength) {
                        longestText = text;
                        longestLength = text.length;
                        console.log('JEF: Found longer text element:', {
                            tagName: el.tagName,
                            className: el.className,
                            id: el.id,
                            length: text.length,
                            preview: text.substring(0, 100),
                            isAIContainer: isAIContainer
                        });
                    }
                }
            } catch (error) {
                // Ignore errors from individual elements
            }
        });
        
        if (longestText.length > 100) {
            console.log('JEF: Brute force found text with length:', longestLength);
            return longestText.trim();
        }
        
        return '';
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
        console.log('JEF: Extracting from selectors for platform:', this.platform);
        
        for (const selector of selectors) {
            try {
                const elements = document.querySelectorAll(selector);
                console.log(`JEF: Selector "${selector}" found ${elements.length} elements`);
                
                if (elements.length > 0) {
                    console.log(`JEF: Analyzing ${elements.length} elements for selector "${selector}"`);
                    
                    // For AI message selectors, find the element with the most substantial content
                    if (selector.includes('ai-message') || selector.includes('content-') || selector.includes('break-words')) {
                        let bestElement = null;
                        let bestLength = 0;
                        
                        for (let i = 0; i < elements.length; i++) {
                            const element = elements[i];
                            const text = element.innerText || element.textContent;
                            
                            if (text && text.trim().length > bestLength) {
                                bestElement = element;
                                bestLength = text.trim().length;
                                console.log(`JEF: Element ${i} has ${text.length} characters:`, text.substring(0, 100));
                            }
                        }
                        
                        if (bestElement && bestLength > 100) {
                            const bestText = bestElement.innerText || bestElement.textContent;
                            console.log(`JEF: Selected best element with ${bestLength} characters:`, bestText.substring(0, 100));
                            return bestText.trim();
                        }
                    } else {
                        // For other selectors, use the last (most recent) element
                        for (let i = elements.length - 1; i >= 0; i--) {
                            const element = elements[i];
                            const text = element.innerText || element.textContent;
                            
                            if (text && text.trim().length > 10) {
                                console.log(`JEF: Found text with selector "${selector}":`, text.substring(0, 100));
                                return text.trim();
                            }
                        }
                    }
                }
            } catch (error) {
                console.log(`JEF: Error with selector "${selector}":`, error);
            }
        }
        
        console.log('JEF: No AI output found with any selector');
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
