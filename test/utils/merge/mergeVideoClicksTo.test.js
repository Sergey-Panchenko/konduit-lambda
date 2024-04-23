'use strict';

const fs = require('fs');
const path = require('path');
const expect = require('expect');
const libxmljs = require('libxmljs');

const {
  mergeVideoClicksTo,
} = require('../../../src/utils/merge/mergeVideoClicksTo');

const creativeLinearXPath = '//Creative//Linear';

const fixturesPath = path.join(__dirname, '../../fixtures/merge/video-clicks/');

const inlineEmptyXmlDocRaw = fs.readFileSync(path.join(fixturesPath, 'inlineEmpty.xml'), 'utf8');
const inlineFullXmlDocRaw = fs.readFileSync(path.join(fixturesPath, 'inlineFull.xml'), 'utf8');
const wrapperEmptyXmlDocRaw = fs.readFileSync(path.join(fixturesPath, 'wrapperEmpty.xml'), 'utf8');
const wrapperFullXmlDocRaw = fs.readFileSync(path.join(fixturesPath, 'wrapperFull.xml'), 'utf8');
const wrapperNonLinearXmlDocRaw = fs.readFileSync(path.join(fixturesPath, 'wrapperNonLinear.xml'), 'utf8');

describe('mergeVideoClicksTo util', () => {
  it('should return original vast with inline if there are no linear creative in wrapper',
    () => Promise.all([
      libxmljs.parseXmlAsync(inlineFullXmlDocRaw),
      libxmljs.parseXmlAsync(wrapperNonLinearXmlDocRaw),
    ]).then(([inlineVast, wrapperVast]) => {
      const expectedResult = inlineVast.toString();
      const newInlineVast = mergeVideoClicksTo(inlineVast, wrapperVast);

      expect(newInlineVast.toString()).toEqual(expectedResult);
    })
  );

  it('should leave initial ClickThrough value as is',
    () => Promise.all([
      libxmljs.parseXmlAsync(inlineFullXmlDocRaw),
      libxmljs.parseXmlAsync(wrapperFullXmlDocRaw),
    ]).then(([inlineVast, wrapperVast]) => {
      const inlineClickThrough = inlineVast.get(creativeLinearXPath).find('//VideoClicks/ClickThrough');
      const newInlineVast = mergeVideoClicksTo(inlineVast, wrapperVast);
      const newInlineClickThrough = newInlineVast.get(creativeLinearXPath).find('//VideoClicks/ClickThrough');

      expect(inlineClickThrough.toString()).toEqual(newInlineClickThrough.toString());
    })
  );

  it('should collect all ClickTracking and CustomClick values',
    () => Promise.all([
      libxmljs.parseXmlAsync(inlineFullXmlDocRaw),
      libxmljs.parseXmlAsync(wrapperFullXmlDocRaw),
    ]).then(([inlineVast, wrapperVast]) => {
      const inlineClickTracking = inlineVast.get(creativeLinearXPath).find('//VideoClicks/ClickTracking');
      const wrapperClickTracking = wrapperVast.get(creativeLinearXPath).find('//VideoClicks/ClickTracking');
      const inlineCustomClick = inlineVast.get(creativeLinearXPath).find('//VideoClicks/CustomClick');
      const wrapperCustomClick = wrapperVast.get(creativeLinearXPath).find('//VideoClicks/CustomClick');
      const newInlineVast = mergeVideoClicksTo(inlineVast, wrapperVast);
      const newInlineClickTracking = newInlineVast.get(creativeLinearXPath).find('//VideoClicks/ClickTracking');
      const newInlineCustomClick = newInlineVast.get(creativeLinearXPath).find('//VideoClicks/CustomClick');
      const expectedNewInlineClickTracking = [...inlineClickTracking, ...wrapperClickTracking];
      const expectedNewInlineCustomClick = [...inlineCustomClick, ...wrapperCustomClick];

      expect(newInlineClickTracking.toString()).toEqual(expectedNewInlineClickTracking.toString());
      expect(newInlineClickTracking.length).toEqual(3);
      expect(newInlineCustomClick.toString()).toEqual(expectedNewInlineCustomClick.toString());
      expect(newInlineCustomClick.length).toEqual(4);
    })
  );

  it('should use wrapper VideoClicks if there is no inline one',
    () => Promise.all([
      libxmljs.parseXmlAsync(inlineEmptyXmlDocRaw),
      libxmljs.parseXmlAsync(wrapperFullXmlDocRaw),
    ]).then(([inlineVast, wrapperVast]) => {
      const wrapperVideoClicks = wrapperVast.get(creativeLinearXPath).get('//VideoClicks');
      const newInlineVast = mergeVideoClicksTo(inlineVast, wrapperVast);
      const newInlineVideoClicks = newInlineVast.get(creativeLinearXPath).get('//VideoClicks');

      expect(newInlineVideoClicks.toString()).toEqual(wrapperVideoClicks.toString());
    })
  );

  it('should not add empty VideoClicks entries',
    () => Promise.all([
      libxmljs.parseXmlAsync(inlineEmptyXmlDocRaw),
      libxmljs.parseXmlAsync(wrapperEmptyXmlDocRaw),
    ]).then(([inlineVast, wrapperVast]) => {
      const newInlineVast = mergeVideoClicksTo(inlineVast, wrapperVast);
      const newInlineVideoClicks = newInlineVast.get('//VideoClicks');

      expect(newInlineVideoClicks).toEqual(undefined);
    })
  );
});
