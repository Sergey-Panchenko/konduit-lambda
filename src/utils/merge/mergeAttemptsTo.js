'use strict';

const inlineAttemptsXPath = './/InLine/Attempt';
const wrapperAttemptsXPath = './/Wrapper/Attempt';

const mergeAttemptsTo = (inlineVast, wrapperVast) => {
  const inlineInLineElement = inlineVast.get('.//InLine');

  if (!inlineInLineElement) {
    return inlineVast;
  }

  const inlineAttempts = inlineVast.find(inlineAttemptsXPath);
  const wrapperAttempts = wrapperVast.find(wrapperAttemptsXPath);

  if (!wrapperAttempts.length) {
    return inlineVast;
  }

  if (!inlineAttempts.length) {
    wrapperAttempts.forEach(attemptNode => inlineInLineElement.addChild(attemptNode.clone()));

    return inlineVast;
  }

  // inlineAttempts.length && wrapperAttempts.length
  let currentAttempt = inlineAttempts[inlineAttempts.length - 1];
  wrapperAttempts.forEach((attemptNode) => {
    currentAttempt.addNextSibling(attemptNode.clone());
    const currentInlineAttempts = inlineVast.find(inlineAttemptsXPath);
    currentAttempt = currentInlineAttempts[currentInlineAttempts.length - 1];
  });

  return inlineVast;
};

module.exports = {
  inlineAttemptsXPath,
  wrapperAttemptsXPath,
  mergeAttemptsTo,
};
