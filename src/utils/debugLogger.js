// Debug utility - có thể bật/tắt dễ dàng
// Để tắt debug: thay DEBUG_ENABLED = false
// Hoặc dùng environment variable

const DEBUG_ENABLED = process.env.NODE_ENV === 'development' || process.env.REACT_APP_DEBUG === 'true';

class DebugLogger {
  constructor(prefix = '') {
    this.prefix = prefix;
  }

  log(...args) {
    if (DEBUG_ENABLED) {
      console.log(`[${this.prefix}]`, ...args);
    }
  }

  info(...args) {
    if (DEBUG_ENABLED) {
      console.info(`ℹ️ [${this.prefix}]`, ...args);
    }
  }

  warn(...args) {
    if (DEBUG_ENABLED) {
      console.warn(`⚠️ [${this.prefix}]`, ...args);
    }
  }

  error(...args) {
    if (DEBUG_ENABLED) {
      console.error(`❌ [${this.prefix}]`, ...args);
    }
  }

  success(...args) {
    if (DEBUG_ENABLED) {
      console.log(`✅ [${this.prefix}]`, ...args);
    }
  }

  debug(...args) {
    if (DEBUG_ENABLED) {
      console.log(`🔍 [${this.prefix}]`, ...args);
    }
  }

  websocket(...args) {
    if (DEBUG_ENABLED) {
      console.log(`🔌 [${this.prefix}]`, ...args);
    }
  }

  message(...args) {
    if (DEBUG_ENABLED) {
      console.log(`📨 [${this.prefix}]`, ...args);
    }
  }

  group(label, fn) {
    if (DEBUG_ENABLED) {
      console.group(label);
      fn();
      console.groupEnd();
    } else {
      fn();
    }
  }
}

// Export pre-configured loggers
export const debugLogger = new DebugLogger('DEBUG');
export const wsLogger = new DebugLogger('WebSocket');
export const chatLogger = new DebugLogger('Chat');
export const apiLogger = new DebugLogger('API');

// Export class for custom loggers
export default DebugLogger;