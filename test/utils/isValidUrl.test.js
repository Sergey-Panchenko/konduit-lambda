'use strict';

const expect = require('expect');

const isValidUrl = require('../../src/utils/isValidUrl');

describe('isValidUrl util', () => {
  it('should validate simple URL', () => {
    const url = 'http://konduit.me/';
    expect(isValidUrl(url)).toBe(true);
  });

  it('should validate simple URL with params', () => {
    const url = 'http://konduit.me/method?param=1';
    expect(isValidUrl(url)).toBe(true);
  });

  it('should validate URL with https scheme', () => {
    const url = 'https://konduit.me/';
    expect(isValidUrl(url)).toBe(true);
  });

  it('should not validate URL with non-http scheme', () => {
    const url = 'mailto://konduit.me/method?param=1';
    expect(isValidUrl(url)).toBe(false);
  });

  it('should not validate URL with a custom scheme', () => {
    const url = 'invalid://konduit.me/method?param=1';
    expect(isValidUrl(url)).toBe(false);
  });

  it('should not validate a string', () => {
    const url = 'konduit.me';
    expect(isValidUrl(url)).toBe(false);
  });

  it('should validate complex URL', () => {
    const url = 'https://servedby.flashtalking.com/imp/1/31714;812030;208;xml;DailyMail;640x360VASTHTML5/?cachebuster=%%CACHEBUSTER%%';
    expect(isValidUrl(url)).toBe(true);
  });

  it('should not validate encoded URL', () => {
    // eslint-disable-next-line max-len
    const url = 'http%3A%2F%2Fcdn-tags.brainient.com%2F1228%2F34f8e4e6-e83c-46da-8bf6-a37ae9ed5134%2Fvast.xml%3Fplatform%3Dvpaid%26v%3Dv6%26proto%3Dhttp';
    expect(isValidUrl(url)).toBe(false);
  });

  it('should validate URL with spaces', () => {
    const url = 'https://servedby.flashtalking.com/imp/1/31714 812030 208;xml;DailyMail;640x360VASTHTML5/?cachebuster=%%CACHEBUSTER%%';
    expect(isValidUrl(url)).toBe(true);
  });
});
