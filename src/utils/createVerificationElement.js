'use strict';

const createVastElement = require('./createVastElement');

const createVerificationElement = (xmlDoc, attributes = {}, jsResourceContent) => {
  const verificationElement = createVastElement(
    xmlDoc,
    'Verification',
    '', attributes.Verification
  );
  const javaScriptResourceElement = createVastElement(
    xmlDoc,
    'JavaScriptResource',
    jsResourceContent,
    attributes.JavaScriptResource
  );

  verificationElement.addChild(javaScriptResourceElement);

  return verificationElement;
};

module.exports = createVerificationElement;
