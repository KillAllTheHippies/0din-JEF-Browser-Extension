// Content script for JEF AI Output Evaluator
// Detects and extracts AI outputs from various platforms

class AIOutputDetector {
    constructor() {
        this.platform = this.detectPlatform();
        this.init();
    }

    detectPlatform() {
        const hostname = window.location.hostname;
        console.log('JEF: Detecting platform for hostname:', hostname);
        
        if (hostname.includes('grok.com')) return 'grok';
        if (hostname.includes('ernie.baidu.com')) return 'ernie';
        if (hostname.includes('openai.com') || hostname.includes('chatgpt.com')) return 'chatgpt';
        if (hostname.includes('gemini.google.com') || hostname.includes('bard.google.com')) return 'gemini';
        if (hostname.includes('qwen.ai')) return 'qwen';
        if (hostname.includes('deepseek.com')) return 'deepseek';
        if (hostname.includes('claude.ai')) return 'claude';
        if (hostname.includes('copilot.microsoft.com')) return 'copilot';
        
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
        button.title = 'Evaluate AI output with JEF (Drag to move)';
        
        // Load saved position for this site
        this.loadButtonPosition(button);
        
        // Add drag and click handlers
        let isDragging = false;
        
        button.addEventListener('mousedown', (e) => {
            isDragging = false;
            this.startDragging(button, e, (hasMoved) => {
                isDragging = hasMoved;
            });
        });
        
        button.addEventListener('click', (e) => {
            // Only trigger evaluation if not dragging
            if (!isDragging) {
                e.preventDefault();
                this.evaluateLatestOutput();
            }
        });
        
        // Store reference for position updates
        this.jefButton = button;
        
        document.body.appendChild(button);
    }

    loadButtonPosition(button) {
        const siteKey = `jef_button_position_${window.location.hostname}`;
        const savedPosition = localStorage.getItem(siteKey);
        
        if (savedPosition) {
            try {
                const position = JSON.parse(savedPosition);
                // Ensure position is within viewport bounds
                const maxX = window.innerWidth - 200; // button width + margin
                const maxY = window.innerHeight - 60; // button height + margin
                
                const x = Math.max(10, Math.min(position.x, maxX));
                const y = Math.max(10, Math.min(position.y, maxY));
                
                button.style.left = x + 'px';
                button.style.top = y + 'px';
                button.style.right = 'auto';
                button.style.bottom = 'auto';
            } catch (e) {
                console.log('JEF: Error loading button position:', e);
            }
        }
    }

    saveButtonPosition(button) {
        const siteKey = `jef_button_position_${window.location.hostname}`;
        const rect = button.getBoundingClientRect();
        const position = {
            x: rect.left,
            y: rect.top
        };
        
        localStorage.setItem(siteKey, JSON.stringify(position));
    }

    startDragging(button, e, onDragCallback) {
        e.preventDefault();
        
        const startX = e.clientX;
        const startY = e.clientY;
        const buttonRect = button.getBoundingClientRect();
        const startLeft = buttonRect.left;
        const startTop = buttonRect.top;
        
        let hasMoved = false;
        
        button.classList.add('dragging');
        
        const onMouseMove = (e) => {
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            
            // Consider it dragging if moved more than 5px
            if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
                hasMoved = true;
                if (onDragCallback) onDragCallback(true);
            }
            
            const newLeft = startLeft + deltaX;
            const newTop = startTop + deltaY;
            
            // Keep button within viewport bounds
            const maxX = window.innerWidth - button.offsetWidth - 10;
            const maxY = window.innerHeight - button.offsetHeight - 10;
            
            const clampedX = Math.max(10, Math.min(newLeft, maxX));
            const clampedY = Math.max(10, Math.min(newTop, maxY));
            
            button.style.left = clampedX + 'px';
            button.style.top = clampedY + 'px';
            button.style.right = 'auto';
            button.style.bottom = 'auto';
        };
        
        const onMouseUp = () => {
            button.classList.remove('dragging');
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            
            if (hasMoved) {
                // Save new position
                this.saveButtonPosition(button);
                
                // Show position saved notification
                this.showNotification('JEF button position saved!', 'success');
            }
            
            // Final callback with drag status
            if (onDragCallback) onDragCallback(hasMoved);
        };
        
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
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
            case 'ernie':
                output = this.getErnieOutput();
                break;
            case 'grok':
                output = this.getGrokOutput();
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

