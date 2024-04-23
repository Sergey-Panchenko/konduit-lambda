'use strict';

const url = require('url');

const isSupportedVastUrl = (vastUrl) => {
  const parsedUrl = url.parse(vastUrl);

  // NOTE: This list could be updated with new hosts, or cleaned up once a host is supported
  const blackListedVastHosts = [];
  // eslint-disable-next-line no-restricted-syntax
  for (const host of blackListedVastHosts) {
    if (parsedUrl.hostname.indexOf(host) !== -1) {
      return false;
    }
  }

  return true;
};

module.exports = isSupportedVastUrl;
