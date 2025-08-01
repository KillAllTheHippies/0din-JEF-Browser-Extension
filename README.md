# JEF AI Output Evaluator - Chrome Extension

A Chrome extension that integrates with the Jailbreak Evaluation Framework (JEF) to evaluate AI model outputs directly from popular AI websites including ChatGPT, Gemini, Qwen, DeepSeek, Claude, Microsoft Copilot, Baidu Ernie, and Grok.

## Features

- **Direct Integration**: Works with 8 major AI platforms including Grok and Baidu Ernie
- **Floating JEF Eval Button**: One-click evaluation with draggable floating button
- **Real-time Scoring**: Get instant JEF scores across 4 categories
- **Modern Dark UI**: Beautiful redesigned interface with improved UX
- **Manual Evaluation**: Evaluate any text manually

## Supported Platforms

- ✅ ChatGPT (chat.openai.com, chatgpt.com)
- ✅ Google Gemini (gemini.google.com)
- ✅ Qwen (chat.qwen.ai)
- ✅ DeepSeek (chat.deepseek.com)
- ✅ Claude (claude.ai)
- ✅ Microsoft Copilot (copilot.microsoft.com)
- ✅ Baidu Ernie (ernie.baidu.com) 🆕
- ✅ Grok (grok.com) 🆕

## Installation

### From Source (Development)

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the `JEF` folder
5. The JEF extension should now appear in your extensions

## Usage

### Automatic Evaluation

#### Step-by-Step Visual Guide:

<div align="center">

### **Step 1: Select Task**
<img src="docs/images/usage-steps/step1-select-task.png" alt="Select Task" width="400">

*Click the JEF extension icon and select the appropriate evaluation task from the dropdown*

<br><br>

### **Step 2: Generate AI Response**  
<img src="docs/images/usage-steps/step2-generate-response.png" alt="Generate Response" width="600">

*Visit any supported AI platform and generate a response you want to evaluate*

<br><br>

### **Step 3: Click JEF Eval Button**
<img src="docs/images/usage-steps/step3-click-jef-eval.png" alt="Click JEF Eval Button" width="600">

*Click the floating "JEF Eval" button that appears after the AI response (draggable for positioning)*

<br><br>

### **Step 4: View Results**
<img src="docs/images/usage-steps/step4-view-results.png" alt="View Results" width="500">

*Review the evaluation results*

</div>

---

### Manual Evaluation

1. Click the JEF extension icon in the Chrome toolbar
2. Click "Manual Evaluation"
3. Paste or type the text you want to evaluate
4. Click "Evaluate" to get JEF scores

## JEF Scoring Categories

The extension evaluates content across four key areas:

1. **Tiananmen Square** - Historical censorship and sensitive events
2. **Nerve Agents** - Harmful chemical synthesis instructions
3. **Methamphetamine** - Illicit drug manufacturing information
4. **Copyright** - Intellectual property violations (Harry Potter)


## Development

### File Structure

```
chrome-extension/
├── manifest.json          # Extension configuration
├── background.js          # Background script (JEF evaluation logic)
├── content.js            # Content script (AI output detection)
├── popup.html            # Extension popup interface
├── popup.js              # Popup functionality
├── popup.css             # Popup styling
├── styles.css            # Content script styling
├── icons/                # Extension icons
└── README.md             # This file
```

### Key Components

- **Content Script**: Detects and extracts AI outputs from web pages
- **Background Script**: Handles JEF evaluation algorithms
- **Popup Interface**: Provides manual evaluation and history viewing
- **Storage**: Maintains evaluation history locally

### Adding New Platforms

To add support for a new AI platform:

1. Add the domain to `host_permissions` in `manifest.json`
2. Add the domain to content script `matches` in `manifest.json`
3. Update `detectPlatform()` in `content.js`
4. Add platform-specific selectors in `content.js`
5. Test the integration



## 🙏 **Acknowledgments**

### 🔬 **Based on Original JEF Framework**

This Chrome extension is built upon the excellent work of the **Jailbreak Evaluation Framework (JEF)** project:

**🌟 Original JEF Repository**: [0din-ai/0din-JEF](https://github.com/0din-ai/0din-JEF)

> The original JEF framework provides the core evaluation algorithms and methodology that power this browser extension. We extend our gratitude to the original developers for creating such a comprehensive and valuable AI safety evaluation tool.

### 🤝 **Special Thanks**

- **Original JEF Team** - For developing the foundational evaluation framework
- **AI Safety Research Community** - For ongoing research and insights
- **Chrome Extension Community** - For development best practices and guidance
- **Open Source Contributors** - For making collaborative development possible

### 📚 **Related Projects**

- **[0din-JEF](https://github.com/0din-ai/0din-JEF)** - Original Jailbreak Evaluation Framework
- **AI Safety Research** - Various academic and industry initiatives
- **Chrome Extension Ecosystem** - Tools and libraries that made this possible

---

**Made with ❤️ for AI Safety Research**

*Empowering researchers, developers, and users to evaluate AI safety in real-time.*

*Built upon the solid foundation of the original JEF framework - extending AI safety evaluation to the browser.*