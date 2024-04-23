'use strict';

const isVpaidAd = require('./isVpaidAd');

/**
 * Check if ad should be cleaned up in terms of OTT support.
 * @param context - current execution context
 * @param adUnit - ad unit to check
 * @param adIndex - index of the ad unit
 * @returns {boolean} true if ad content should turned into empty ad and false otherwise
 */
const shouldCleanUpAdForOtt = (context, adUnit, adIndex) => {
  if (isVpaidAd(adUnit)) {
    return true;
  }

  if (context.isAdPod) {
    const adReport = context.adpodReports[adIndex];
    return !(adReport && adReport.successfulProcess);
  }

  return false;
};

module.exports = shouldCleanUpAdForOtt;
