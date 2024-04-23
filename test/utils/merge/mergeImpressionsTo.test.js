'use strict';

const fs = require('fs');
const path = require('path');
const expect = require('expect');
const libxmljs = require('libxmljs');

const {
  inlineImpressionsXPath,
  wrapperImpressionsXPath,
  mergeImpressionsTo,
} = require('../../../src/utils/merge/mergeImpressionsTo');

const fixturesPath = path.join(__dirname, '../../fixtures/merge/impressions/');

const inlineEmptyXmlDocRaw = fs.readFileSync(path.join(fixturesPath, 'inlineEmpty.xml'), 'utf8');
const inlineFullXmlDocRaw = fs.readFileSync(path.join(fixturesPath, 'inlineFull.xml'), 'utf8');
const wrapperEmptyXmlDocRaw = fs.readFileSync(path.join(fixturesPath, 'wrapperEmpty.xml'), 'utf8');
const wrapperFullXmlDocRaw = fs.readFileSync(path.join(fixturesPath, 'wrapperFull.xml'), 'utf8');

describe('mergeImpressionsTo util', () => {
  it('should leave inline impressions as is if there are no wrapper impressions', () => Promise.all([
    libxmljs.parseXmlAsync(inlineFullXmlDocRaw),
    libxmljs.parseXmlAsync(wrapperEmptyXmlDocRaw),
  ]).then(([inlineVast, wrapperVast]) => {
    const oldInlineImpressions = inlineVast.find(inlineImpressionsXPath);
    const newInlineVast = mergeImpressionsTo(inlineVast, wrapperVast);
    const newInlineImpressions = newInlineVast.find(inlineImpressionsXPath);

    expect(oldInlineImpressions.toString()).toEqual(newInlineImpressions.toString());
    expect(oldInlineImpressions.length).toEqual(2);
  }));

  it('should add wrapper impressions if there are no inline impressions', () => Promise.all([
    libxmljs.parseXmlAsync(inlineEmptyXmlDocRaw),
    libxmljs.parseXmlAsync(wrapperFullXmlDocRaw),
  ]).then(([inlineVast, wrapperVast]) => {
    const wrapperImpressions = wrapperVast.find(wrapperImpressionsXPath);
    const newInlineVast = mergeImpressionsTo(inlineVast, wrapperVast);
    const newInlineImpressions = newInlineVast.find(inlineImpressionsXPath);

    expect(newInlineImpressions.toString()).toEqual(wrapperImpressions.toString());
    expect(newInlineImpressions.length).toEqual(2);
  }));

  it('should merge wrapper and inline impressions if both are present', () => Promise.all([
    libxmljs.parseXmlAsync(inlineFullXmlDocRaw),
    libxmljs.parseXmlAsync(wrapperFullXmlDocRaw),
  ]).then(([inlineVast, wrapperVast]) => {
    const oldInlineImpressions = inlineVast.find(inlineImpressionsXPath);
    const wrapperImpressions = wrapperVast.find(wrapperImpressionsXPath);
    const newInlineVast = mergeImpressionsTo(inlineVast, wrapperVast);
    const newInlineImpressions = newInlineVast.find(inlineImpressionsXPath);

    // TODO: Need to improve comparison of 2 XML documents
    // const expectedImpressions = [...oldInlineImpressions, ...wrapperImpressions];
    // expect(newInlineImpressions.toString()).toEqual(expectedImpressions.toString());

    expect(newInlineImpressions.length).toEqual(4);
  }));

  it('should not add anything if both are empty', () => Promise.all([
    libxmljs.parseXmlAsync(inlineEmptyXmlDocRaw),
    libxmljs.parseXmlAsync(wrapperEmptyXmlDocRaw),
  ]).then(([inlineVast, wrapperVast]) => {
    const newInlineVast = mergeImpressionsTo(inlineVast, wrapperVast);
    const newInlineImpressions = newInlineVast.find(inlineImpressionsXPath);

    expect(newInlineImpressions).toEqual([]);
  }));
});
