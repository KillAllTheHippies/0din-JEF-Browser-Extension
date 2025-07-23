// Jest Setup File
// Global test configuration and mocks for JEF Browser Extension

// Mock browser APIs
global.chrome = {
  runtime: {
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn()
    },
    getURL: jest.fn((path) => `chrome-extension://test-id/${path}`),
    id: 'test-extension-id'
  },
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn()
    },
    sync: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn()
    }
  },
  tabs: {
    query: jest.fn(),
    sendMessage: jest.fn(),
    create: jest.fn(),
    update: jest.fn()
  },
  action: {
    setBadgeText: jest.fn(),
    setBadgeBackgroundColor: jest.fn(),
    setIcon: jest.fn()
  },
  scripting: {
    executeScript: jest.fn(),
    insertCSS: jest.fn()
  }
};

// Mock browser for Firefox compatibility
global.browser = global.chrome;

// Mock IndexedDB
class MockIDBRequest {
  constructor() {
    this.result = null;
    this.error = null;
    this.readyState = 'pending';
    this.onsuccess = null;
    this.onerror = null;
  }

  _succeed(result) {
    this.result = result;
    this.readyState = 'done';
    if (this.onsuccess) {
      this.onsuccess({ target: this });
    }
  }

  _fail(error) {
    this.error = error;
    this.readyState = 'done';
    if (this.onerror) {
      this.onerror({ target: this });
    }
  }
}

class MockIDBDatabase {
  constructor(name, version) {
    this.name = name;
    this.version = version;
    this.objectStoreNames = [];
    this.stores = {};
  }

  createObjectStore(name, options = {}) {
    this.objectStoreNames.push(name);
    const store = new MockIDBObjectStore(name, options);
    this.stores[name] = store;
    return store;
  }

  transaction(storeNames, mode = 'readonly') {
    return new MockIDBTransaction(this, storeNames, mode);
  }

  close() {
    // Mock close
  }
}

class MockIDBObjectStore {
  constructor(name, options = {}) {
    this.name = name;
    this.keyPath = options.keyPath;
    this.autoIncrement = options.autoIncrement || false;
    this.data = new Map();
    this.nextKey = 1;
  }

  add(value, key) {
    const request = new MockIDBRequest();
    setTimeout(() => {
      try {
        const actualKey = key || (this.autoIncrement ? this.nextKey++ : value[this.keyPath]);
        if (this.data.has(actualKey)) {
          request._fail(new Error('Key already exists'));
        } else {
          this.data.set(actualKey, value);
          request._succeed(actualKey);
        }
      } catch (error) {
        request._fail(error);
      }
    }, 0);
    return request;
  }

  put(value, key) {
    const request = new MockIDBRequest();
    setTimeout(() => {
      try {
        const actualKey = key || (this.autoIncrement ? this.nextKey++ : value[this.keyPath]);
        this.data.set(actualKey, value);
        request._succeed(actualKey);
      } catch (error) {
        request._fail(error);
      }
    }, 0);
    return request;
  }

  get(key) {
    const request = new MockIDBRequest();
    setTimeout(() => {
      request._succeed(this.data.get(key));
    }, 0);
    return request;
  }

  delete(key) {
    const request = new MockIDBRequest();
    setTimeout(() => {
      const deleted = this.data.delete(key);
      request._succeed(deleted);
    }, 0);
    return request;
  }

  clear() {
    const request = new MockIDBRequest();
    setTimeout(() => {
      this.data.clear();
      request._succeed();
    }, 0);
    return request;
  }

  openCursor(range, direction) {
    const request = new MockIDBRequest();
    setTimeout(() => {
      const entries = Array.from(this.data.entries());
      let index = 0;
      
      const cursor = {
        key: entries[index]?.[0],
        value: entries[index]?.[1],
        continue: () => {
          index++;
          if (index < entries.length) {
            cursor.key = entries[index][0];
            cursor.value = entries[index][1];
            if (request.onsuccess) {
              request.onsuccess({ target: { result: cursor } });
            }
          } else {
            if (request.onsuccess) {
              request.onsuccess({ target: { result: null } });
            }
          }
        }
      };
      
      request._succeed(entries.length > 0 ? cursor : null);
    }, 0);
    return request;
  }

  count() {
    const request = new MockIDBRequest();
    setTimeout(() => {
      request._succeed(this.data.size);
    }, 0);
    return request;
  }
}

