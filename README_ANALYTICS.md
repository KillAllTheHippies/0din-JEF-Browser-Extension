# JEF Browser Extension - Analytics & Storage System

Comprehensive analytics and storage system for the JEF (Jailbreak Evaluation Framework) Browser Extension, implementing Phase 0 "Walking" requirements from the Product Requirements Document.

## 🎯 Overview

This system extends the existing JEF Browser Extension with persistent storage, analytics capabilities, and a comprehensive history management interface. It captures, stores, and analyzes AI evaluation results across multiple platforms (ChatGPT, Claude, Gemini) with detailed metadata and performance metrics.

## 📋 Features

### Core Functionality
- **Persistent Storage**: IndexedDB-based storage using Dexie.js
- **Token Analysis**: Accurate token counting with tiktoken integration
- **Multi-language Support**: Language detection and encoding management
- **History Grid**: Advanced filtering, sorting, and search capabilities
- **Export/Import**: JSON Lines format for data portability
- **Performance Monitoring**: Real-time performance metrics and benchmarks

### Data Capture
- Prompt and response text
- JEF evaluation scores and categories
- Token counts and language metadata
- Platform and model information
- Timestamps and performance metrics

### Analytics Features
- Multi-column sorting and filtering
- Full-text search across all fields
- Category-based analysis
- Score range filtering
- Platform comparison
- Export for external analysis

## 🏗️ Architecture

```
src/
├── database/
│   └── jef-database.js      # Database layer (Dexie.js)
├── utils/
│   └── token-utils.js       # Token counting and metadata
├── ui/
│   ├── history-grid.js      # History management interface
│   └── analytics-styles.css # UI styling
tests/
├── setup.js                 # Test configuration
├── database.test.js         # Database unit tests
├── token-utils.test.js      # Token utilities tests
├── history-grid.test.js     # UI component tests
└── integration.test.js      # End-to-end tests
```

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm
- Modern browser with IndexedDB support
- Chrome/Firefox extension development environment

### Installation

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Run Tests**
   ```bash
   npm test
   ```

3. **Check Code Quality**
   ```bash
   npm run lint
   ```

4. **Generate Coverage Report**
   ```bash
   npm run test:coverage
   ```

### Integration with Existing Extension

1. **Add to Manifest** (`manifest.json`)
   ```json
   {
     "permissions": [
       "storage",
       "unlimitedStorage"
     ]
   }
   ```

2. **Initialize Database** (in background script)
   ```javascript
   import { JEFDatabase } from './src/database/jef-database.js';
   
   const database = new JEFDatabase();
   await database.initDatabase();
   ```

3. **Store Evaluations** (after JEF evaluation)
   ```javascript
   import { TokenUtils } from './src/utils/token-utils.js';
   
   const tokenUtils = new TokenUtils();
   const tokenCount = await tokenUtils.countTokens(responseText, model);
   const language = tokenUtils.detectLanguage(responseText);
   
   await database.storeEvaluation({
     text: responseText,
     prompt: promptText,
     platform: 'chatgpt',
     model: 'gpt-3.5-turbo',
     overall_score: jefScore,
     tokenCount,
     language,
     selectedCategories: categories
   });
   ```

4. **Display History** (in popup or options page)
   ```javascript
   import { HistoryGrid } from './src/ui/history-grid.js';
   
   const container = document.getElementById('history-container');
   const historyGrid = new HistoryGrid(container, database);
   await historyGrid.loadData();
   ```

## 📊 Data Model

### Evaluation Record Structure
```javascript
{
  id: 'auto-generated-uuid',
  createdAt: '2024-01-01T10:00:00.000Z',
  platform: 'chatgpt|claude|gemini',
  model: 'gpt-3.5-turbo|claude-3|gemini-pro',
  prompt: 'User input text',
  response: 'AI response text',
  jefScore: 0.75,                    // Overall JEF score (0-1)
  scorePct: 75,                      // Score as percentage
  verboseResults: {...},             // Detailed category scores
  tokenCount: 150,                   // Accurate token count
  language: 'en',                    // Detected language
  encodingHint: 'cl100k_base',       // Token encoding used
  categories: ['meth', 'agent'],     // Active JEF categories
  metadata: {...}                    // Additional platform-specific data
}
```

### Database Schema
- **Primary Key**: Auto-generated UUID
- **Indexes**: createdAt, platform, jefScore, language, categories
- **Full-text Search**: prompt, response fields
- **Storage**: IndexedDB with automatic cleanup

## 🧪 Testing

### Test Coverage
- **Database Layer**: 85% coverage requirement
- **Utilities**: 80% coverage requirement  
- **UI Components**: 75% coverage requirement
- **Overall**: 80% coverage requirement

### Test Suites

#### Unit Tests
```bash
# Database operations
npx jest tests/database.test.js

# Token utilities
npx jest tests/token-utils.test.js

# UI components
npx jest tests/history-grid.test.js
```

#### Integration Tests
```bash
# End-to-end workflows
npx jest tests/integration.test.js
```

#### Performance Tests
```bash
# Performance benchmarks
npx jest tests/integration.test.js --testNamePattern="Performance"
```

### Performance Requirements
- **Storage**: ≤200ms per evaluation
- **Retrieval**: ≤300ms for 10,000 records
- **UI Operations**: ≤100ms for filtering/sorting

## 🔧 API Reference

### JEFDatabase Class

#### Core Methods
```javascript
// Initialize database
await database.initDatabase();

// Store evaluation
const id = await database.storeEvaluation(evaluationData);

// Retrieve evaluations
const evaluations = await database.getEvaluations({
  limit: 100,
  offset: 0,
  sortBy: 'createdAt',
  sortOrder: 'desc',
  filters: { platform: 'chatgpt' }
});

// Search evaluations
const results = await database.searchEvaluations('search term');

// Export data
const jsonlData = await database.exportToJSONL();

// Import data
const importCount = await database.importFromJSONL(jsonlData);

// Get statistics
const stats = await database.getStatistics();
```

