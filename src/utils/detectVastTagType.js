'use strict';

const detectVastTagType = (context) => {
  if (context.hasMediaFile) {
    return context.isVpaidDetected ? 'vpaid' : 'video';
  }

  if (context.isNoAd) {
    return context.successfulProcess ? 'no_ad' : 'empty';
  }

  return 'error';
};

module.exports = detectVastTagType;
