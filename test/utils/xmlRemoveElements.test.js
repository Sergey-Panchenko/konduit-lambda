'use strict';

const expect = require('expect');
const libxml = require('libxmljs');

const xmlRemoveElements = require('../../src/utils/xmlRemoveElements');

const dummyXml = `
<VAST>
  <Error></Error>
  <Ad></Ad>
  <Ad type="removethis"></Ad>
  <Ad type="removethis"></Ad>
  <Ad></Ad>
</VAST>`;

describe('xmlRemoveElements util', () => {
  it('should remove all elements that suit passed xpath query', () => {
    const xmlElement = libxml.parseXml(dummyXml).root();

    xmlRemoveElements(xmlElement, '//Ad[@type="removethis"]');
    expect(xmlElement.find('//Ad').length).toEqual(2);
    expect(xmlElement.find('//Error').length).toEqual(1);
    expect(xmlElement.find('//Ad[@type="removethis"]').length).toEqual(0);
  });

  it('should not throw if no any element that suit passed query', () => {
    const xmlElement = libxml.parseXml(dummyXml).root();

    const cast = () => xmlRemoveElements(xmlElement, '//Weird');
    expect(cast).toNotThrow();
  });

  it('should throw if invalid vast parent passed', () => {
    const cast = () => xmlRemoveElements();
    expect(cast).toThrow();
  });
});
