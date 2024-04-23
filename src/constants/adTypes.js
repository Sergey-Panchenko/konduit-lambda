'use strict';

module.exports = Object.freeze({
  WRAPPER: 'wrapper',
  // @TODO: caution! decided to call this type as INLINE
  //        but value 'mediafile' is still used over the system (e.g. datadog metric tags, logs)
  INLINE: 'mediafile',
  ADPOD: 'adpod',
  NO_AD: 'no_ad',
  ERROR_LOAD: 'error_load',
  UNKNOWN: 'unknown',
});
