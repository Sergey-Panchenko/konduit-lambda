'use strict';

const fs = require('fs');
const path = require('path');
const expect = require('expect');
const libxmljs = require('libxmljs');

const {
  mergeOuterExtensionsTo,
  outerExtensionXPath,
} = require('../../../src/utils/merge/mergeOuterExtensionsTo');

const fixturesPath = path.join(__dirname, '../../fixtures/merge/outer-extensions/');

const inlineEmptyXmlDocRaw = fs.readFileSync(path.join(fixturesPath, 'inlineEmpty.xml'), 'utf8');
const inlineFullXmlDocRaw = fs.readFileSync(path.join(fixturesPath, 'inlineFull.xml'), 'utf8');
const wrapperEmptyXmlDocRaw = fs.readFileSync(path.join(fixturesPath, 'wrapperEmpty.xml'), 'utf8');
const wrapperFullXmlDocRaw = fs.readFileSync(path.join(fixturesPath, 'wrapperFull.xml'), 'utf8');

describe('mergeOuterExtensionsTo util', () => {
  it('should leave original outer extensions as is if there are no outer extensions in wrapper vast',
    () => Promise.all([
      libxmljs.parseXmlAsync(inlineFullXmlDocRaw),
      libxmljs.parseXmlAsync(wrapperEmptyXmlDocRaw),
    ]).then(([inlineVast, wrapperVast]) => {
      const newInlineVast = mergeOuterExtensionsTo(inlineVast, wrapperVast);
      const inlineVastExtensions = inlineVast.get(outerExtensionXPath);
      const newInlineVastExtensions = newInlineVast.get(outerExtensionXPath);

      expect(newInlineVastExtensions.toString()).toEqual(inlineVastExtensions.toString());
    })
  );

  it('should insert outer extensions from wrapper vast as is if there are no outer extensions in inline vast',
    () => Promise.all([
      libxmljs.parseXmlAsync(inlineEmptyXmlDocRaw),
      libxmljs.parseXmlAsync(wrapperFullXmlDocRaw),
    ]).then(([inlineVast, wrapperVast]) => {
      const newInlineVast = mergeOuterExtensionsTo(inlineVast, wrapperVast);
      const wrapperVastExtensions = wrapperVast.get(outerExtensionXPath);
      const newInlineVastExtensions = newInlineVast.get(outerExtensionXPath);

      expect(newInlineVastExtensions.toString()).toEqual(wrapperVastExtensions.toString());
    })
  );

  it('should merge outer extensions in both xmls if both are present', () => Promise.all([
    libxmljs.parseXmlAsync(inlineFullXmlDocRaw),
    libxmljs.parseXmlAsync(wrapperFullXmlDocRaw),
  ]).then(([inlineVast, wrapperVast]) => {
    const oldInlineVastExtensions = inlineVast.find('//VAST/Extensions/Extension');
    const newInlineVast = mergeOuterExtensionsTo(inlineVast, wrapperVast);
    const wrapperVastExtensions = wrapperVast.find('//VAST/Extensions/Extension');
    const newInlineVastExtensions = newInlineVast.find('//VAST/Extensions/Extension');

    const expectedExtensions = [...oldInlineVastExtensions, ...wrapperVastExtensions];

    expect(newInlineVastExtensions.toString()).toEqual(expectedExtensions.toString());
  }));

  it('should not add anything if both are empty', () => Promise.all([
    libxmljs.parseXmlAsync(inlineEmptyXmlDocRaw),
    libxmljs.parseXmlAsync(wrapperEmptyXmlDocRaw),
  ]).then(([inlineVast, wrapperVast]) => {
    const newInlineVast = mergeOuterExtensionsTo(inlineVast, wrapperVast);
    const newInlineVastExtensions = newInlineVast.get(outerExtensionXPath);

    expect(newInlineVastExtensions).toEqual(undefined);
  }));
});