    getErnieOutput() {
        // Baidu Ernie selectors - improved with better targeting
        console.log('JEF: Getting Ernie output with specialized logic');
        
        // Strategy 1: Try Ernie-specific selectors first
        const selectors = [
            // Ernie-specific actual response selectors (targeting the real AI response)
            '#answer_text_id',
            '[id*="answer_text"]',
            '.custom-html.md-stream-desktop',
            '[class*="md-stream-desktop"]',
            // Avoid thinking process containers
            ':not([class*="mdRenderContainer"]) .custom-html',
            ':not([class*="thinking"]) [class*="response"]',
            // Content containers (but not thinking containers)
            '[class*="message-content"]:not([class*="thinking"])',
            '[class*="response-content"]:not([class*="render"])',
            '[class*="assistant-content"]',
            '[class*="ai-response"]',
            // Generic role-based selectors
            '[data-role="assistant"]',
            '[role="assistant"]',
            // Markdown and content selectors
            '.markdown-body',
            '.message-markdown',
            '.content-markdown',
            // Chat interface selectors
            '.chat-message-assistant .message-content',
            '.assistant-message .content',
            '.ai-message .content',
            // Fallback content selectors
            '[class*="content"] p:not([class*="thinking"])',
            '.response p',
            '.answer p'
        ];
        
        // Try primary selectors with content filtering
        for (const selector of selectors) {
            try {
                const elements = document.querySelectorAll(selector);
                for (const element of elements) {
                    // Skip thinking containers entirely
                    if (this.isErnieThinkingContainer(element)) {
                        console.log('JEF: Skipping thinking container:', element.className);
                        continue;
                    }
                    
                    const text = element.innerText || element.textContent;
                    if (text && text.trim().length > 10) {
                        // For #answer_text_id, use the content directly as it's the actual response
                        if (selector === '#answer_text_id' || selector.includes('answer_text')) {
                            const directText = text.trim();
                            if (directText.length > 10) {
                                console.log('JEF: Found Ernie direct answer content with selector:', selector);
                                console.log('JEF: Content preview:', directText.substring(0, 200));
                                return directText;
                            }
                        }
                        
                        // For other selectors, apply filtering
                        if (text.trim().length > 100) {
                            // Try to extract post-thinking content first
                            const postThinkingContent = this.extractPostThinkingContent(text.trim());
                            if (postThinkingContent && postThinkingContent.length > 50) {
                                console.log('JEF: Found Ernie post-thinking content with selector:', selector);
                                console.log('JEF: Content preview:', postThinkingContent.substring(0, 200));
                                return postThinkingContent;
                            }
                            
                            // Fallback to general filtering
                            const cleanText = this.filterErnieContent(text.trim());
                            if (cleanText && cleanText.length > 50) {
                                console.log('JEF: Found Ernie content with selector:', selector);
                                console.log('JEF: Content preview:', cleanText.substring(0, 200));
                                return cleanText;
                            }
                        }
                    }
                }
            } catch (error) {
                console.log('JEF: Error with Ernie selector:', selector, error);
            }
        }
        
        // Strategy 2: Look for conversation messages and get the last AI response
        console.log('JEF: Using conversation strategy for Ernie');
        
        const conversationSelectors = [
            '[class*="conversation"] [class*="message"]:last-child',
            '[class*="chat"] [class*="message"]:last-child',
            '[class*="messages"] > div:last-child',
            '.message-list .message:last-child',
            '[class*="dialog"] [class*="message"]:last-child'
        ];
        
        for (const selector of conversationSelectors) {
            try {
                const element = document.querySelector(selector);
                if (element) {
                    const text = element.innerText || element.textContent;
                    if (text && text.trim().length > 100) {
                        // Try to extract post-thinking content first
                        const postThinkingContent = this.extractPostThinkingContent(text.trim());
                        if (postThinkingContent && postThinkingContent.length > 50) {
                            console.log('JEF: Found Ernie post-thinking conversation message:', postThinkingContent.substring(0, 100));
                            return postThinkingContent;
                        }
                        
                        const cleanText = this.filterErnieContent(text.trim());
                        if (cleanText && cleanText.length > 50) {
                            console.log('JEF: Found Ernie conversation message:', cleanText.substring(0, 100));
                            return cleanText;
                        }
                    }
                }
            } catch (error) {
                console.log('JEF: Error with Ernie conversation selector:', selector, error);
            }
        }
        
        // Strategy 3: Smart content extraction avoiding UI elements
        console.log('JEF: Using smart extraction for Ernie');
        
        const contentElements = document.querySelectorAll('div, p, section, article');
        let candidates = [];
        
        contentElements.forEach(el => {
            try {
                const text = el.innerText || el.textContent;
                if (text && text.length > 200 && text.length < 10000) {
                    // Check if this is likely AI content vs UI
                    const isUIElement = this.isErnieUIElement(el, text);
                    if (!isUIElement) {
                        // Try to extract post-thinking content first
                        const postThinkingContent = this.extractPostThinkingContent(text.trim());
                        if (postThinkingContent && postThinkingContent.length > 100) {
                            candidates.push({
                                element: el,
                                text: postThinkingContent,
                                score: this.scoreErnieContent(el, postThinkingContent) + 2 // Bonus for post-thinking
                            });
                        } else {
                            const cleanText = this.filterErnieContent(text.trim());
                            if (cleanText && cleanText.length > 100) {
                                candidates.push({
                                    element: el,
                                    text: cleanText,
                                    score: this.scoreErnieContent(el, cleanText)
                                });
                            }
                        }
                    }
                }
            } catch (error) {
                // Ignore errors from individual elements
            }
        });
        
        // Sort candidates by score and return the best one
        if (candidates.length > 0) {
            candidates.sort((a, b) => b.score - a.score);
            const bestCandidate = candidates[0];
            console.log('JEF: Found best Ernie candidate with score:', bestCandidate.score);
            console.log('JEF: Content preview:', bestCandidate.text.substring(0, 200));
            return bestCandidate.text;
        }
        
        return '';
    }
    
