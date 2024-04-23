'use strict';

const expect = require('expect');

const PixelUrl = require('../../src/tracking/PixelUrl');

describe('PixelUrl class', () => {
  describe('#constructor', () => {
    it('should concatenate passed `host` and `path`', () => {
      const host = '//example.com';
      const path = '/api';
      const pixelUrl = new PixelUrl({ host, path });

      expect(pixelUrl.toString()).toMatch(new RegExp(`${host}${path}?`, 'i'));
    });

    it('should serialize parameters hash as a query string', () => {
      const host = '//example.com';
      const path = '/api';
      const pixelUrl = new PixelUrl({
        host,
        path,
        parameters: {
          hello: 'world',
          foo: 'bar',
          baz: 123,
        },
      });
      const urlString = pixelUrl.toString();

      expect(urlString).toMatch(/hello=world/i);
      expect(urlString).toMatch(/foo=bar/i);
      expect(urlString).toMatch(/baz=123/i);
      expect(urlString).toMatch(/\?.*?&.*?&/i);
    });

    it('should create a valid root-path url with no host if host and path are not passed', () => {
      const pixelUrl = new PixelUrl({ parameters: { hello: 'world' } });

      expect(pixelUrl.toString()).toMatch(new RegExp('/?hello=world', 'i'));
    });

    it('should serialize query parameters without a value', () => {
      const host = '//example.com';
      const path = '/api';
      const pixelUrl = new PixelUrl({
        host,
        path,
        parameters: {
          hello: 'world',
          foo: 'bar',
          flag: null,
          baz: 123,
        },
      });
      const urlString = pixelUrl.toString();

      expect(urlString).toMatch(/(&|\?)flag(&|$)/i);
      expect(urlString).toMatch(/\?.*?&.*?&.*?&/i);
    });

    it('should append `optionalParametersStr` as a trailing string', () => {
      const host = '//example.com';
      const path = '/api';
      const pixelUrl = new PixelUrl({
        host,
        path,
        optionalParametersStr: 'trailing&string=yo',
        parameters: {
          hello: 'world',
          foo: 'bar',
          baz: 123,
        },
      });

      const urlString = pixelUrl.toString();
      expect(urlString).toMatch(/trailing&string=yo$/i);
    });
  });
});
