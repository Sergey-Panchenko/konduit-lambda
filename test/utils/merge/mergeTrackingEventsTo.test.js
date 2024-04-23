'use strict';

const fs = require('fs');
const path = require('path');
const expect = require('expect');
const libxmljs = require('libxmljs');

const {
  mergeTrackingEventsTo,
} = require('../../../src/utils/merge/mergeTrackingEventsTo');

const creativeLinearXPath = '//Creative//Linear';

const fixturesPath = path.join(__dirname, '../../fixtures/merge/tracking-events/');

const inlineEmptyXmlDocRaw = fs.readFileSync(path.join(fixturesPath, 'inlineEmpty.xml'), 'utf8');
const inlineFullXmlDocRaw = fs.readFileSync(path.join(fixturesPath, 'inlineFull.xml'), 'utf8');
const wrapperEmptyXmlDocRaw = fs.readFileSync(path.join(fixturesPath, 'wrapperEmpty.xml'), 'utf8');
const wrapperFullXmlDocRaw = fs.readFileSync(path.join(fixturesPath, 'wrapperFull.xml'), 'utf8');
const wrapperNonLinearXmlDocRaw = fs.readFileSync(path.join(fixturesPath, 'wrapperNonLinear.xml'), 'utf8');

describe('mergeTrackingEventsTo util', () => {
  it('should return original vast with inline if there are no linear creative in wrapper',
    () => Promise.all([
      libxmljs.parseXmlAsync(inlineFullXmlDocRaw),
      libxmljs.parseXmlAsync(wrapperNonLinearXmlDocRaw),
    ]).then(([inlineVast, wrapperVast]) => {
      const expectedResult = inlineVast.toString();
      const newInlineVast = mergeTrackingEventsTo(inlineVast, wrapperVast);

      expect(newInlineVast.toString()).toEqual(expectedResult);
    })
  );

  it('should collect all TrackingEvents',
    () => Promise.all([
      libxmljs.parseXmlAsync(inlineFullXmlDocRaw),
      libxmljs.parseXmlAsync(wrapperFullXmlDocRaw),
    ]).then(([inlineVast, wrapperVast]) => {
      const inlineTrackingEvents = inlineVast.get(creativeLinearXPath).find('//TrackingEvents/Tracking');
      const wrapperTrackingEvents = wrapperVast.get(creativeLinearXPath).find('//TrackingEvents/Tracking');
      const newInlineVast = mergeTrackingEventsTo(inlineVast, wrapperVast);
      const newInlineTrackingEvents = newInlineVast.get(creativeLinearXPath).find('//TrackingEvents/Tracking');
      const expectedNewInlineTrackingEvents = [...inlineTrackingEvents, ...wrapperTrackingEvents];

      expect(newInlineTrackingEvents.toString()).toEqual(expectedNewInlineTrackingEvents.toString());
      expect(newInlineTrackingEvents.length).toEqual(4);
    })
  );

  it('should leave inline tracking events as is if there are no wrapper tracking events',
    () => Promise.all([
      libxmljs.parseXmlAsync(inlineFullXmlDocRaw),
      libxmljs.parseXmlAsync(wrapperEmptyXmlDocRaw),
    ]).then(([inlineVast, wrapperVast]) => {
      const inlineTrackingEvents = inlineVast.get(creativeLinearXPath).find('//TrackingEvents/Tracking');
      const newInlineVast = mergeTrackingEventsTo(inlineVast, wrapperVast);
      const newInlineTrackingEvents = newInlineVast.get(creativeLinearXPath).find('//TrackingEvents/Tracking');

      expect(newInlineTrackingEvents.toString()).toEqual(inlineTrackingEvents.toString());
    })
  );

  it('should insert wrapper tracking events as is if there are no inline tracking events',
    () => Promise.all([
      libxmljs.parseXmlAsync(inlineEmptyXmlDocRaw),
      libxmljs.parseXmlAsync(wrapperFullXmlDocRaw),
    ]).then(([inlineVast, wrapperVast]) => {
      const wrapperTrackingEvents = wrapperVast.get(creativeLinearXPath).find('//TrackingEvents/Tracking');
      const newInlineVast = mergeTrackingEventsTo(inlineVast, wrapperVast);
      const newInlineTrackingEvents = newInlineVast.get(creativeLinearXPath).find('//TrackingEvents/Tracking');

      expect(newInlineTrackingEvents.toString()).toEqual(wrapperTrackingEvents.toString());
    })
  );
});
