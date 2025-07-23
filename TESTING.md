# JEF Browser Extension - Testing Documentation

This document provides comprehensive guidance for testing the JEF (Jailbreak Evaluation Framework) Browser Extension analytics and storage system.

## Overview

The testing infrastructure covers three main areas:
- **Unit Tests**: Individual component testing
- **Integration Tests**: End-to-end workflow testing
- **Performance Tests**: Benchmarking against PRD requirements

## Test Structure

```
tests/
├── setup.js              # Global test configuration and mocks
├── database.test.js       # JEFDatabase class unit tests
├── token-utils.test.js    # TokenUtils class unit tests
├── history-grid.test.js   # HistoryGrid UI component tests
└── integration.test.js    # End-to-end integration tests
```

## Prerequisites

### Dependencies
Ensure all testing dependencies are installed:

```bash
npm install
```

Key testing dependencies:
- `jest`: Testing framework
- `@babel/preset-env`: ES6+ transpilation
- `jest-environment-jsdom`: Browser environment simulation
- `jest-junit`: JUnit XML reporting
- `jest-html-reporters`: HTML test reports

### Environment Setup
The test environment automatically mocks:
- Chrome Extension APIs (`chrome.*`)
- IndexedDB and localStorage
- Browser APIs (fetch, crypto, etc.)
- DOM APIs and observers

## Running Tests

### All Tests
```bash
npm test
```

### Specific Test Suites
```bash
# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# Watch mode for development
npm run test:watch

# Coverage report
npm run test:coverage
```

### Individual Test Files
```bash
# Database tests
npx jest tests/database.test.js

# Token utilities tests
npx jest tests/token-utils.test.js

# History grid tests
npx jest tests/history-grid.test.js

# Integration tests
npx jest tests/integration.test.js
```

## Test Categories

### 1. Database Tests (`database.test.js`)

Tests the `JEFDatabase` class functionality:

#### Core Operations
- Database initialization and schema setup
- Storing evaluations with metadata
- Retrieving evaluations with filtering and sorting
- Search functionality across text fields
- Statistics calculation

#### Data Management
- Export to JSON Lines format
- Import from JSON Lines format
- Data validation and sanitization
- Storage quota management

#### Helper Functions
- Token count estimation
- Language detection
- Category extraction from evaluation data

#### Error Handling
- Database connection failures
- Invalid data handling
- Storage quota exceeded scenarios

**Example Test Run:**
```bash
npx jest tests/database.test.js --verbose
```

### 2. Token Utilities Tests (`token-utils.test.js`)

Tests the `TokenUtils` class functionality:

#### Token Counting
- Accurate token counting with tiktoken
- Fallback estimation when tiktoken unavailable
- Support for different model encodings
- Performance optimization

#### Language Detection
- Multi-language support (English, Chinese, Japanese, Russian, etc.)
- Fallback to English for unknown languages
- Handling mixed-language content

#### Encoding Management
- Model-specific encoding hints
- Context window data generation
- Token diffing capabilities

#### Performance
- Token counting speed benchmarks
- Memory usage optimization
- Batch processing efficiency

**Example Test Run:**
```bash
npx jest tests/token-utils.test.js --verbose
```

### 3. History Grid Tests (`history-grid.test.js`)

Tests the `HistoryGrid` UI component:

#### Data Display
- Grid initialization and rendering
- Data loading from database
- Pagination functionality
- Column sorting (multi-column support)

#### User Interactions
- Search across multiple fields
- Filtering by platform, score range, categories
- Export/import operations
- Details modal display

#### Performance
- Large dataset handling (1000+ records)
- UI responsiveness during operations
- Memory management

#### Accessibility
- Keyboard navigation
- Screen reader compatibility
- Focus management

**Example Test Run:**
```bash
npx jest tests/history-grid.test.js --verbose
```

### 4. Integration Tests (`integration.test.js`)

End-to-end testing of complete workflows:

#### Complete Evaluation Workflow
1. AI evaluation input processing
2. Token counting and metadata extraction
3. Database storage
4. History grid display
5. Filtering and searching

#### Export/Import Workflow
1. Data export to JSON Lines
2. Database clearing
3. Data import and validation
4. Data integrity verification

#### Multi-language Support
- Evaluations in different languages
- Language-specific filtering
- Cross-language search functionality

#### Performance Integration
- Large dataset operations
- Memory usage monitoring
- Response time validation

#### Error Handling Integration
- Database error propagation
- UI error state management
- Recovery mechanisms

**Example Test Run:**
```bash
npx jest tests/integration.test.js --verbose
```

## Coverage Requirements

Per PRD specifications, minimum coverage thresholds:

- **Overall**: 80% (branches, functions, lines, statements)
- **Database Layer**: 85% (critical data operations)
- **Utilities**: 80% (token processing, language detection)
- **UI Components**: 75% (user interface interactions)

### Viewing Coverage Reports

```bash
# Generate coverage report
npm run test:coverage

# Open HTML coverage report
open coverage/lcov-report/index.html
```

## Performance Benchmarks

