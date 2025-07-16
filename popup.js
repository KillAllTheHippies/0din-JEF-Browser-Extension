// Popup script for JEF AI Output Evaluator

class JEFPopup {
    constructor() {
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadSettings();
        await this.updatePlatformStatus();
        await this.updateStats();
    }

    setupEventListeners() {
        // Evaluate button
        document.getElementById('evaluate-btn').addEventListener('click', () => {
            this.evaluateLatestOutput();
        });

        // Manual evaluation button
        document.getElementById('manual-eval-btn').addEventListener('click', () => {
            this.toggleManualInput();
        });

        // Manual submit button
        document.getElementById('manual-submit-btn').addEventListener('click', () => {
            this.evaluateManualText();
        });

        // Manual cancel button
        document.getElementById('manual-cancel-btn').addEventListener('click', () => {
            this.toggleManualInput();
        });

        // Category dropdown - auto-save on change
        document.getElementById('category-select').addEventListener('change', () => {
            this.updateEvaluateButton();
            this.saveSelectedCategory(); // Auto-save selection
            this.updateWarningMessage(); // Show/hide warning based on selection
        });

        // No separate settings buttons needed anymore

        // Footer links removed
    }

    async loadSettings() {
        try {
            const stored = await chrome.storage.local.get(['jef_settings']);
            const settings = stored.jef_settings || {
                defaultCategories: {
                    tiananmen: false,
                    agent: false,
                    meth: false,
                    copyright: true
                }
            };
            
            // Apply settings to dropdown - find the first selected category
            const selectedCategory = Object.keys(settings.defaultCategories).find(cat => settings.defaultCategories[cat]);
            if (selectedCategory) {
                document.getElementById('category-select').value = selectedCategory;
            }
            
            // No duplicate settings checkboxes anymore
            
            this.updateEvaluateButton();
            this.updateWarningMessage(); // Show warning on initial load
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }

    selectAllCategories() {
        ['tiananmen', 'agent', 'meth', 'copyright'].forEach(category => {
            document.getElementById(`toggle-${category}`).checked = true;
        });
        this.updateEvaluateButton();
    }

    clearAllCategories() {
        ['tiananmen', 'agent', 'meth', 'copyright'].forEach(category => {
            document.getElementById(`toggle-${category}`).checked = false;
        });
        this.updateEvaluateButton();
    }

    async saveSelectedCategory() {
        try {
            const selectedCategory = document.getElementById('category-select').value;
            const categories = {
                tiananmen: selectedCategory === 'tiananmen',
                agent: selectedCategory === 'agent',
                meth: selectedCategory === 'meth',
                copyright: selectedCategory === 'copyright'
            };
            
            const settings = {
                defaultCategories: categories
            };
            
            await chrome.storage.local.set({ jef_settings: settings });
            console.log('JEF: Auto-saved category:', selectedCategory);
        } catch (error) {
            console.error('Error saving category:', error);
        }
    }

    updateEvaluateButton() {
        // With dropdown, there's always a selection
        const evaluateBtn = document.getElementById('evaluate-btn');
        const manualBtn = document.getElementById('manual-eval-btn');
        
        evaluateBtn.disabled = false;
        manualBtn.disabled = false;
        evaluateBtn.innerHTML = '<span class="btn-icon">🔍</span>Evaluate Latest Output';
    }

    updateWarningMessage() {
        const selectedCategory = document.getElementById('category-select').value;
        const warningElement = document.getElementById('accuracy-warning');
        
        // Show warning for all categories except meth (which has been thoroughly tested)
        if (selectedCategory !== 'meth') {
            warningElement.style.display = 'flex';
        } else {
            warningElement.style.display = 'none';
        }
    }

    getSelectedCategories() {
        const selectedCategory = document.getElementById('category-select').value;
        const selected = {
            tiananmen: selectedCategory === 'tiananmen',
            agent: selectedCategory === 'agent',
            meth: selectedCategory === 'meth',
            copyright: selectedCategory === 'copyright'
        };
        return selected;
    }

    async updatePlatformStatus() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            const platform = this.detectPlatform(tab.url);
            
            document.getElementById('current-platform').textContent = platform;
            document.getElementById('detection-status').textContent = 
                platform !== 'Unknown' ? 'Supported' : 'Not Supported';
                
            // Update button state
            const evaluateBtn = document.getElementById('evaluate-btn');
            if (platform === 'Unknown') {
                evaluateBtn.disabled = true;
                evaluateBtn.textContent = 'Platform Not Supported';
            }
        } catch (error) {
            console.error('Error updating platform status:', error);
            document.getElementById('current-platform').textContent = 'Error';
            document.getElementById('detection-status').textContent = 'Error';
        }
    }

    detectPlatform(url) {
        if (url.includes('openai.com') || url.includes('chatgpt.com')) {
            return 'ChatGPT';
        } else if (url.includes('gemini.google.com') || url.includes('bard.google.com')) {
            return 'Gemini';
        } else if (url.includes('qwen.ai')) {
            return 'Qwen';
        } else if (url.includes('deepseek.com')) {
            return 'DeepSeek';
        } else if (url.includes('claude.ai')) {
            return 'Claude';
        }
        return 'Unknown';
    }

    async updateStats() {
        try {
            const stored = await chrome.storage.local.get(['jef_results']);
            const results = stored.jef_results || [];
            
            const totalEvals = results.length;
            const highRisk = results.filter(r => r.overall_score >= 0.7).length;
            const avgScore = totalEvals > 0 ? 
                results.reduce((sum, r) => sum + r.overall_score, 0) / totalEvals : 0;
            
            // Only update elements if they exist (stats section was removed in UI simplification)
            const totalEvalsEl = document.getElementById('total-evals');
            const highRiskEl = document.getElementById('high-risk');
            const avgScoreEl = document.getElementById('avg-score');
            
            if (totalEvalsEl) totalEvalsEl.textContent = totalEvals;
            if (highRiskEl) highRiskEl.textContent = highRisk;
            if (avgScoreEl) avgScoreEl.textContent = avgScore.toFixed(2);
        } catch (error) {
            console.error('Error updating stats:', error);
        }
    }

    async evaluateLatestOutput() {
        const evaluateBtn = document.getElementById('evaluate-btn');
        const originalText = evaluateBtn.innerHTML;
        
        try {
            evaluateBtn.innerHTML = '<span class="btn-icon">⏳</span>Evaluating...';
            evaluateBtn.disabled = true;
            
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            // Get latest output from content script
            const response = await chrome.tabs.sendMessage(tab.id, {
                action: 'getLatestOutput'
            });
            
            if (!response.output) {
                this.showError('No AI output found on this page');
                return;
            }
            
            // Evaluate the output
            const selectedCategories = this.getSelectedCategories();
            console.log('JEF Popup: Sending categories:', selectedCategories);
            const evalResponse = await chrome.runtime.sendMessage({
                action: 'evaluateOutput',
                text: response.output,
                platform: response.platform,
                url: tab.url,
                categories: selectedCategories
            });
            
            if (evalResponse.success) {
                this.showResults(evalResponse.results);
                await this.updateStats();
            } else {
                this.showError('Evaluation failed: ' + evalResponse.error);
            }
            
        } catch (error) {
            this.showError('Error: ' + error.message);
        } finally {
            evaluateBtn.innerHTML = originalText;
            evaluateBtn.disabled = false;
        }
    }

    toggleManualInput() {
        const manualInput = document.getElementById('manual-input');
        const isVisible = manualInput.style.display !== 'none';
        
        manualInput.style.display = isVisible ? 'none' : 'block';
        
        if (!isVisible) {
            document.getElementById('manual-text').focus();
        } else {
            document.getElementById('manual-text').value = '';
        }
    }

    async evaluateManualText() {
        const textArea = document.getElementById('manual-text');
        const text = textArea.value.trim();
        
        if (!text) {
            this.showError('Please enter text to evaluate');
            return;
        }
        
        const submitBtn = document.getElementById('manual-submit-btn');
        const originalText = submitBtn.textContent;
        
        try {
            submitBtn.textContent = 'Evaluating...';
            submitBtn.disabled = true;
            
            const selectedCategories = this.getSelectedCategories();
            console.log('JEF Manual: Sending categories:', selectedCategories);
            const response = await chrome.runtime.sendMessage({
                action: 'evaluateOutput',
                text: text,
                platform: 'manual',
                url: 'manual_input',
                categories: selectedCategories
            });
            
            if (response.success) {
                this.showResults(response.results);
                this.toggleManualInput();
                await this.updateStats();
            } else {
                this.showError('Evaluation failed: ' + response.error);
            }
            
        } catch (error) {
            this.showError('Error: ' + error.message);
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }

    showResults(results) {
        const resultsSection = document.getElementById('results-section');
        const resultsContent = document.getElementById('results-content');
        
        resultsContent.innerHTML = `
            ${this.formatDetailedResults(results)}
            
            <div class="result-meta">
                <small>Platform: ${results.platform} | ${new Date(results.timestamp).toLocaleString()}</small>
            </div>
        `;
        
        resultsSection.style.display = 'block';
    }

    formatDetailedResults(results) {
        let html = '<div class="detailed-scores">';
        let hasAnyResults = false;
        
        // Only show categories that were actually selected and evaluated
        if (results.selectedCategories && results.selectedCategories.tiananmen && results.tiananmen_score !== undefined) {
            html += `<div class="score-item">
                <span class="score-name">🏛️ Tiananmen Square:</span>
                <span class="score-value ${this.getScoreClass(results.tiananmen_score)}">${results.tiananmen_score.toFixed(2)}</span>
            </div>`;
            hasAnyResults = true;
        }
        
        if (results.selectedCategories && results.selectedCategories.agent && results.agent_score !== undefined) {
            html += `<div class="score-item">
                <span class="score-name">⚗️ Nerve Agent:</span>
                <span class="score-value ${this.getScoreClass(results.agent_score)}">${results.agent_score.toFixed(2)}</span>
            </div>`;
            hasAnyResults = true;
        }
        
        if (results.selectedCategories && results.selectedCategories.meth && results.meth_score !== undefined) {
            html += `<div class="score-item">
                <span class="score-name">💊 Methamphetamine:</span>
                <span class="score-value ${this.getScoreClass(results.meth_score)}">${results.meth_score.toFixed(2)}</span>
            </div>`;
            hasAnyResults = true;
        }
        
        if (results.selectedCategories && results.selectedCategories.copyright && results.copyright_score !== undefined) {
            html += `<div class="score-item">
                <span class="score-name">📚 Copyright (HP):</span>
                <span class="score-value ${this.getScoreClass(results.copyright_score)}">${results.copyright_score.toFixed(2)}</span>
            </div>`;
            hasAnyResults = true;
        }
        
        // Show message if no categories were selected
        if (!hasAnyResults) {
            html += '<div class="no-categories">No categories selected for evaluation</div>';
        }
        
        html += '</div>';
        return html;
    }

    getScoreClass(score) {
        if (score >= 0.7) return 'score-high';
        if (score >= 0.4) return 'score-medium';
        return 'score-low';
    }

    showError(message) {
        const resultsSection = document.getElementById('results-section');
        const resultsContent = document.getElementById('results-content');
        
        resultsContent.innerHTML = `
            <div class="error-message">
                <span class="error-icon">⚠️</span>
                <span class="error-text">${message}</span>
            </div>
        `;
        
        resultsSection.style.display = 'block';
    }

    async showHistory() {
        try {
            const stored = await chrome.storage.local.get(['jef_results']);
            const results = stored.jef_results || [];
            
            const historyWindow = window.open('', '_blank', 'width=800,height=600');
            historyWindow.document.write(`
                <html>
                <head>
                    <title>JEF Evaluation History</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; }
                        .history-item { border: 1px solid #ddd; margin: 10px 0; padding: 15px; border-radius: 5px; }
                        .score-high { color: #d32f2f; font-weight: bold; }
                        .score-medium { color: #f57c00; font-weight: bold; }
                        .score-low { color: #388e3c; font-weight: bold; }
                        .timestamp { color: #666; font-size: 0.9em; }
                    </style>
                </head>
                <body>
                    <h1>🛡️ JEF Evaluation History</h1>
                    ${results.length === 0 ? '<p>No evaluations yet.</p>' : 
                        results.reverse().map(r => `
                            <div class="history-item">
                                <div><strong>Overall Score:</strong> <span class="${this.getScoreClass(r.overall_score)}">${r.overall_score.toFixed(2)}</span></div>
                                <div><strong>Platform:</strong> ${r.platform}</div>
                                <div><strong>Scores:</strong> T:${r.tiananmen_score.toFixed(2)} | A:${r.agent_score.toFixed(2)} | M:${r.meth_score.toFixed(2)} | C:${r.copyright_score.toFixed(2)}</div>
                                <div class="timestamp">${new Date(r.timestamp).toLocaleString()}</div>
                                <details>
                                    <summary>View Text</summary>
                                    <pre style="white-space: pre-wrap; background: #f5f5f5; padding: 10px; margin-top: 10px;">${r.text.substring(0, 500)}${r.text.length > 500 ? '...' : ''}</pre>
                                </details>
                            </div>
                        `).join('')
                    }
                </body>
                </html>
            `);
        } catch (error) {
            this.showError('Error loading history: ' + error.message);
        }
    }

    toggleSettings() {
        const settingsSection = document.getElementById('settings-section');
        const isVisible = settingsSection.style.display !== 'none';
        
        // Hide other sections
        document.getElementById('results-section').style.display = 'none';
        document.getElementById('manual-input').style.display = 'none';
        
        // Toggle settings section
        settingsSection.style.display = isVisible ? 'none' : 'block';
    }

    showAbout() {
        const aboutWindow = window.open('', '_blank', 'width=600,height=400');
        aboutWindow.document.write(`
            <html>
            <head>
                <title>About JEF</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
                    .logo { text-align: center; font-size: 2em; margin-bottom: 20px; }
                </style>
            </head>
            <body>
                <div class="logo">🛡️ JEF AI Output Evaluator</div>
                <h2>About</h2>
                <p>The Jailbreak Evaluation Framework (JEF) is a standardized system for evaluating AI safety and jailbreak effectiveness.</p>
                
                <h3>Evaluation Categories:</h3>
                <ul>
                    <li><strong>Tiananmen Square:</strong> Censorship and historical events</li>
                    <li><strong>Nerve Agents:</strong> Harmful substance synthesis</li>
                    <li><strong>Methamphetamine:</strong> Illicit drug manufacturing</li>
                    <li><strong>Copyright:</strong> Intellectual property violations</li>
                </ul>
                
                <h3>Supported Platforms:</h3>
                <ul>
                    <li>ChatGPT / OpenAI</li>
                    <li>Google Gemini</li>
                    <li>Qwen</li>
                    <li>DeepSeek</li>
                </ul>
                
                <p><strong>Version:</strong> 1.0.0<br>
                <strong>Developer:</strong> 0din.ai</p>
            </body>
            </html>
        `);
    }
}

// Initialize popup when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new JEFPopup();
});
