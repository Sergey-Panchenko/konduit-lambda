'use strict';

const fs = require('fs');
const path = require('path');
const expect = require('expect');
const libxmljs = require('libxmljs');

const {
  inlineAttemptsXPath,
  wrapperAttemptsXPath,
  mergeAttemptsTo,
} = require('../../../src/utils/merge/mergeAttemptsTo');

const fixturesPath = path.join(__dirname, '../../fixtures/merge/attempts/');

const inlineEmptyXmlDocRaw = fs.readFileSync(path.join(fixturesPath, 'inlineEmpty.xml'), 'utf8');
const inlineFullXmlDocRaw = fs.readFileSync(path.join(fixturesPath, 'inlineFull.xml'), 'utf8');
const wrapperEmptyXmlDocRaw = fs.readFileSync(path.join(fixturesPath, 'wrapperEmpty.xml'), 'utf8');
const wrapperFullXmlDocRaw = fs.readFileSync(path.join(fixturesPath, 'wrapperFull.xml'), 'utf8');

describe('mergeAttemptsTo util', () => {
  it('should leave inline attempts as is if there are no wrapper attempts', () => Promise.all([
    libxmljs.parseXmlAsync(inlineFullXmlDocRaw),
    libxmljs.parseXmlAsync(wrapperEmptyXmlDocRaw),
  ]).then(([inlineVast, wrapperVast]) => {
    const oldInlineAttempts = inlineVast.find(inlineAttemptsXPath);
    const newInlineVast = mergeAttemptsTo(inlineVast, wrapperVast);
    const newInlineAttempts = newInlineVast.find(inlineAttemptsXPath);

    expect(oldInlineAttempts.toString()).toEqual(newInlineAttempts.toString());
    expect(oldInlineAttempts.length).toEqual(2);
  }));

  it('should add wrapper attempts if there are no inline attempts', () => Promise.all([
    libxmljs.parseXmlAsync(inlineEmptyXmlDocRaw),
    libxmljs.parseXmlAsync(wrapperFullXmlDocRaw),
  ]).then(([inlineVast, wrapperVast]) => {
    const wrapperAttempts = wrapperVast.find(wrapperAttemptsXPath);
    const newInlineVast = mergeAttemptsTo(inlineVast, wrapperVast);
    const newInlineAttempts = newInlineVast.find(inlineAttemptsXPath);

    expect(newInlineAttempts.toString()).toEqual(wrapperAttempts.toString());
    expect(newInlineAttempts.length).toEqual(1);
  }));

  it('should merge wrapper and inline attempts if both are present', () => Promise.all([
    libxmljs.parseXmlAsync(inlineFullXmlDocRaw),
    libxmljs.parseXmlAsync(wrapperFullXmlDocRaw),
  ]).then(([inlineVast, wrapperVast]) => {
    const oldInlineAttempts = inlineVast.find(inlineAttemptsXPath);
    const wrapperAttempts = wrapperVast.find(wrapperAttemptsXPath);
    const newInlineVast = mergeAttemptsTo(inlineVast, wrapperVast);
    const newInlineAttempts = newInlineVast.find(inlineAttemptsXPath);

    const expectedAttempts = [...oldInlineAttempts, ...wrapperAttempts];

    expect(newInlineAttempts.toString()).toEqual(expectedAttempts.toString());
    expect(newInlineAttempts.length).toEqual(3);
  }));

  it('should not add anything if both are empty', () => Promise.all([
    libxmljs.parseXmlAsync(inlineEmptyXmlDocRaw),
    libxmljs.parseXmlAsync(wrapperEmptyXmlDocRaw),
  ]).then(([inlineVast, wrapperVast]) => {
    const newInlineVast = mergeAttemptsTo(inlineVast, wrapperVast);
    const newInlineAttempts = newInlineVast.find(inlineAttemptsXPath);

    expect(newInlineAttempts).toEqual([]);
  }));
});
