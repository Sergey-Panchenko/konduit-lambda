'use strict';

const inlineImpressionsXPath = './/InLine/Impression';
const wrapperImpressionsXPath = './/Wrapper/Impression';

const mergeImpressionsTo = (inlineVast, wrapperVast) => {
  const inlineInLineElement = inlineVast.get('.//InLine');

  if (!inlineInLineElement) {
    return inlineVast;
  }

  const inlineImpressions = inlineVast.find(inlineImpressionsXPath);
  const wrapperImpressions = wrapperVast.find(wrapperImpressionsXPath);

  if (!wrapperImpressions.length) {
    return inlineVast;
  }

  if (!inlineImpressions.length) {
    wrapperImpressions.forEach((impressionNode) => {
      inlineInLineElement.addChild(impressionNode.clone());
    });

    return inlineVast;
  }

  // inlineImpressions.length && wrapperImpressions.length
  const lastImpression = inlineImpressions[inlineImpressions.length - 1];

  wrapperImpressions.forEach((impressionNode) => {
    // following code didn't work for some reason (returned currentImpression but not from current document)
    // currentImpression = currentImpression.addNextSibling(impressionNode.clone());
    lastImpression.addNextSibling(impressionNode.clone());
  });

  return inlineVast;
};

module.exports = {
  inlineImpressionsXPath,
  wrapperImpressionsXPath,
  mergeImpressionsTo,
};
