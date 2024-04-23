'use strict';

class MockRequest {
  constructor(options = {}) {
    this.originalUrl = options.originalUrl || '/';
    this.headers = Object.assign({}, options.headers);
    this.query = Object.assign({}, options.query);
    this.cookies = Object.assign({}, options.cookies);
    this.body = options.body ? Object.assign({}, options.body) : null;
  }
}

module.exports = MockRequest;
