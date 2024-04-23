'use strict';

/**
 * Detects if the passed VastContext is in initial vast loading stage
 * i.e. loading and processing of VAST XML from initialVastUrl
 *
 * @param  {VASTContext} context -- context to analyze
 * @return {Boolean}
 */
const isInitialVastContext = (context) => {
  if (context.isInternalProcessor) return false;
  if (context.nestingLevel > 0) return false;

  return true;
};

module.exports = isInitialVastContext;
