'use strict';

const expect = require('expect');

const removeUrlParameters = require('../../src/utils/removeUrlParameters');
const cacheBusterParamList = require('../../src/constants/cacheBusterParamList');

describe('removeUrlParameters util', () => {
  it('should return url without query string as is', () => {
    const url = 'https://example.com/path';

    expect(removeUrlParameters(url, ['test'])).toEqual(url);
  });

  it('should correctly remove first parameter', () => {
    const initialUrl = 'https://example.com/path?first=1&second=2';
    const expectedUrl = 'https://example.com/path?second=2';

    expect(removeUrlParameters(initialUrl, ['first'])).toEqual(expectedUrl);
  });

  it('should correctly remove any parameter', () => {
    const initialUrl = 'https://example.com/path?first=1&second=2&third=3';
    const expectedUrl = 'https://example.com/path?first=1&third=3';

    expect(removeUrlParameters(initialUrl, ['second'])).toEqual(expectedUrl);
  });

  it('should correctly remove cache buster params parameter', () => {
    const initialUrl = 'https://example.com/path?rand=1&cb=2&random=3&c=2';
    const expectedUrl = 'https://example.com/path';

    expect(removeUrlParameters(initialUrl, cacheBusterParamList)).toEqual(expectedUrl);
  });
});
