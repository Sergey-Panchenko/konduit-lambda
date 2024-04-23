'use strict';

const url = require('url');

const isValidUrl = (webUrl = '') => {
  const parsedUrl = url.parse(webUrl);

  if (parsedUrl && parsedUrl.hostname && (parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:')) {
    return true;
  }
  return false;
};

module.exports = isValidUrl;
