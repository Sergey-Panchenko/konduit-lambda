'use strict';

const expect = require('expect');
const isBlockedBy = require('../../src/utils/isBlockedBy');
const { blocklist } = require('../../src/constants/blocklist');

describe('isBlockedBy util', () => {
  describe('vendors constants validation', () => {
    it('constants/blocklist/vendors', () => {
      Object.keys(blocklist.vendors).forEach((vendorId) => {
        expect(vendorId).toBeA('string');
        const blocker = blocklist.vendors[vendorId];
        if (blocker instanceof Set) {
          blocker.forEach((countryCode) => {
            expect(countryCode).toBeA('string');
            expect(countryCode.length).toEqual(2);
          });
        } else {
          expect(blocker).toBeA('boolean');
        }
      });
    });
    it('constants/blocklist/origins', () => {
      blocklist.origins.forEach((originRegExp) => {
        expect(originRegExp instanceof RegExp).toBe(true);
      });
    });
  });

  describe('isBlockedByVendor', () => {
    const isBlockedByVendor = isBlockedBy.INTERNAL.isBlockedByVendor;

    it('should not fire if no vastUrl specified', () => {
      const result = isBlockedByVendor(new Map(), null, null);
      expect(result).toEqual(false);
    });

    it('should not fire if url vendor is not in blocklist', () => {
      const result = isBlockedByVendor(new Map(), 'http://example.com', null);
      expect(result).toEqual(false);
    });

    it('should fire if vendor is in blocklist and blocker is true', () => {
      const result = isBlockedByVendor(new Map([['example.com', true]]), 'http://example.com', null);
      expect(result).toEqual(true);
    });

    it('should not fire if vendor is in blocklist anb blocker is false', () => {
      const result = isBlockedByVendor(new Map([['example.com', false]]), 'http://example.com', null);
      expect(result).toEqual(false);
    });

    it('should fire if blocker is a set and contains viewerCountry', () => {
      const vendorsToBlock = new Map([
        ['example.com', new Set(['uk', 'us'])],
      ]);
      const url = 'http://example.com';
      expect(isBlockedByVendor(vendorsToBlock, url, 'uk')).toEqual(true);
      expect(isBlockedByVendor(vendorsToBlock, url, 'us')).toEqual(true);
      expect(isBlockedByVendor(vendorsToBlock, url, 'en')).toEqual(false);
      expect(isBlockedByVendor(vendorsToBlock, url, null)).toEqual(false);
    });
  });
  describe('isBlockedByOrigin', () => {
    const isBlockedByOrigin = isBlockedBy.INTERNAL.isBlockedByOrigin;

    it('should return false for empty parameters', () => {
      const result = isBlockedByOrigin([], null);
      expect(result).toEqual(false);
    });

    it('should return false if no origin specified', () => {
      const result = isBlockedByOrigin([/test\.com/i, /test2\.com/i], null);
      expect(result).toEqual(false);
    });

    it('should return false if no rules provided', () => {
      const result = isBlockedByOrigin([], 'http://test.com');
      expect(result).toEqual(false);
    });

    it('should not fire if origin is not passed to at least one regexp', () => {
      const result = isBlockedByOrigin([/test\.com/i, /test2\.com/i], 'https://test3.com');
      expect(result).toEqual(false);
    });

    it('should fire if origin is passed to at least one regexp', () => {
      const result = isBlockedByOrigin([/test\.com/i, /test2\.com/i], 'http://test.com');
      expect(result).toEqual(true);
    });

    it('should fire for subdomains as well', () => {
      const result = isBlockedByOrigin([/test\.com/i, /test2\.com/i], 'http://subdomain.test.com');
      expect(result).toEqual(true);
    });

    it('should return true for swagbucks.com case', () => {
      const result = isBlockedByOrigin([/swagbucks\.com/i], 'http://www.swagbucks.com');
      expect(result).toEqual(true);
    });
  });
  describe('isBlockedByClient', () => {
    const isBlockedByClient = isBlockedBy.INTERNAL.isBlockedByClient;

    it('should not fire if no client id specified', () => {
      const result = isBlockedByClient(new Set(), null);
      expect(result).toEqual(false);
    });

    it('should not fire if client id is not in blocklist', () => {
      const result = isBlockedByClient(new Set(['5c49edb898b5e743f6baa111']), '5978c36a9140d272a115bdb6');
      expect(result).toEqual(false);
    });

    it('should fire if client id is in blocklist with single item', () => {
      const result = isBlockedByClient(new Set(['5c49edb898b5e743f6baa111']), '5c49edb898b5e743f6baa111');
      expect(result).toEqual(true);
    });

    it('should fire if client id is in blocklist with multiple item', () => {
      const blockedClientsSet = new Set(['5978c36a9140d272a115bdb6', '5c49edb898b5e743f6baa111']);
      const result = isBlockedByClient(blockedClientsSet, '5c49edb898b5e743f6baa111');
      expect(result).toEqual(true);
    });
  });
});
