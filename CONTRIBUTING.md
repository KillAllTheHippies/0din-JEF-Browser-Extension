# Contributing to JEF Browser Extension

Thank you for your interest in contributing to the JEF Browser Extension! This document provides guidelines for contributing to this AI safety evaluation tool.

## 🤝 How to Contribute

### Reporting Issues
- **Bug Reports**: Use GitHub Issues with detailed reproduction steps
- **Feature Requests**: Describe the feature and its use case for AI safety
- **Security Issues**: Report privately to the maintainers

### Development Setup

1. **Fork the repository**
2. **Clone your fork**:
   ```bash
   git clone https://github.com/your-username/0din-JEF-Browser-Extension.git
   cd 0din-JEF-Browser-Extension
   ```
3. **Load extension in Chrome**:
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the project folder

### Making Changes

1. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. **Make your changes**
3. **Test thoroughly** on all supported platforms
4. **Commit with clear messages**:
   ```bash
   git commit -m "Add: Brief description of changes"
   ```

### Code Guidelines

#### JavaScript
- Use modern ES6+ syntax
- Follow consistent indentation (2 spaces)
- Add comments for complex logic
- Handle errors gracefully

#### CSS
- Use consistent naming conventions
- Maintain responsive design principles
- Test across different screen sizes

#### Manifest
- Follow Chrome Extension Manifest V3 standards
- Update permissions only when necessary
- Test all declared permissions

### Adding New AI Platforms

To add support for a new AI platform:

1. **Update `manifest.json`**:
   - Add domain to `host_permissions`
   - Add domain to `content_scripts.matches`

2. **Update `content.js`**:
   - Add platform detection logic
   - Add response selector for the platform
   - Test integration thoroughly

3. **Update documentation**:
   - Add platform to README.md
   - Update supported platforms list

### Testing

Before submitting:
- ✅ Test on all supported AI platforms
- ✅ Verify floating button appears correctly
- ✅ Confirm evaluation results display properly
- ✅ Check manual evaluation functionality
- ✅ Test extension popup interface

### Pull Request Process

1. **Ensure your PR**:
   - Has a clear title and description
   - References any related issues
   - Includes screenshots for UI changes
   - Has been tested on multiple platforms

2. **PR Review**:
   - Maintainers will review your code
   - Address any requested changes
   - Ensure all tests pass

3. **Merge**:
   - PRs are merged after approval
   - Your contribution will be credited

## 🔒 Security Considerations

This extension deals with AI safety evaluation:
- **Never log sensitive content** from AI platforms
- **Respect user privacy** - no data collection
- **Secure evaluation** - all processing is local
- **Platform compliance** - follow each platform's terms

## 📚 Resources

- **Original JEF Framework**: [0din-ai/0din-JEF](https://github.com/0din-ai/0din-JEF)
- **Chrome Extension Documentation**: [Chrome Developers](https://developer.chrome.com/docs/extensions/)
- **AI Safety Research**: Various academic and industry resources

## 🙏 Recognition

Contributors will be:
- Listed in the README.md acknowledgments
- Credited in release notes
- Recognized for their AI safety contributions

## 📞 Contact

For questions about contributing:
- **GitHub Issues**: For public discussion
- **GitHub Discussions**: For general questions
- **Security Issues**: Contact maintainers privately

---

**Thank you for helping make AI evaluation more accessible and secure!**
