'use strict';

const logger = require('../../services/logger');
const getVastTagVersion = require('../getVastTagVersion');

const formatAdProcessingReport = require('../formatOptimizationReport');
const extractRequiredFields = require('./extractRequiredFields');

const { CLIENT_WO_ID } = require('../../constants/clientIds');

const LEVEL = {
  INFO: 'info',
  DEBUG: 'debug',
  ERROR: 'error',
};

const extendLogData = (context, logData) => {
  if (CLIENT_WO_ID === context.clientId) {
    // eslint-disable-next-line camelcase
    const { wr_mt, ci, ai, ac, pc, pp, md } = context.query;
    logData.wo = { wr_mt, customerId: ci, ai, ac, pc, pp, md };
    logData.wo.vastWrapperApplied = !!context.vastWrapperApplied;
    logData.wo.isAdVerificationAdded = !!context.isAdVerificationAdded;
  }
  return logData;
};

/**
 * Perform logging with specified level, message, mandatory fields
 *   and every further specified custom fields
 * @param  {String}    level        -- logging level (debug, info, error, warning)
 * @param  {String}    message      -- message to log
 * @param  {...Object} customFields -- sequence of logging fields
 */

const log = (level = LEVEL.INFO, message, context, ...customFields) =>
  logger[level](message, Object.assign(extractRequiredFields(context), ...customFields));

/**
 * Log VAST proxy request
 * @param  {Object} context -- VAST processing context
 * @param  {Object} request -- express request
 */
const logRequest = (context, request) =>
  log(LEVEL.DEBUG, 'Proxy request', context, {
    command: 'api:VastRequest',
    ipAddress: request.ip,
    requestMethod: request.method,
    country: context.viewerCountry,
    requestBody: context.allowLogs ? JSON.stringify(request.body) : undefined,
    elapsedTimeMS: 0,
  });

/**
 * Log VAST proxy successful response
 * @param  {Object} context -- VAST processing context
 */
const logResponse = context =>
  log(LEVEL.INFO, 'Proxy response', context, extendLogData(context, {
    command: 'api:VastResponse',
    deviceType: context.deviceType,
    browserName: context.browserName,
    browserVersion: context.browserVersion,
    osName: context.osName,
    origin: context.headers.origin,
    referer: context.headers.referer,
    userAgent: context.headers['user-agent'],
    isOttRequest: context.isOttRequest,
    ad: formatAdProcessingReport(context),
    vastVersion: getVastTagVersion(context.xmlDoc) || 'unknown',
    originalUrl: context.originalUrl,
  }));

/**
 * Log VAST proxy error response
 * @param  {Object} context -- VAST processing context
 * @param  {Error}  error   -- Error that was occurred
 */
const logError = (context, error) =>
  log(LEVEL.ERROR, 'Proxy error', context, extendLogData(context, { command: 'api:VastError', error }));


/**
 * Log VAST proxy redirect response
 * @param  {Object} context -- VAST processing context
 */
const logRedirect = context =>
  log(LEVEL.INFO, 'Proxy redirect', context, {
    command: 'api:VastRedirect',
    vastUrl: context.vastUrl,
    origin: context.headers.origin,
    referer: context.headers.referer,
    ad: formatAdProcessingReport(context),
    originalUrl: context.originalUrl,
  });

module.exports = {
  request: logRequest,
  success: logResponse,
  error: logError,
  redirect: logRedirect,
};
