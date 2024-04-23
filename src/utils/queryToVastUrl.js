'use strict';

const url = require('url');

const konduitParams = require('../constants/konduitParams');

const shouldEncodeParameterRegexp = /(url|title)/i;
const shouldLeaveValueUnchangedRegexp = /(:|;)/i;

const safeEncodeParameter = (paramName, paramValue) => {
  if (!paramName || !paramValue) return '';

  // NOTE: There are special cases when we don't need to encode everything
  // For example, in "prof=168234:aol_as3_live;;slid=Pre" prof param should be passed as is
  if (!shouldEncodeParameterRegexp.test(paramName) && shouldLeaveValueUnchangedRegexp.test(paramValue)) {
    return paramValue;
  }

  return encodeURIComponent(paramValue);
};

const queryToVastUrl = (query, paramConverters = {}) => {
  let urlString = query[konduitParams.KONDUIT_URL] ? query[konduitParams.KONDUIT_URL].trim() : '';
  const isKonduitUrl = urlString.length > 0;

  // NOTE: Support for 'url' parameter for backward compatibility
  if (!isKonduitUrl && query.url) {
    if (Array.isArray(query.url)) {
      urlString = query.url.length > 0 ? query.url[0] : '';
    } else {
      urlString = query.url.trim();
    }
  }

  const konduitParamNames = Object.keys(konduitParams).map(key => konduitParams[key].toLowerCase());
  const params = [];

  Object
    .keys(query)
    .filter(param => konduitParamNames.indexOf(param.toLowerCase()) === -1)
    .forEach((param) => {
      let paramValue = query[param];
      if (paramConverters[param]) {
        paramValue = paramConverters[param](paramValue);
      }

      if (!isKonduitUrl && param === 'url') {
        paramValue = (Array.isArray(paramValue)) ? paramValue.slice(1) : [];
      }

      const valueArray = Array.isArray(paramValue) ? [...paramValue] : [paramValue];
      valueArray.forEach((value) => {
        const parameterStringChunks = [param];
        const encodedParameterValue = safeEncodeParameter(param, value);
        if (encodedParameterValue) {
          parameterStringChunks.push(encodedParameterValue);
        }

        const encodedParameterString = parameterStringChunks.join('=');
        params.push(encodedParameterString);
      });
    });

  let output = urlString;
  if (params.length) {
    output = urlString + (urlString.indexOf('?') === -1 ? '?' : '&') + params.join('&');
  }

  return url.format(url.parse(output, true));
};

module.exports = queryToVastUrl;
