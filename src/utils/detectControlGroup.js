'use strict';


/**
 * Analize VAST context and detect processing control group
 * @param  {VastContext} context  -- VAST processing context to analize
 * @return {String}               -- detected control group name
 */
const detectControlGroup = (context = {}) => {
  const detectedControlGroups = [];

  if (context.isWrapper) {
    detectedControlGroups.push('wrapper');
  }

  if (context.isVpaidDetected) {
    detectedControlGroups.push('vpaid-omit');
  }

  if (detectedControlGroups.length === 0) {
    return 'unknown';
  }

  return detectedControlGroups.join('-');
};

module.exports = detectControlGroup;
