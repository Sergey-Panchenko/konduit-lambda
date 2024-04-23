'use strict';

const konduitParamPrefixRegExp = /(konduit_)/i;
const konduitUrlParamPrefixRegExp = /(konduit_.*?=)/ig;

const normalizeKonduitQueryParams = (request, response, next) => {
  const lowerCasedKonduitParams = {};

  // TODO: fixed issue in initial state, should be removed
  request.originalUrl = request.originalUrl.replace(konduitUrlParamPrefixRegExp, (match, $1) => $1.toLowerCase());

  Object.keys(request.query).forEach((queryKey) => {
    if (queryKey.match(konduitParamPrefixRegExp)) {
      lowerCasedKonduitParams[queryKey.toLowerCase()] = request.query[queryKey];
      delete request.query[queryKey];
    }
  });

  Object.assign(request.query, lowerCasedKonduitParams);

  next();
};

module.exports = normalizeKonduitQueryParams;
