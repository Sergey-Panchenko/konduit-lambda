'use strict';

/**
 * Special VAST handler for requests coming from mobile user agents (KME-1693)
 */

const querystring = require('querystring');
const libxml = require('libxmljs');

const Strategy = require('../Strategy');
const HandlerReport = require('../HandlerReport');

const createVerificationElement = require('../../utils/createVerificationElement');
const injectVerificationElement = require('../../utils/injectVerificationElement');

const metrics = require('../../utils/metrics');

const isMobilePlatformRequest = require('../../utils/isMobilePlatformRequest');

const konduitParams = require('../../constants/konduitParams');
const { CLIENT_WO_ID } = require('../../constants/clientIds');

const verificationJsUrl = ci => `https://s.tpcserve.com/2/${ci}/pagespeed.js`;

const obtainPagespeedParams = (query, requestId) => {
  const pagespeedParams = {};
  const konduitParamNames = Object.keys(konduitParams).map(key => konduitParams[key].toLowerCase());

  Object.keys(query)
    .forEach((queryParamName) => {
      const isKnownParam = konduitParamNames.indexOf(queryParamName.toLowerCase()) >= 0;
      if (queryParamName && !isKnownParam) {
        pagespeedParams[queryParamName] = query[queryParamName];
      }
    });

  delete pagespeedParams.wr_mt;
  pagespeedParams.oz_flash_id = requestId;
  pagespeedParams.oz_vp = 3;
  pagespeedParams.oz_vid = '';

  return pagespeedParams;
};

const composeVerificationJsUrl = (query, requestId) => {
  const composedParams = Object.assign({}, obtainPagespeedParams(query, requestId));

  const queryParamsString = Object.keys(composedParams).length ? `?${querystring.stringify(composedParams)}` : '';

  return `${verificationJsUrl(query.ci)}${queryParamsString}`;
};

const handler = (context) => {
  const { xmlDoc, query, requestId } = context;
  const documentContext = (xmlDoc instanceof libxml.Element) ? xmlDoc.doc() : xmlDoc;

  const adVerificationElementAttributes = {
    JavaScriptResource: { apiFramework: 'omid', browserOptional: 'false' },
  };
  const verificationElement = createVerificationElement(
    documentContext,
    adVerificationElementAttributes,
    composeVerificationJsUrl(query, requestId)
  );

  injectVerificationElement(documentContext, verificationElement);

  context.isAdVerificationAdded = true;
  metrics.vastOutlier(context, { [metrics.RESERVED_TAGS.SCOPE]: 'ad-verification-special-handler' });

  return HandlerReport.makeSuccessful({ isAdVerificationAdded: true });
};

const clientWoAdVerificationStrategy = new Strategy({
  isActual: (context) => {
    const isTargetClient = context.clientId === CLIENT_WO_ID;

    if (!isTargetClient) {
      return false;
    }

    const hasCiParameter = !!context.query.ci;

    if (!hasCiParameter) {
      return false;
    }

    return isMobilePlatformRequest(context);
  },
  handler,
});

module.exports = clientWoAdVerificationStrategy;
