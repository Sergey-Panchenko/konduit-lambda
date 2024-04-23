'use strict';

const fs = require('fs');
const path = require('path');

const expect = require('expect');
const libxmljs = require('libxmljs');

const getOrCreateElement = require('../../src/utils/getOrCreateElement');

const vast = fs.readFileSync(path.join(__dirname, '../fixtures/', 'just_test_vast3.0.xml'), 'utf8');

describe('getOrCreateElement', () => {
  const xmlDoc = libxmljs.parseXml(vast);

  it('should return new Error element when it is not presented in parent element', () => {
    const currentErrorElement = xmlDoc.get('.//Error');
    const createdErrorElement = getOrCreateElement(xmlDoc.root(), './/Error', 'Error');

    expect(currentErrorElement).toNotExist();
    expect(createdErrorElement).toExist();
    expect(createdErrorElement.name()).toBe('Error');
  });

  it('should return new Extensions element with attr "custom=true" when it is not presented in parent element', () => {
    const currentExtensionsElement = xmlDoc.get('.//Extensions');
    const createdExtensionsElement = getOrCreateElement(
      xmlDoc.root(),
      './/Extensions',
      'Extensions',
      '',
      { custom: 'true' }
    );

    expect(currentExtensionsElement).toNotExist();
    expect(createdExtensionsElement).toExist();
    expect(createdExtensionsElement.name()).toBe('Extensions');
    expect(createdExtensionsElement.getAttribute('custom').value()).toBe('true');
  });

  it('should return existing AdSystem element when it is presented in parent element', () => {
    const currentAdSystemElement = xmlDoc.get('.//AdSystem');
    const createdAdSystemElement = getOrCreateElement(xmlDoc.root(), './/AdSystem', 'AdSystem');

    expect(currentAdSystemElement).toExist();
    expect(currentAdSystemElement).toBe(createdAdSystemElement);
  });

  it('should throw error when no params passed', () => {
    expect(getOrCreateElement).toThrow(Error);
  });
});
