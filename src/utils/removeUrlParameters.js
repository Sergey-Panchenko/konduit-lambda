'use strict';

const url = require('url');

function removeUrlParameters(urlString, blacklistPrefixes) {
  const urlObject = url.parse(urlString, true);
  const query = urlObject.query;
  const queryParams = Object.keys(query);

  let i;
  let len;
  let j;
  let jLen;

  for (i = 0, len = queryParams.length; i < len; i += 1) {
    for (j = 0, jLen = blacklistPrefixes.length; j < jLen; j += 1) {
      if (queryParams[i] === blacklistPrefixes[j]) {
        delete query[queryParams[i]];
      }
    }
  }

  delete urlObject.search;
  return url.format(urlObject);
}

module.exports = removeUrlParameters;