The test suite includes performance benchmarks aligned with PRD requirements:

### Storage Performance
- **Target**: ≤200ms per evaluation storage
- **Test**: Single evaluation with token counting and metadata

### Retrieval Performance
- **Target**: ≤300ms for 10,000 records
- **Test**: Large dataset loading and display

### UI Responsiveness
- **Target**: ≤100ms for filtering/sorting operations
- **Test**: Interactive operations on loaded data

### Running Performance Tests
```bash
# Run integration tests with performance benchmarks
npx jest tests/integration.test.js --testNamePattern="Performance"
```

## Mock Data and Utilities

### Test Data Generation
The test suite includes utilities for generating realistic test data:

```javascript
// Create test evaluation
const testEval = createTestEvaluation({
  platform: 'chatgpt',
  jefScore: 0.75,
  categories: ['meth', 'agent']
});

// Generate large dataset
const largeDataset = Array.from({ length: 1000 }, (_, i) => 
  createTestEvaluation({ prompt: `Test prompt ${i}` })
);
```

### Browser API Mocks
Comprehensive mocking of browser APIs:
- Chrome Extension APIs
- IndexedDB operations
- Local storage
- Fetch requests
- File operations

## Debugging Tests

### Debug Mode
```bash
# Run tests with debug output
DEBUG=true npm test

# Run specific test with debugging
npx jest tests/database.test.js --verbose --no-cache
```

### Common Issues

#### 1. IndexedDB Mock Issues
```javascript
// Ensure proper cleanup
afterEach(async () => {
  await database.clearAll();
  await database.close();
});
```

#### 2. Async Operation Timeouts
```javascript
// Increase timeout for slow operations
test('slow operation', async () => {
  // Test implementation
}, 30000); // 30 second timeout
```

#### 3. DOM Cleanup
```javascript
// Clean up DOM elements
afterEach(() => {
  document.body.innerHTML = '';
});
```

## Continuous Integration

### GitHub Actions Configuration
The test suite is designed to run in CI environments:

```yaml
# .github/workflows/test.yml
name: Test Suite
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '16'
      - run: npm ci
      - run: npm test
      - uses: codecov/codecov-action@v1
```

### Test Reports
Generated test artifacts:
- `test-results/junit.xml`: JUnit format for CI integration
- `test-results/test-report.html`: Human-readable HTML report
- `coverage/`: Coverage reports in multiple formats

## Writing New Tests

### Test Structure Template
```javascript
describe('ComponentName', () => {
  let component;
  
  beforeEach(() => {
    // Setup
    component = new ComponentName();
  });
  
  afterEach(() => {
    // Cleanup
    component = null;
  });
  
  describe('method name', () => {
    test('should handle normal case', () => {
      // Test implementation
    });
    
    test('should handle edge case', () => {
      // Test implementation
    });
    
    test('should handle error case', () => {
      // Test implementation
    });
  });
});
```

### Best Practices

1. **Descriptive Test Names**: Use clear, specific test descriptions
2. **Arrange-Act-Assert**: Structure tests with clear setup, execution, and verification
3. **Mock External Dependencies**: Isolate units under test
4. **Test Edge Cases**: Include boundary conditions and error scenarios
5. **Performance Considerations**: Include timing assertions for critical operations
6. **Cleanup**: Ensure proper cleanup to prevent test interference

### Adding Performance Tests
```javascript
test('should meet performance requirement', async () => {
  const startTime = performance.now();
  
  // Operation under test
  await performOperation();
  
  const endTime = performance.now();
  const duration = endTime - startTime;
  
  expect(duration).toBeLessThan(200); // 200ms requirement
});
```

## Troubleshooting

### Common Test Failures

#### 1. "Cannot read property of undefined"
- Check mock setup in `tests/setup.js`
- Verify component initialization

#### 2. "Timeout exceeded"
- Increase test timeout
- Check for unresolved promises
- Verify async/await usage

#### 3. "Coverage threshold not met"
- Add tests for uncovered code paths
- Remove dead code
- Update coverage thresholds if appropriate

#### 4. "Database operation failed"
- Check IndexedDB mock setup
- Verify database cleanup between tests
- Ensure proper async handling

### Getting Help

1. **Check Test Output**: Read error messages carefully
2. **Run Individual Tests**: Isolate failing tests
3. **Enable Debug Mode**: Use verbose output
4. **Review Mock Setup**: Verify browser API mocks
5. **Check Dependencies**: Ensure all packages are installed

## Maintenance

### Regular Tasks

1. **Update Dependencies**: Keep testing libraries current
2. **Review Coverage**: Maintain coverage thresholds
3. **Performance Monitoring**: Track benchmark trends
4. **Mock Updates**: Update mocks for new browser APIs

### Test Data Management

- Keep test data realistic but minimal
- Use factories for consistent test data generation
- Clean up test artifacts regularly
- Monitor test execution time

---

**Note**: This testing infrastructure supports the Phase 0 "Walking" implementation of the JEF Browser Extension analytics system. As new features are added in subsequent phases, corresponding tests should be added following the patterns established here.