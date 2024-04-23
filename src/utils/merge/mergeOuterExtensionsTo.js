'use strict';

const outerExtensionXPath = '//VAST/Extensions';

const mergeOuterExtensionsTo = (inlineVast, wrapperVast) => {
  const inlineVastElement = inlineVast.get('//VAST');

  if (!inlineVastElement) {
    return inlineVast;
  }

  const inlineOuterExtensions = inlineVast.get(outerExtensionXPath);
  const wrapperOuterExtensions = wrapperVast.get(outerExtensionXPath);


  if (!wrapperOuterExtensions) {
    return inlineVast;
  }

  if (!inlineOuterExtensions) {
    inlineVastElement.addChild(wrapperOuterExtensions.clone());

    return inlineVast;
  }

  // merge inline and wrapper outer extensions
  wrapperOuterExtensions.childNodes().forEach(childNode => inlineOuterExtensions.addChild(childNode.clone()));

  return inlineVast;
};

module.exports = {
  mergeOuterExtensionsTo,
  outerExtensionXPath,
};
