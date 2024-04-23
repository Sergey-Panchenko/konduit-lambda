'use strict';

const fs = require('fs');
const path = require('path');
const expect = require('expect');
const libxmljs = require('libxmljs');

const {
  mergeCompanionAds,
} = require('../../../src/utils/merge/mergeCompanionAds');

const fixturesPath = path.join(__dirname, '../../fixtures/merge/companion-ads/');
const inlineEmptyRaw = fs.readFileSync(path.join(fixturesPath, 'inlineEmpty.xml'), 'utf8');
const wrapperEmptyRaw = fs.readFileSync(path.join(fixturesPath, 'wrapperEmpty.xml'), 'utf8');

const wrapperCompanionAdsRaw = fs.readFileSync(path.join(fixturesPath, 'wrapperCompanionAds.xml'), 'utf8');
const inlineBlankRaw = fs.readFileSync(path.join(fixturesPath, 'inlineBlank.xml'), 'utf8');

const inlineCompanionAdsRaw = fs.readFileSync(path.join(fixturesPath, 'inlineCompanionAds.xml'), 'utf8');

const XPATH_CREATIVE_COMPANION_ADS = '//Creative/CompanionAds';
const XPATH_COMPANION = '//Companion';

describe('mergeCompanionAds util', () => {
  it('should return inlineVast if wrapperVast has no CompanionAds elements and keep inlineVast as is',
    () => Promise.all([
      libxmljs.parseXmlAsync(inlineCompanionAdsRaw),
      libxmljs.parseXmlAsync(wrapperEmptyRaw),
    ]).then(([inlineVast, wrapperVast]) => {
      const expectedCompanionSize = inlineVast.find(XPATH_COMPANION).length;
      const expectedCompanionAdsSize = inlineVast.find(XPATH_CREATIVE_COMPANION_ADS).length;
      expect(mergeCompanionAds(inlineVast, wrapperVast)).toBe(inlineVast);

      expect(inlineVast.find(XPATH_COMPANION).length).toBe(expectedCompanionSize);
      expect(inlineVast.find(XPATH_CREATIVE_COMPANION_ADS).length).toBe(expectedCompanionAdsSize);
    }));

  it('should return inlineVast if inlineVast has no Creatives element',
    () => Promise.all([
      libxmljs.parseXmlAsync(inlineBlankRaw),
      libxmljs.parseXmlAsync(wrapperCompanionAdsRaw),
    ]).then(([inlineVast, wrapperVast]) => {
      expect(mergeCompanionAds(inlineVast, wrapperVast)).toBe(inlineVast);
    }));

  it('should merge Creative>CompanionAds from wrapper to inline (no inline CompanionAds case)',
    () => Promise.all([
      libxmljs.parseXmlAsync(inlineEmptyRaw),
      libxmljs.parseXmlAsync(wrapperCompanionAdsRaw),
    ]).then(([inlineVast, wrapperVast]) => {
      expect(inlineVast.get(XPATH_CREATIVE_COMPANION_ADS)).toBe(null);
      expect(mergeCompanionAds(inlineVast, wrapperVast)).toBe(inlineVast);

      const inlineCompanionAdsSize = inlineVast.find(XPATH_CREATIVE_COMPANION_ADS).length;
      const wrapperCompanionAdsSize = wrapperVast.find(XPATH_CREATIVE_COMPANION_ADS).length;

      expect(inlineCompanionAdsSize).toBe(wrapperCompanionAdsSize);
    }));

  it('should merge Creative>CompanionAds from wrapper to inline (both CompanionAds case)',
    () => Promise.all([
      libxmljs.parseXmlAsync(inlineCompanionAdsRaw),
      libxmljs.parseXmlAsync(wrapperCompanionAdsRaw),
    ]).then(([inlineVast, wrapperVast]) => {
      const inlineInitialCompanionSize = inlineVast.find(XPATH_COMPANION).length;
      const inlineInitialCompanionAdsSize = inlineVast.find(XPATH_CREATIVE_COMPANION_ADS).length;
      expect(mergeCompanionAds(inlineVast, wrapperVast)).toBe(inlineVast);

      const inlineCompanionAdsSize = inlineVast.find(XPATH_CREATIVE_COMPANION_ADS).length;
      const wrapperCompanionAdsSize = wrapperVast.find(XPATH_CREATIVE_COMPANION_ADS).length;

      expect(inlineCompanionAdsSize).toBe(wrapperCompanionAdsSize + inlineInitialCompanionAdsSize);

      const inlineCompanionSize = inlineVast.find(XPATH_COMPANION).length;
      const wrapperCompanionSize = wrapperVast.find(XPATH_COMPANION).length;

      expect(inlineCompanionSize).toBe(wrapperCompanionSize + inlineInitialCompanionSize);
    }));
});
