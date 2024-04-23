'use strict';

class MockLogger {
  constructor(options = {}) {
    this.silent = options.silent || false;
  }

  info(...args) {
    if (this.silent) {
      return;
    }

    throw new Error(`Unexpected call with ${args}`);
  }

  debug(...args) {
    if (this.silent) {
      return;
    }

    throw new Error(`Unexpected call with ${args}`);
  }

  warn(...args) {
    if (this.silent) {
      return;
    }

    throw new Error(`Unexpected call with ${args}`);
  }

  error(...args) {
    if (this.silent) {
      return;
    }

    throw new Error(`Unexpected call with ${args}`);
  }
}

module.exports = MockLogger;
