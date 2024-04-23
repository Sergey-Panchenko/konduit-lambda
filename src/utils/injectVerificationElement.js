'use strict';

const getVastTagVersion = require('./getVastTagVersion');

const getOrCreateElement = require('./getOrCreateElement');

const adVerificationsFirstVastVersion = 4;

const injectPureVerificationElement = (parentElement, verificationElement) => {
  const adVerificationsElement = getOrCreateElement(
    parentElement,
    './/AdVerifications',
    'AdVerifications'
  );

  adVerificationsElement.addChild(verificationElement);
};
const injectExtensionVerificationElement = (parentElement, verificationElement) => {
  const extensionsElement = getOrCreateElement(parentElement, './/Extensions', 'Extensions');

  const extensionAdVerificationElement = getOrCreateElement(
    extensionsElement,
    './/Extension[type=AdVerifications]',
    'Extension',
    '',
    { type: 'AdVerifications' }
  );

  const adVerificationsElement = getOrCreateElement(
    extensionAdVerificationElement,
    './/AdVerifications',
    'AdVerifications'
  );

  adVerificationsElement.addChild(verificationElement);
};

const injectVerificationElement = (xmlDoc, verificationElement) => {
  if (!xmlDoc || !verificationElement) {
    return xmlDoc;
  }
  const vastVersion = getVastTagVersion(xmlDoc) || '2.0';
  const parentElement = xmlDoc.get('.//InLine|.//Wrapper');

  if (!parentElement) {
    return xmlDoc;
  }

  if (parseFloat(vastVersion) >= adVerificationsFirstVastVersion) {
    injectPureVerificationElement(parentElement, verificationElement);
  } else {
    injectExtensionVerificationElement(parentElement, verificationElement);
  }

  return xmlDoc;
};

module.exports = injectVerificationElement;
