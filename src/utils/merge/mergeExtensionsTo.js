'use strict';

const inlineExtensionsXPath = '//VAST//Ad//InLine//Extensions';
const wrapperExtensionsXPath = '//VAST//Wrapper//Extensions';

const mergeExtensionsTo = (inlineVast, wrapperVast) => {
  const inlineElement = inlineVast.get('//VAST//Ad//InLine');

  if (!inlineElement) {
    return inlineVast;
  }

  const inlineVastExtensions = inlineVast.get(inlineExtensionsXPath);
  const wrapperVastExtensions = wrapperVast.get(wrapperExtensionsXPath);

  if (!wrapperVastExtensions) {
    return inlineVast;
  }

  if (!inlineVastExtensions) {
    inlineElement.addChild(wrapperVastExtensions.clone());

    return inlineVast;
  }

  // merge inline and wrapper extensions
  wrapperVastExtensions.childNodes().forEach(childNode => inlineVastExtensions.addChild(childNode.clone()));

  return inlineVast;
};

module.exports = {
  mergeExtensionsTo,
  inlineExtensionsXPath,
  wrapperExtensionsXPath,
};
