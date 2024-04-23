'use strict';

const parseDataURL = require('data-urls');

const isValidUrl = (dataUrl) => {
  const parsedDataUrl = parseDataURL(dataUrl || '');

  return !!parsedDataUrl;
};

module.exports = isValidUrl;