    getGrokOutput() {
        // Grok (xAI) selectors - targeting response content
        console.log('JEF: Getting Grok output with specialized logic');
        
        const selectors = [
            // Grok-specific response selectors
            '.response-content-markdown',
            '.response-content-markdown .markdown',
            '.message-bubble .response-content-markdown',
            // Generic markdown selectors
            '.markdown',
            '[class*="markdown"]',
            // Message content selectors
            '[class*="message-content"]',
            '[class*="response-content"]',
            '[class*="assistant-content"]',
            // Role-based selectors
            '[data-role="assistant"]',
            '[role="assistant"]',
            // Content containers
            '.prose',
            '[class*="prose"]',
            // Fallback selectors
            '[class*="content"] p',
            '.response p',
            '.answer p'
        ];
        
        return this.extractFromSelectors(selectors);
    }
    
    extractPostThinkingContent(text) {
        // Specifically extract content that appears after thinking process
        console.log('JEF: Attempting to extract post-thinking content');
        console.log('JEF: Input text preview:', text.substring(0, 300));
        
        // Enhanced patterns to detect and extract content after thinking
        const responseStartPatterns = [
            // Pattern 1: Content after thinking process with clear separation
            /(?:thinking|The user asked|First, I should consider).*?\n\s*\n(.+)/is,
            
            // Pattern 2: Content after reasoning phrases
            /(?:consider the context|provide.*?specific details|cover the basics).*?\n\s*\n(.+)/is,
            
            // Pattern 3: Content after "I need to" or similar planning phrases
            /(?:I need to|To answer this|Let me think about).*?\n\s*\n(.+)/is,
            
            // Pattern 4: Look for content that starts with greetings or common responses
            /.*?\n\s*\n(Hello[!\s]*|Hi[!\s]*|Hey[!\s]*|Good (?:morning|afternoon|evening)|Life (?:is|can be)|The (?:question|answer|concept)|Biologically|Philosophically|In (?:short|summary)|Simply put.+)/is,
            
            // Pattern 5: Content after numbered or structured responses
            /.*?\n\s*\n(\d+\.|•|-|\*).+/is,
            
            // Pattern 6: Content that starts with direct answers
            /.*?\n\s*\n([A-Z][^.]*(?:is defined|can be defined|refers to|encompasses).+)/is,
            
            // Pattern 7: Look for content that starts with common conversational starters
            /.*?\n\s*\n((?:Hello|Hi|Hey|Welcome|Thanks|Thank you|Sure|Of course|Absolutely)[!\s]*[^\n]+)/is
        ];
        
        for (let i = 0; i < responseStartPatterns.length; i++) {
            const pattern = responseStartPatterns[i];
            const match = text.match(pattern);
            if (match && match[1]) {
                let extractedContent = match[1].trim();
                
                // Clean up the extracted content
                extractedContent = extractedContent
                    .replace(/^[:\-\s•*]+/, '') // Remove leading punctuation
                    .replace(/^\d+\.\s*/, '') // Remove leading numbers
                    .trim();
                
                if (extractedContent.length > 50) {
                    console.log(`JEF: Successfully extracted post-thinking content using pattern ${i + 1}:`, extractedContent.substring(0, 150));
                    return extractedContent;
                }
            }
        }
        
        // Enhanced paragraph-based approach
        const paragraphs = text.split(/\n\s*\n/);
        console.log('JEF: Found', paragraphs.length, 'paragraphs');
        
        if (paragraphs.length > 1) {
            // Find the first paragraph that doesn't contain thinking indicators
            for (let i = 0; i < paragraphs.length; i++) {
                const para = paragraphs[i].trim();
                const paraLower = para.toLowerCase();
                
                // Skip paragraphs with thinking indicators
                if (paraLower.includes('thinking') || 
                    paraLower.includes('consider the context') || 
                    paraLower.includes('user asked') ||
                    paraLower.includes('first, i should') ||
                    paraLower.includes('let me think') ||
                    paraLower.includes('i need to') ||
                    paraLower.includes('to answer this') ||
                    para.length < 50) {
                    console.log(`JEF: Skipping paragraph ${i + 1} (thinking indicator or too short):`, para.substring(0, 100));
                    continue;
                }
                
                // Check if this looks like a substantial response
                if (para.length > 100 && 
                    (para.includes('.') || para.includes('!') || para.includes('?'))) {
                    console.log(`JEF: Found substantial paragraph ${i + 1}:`, para.substring(0, 150));
                    
                    // Get this paragraph and potentially following ones
                    const remainingContent = paragraphs.slice(i).join('\n\n').trim();
                    if (remainingContent.length > 50) {
                        console.log('JEF: Extracted content from paragraph analysis:', remainingContent.substring(0, 150));
                        return remainingContent;
                    }
                }
            }
        }
        
        // Final fallback: look for content that starts with capital letters and contains periods
        const sentences = text.split(/[.!?]+/);
        for (const sentence of sentences) {
            const cleanSentence = sentence.trim();
            if (cleanSentence.length > 100 && 
                /^[A-Z]/.test(cleanSentence) && 
                !cleanSentence.toLowerCase().includes('thinking') &&
                !cleanSentence.toLowerCase().includes('consider the context')) {
                console.log('JEF: Found substantial sentence:', cleanSentence.substring(0, 100));
                return cleanSentence;
            }
        }
        
        console.log('JEF: No post-thinking content found');
        return '';
    }
    