### TokenUtils Class

#### Token Operations
```javascript
const tokenUtils = new TokenUtils();

// Count tokens
const count = await tokenUtils.countTokens(text, model);

// Detect language
const language = tokenUtils.detectLanguage(text);

// Get encoding hint
const encoding = tokenUtils.getEncodingHint(model);

// Generate token diff
const diff = await tokenUtils.generateTokenDiff(text1, text2, model);

// Get context window data
const contextData = tokenUtils.getContextWindowData(model);
```

### HistoryGrid Class

#### UI Operations
```javascript
const historyGrid = new HistoryGrid(container, database);

// Load data
await historyGrid.loadData();

// Apply filters
historyGrid.applyFilters({
  platform: 'chatgpt',
  scoreRange: { min: 0.5, max: 1.0 },
  categories: ['meth', 'agent'],
  dateRange: { start: '2024-01-01', end: '2024-12-31' }
});

// Search
await historyGrid.search('search term');

// Sort
historyGrid.sort('jefScore', 'desc');

// Export data
const exportData = await historyGrid.exportData();

// Import data
await historyGrid.importData(importData);
```

## 🎨 UI Components

### History Grid Features
- **Multi-column Sorting**: Click headers to sort by any field
- **Advanced Filtering**: Platform, score range, categories, date range
- **Full-text Search**: Search across prompts and responses
- **Pagination**: Handle large datasets efficiently
- **Export/Import**: JSON Lines format support
- **Details Modal**: View complete evaluation details
- **Responsive Design**: Works on desktop and mobile

### Styling
The analytics UI uses a modern, professional design with:
- Dark mode support
- Accessibility compliance
- Responsive layout
- Smooth animations
- Clear visual hierarchy

## 🔒 Security & Privacy

### Data Protection
- **Local Storage**: All data stored locally in IndexedDB
- **No External Transmission**: Data never leaves the user's device
- **Encryption**: Sensitive data can be encrypted at rest
- **Access Control**: Extension-only access to stored data

### Privacy Considerations
- **User Consent**: Clear disclosure of data collection
- **Data Retention**: Configurable retention policies
- **Export Control**: Users can export and delete their data
- **Minimal Collection**: Only necessary data is stored

## 📈 Performance Optimization

### Database Optimization
- **Indexed Queries**: Efficient filtering and sorting
- **Batch Operations**: Bulk insert/update capabilities
- **Memory Management**: Automatic cleanup and garbage collection
- **Query Optimization**: Optimized database queries

### UI Optimization
- **Virtual Scrolling**: Handle large datasets
- **Debounced Search**: Efficient search operations
- **Lazy Loading**: Load data on demand
- **Caching**: Cache frequently accessed data

## 🐛 Troubleshooting

### Common Issues

#### Database Connection Errors
```javascript
// Check IndexedDB support
if (!window.indexedDB) {
  console.error('IndexedDB not supported');
}

// Handle quota exceeded
try {
  await database.storeEvaluation(data);
} catch (error) {
  if (error.name === 'QuotaExceededError') {
    // Handle storage quota exceeded
  }
}
```

#### Token Counting Issues
```javascript
// Fallback when tiktoken unavailable
const tokenCount = await tokenUtils.countTokens(text, model)
  .catch(() => tokenUtils.estimateTokens(text));
```

#### UI Performance Issues
```javascript
// Limit displayed results
historyGrid.setPageSize(50); // Show 50 items per page

// Use debounced search
historyGrid.setSearchDebounce(300); // 300ms delay
```

### Debug Mode
```javascript
// Enable debug logging
const database = new JEFDatabase({ debug: true });
const tokenUtils = new TokenUtils({ debug: true });
const historyGrid = new HistoryGrid(container, database, { debug: true });
```

## 🔄 Migration & Upgrades

### Database Migrations
```javascript
// Handle schema changes
const database = new JEFDatabase();
await database.migrate({
  from: '1.0.0',
  to: '1.1.0',
  migrations: [
    // Migration functions
  ]
});
```

### Data Export for Backup
```javascript
// Export all data
const backup = await database.exportToJSONL();
localStorage.setItem('jef_backup', backup);

// Import from backup
const backup = localStorage.getItem('jef_backup');
await database.importFromJSONL(backup);
```

## 📚 Additional Resources

### Documentation
- [TESTING.md](./TESTING.md) - Comprehensive testing guide
- [product_requirements_document.md](./product_requirements_document.md) - Full PRD
- [API Documentation](./docs/api.md) - Detailed API reference

### Dependencies
- [Dexie.js](https://dexie.org/) - IndexedDB wrapper
- [tiktoken](https://github.com/openai/tiktoken) - Token counting
- [Jest](https://jestjs.io/) - Testing framework

### Browser Compatibility
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## 🤝 Contributing

### Development Workflow
1. **Setup**: `npm install`
2. **Test**: `npm test`
3. **Lint**: `npm run lint`
4. **Build**: `npm run build`
5. **Coverage**: `npm run test:coverage`

### Code Standards
- ESLint configuration for code quality
- Jest for comprehensive testing
- 80%+ test coverage requirement
- Performance benchmarks for critical operations

### Pull Request Process
1. Ensure all tests pass
2. Maintain or improve test coverage
3. Update documentation as needed
4. Follow existing code style
5. Include performance impact assessment

---

**Version**: 1.0.0 (Phase 0 "Walking")
**Last Updated**: January 2024
**License**: MIT

For questions or support, please refer to the project documentation or create an issue in the repository.