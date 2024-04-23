'use strict';

const fs = require('fs');
const path = require('path');

const expect = require('expect');
const libxmljs = require('libxmljs');

const createVerificationElement = require('../../src/utils/createVerificationElement');

const vast = fs.readFileSync(path.join(__dirname, '../fixtures/', 'just_test_vast3.0.xml'), 'utf8');

describe('createAdVerificationElement', () => {
  const xmlDoc = libxmljs.parseXml(vast);

  it('should return AdVerification with JavaScriptResource element inside', () => {
    const verificationElementAttributes = {
      Verification: { vendor: 'test' },
      JavaScriptResource: { apiFramework: 'omid', browserOptional: 'false' },
    };
    const verificationElement = createVerificationElement(
      xmlDoc,
      verificationElementAttributes,
      'http://js.resource.content.com'
    );
    const javaScriptResourceElement = verificationElement.get('.//JavaScriptResource');

    expect(verificationElement).toExist();
    expect(verificationElement.getAttribute('vendor').value()).toBe('test');
    expect(javaScriptResourceElement).toExist();
    expect(javaScriptResourceElement.name()).toBe('JavaScriptResource');
    expect(javaScriptResourceElement.getAttribute('apiFramework').value()).toBe('omid');
    expect(javaScriptResourceElement.getAttribute('browserOptional').value()).toBe('false');
  });
});
