module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
    jest: true,
    webextensions: true
  },
  extends: [
    'eslint:recommended'
  ],
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module'
  },
  globals: {
    chrome: 'readonly',
    browser: 'readonly',
    indexedDB: 'readonly',
    localStorage: 'readonly',
    sessionStorage: 'readonly',
    Dexie: 'readonly',
    tiktoken: 'readonly'
  },
  rules: {
    // Error prevention
    'no-console': 'warn',
    'no-debugger': 'error',
    'no-alert': 'error',
    'no-unused-vars': ['error', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_'
    }],
    'no-undef': 'error',
    'no-unreachable': 'error',
    'no-duplicate-imports': 'error',
    
    // Code quality
    'prefer-const': 'error',
    'no-var': 'error',
    'object-shorthand': 'error',
    'prefer-arrow-callback': 'error',
    'prefer-template': 'error',
    'template-curly-spacing': ['error', 'never'],
    
    // Async/await best practices
    'require-await': 'error',
    'no-async-promise-executor': 'error',
    'no-await-in-loop': 'warn',
    
    // Function and class rules
    'func-style': ['error', 'declaration', { allowArrowFunctions: true }],
    'no-empty-function': 'warn',
    'class-methods-use-this': 'off',
    
    // Formatting (basic rules, detailed formatting handled by prettier if used)
    'indent': ['error', 2, { SwitchCase: 1 }],
    'quotes': ['error', 'single', { avoidEscape: true }],
    'semi': ['error', 'always'],
    'comma-dangle': ['error', 'never'],
    'object-curly-spacing': ['error', 'always'],
    'array-bracket-spacing': ['error', 'never'],
    'space-before-function-paren': ['error', {
      anonymous: 'always',
      named: 'never',
      asyncArrow: 'always'
    }],
    
    // Browser extension specific
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-script-url': 'error'
  },
  overrides: [
    {
      // Test files specific rules
      files: ['tests/**/*.js', '**/*.test.js'],
      env: {
        jest: true
      },
      rules: {
        'no-console': 'off', // Allow console in tests for debugging
        'max-lines-per-function': 'off', // Test functions can be longer
        'max-statements': 'off' // Test functions can have more statements
      }
    },
    {
      // Configuration files
      files: ['*.config.js', '.eslintrc.js'],
      env: {
        node: true
      },
      rules: {
        'no-console': 'off'
      }
    },
    {
      // Browser extension content scripts
      files: ['src/**/*.js'],
      env: {
        browser: true,
        webextensions: true
      },
      rules: {
        'no-console': 'warn' // Console usage should be minimal in production
      }
    }
  ],
  settings: {
    // Additional settings for browser extension development
  }
};