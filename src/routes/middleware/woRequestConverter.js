'use strict';

const url = require('url');
const _ = require('lodash');

const {
  KONDUIT_URL,
  KONDUIT_ID,
} = require('../../constants/konduitParams');
const { CLIENT_WO_ID } = require('../../constants/clientIds');

const getConfigParameter = require('../../utils/getConfigParameter');

const presetWrapperFilteringValue = getConfigParameter('CLIENT_WO_ENFORCE_WRAPPER_FILTERING_VALUE');


const convertQueryParams = (queryParams) => {
  if (queryParams.origVast) {
    queryParams[KONDUIT_URL] = queryParams.origVast;
  }

  queryParams[KONDUIT_ID] = CLIENT_WO_ID;

  return queryParams;
};

const woParamsToKonduit = (request) => {
  const { query: queryParams } = request;

  request.query = convertQueryParams(queryParams);

  return request;
};

const originalVastParamRegExp = /^(.*?)[?&]origVast=(.*)$/i;

const parseWoUrlIntoQuery = (originalUrl) => {
  const [fullMatch, originalRequestUrl, vastUrl] = originalUrl // eslint-disable-line
    .match(originalVastParamRegExp) || [];

  if (!vastUrl) {
    return null;
  }

  const urlObject = url.parse(originalRequestUrl, true);
  let originalVastUrl;

  try {
    originalVastUrl = decodeURIComponent(vastUrl);
  } catch (error) {
    originalVastUrl = vastUrl;
  }

  urlObject.query.origVast = originalVastUrl;

  return urlObject.query;
};

const sanitizeParameters = (query) => {
  const vastWrapperFiltering = presetWrapperFilteringValue || parseInt(query.wr_mt, 10);

  // @NOTE check if we have correct param in wr_mt - 1, 2, 3
  if ((vastWrapperFiltering > 0) && (vastWrapperFiltering < 4)) {
    query.wr_mt = vastWrapperFiltering;
  } else {
    query.wr_mt = 3;
  }

  return query;
};

const konduitQueryParamRegExp = /konduit_/i;

const woRequestConverter = (request, response, next) => { // eslint-disable-line
  // NOTE: used special query parsing to prevent double wrapping issues
  request.query = parseWoUrlIntoQuery(request.originalUrl) || request.query;

  // NOTE: remove all konduit params when we should use just partner params
  request.query = _.omitBy(request.query, (value, key) => konduitQueryParamRegExp.test(key));

  request.query = sanitizeParameters(request.query);

  if (request.query.ci) {
    request.clientSpecificLogFields = { wo: { customerId: request.query.ci } };
  }

  woParamsToKonduit(request);
  next();
};

module.exports = woRequestConverter;
