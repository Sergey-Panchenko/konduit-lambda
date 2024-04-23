'use strict';

const expect = require('expect');

const { buildRequestHeaders, buildResponseHeaders } = require('../../src/utils/buildHeaders');

describe('buildHeaders util', () => {
  it('should build new headers from passed one', () => {
    const expectedHeaders = {
      'accept-encoding': 'gzip',
      connection: 'keep-alive',
    };

    expect(buildRequestHeaders({ connection: 'keep-alive' })).toEqual(expectedHeaders);
  });

  it('buildRequestHeaders should omit "host" header', () => {
    const expectedHeaders = {
      'accept-encoding': 'gzip',
      connection: 'keep-alive',
    };

    expect(buildRequestHeaders({
      connection: 'keep-alive',
      host: 'localhost',
    })).toEqual(expectedHeaders);
  });


  it('buildResponseHeaders should omit "custom-header" header', () => {
    const expectedHeaders = {
      allow: 'value;',
    };

    expect(buildResponseHeaders({
      allow: 'value;',
      'custom-header': 'some_key=some_value;',
    })).toEqual(expectedHeaders);
  });
});
