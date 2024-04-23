'use strict';

const fs = require('fs');
const path = require('path');
const expect = require('expect');
const libxmljs = require('libxmljs');

const {
  mergeNonLinearAds,
} = require('../../../src/utils/merge/mergeNonLinearAds');

const fixturesPath = path.join(__dirname, '../../fixtures/merge/non-linear-ads/');
const inlineEmptyRaw = fs.readFileSync(path.join(fixturesPath, 'inlineEmpty.xml'), 'utf8');
const wrapperEmptyRaw = fs.readFileSync(path.join(fixturesPath, 'wrapperEmpty.xml'), 'utf8');

const inlineNonLinearAdsRaw = fs.readFileSync(path.join(fixturesPath, 'inlineNonLinearAds.xml'), 'utf8');
const wrapperNonLinearAdsRaw = fs.readFileSync(path.join(fixturesPath, 'wrapperNonLinearAds.xml'), 'utf8');

describe('mergeNonLinearAds util', () => {
  it('should return inlineVast if inlineVast have no Creative>NonLinearAds elements',
    () => Promise.all([
      libxmljs.parseXmlAsync(inlineEmptyRaw),
      libxmljs.parseXmlAsync(wrapperNonLinearAdsRaw),
    ]).then(([inlineEmptyDoc, wrapperNonLinearAdsDoc]) => {
      expect(mergeNonLinearAds(inlineEmptyDoc, wrapperNonLinearAdsDoc)).toEqual(inlineEmptyDoc);
    }));

  it('should return inlineVast if wrapperVast have no Creative>NonLinearAds elements',
    () => Promise.all([
      libxmljs.parseXmlAsync(inlineNonLinearAdsRaw),
      libxmljs.parseXmlAsync(wrapperEmptyRaw),
    ]).then(([inlineNonLinearAdsDoc, wrapperEmptyDoc]) => {
      expect(mergeNonLinearAds(inlineNonLinearAdsDoc, wrapperEmptyDoc)).toEqual(inlineNonLinearAdsDoc);
    }));

  it('should merge NonLinearAds>TrackingEvents from wrapper to inline',
    () => Promise.all([
      libxmljs.parseXmlAsync(inlineNonLinearAdsRaw),
      libxmljs.parseXmlAsync(wrapperNonLinearAdsRaw),
    ]).then(([inlineNonLinearAdsDoc, wrapperNonLinearAdsDoc]) => {
      expect(inlineNonLinearAdsDoc.get('//Creative/NonLinearAds/TrackingEvents')).toEqual(undefined);
      expect(mergeNonLinearAds(inlineNonLinearAdsDoc, wrapperNonLinearAdsDoc)).toEqual(inlineNonLinearAdsDoc);

      const inlineTrackingEvents = inlineNonLinearAdsDoc.get('//Creative/NonLinearAds/TrackingEvents');
      const wrapperTracking = wrapperNonLinearAdsDoc.find('//Creative/NonLinearAds/TrackingEvents/Tracking');

      expect(inlineTrackingEvents).toExist();

      expect(inlineTrackingEvents.find('.//Tracking').length).toEqual(wrapperTracking.length);
    }));

  it('should merge NonLinearAds>NonLinear>NonLinearclickTracking from wrapper to inline',
    () => Promise.all([
      libxmljs.parseXmlAsync(inlineNonLinearAdsRaw),
      libxmljs.parseXmlAsync(wrapperNonLinearAdsRaw),
    ]).then(([inlineNonLinearAdsDoc, wrapperNonLinearAdsDoc]) => {
      expect(inlineNonLinearAdsDoc.get('//Creative/NonLinearAds/NonLinear/NonLinearClickTracking')).toEqual(undefined);
      expect(mergeNonLinearAds(inlineNonLinearAdsDoc, wrapperNonLinearAdsDoc)).toEqual(inlineNonLinearAdsDoc);

      const nonLinearClickTrackingXPath = '//Creative/NonLinearAds/NonLinear/NonLinearClickTracking';
      const inlineNonLinearClickTracking = inlineNonLinearAdsDoc.get(nonLinearClickTrackingXPath);
      const wrapperNonLinearClickTracking = wrapperNonLinearAdsDoc.get(nonLinearClickTrackingXPath);

      expect(inlineNonLinearClickTracking).toExist();

      expect(inlineNonLinearClickTracking.toString()).toEqual(wrapperNonLinearClickTracking.toString());
    }));
});