class MockIDBTransaction {
  constructor(db, storeNames, mode) {
    this.db = db;
    this.mode = mode;
    this.objectStoreNames = Array.isArray(storeNames) ? storeNames : [storeNames];
    this.oncomplete = null;
    this.onerror = null;
    this.onabort = null;
  }

  objectStore(name) {
    return this.db.stores[name];
  }

  abort() {
    if (this.onabort) {
      this.onabort();
    }
  }
}

global.indexedDB = {
  open: (name, version) => {
    const request = new MockIDBRequest();
    setTimeout(() => {
      const db = new MockIDBDatabase(name, version);
      request._succeed(db);
      if (request.onupgradeneeded) {
        request.onupgradeneeded({ target: { result: db } });
      }
    }, 0);
    return request;
  },
  deleteDatabase: (name) => {
    const request = new MockIDBRequest();
    setTimeout(() => {
      request._succeed();
    }, 0);
    return request;
  }
};

// Mock localStorage
class MockStorage {
  constructor() {
    this.store = {};
  }

  getItem(key) {
    return this.store[key] || null;
  }

  setItem(key, value) {
    this.store[key] = String(value);
  }

  removeItem(key) {
    delete this.store[key];
  }

  clear() {
    this.store = {};
  }

  get length() {
    return Object.keys(this.store).length;
  }

  key(index) {
    const keys = Object.keys(this.store);
    return keys[index] || null;
  }
}

global.localStorage = new MockStorage();
global.sessionStorage = new MockStorage();

// Mock navigator
global.navigator = {
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  language: 'en-US',
  languages: ['en-US', 'en'],
  storage: {
    estimate: jest.fn().mockResolvedValue({
      usage: 50 * 1024 * 1024, // 50MB
      quota: 1000 * 1024 * 1024 // 1GB
    })
  },
  permissions: {
    query: jest.fn().mockResolvedValue({ state: 'granted' })
  }
};

// Mock URL and URLSearchParams
global.URL = class MockURL {
  constructor(url, base) {
    this.href = url;
    this.origin = 'https://example.com';
    this.protocol = 'https:';
    this.hostname = 'example.com';
    this.pathname = '/path';
    this.search = '';
    this.hash = '';
  }
};

global.URLSearchParams = class MockURLSearchParams {
  constructor(init) {
    this.params = new Map();
    if (typeof init === 'string') {
      // Parse query string
      init.split('&').forEach(pair => {
        const [key, value] = pair.split('=');
        if (key) {
          this.params.set(decodeURIComponent(key), decodeURIComponent(value || ''));
        }
      });
    }
  }

  get(key) {
    return this.params.get(key);
  }

  set(key, value) {
    this.params.set(key, value);
  }

  has(key) {
    return this.params.has(key);
  }

  delete(key) {
    this.params.delete(key);
  }

  toString() {
    const pairs = [];
    for (const [key, value] of this.params) {
      pairs.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
    }
    return pairs.join('&');
  }
};

// Mock performance API
global.performance = {
  now: jest.fn(() => Date.now()),
  mark: jest.fn(),
  measure: jest.fn(),
  getEntriesByType: jest.fn(() => []),
  getEntriesByName: jest.fn(() => [])
};

// Mock console methods for testing
const originalConsole = global.console;
global.console = {
  ...originalConsole,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  debug: jest.fn()
};

// Mock fetch API
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    blob: () => Promise.resolve(new Blob()),
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0))
  })
);

// Mock File and FileReader APIs
global.File = class MockFile {
  constructor(bits, name, options = {}) {
    this.name = name;
    this.size = bits.reduce((size, bit) => size + bit.length, 0);
    this.type = options.type || '';
    this.lastModified = options.lastModified || Date.now();
  }
};

global.FileReader = class MockFileReader {
  constructor() {
    this.readyState = 0; // EMPTY
    this.result = null;
    this.error = null;
    this.onload = null;
    this.onerror = null;
    this.onloadend = null;
  }

  readAsText(file) {
    setTimeout(() => {
      this.readyState = 2; // DONE
      this.result = 'mock file content';
      if (this.onload) {
        this.onload({ target: this });
      }
      if (this.onloadend) {
        this.onloadend({ target: this });
      }
    }, 0);
  }

  readAsDataURL(file) {
    setTimeout(() => {
      this.readyState = 2; // DONE
      this.result = 'data:text/plain;base64,bW9jayBmaWxlIGNvbnRlbnQ=';
      if (this.onload) {
        this.onload({ target: this });
      }
      if (this.onloadend) {
        this.onloadend({ target: this });
      }
    }, 0);
  }
};

