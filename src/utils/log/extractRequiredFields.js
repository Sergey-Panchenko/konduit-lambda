'use strict';

const hrtimeToMs = require('../hrtimeToMs');

/**
 * Pull list of mandatory fields from a VAST processing context
 * @param  {Object} context -- VAST processing context
 * @return {Object}         -- Object that contains mandatory logging fields
 */
const extractRequiredFields = context => ({
  requestId: context.requestId,
  konduitId: context.clientId,
  completeLogRecord: context.allowLogs,
  elapsedTimeMS: hrtimeToMs(process.hrtime(context.startTime)),
  adPosition: parseInt(context.adPosition, 10) || 0,
});

module.exports = extractRequiredFields;