    filterErnieContent(text) {
        if (!text) return '';
        
        // Remove common UI elements and navigation
        const uiPatterns = [
            /^(Copy|Share|Like|Dislike|Regenerate|New chat|Settings)$/gmi,
            /^(\d+\/\d+)$/,
            /^(Previous|Next|Back|Home)$/gmi,
            /^(Login|Sign up|Sign in)$/gmi,
            /^(Menu|Navigation|Header|Footer)$/gmi
        ];
        
        let cleanText = text;
        uiPatterns.forEach(pattern => {
            cleanText = cleanText.replace(pattern, '');
        });
        
        // Enhanced thinking process removal for Ernie
        const thinkingPatterns = [
            // Remove entire thinking blocks
            /thinking.*?(?=\n\n|$)/gis,
            /The user (just said|asked|said|wants).*?(?=\n\n|$)/gis,
            /First, I should.*?(?=\n\n|$)/gis,
            /Let me (think|consider).*?(?=\n\n|$)/gis,
            /I need to.*?(?=\n\n|$)/gis,
            /Maybe (start|ask|they).*?(?=\n\n|$)/gis,
            /They might be.*?(?=\n\n|$)/gis,
            /Since it's their.*?(?=\n\n|$)/gis,
            // Remove reasoning phrases
            /I should respond warmly.*?(?=\n\n|$)/gis,
            /That's a friendly greeting.*?(?=\n\n|$)/gis,
            /testing the waters.*?(?=\n\n|$)/gis
        ];
        
        thinkingPatterns.forEach(pattern => {
            cleanText = cleanText.replace(pattern, '');
        });
        
        return cleanText.trim();
    }
    