// Mock Blob API
global.Blob = class MockBlob {
  constructor(parts = [], options = {}) {
    this.size = parts.reduce((size, part) => size + part.length, 0);
    this.type = options.type || '';
  }

  text() {
    return Promise.resolve('mock blob content');
  }

  arrayBuffer() {
    return Promise.resolve(new ArrayBuffer(this.size));
  }
};

// Mock MutationObserver
global.MutationObserver = class MockMutationObserver {
  constructor(callback) {
    this.callback = callback;
    this.observations = [];
  }

  observe(target, options) {
    this.observations.push({ target, options });
  }

  disconnect() {
    this.observations = [];
  }

  takeRecords() {
    return [];
  }
};

// Mock ResizeObserver
global.ResizeObserver = class MockResizeObserver {
  constructor(callback) {
    this.callback = callback;
  }

  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock IntersectionObserver
global.IntersectionObserver = class MockIntersectionObserver {
  constructor(callback, options) {
    this.callback = callback;
    this.options = options;
  }

  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock crypto API
global.crypto = {
  getRandomValues: (array) => {
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    return array;
  },
  randomUUID: () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
};

// Mock TextEncoder/TextDecoder
global.TextEncoder = class MockTextEncoder {
  encode(string) {
    return new Uint8Array(Buffer.from(string, 'utf8'));
  }
};

global.TextDecoder = class MockTextDecoder {
  decode(buffer) {
    return Buffer.from(buffer).toString('utf8');
  }
};

// Setup test utilities
global.testUtils = {
  // Helper to wait for async operations
  waitFor: (ms = 0) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // Helper to trigger storage events
  triggerStorageEvent: (key, newValue, oldValue) => {
    const event = new Event('storage');
    event.key = key;
    event.newValue = newValue;
    event.oldValue = oldValue;
    window.dispatchEvent(event);
  },
  
  // Helper to create mock DOM elements
  createMockElement: (tagName = 'div', attributes = {}) => {
    const element = document.createElement(tagName);
    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });
    return element;
  },
  
  // Helper to simulate user interactions
  simulateClick: (element) => {
    const event = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window
    });
    element.dispatchEvent(event);
  },
  
  // Helper to simulate keyboard events
  simulateKeyPress: (element, key, options = {}) => {
    const event = new KeyboardEvent('keydown', {
      key,
      bubbles: true,
      cancelable: true,
      ...options
    });
    element.dispatchEvent(event);
  },
  
  // Helper to create test data
  createTestEvaluation: (overrides = {}) => ({
    id: Math.floor(Math.random() * 10000),
    prompt: 'Test prompt',
    response: 'Test response',
    platform: 'chatgpt',
    model: 'gpt-3.5-turbo',
    jefScore: Math.random(),
    scorePct: Math.floor(Math.random() * 100),
    tokenCount: Math.floor(Math.random() * 1000) + 50,
    language: 'en',
    encodingHint: 'cl100k_base',
    categories: ['meth'],
    createdAt: Date.now(),
    ...overrides
  })
};

// Global test configuration
jest.setTimeout(10000);

// Clean up after each test
afterEach(() => {
  // Clear all mocks
  jest.clearAllMocks();
  
  // Reset localStorage
  localStorage.clear();
  sessionStorage.clear();
  
  // Reset console mocks
  console.log.mockClear();
  console.warn.mockClear();
  console.error.mockClear();
  console.info.mockClear();
  console.debug.mockClear();
  
  // Reset fetch mock
  fetch.mockClear();
  
  // Reset chrome API mocks
  Object.values(chrome.runtime).forEach(method => {
    if (typeof method === 'function' && method.mockClear) {
      method.mockClear();
    }
  });
  
  Object.values(chrome.storage.local).forEach(method => {
    if (typeof method === 'function' && method.mockClear) {
      method.mockClear();
    }
  });
  
  Object.values(chrome.storage.sync).forEach(method => {
    if (typeof method === 'function' && method.mockClear) {
      method.mockClear();
    }
  });
});

// Global error handler for unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Export for use in tests
module.exports = {
  testUtils: global.testUtils
};