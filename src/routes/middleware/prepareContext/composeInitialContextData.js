'use strict';

const getGUID = require('../../../utils/getGUID');
const queryToVastUrl = require('../../../utils/queryToVastUrl');
const getConfigParameter = require('../../../utils/getConfigParameter');
const UserAgentParser = require('../../../utils/UserAgentParser');
const BadRequest = require('../../../errors/BadRequest');


const {
  CLIENT_VIEWER_COUNTRY_HEADER,
} = require('../../../constants/cookies');

const ABTestType = require('../../../constants/ABTestType');

const {
  KONDUIT_ID,
  KONDUIT_URL,
  KONDUIT_OPTIMIZE,
  KONDUIT_AB_TYPE,
  KONDUIT_OTT,
} = require('../../../constants/konduitParams');

const LOG_RATE = getConfigParameter('LOG_RATE');

/**
 * Express middleware that analyze request object and construct VAST processing context
 */

const composeInitialData = (request, response, next) => {
  // NOTE: Unique identifier of the processed request
  request.requestId = getGUID();

  const userAgentParser = new UserAgentParser(request.get('User-Agent'), request.get('x-device-user-agent'));

  const optimizeFlag = request.query[KONDUIT_OPTIMIZE];
  const disableOptimization = optimizeFlag === undefined ? false : !parseInt(optimizeFlag, 10);

  const ottFlag = request.query[KONDUIT_OTT];
  const isOttRequest = ottFlag === undefined ? false : !!parseInt(ottFlag, 10);

  const clientId = request.query[KONDUIT_ID];
  const initialResponseCookies = [];

  // detecting forced AB testing group marker
  let konduitAbType = null;
  if (request.query[KONDUIT_AB_TYPE]) {
    const typeToForce = request.query[KONDUIT_AB_TYPE].toUpperCase();

    if (ABTestType[typeToForce] !== undefined) {
      konduitAbType = ABTestType[typeToForce];
    }
  }

  // FIXME Consider removing the empty object
  const customOptions = { };

  const context = {
    query: request.query,
    requestId: request.requestId,
    clientId,
    browserName: userAgentParser.browserName || 'unknown',
    browserVersion: userAgentParser.browserMajorVersion || 'unknown',
    osName: userAgentParser.osName || 'unknown',
    deviceType: userAgentParser.deviceType || 'unknown',
    // TODO: Should be calculated once, let's find one place for this.
    // See: src/state-machine/VASTProcessorInitializationState.js
    vastUrl: request.query.origVast || queryToVastUrl(request.query),
    headers: Object.assign({}, request.headers),
    cookies: Object.assign({}, request.cookies),
    viewerCountry: request.headers[CLIENT_VIEWER_COUNTRY_HEADER],
    originalUrl: request.originalUrl,
    isSecureRequest: request.protocol === 'https',
    protocol: request.protocol,
    adServerUserIds: request.adServerUserIds || {},
    allowLogs: Math.random() <= LOG_RATE,
    isOttRequest,
    clientSpecificLogFields: request.clientSpecificLogFields,
    konduitAbType,
    disableOptimization,
    initialResponseCookies,
    options: customOptions,
  };

  request.context = context;

  if (!context.clientId) {
    return next(new BadRequest('Invalid client identifier'));
  }
  if (!request.query[KONDUIT_URL]) {
    return next(new BadRequest('Invalid VAST URL'));
  }

  return next();
};

module.exports = composeInitialData;
