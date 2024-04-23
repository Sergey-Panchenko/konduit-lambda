'use strict';


const getInlineContentType = (context) => {
  if (context.isNoAd) {
    return 'no_ad';
  }

  if (context.hasMediaFile) {
    return context.isVpaidDetected ? 'vpaid' : 'static';
  }

  return 'unknown';
};

const collectFluentVastType = (context) => {
  const inlineContent = getInlineContentType(context);

  const fluentVastType = {
    isAdPod: !!context.isAdPod,
    isWrapper: !!context.unwrapOperationsCount > 0,
    inlineContent,
  };
  return fluentVastType;
};

module.exports = collectFluentVastType;
