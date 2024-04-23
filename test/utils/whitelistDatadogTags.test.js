'use strict';

const expect = require('expect');

const {
  whitelistBrowserDatadogTag,
  whitelistOsDatadogTag,
  whitelistVastVendorDatadogTag,
  whitelistVpaidVendorDatadogTag,
} = require('../../src/utils/whitelistDatadogTags');

describe('whitelistDataDogTags util', () => {
  it('should return same value for whitelisted os', () => {
    const os = 'mac_os';
    expect(whitelistOsDatadogTag(os)).toEqual(os);
  });

  it('should return same value for whitelisted browser', () => {
    const browser = 'chrome';
    expect(whitelistBrowserDatadogTag(browser)).toEqual(browser);
  });

  it('should return \'other\' for non whitelisted os', () => {
    const os = 'playstation';
    expect(whitelistOsDatadogTag(os)).toEqual('other');
  });

  it('should return \'other\' for non whitelisted browser', () => {
    const browser = 'opera';
    expect(whitelistOsDatadogTag(browser)).toEqual('other');
  });

  it('should convert provided os tag to DataDog format', () => {
    const originalTag = 'Mac OS';
    expect(whitelistOsDatadogTag(originalTag)).toEqual('mac_os');
  });

  it('should convert provided browser tag to DataDog format', () => {
    const originalTag = 'Samsung Browser';
    expect(whitelistBrowserDatadogTag(originalTag)).toEqual('samsung_browser');
  });

  it('should convert vast vendor domain to the whitelisted one', () => {
    const originalTag = 's8t.teads.tv';
    expect(whitelistVastVendorDatadogTag(originalTag)).toEqual('teads.tv');
  });

  it('should bypass vast vendor alias if it is a whitelisted one', () => {
    const originalTag = 'ias';
    expect(whitelistVastVendorDatadogTag(originalTag)).toEqual('ias');
  });

  it('should pass any doubleclick domain as double-click for vast vendor tag', () => {
    const DOUBLE_CLICK = 'double-click';
    const firstOriginalTag = 'server1.doubleclick.net';
    const secondOriginalTag = 'server2.server1.doubleclick.net';
    const thirdOriginalTag = 'server3.server2.server1.doubleclick.net';

    expect(whitelistVastVendorDatadogTag(firstOriginalTag)).toEqual(DOUBLE_CLICK);
    expect(whitelistVastVendorDatadogTag(secondOriginalTag)).toEqual(DOUBLE_CLICK);
    expect(whitelistVastVendorDatadogTag(thirdOriginalTag)).toEqual(DOUBLE_CLICK);
  });

  it('should return \'other\' for non whitelisted vast vendor alias', () => {
    const originalTag = 'fake';
    expect(whitelistVastVendorDatadogTag(originalTag)).toEqual('other');
  });

  it('should return \'other\' for non whitelisted vast vendor top level domain', () => {
    const originalTag = 'fake.domain.com';
    expect(whitelistVastVendorDatadogTag(originalTag)).toEqual('other');
  });

  it('should convert vpaid vendor domain to the whitelisted one', () => {
    const originalTag = 'ads.s8t.teads.tv';
    expect(whitelistVpaidVendorDatadogTag(originalTag)).toEqual('teads.tv');
  });

  it('should bypass vpaid vendor alias if it is a whitelisted one', () => {
    const originalTag = 'google_ima';
    expect(whitelistVpaidVendorDatadogTag(originalTag)).toEqual('google_ima');
  });

  it('should return \'other\' for non whitelisted vendor alias', () => {
    const originalTag = 'fake';
    expect(whitelistVpaidVendorDatadogTag(originalTag)).toEqual('other');
  });

  it('should return \'other\' for non whitelisted vendor top level domain', () => {
    const originalTag = 'fake.domain.com';
    expect(whitelistVpaidVendorDatadogTag(originalTag)).toEqual('other');
  });

  it('should make non defined tags as \'other\'', () => {
    const tag = '';
    expect(whitelistBrowserDatadogTag(tag)).toEqual('other');
    expect(whitelistOsDatadogTag(tag)).toEqual('other');
    expect(whitelistVastVendorDatadogTag(tag)).toEqual('other');
    expect(whitelistVpaidVendorDatadogTag(tag)).toEqual('other');

    expect(whitelistBrowserDatadogTag(null)).toEqual('other');
    expect(whitelistOsDatadogTag(null)).toEqual('other');
    expect(whitelistVastVendorDatadogTag(null)).toEqual('other');
    expect(whitelistVpaidVendorDatadogTag(null)).toEqual('other');

    expect(whitelistBrowserDatadogTag(undefined)).toEqual('other');
    expect(whitelistOsDatadogTag(undefined)).toEqual('other');
    expect(whitelistVastVendorDatadogTag(undefined)).toEqual('other');
    expect(whitelistVpaidVendorDatadogTag(undefined)).toEqual('other');
  });
});
