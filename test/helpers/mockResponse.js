'use strict';

function catchArgsAndThrow(...args) {
  throw new Error(`Unexpected call with ${args}`);
}

const defaultResponseFields = {
  set: catchArgsAndThrow,
  send: catchArgsAndThrow,
  redirect: catchArgsAndThrow,
  status: catchArgsAndThrow,
};

/**
 * Mock Response constructor
 *
 * Implement basic HTTP.Response methods with throwing calls by default
 * Default behavoir can be overright by passign method via params:
 *
 *    new MockResponse({
 *      send: expect.createSpy(),
 *    });
 */
class MockResponse {
  constructor(response) {
    Object.assign(this, defaultResponseFields, response);
  }
}

module.exports = MockResponse;