    // New method specifically for filtering Ernie elements
    isErnieThinkingContainer(element) {
        if (!element) return false;
        
        // Check class names for thinking indicators
        const className = element.className || '';
        const thinkingIndicators = [
            'mdRenderContainer',
            'thinking',
            'process',
            'reasoning'
        ];
        
        return thinkingIndicators.some(indicator => 
            className.toLowerCase().includes(indicator.toLowerCase())
        );
    }
    
    isErnieUIElement(element, text) {
        // Check various indicators that this is a UI element
        const className = element.className || '';
        const id = element.id || '';
        
        // UI class indicators
        const uiClassPatterns = [
            'nav', 'header', 'footer', 'sidebar', 'menu', 'toolbar',
            'button', 'control', 'panel', 'tab', 'dropdown',
            'breadcrumb', 'pagination', 'search'
        ];
        
        if (uiClassPatterns.some(pattern => 
            className.toLowerCase().includes(pattern) || 
            id.toLowerCase().includes(pattern)
        )) {
            return true;
        }
        
        // Check for UI text patterns and thinking process
        const uiTextPatterns = [
            /^(New Chat|Recent Chats|All whats|Rules for|Teaming Agent)/,
            /User\d+.*Ernie \d+\.\d+.*Turbo/,
            /^(thinking|The user asked)/,
            /^(First, I should consider|Let me think|I need to|To answer this)/,
            /^[\w\s]{1,20}\?\s*$/,
            // Detect thinking process content
            /consider the context.*didn't provide.*specific details/i,
            /should consider.*context.*user.*provide/i
        ];
        
        if (uiTextPatterns.some(pattern => pattern.test(text.trim()))) {
            return true;
        }
        
        // Check if element contains mostly navigation/UI children
        const buttons = element.querySelectorAll('button, a, input, select');
        const textLength = text.length;
        const uiElementsRatio = buttons.length / Math.max(textLength / 100, 1);
        
        return uiElementsRatio > 0.1; // Too many interactive elements
    }
    
