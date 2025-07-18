# JEF Browser Extension - Changelog

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
