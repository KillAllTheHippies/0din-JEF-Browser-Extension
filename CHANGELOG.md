# JEF Browser Extension - Changelog

## [1.3.0] - 2025-01-20

### 🎉 Major Platform Additions
- **Added Grok Support** (grok.com)
  - Full AI response detection and extraction
  - Platform-specific selectors for Grok's interface
  - Integrated with JEF evaluation framework

- **Added Baidu Ernie Support** (ernie.baidu.com)
  - Advanced content extraction with thinking process filtering
  - Smart container detection to avoid UI elements
  - Multi-strategy extraction with robust fallback mechanisms

### ✨ UI/UX Improvements
- **Floating JEF Eval Button**: Draggable evaluation button on AI platforms
- **Modern Dark UI**: Beautiful redesigned warning messages and notifications
- **Streamlined Popup**: Removed redundant "Evaluate Latest Output" button
- **Enhanced Category Selection**: Improved dropdown with auto-save functionality

### 🔧 Technical Enhancements
- **Fixed Category Selection Bug**: Categories now properly save and load
- **Added Missing Methods**: Fixed showNotification and setupMessageListener
- **Improved Error Handling**: Better debugging and console logging
- **Code Cleanup**: Removed dead code and fixed broken references

### 📋 Platform Support (8 Total)
- ✅ ChatGPT (chat.openai.com, chatgpt.com)
- ✅ Google Gemini (gemini.google.com)
- ✅ Qwen (chat.qwen.ai)
- ✅ DeepSeek (chat.deepseek.com)
- ✅ Claude (claude.ai)
- ✅ Microsoft Copilot (copilot.microsoft.com)
- ✅ Baidu Ernie (ernie.baidu.com) 🆕
- ✅ Grok (grok.com) 🆕

---

## [1.2.0] - 2025-01-18

### 🎉 Major Platform Additions
- **Added Claude Support** (claude.ai)
  - Full AI output detection and extraction
  - Platform-specific selectors for accurate content capture
  - Integrated with JEF evaluation framework

- **Added Microsoft Copilot Support** (copilot.microsoft.com)
  - Advanced content detection with multi-strategy extraction
  - Smart element selection for complex dynamic content
  - Robust selectors targeting actual HTML structure
  - Handles modern React-based chat interfaces

### 🔧 Technical Improvements
- **Enhanced Content Extraction**: Multi-strategy approach for better AI response detection
- **Smart Element Selection**: Prioritizes elements with substantial content over UI elements
- **Improved Platform Detection**: Better hostname matching and debugging
- **Robust Error Handling**: Enhanced error logging and fallback mechanisms

### 📋 Platform Support (6 Total)
- ✅ ChatGPT (chat.openai.com, chatgpt.com)
- ✅ Google Gemini (gemini.google.com)
- ✅ Qwen (chat.qwen.ai)
- ✅ DeepSeek (chat.deepseek.com)
- ✅ Claude (claude.ai) 🆕
- ✅ Microsoft Copilot (copilot.microsoft.com) 🆕

### 🛠️ Developer Notes
- Updated manifest.json with new host permissions
- Enhanced content.js with platform-specific extraction methods
- Improved popup.js with comprehensive platform detection
- Updated documentation and README

---

## [1.0.0] - 2024-12-XX

### 🚀 Initial Release
- **Core JEF Integration**: Direct AI output evaluation from web browsers
- **Multi-Platform Support**: ChatGPT, Gemini, Qwen, DeepSeek
- **Real-time Scoring**: Instant JEF evaluation across 4 categories
- **Modern UI**: Clean, intuitive interface with dropdown category selection
- **Privacy-Focused**: All processing happens locally
- **One-Click Evaluation**: No copy-paste required

### 📊 JEF Categories
- 🏛️ Tiananmen Square
- ⚗️ Nerve Agent  
- 🧪 Methamphetamine
- 📚 Copyright (HP)

### 🎯 Key Features
- Floating JEF evaluation button on AI websites
- Manual text evaluation capability
- Automatic AI output detection
- Category-specific accuracy warnings
- Comprehensive scoring system