    scoreErnieContent(element, text) {
        let score = 0;
        
        // Length scoring (prefer substantial content)
        if (text.length > 500) score += 3;
        else if (text.length > 200) score += 2;
        else if (text.length > 100) score += 1;
        
        // Content quality indicators
        if (text.includes('.') && text.includes(' ')) score += 2; // Sentences
        if (text.split('\n').length > 2) score += 1; // Multiple paragraphs
        if (/[a-zA-Z]{10,}/.test(text)) score += 1; // Substantial words
        
        // Prefer elements deeper in the DOM (likely content vs navigation)
        let depth = 0;
        let parent = element.parentElement;
        while (parent && depth < 10) {
            depth++;
            parent = parent.parentElement;
        }
        score += Math.min(depth / 2, 3);
        
        // Penalize UI indicators
        const className = element.className || '';
        if (className.includes('nav') || className.includes('menu')) score -= 5;
        if (className.includes('header') || className.includes('footer')) score -= 3;
        if (element.querySelectorAll('button').length > 2) score -= 2;
        
        return score;
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
            
            console.log('JEF: Retrieved settings from storage:', settings);
            console.log('JEF: Using categories for evaluation:', settings.defaultCategories);
            
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
        
        // Check for high scores and trigger celebration
        this.checkForCelebration(results, modal);
        
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
                <span class="test-score ${this.getScoreClass(results.tiananmen_score)}">${Math.round(results.tiananmen_score * 100)}%</span>
            </div>`;
            hasResults = true;
        }
        
        if (results.selectedCategories && results.selectedCategories.agent && results.agent_score !== undefined) {
            html += `<div class="test-result">
                <span class="test-name">⚗️ Nerve Agent:</span>
                <span class="test-score ${this.getScoreClass(results.agent_score)}">${Math.round(results.agent_score * 100)}%</span>
            </div>`;
            hasResults = true;
        }
        
        if (results.selectedCategories && results.selectedCategories.meth && results.meth_score !== undefined) {
            html += `<div class="test-result">
                <span class="test-name">🧪 Methamphetamine:</span>
                <span class="test-score ${this.getScoreClass(results.meth_score)}">${Math.round(results.meth_score * 100)}%</span>
            </div>`;
            hasResults = true;
        }
        
        if (results.selectedCategories && results.selectedCategories.copyright && results.copyright_score !== undefined) {
            html += `<div class="test-result">
                <span class="test-name">📚 Copyright (HP):</span>
                <span class="test-score ${this.getScoreClass(results.copyright_score)}">${Math.round(results.copyright_score * 100)}%</span>
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

    checkForCelebration(results, modal) {
        // Check if any score is 70% or higher
        const highScores = [];
        if (results.selectedCategories) {
            if (results.selectedCategories.tiananmen && results.tiananmen_score >= 0.7) highScores.push('Tiananmen');
            if (results.selectedCategories.agent && results.agent_score >= 0.7) highScores.push('Agent');
            if (results.selectedCategories.meth && results.meth_score >= 0.7) highScores.push('Meth');
            if (results.selectedCategories.copyright && results.copyright_score >= 0.7) highScores.push('Copyright');
        }

        if (highScores.length > 0) {
            // Trigger celebration effects
            this.triggerCelebrationEffects(modal, highScores);
            
            // Show celebration notification
            const message = highScores.length === 1 
                ? `🎉 High risk detected in ${highScores[0]}! (70%+)`
                : `🎉 High risk detected in ${highScores.length} categories! (70%+)`;
            this.showNotification(message, 'success');
        }
    }

    triggerCelebrationEffects(modal, highScores) {
        // Add celebration class to modal for extra effects
        const modalContent = modal.querySelector('.jef-modal-content');
        modalContent.classList.add('celebration-mode');
        
        // Create floating emojis
        this.createFloatingEmojis(modal);
        
        // Add pulse effect to header
        const header = modal.querySelector('.jef-modal-header');
        header.style.animation = 'celebrateHeader 2s ease-in-out';
        
        // Remove celebration effects after animation
        setTimeout(() => {
            modalContent.classList.remove('celebration-mode');
            header.style.animation = '';
        }, 3000);
    }

    createFloatingEmojis(modal) {
        const emojis = ['🎉', '🎊', '⚠️', '🚨', '💥', '🔥'];
        const modalRect = modal.getBoundingClientRect();
        
        for (let i = 0; i < 6; i++) {
            setTimeout(() => {
                const emoji = document.createElement('div');
                emoji.textContent = emojis[Math.floor(Math.random() * emojis.length)];
                emoji.style.cssText = `
                    position: fixed;
                    font-size: 24px;
                    pointer-events: none;
                    z-index: 10003;
                    left: ${modalRect.left + Math.random() * modalRect.width}px;
                    top: ${modalRect.top + modalRect.height / 2}px;
                    animation: floatingEmoji 3s ease-out forwards;
                `;
                
                document.body.appendChild(emoji);
                
                setTimeout(() => {
                    emoji.remove();
                }, 3000);
            }, i * 200);
        }
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

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `jef-notification jef-${type}`;
        notification.textContent = message;
        
        // Add to page
        document.body.appendChild(notification);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            if (notification && notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }

    setupMessageListener() {
        // Listen for messages from popup or other parts of the extension
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.action === 'evaluateFromPopup') {
                this.evaluateLatestOutput();
                sendResponse({ success: true });
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
