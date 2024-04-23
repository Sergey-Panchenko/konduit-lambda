'use strict';

const fs = require('fs');
const path = require('path');
const expect = require('expect');
const libxmljs = require('libxmljs');

const {
  mergeExtensionsTo,
  inlineExtensionsXPath,
  wrapperExtensionsXPath,
} = require('../../../src/utils/merge/mergeExtensionsTo');

const fixturesPath = path.join(__dirname, '../../fixtures/merge/extensions/');

const inlineEmptyXmlDocRaw = fs.readFileSync(path.join(fixturesPath, 'inlineEmpty.xml'), 'utf8');
const inlineFullXmlDocRaw = fs.readFileSync(path.join(fixturesPath, 'inlineFull.xml'), 'utf8');
const wrapperEmptyXmlDocRaw = fs.readFileSync(path.join(fixturesPath, 'wrapperEmpty.xml'), 'utf8');
const wrapperFullXmlDocRaw = fs.readFileSync(path.join(fixturesPath, 'wrapperFull.xml'), 'utf8');

const cleanString = str => str.replace(/\n|\r\t|\s/g, '');

describe('mergeExtensionsTo util', () => {
  it('should leave original inline extensions as is if there are no wrapper extensions', () => Promise.all([
    libxmljs.parseXmlAsync(inlineFullXmlDocRaw),
    libxmljs.parseXmlAsync(wrapperEmptyXmlDocRaw),
  ]).then(([inlineVast, wrapperVast]) => {
    const newInlineVast = mergeExtensionsTo(inlineVast, wrapperVast);
    const inlineVastExtensions = inlineVast.get(inlineExtensionsXPath);
    const newInlineVastExtensions = newInlineVast.get(inlineExtensionsXPath);

    expect(newInlineVastExtensions.toString()).toEqual(inlineVastExtensions.toString());
  }));

  it('should insert wrapper extensions as is if there are no inline extensions', () => Promise.all([
    libxmljs.parseXmlAsync(inlineEmptyXmlDocRaw),
    libxmljs.parseXmlAsync(wrapperFullXmlDocRaw),
  ]).then(([inlineVast, wrapperVast]) => {
    const newInlineVast = mergeExtensionsTo(inlineVast, wrapperVast);
    const wrapperVastExtensions = wrapperVast.get(wrapperExtensionsXPath);
    const newInlineVastExtensions = newInlineVast.get(inlineExtensionsXPath);

    expect(newInlineVastExtensions.toString()).toEqual(wrapperVastExtensions.toString());
  }));

  it('should merge inline extensions with wrapper extensions if both are present', () => Promise.all([
    libxmljs.parseXmlAsync(inlineFullXmlDocRaw),
    libxmljs.parseXmlAsync(wrapperFullXmlDocRaw),
  ]).then(([inlineVast, wrapperVast]) => {
    const newInlineVast = mergeExtensionsTo(inlineVast, wrapperVast);
    const newInlineVastExtensionsString = newInlineVast.get(inlineExtensionsXPath).toString();

    const expectedExtensionsString = `
    <Extensions>
      <Extension type="inline_Extension">
        <ParamA>inline_Extension/ValueA</ParamA>
        <ParamB>inline_Extension/ValueB</ParamB>
        <ParamC>inline_Extension/ValueC</ParamC>
      </Extension>

      <Extension type="wrapper_0_Extension">
        <ParamA>wrapper_0_Extension/ValueA</ParamA>
        <ParamB>wrapper_0_Extension/ValueB</ParamB>
        <ParamC>wrapper_0_Extension/ValueC</ParamC>
      </Extension>
    </Extensions>`;

    expect(cleanString(newInlineVastExtensionsString)).toEqual(cleanString(expectedExtensionsString));
  }));

  it('should not add anything if both are empty', () => Promise.all([
    libxmljs.parseXmlAsync(inlineEmptyXmlDocRaw),
    libxmljs.parseXmlAsync(wrapperEmptyXmlDocRaw),
  ]).then(([inlineVast, wrapperVast]) => {
    const newInlineVast = mergeExtensionsTo(inlineVast, wrapperVast);
    const newInlineVastExtensions = newInlineVast.get(inlineExtensionsXPath);

    expect(newInlineVastExtensions).toEqual(undefined);
  }));
});
