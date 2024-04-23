'use strict';

const libxml = require('libxmljs');
const expect = require('expect');

const xmlAddFirstChild = require('../../src/utils/xmlAddFirstChild');

const XML_TAG_WITH_CHILDREN = '<Parent><Child>yoo</Child><Child>yoo</Child><Child>yoo</Child></Parent>';
const EMPTY_XML_TAG = '<Parent></Parent>';

describe('xmlAddFirstChild util', () => {
  it.skip('should return passed parentElement passed as parameter', () => {
    const xmlDoc = libxml.parseXml(XML_TAG_WITH_CHILDREN);
    const parentElement = xmlDoc.get('//Parent');
    const childElement = new libxml.Element(xmlDoc, 'NewChild');

    const result = xmlAddFirstChild(parentElement, childElement);
    expect(result).toBeA(libxml.Element);
    expect(result.name()).toEqual('Parent');
  });

  it('should inject child into first position', () => {
    const xmlDoc = libxml.parseXml(XML_TAG_WITH_CHILDREN);
    const parentElement = xmlDoc.get('//Parent');
    const childElement = new libxml.Element(xmlDoc, 'NewChild');
    childElement.text('testText');

    const result = xmlAddFirstChild(parentElement, childElement);
    // eslint-disable-next-line max-len
    const expectedXmlresult = '<Parent><NewChild>testText</NewChild><Child>yoo</Child><Child>yoo</Child><Child>yoo</Child></Parent>';
    expect(result.toString()).toEqual(expectedXmlresult);
  });

  it('should inject into empty element correctly', () => {
    const xmlDoc = libxml.parseXml(EMPTY_XML_TAG);
    const parentElement = xmlDoc.get('//Parent');
    const childElement = new libxml.Element(xmlDoc, 'NewChild');
    childElement.text('testText');

    const result = xmlAddFirstChild(parentElement, childElement);
    const expectedXmlresult = '<Parent><NewChild>testText</NewChild></Parent>';
    expect(result.toString()).toEqual(expectedXmlresult);
  });
});
