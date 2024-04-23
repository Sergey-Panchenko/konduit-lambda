'use strict';

const url = require('url');

const vendors = require('../constants/vendors').list;

const mapUrlToVendorNameInternal = (adUrl, vendorProperty = 'name') => {
  if (!adUrl) return 'None';

  const parsedUrl = url.parse(adUrl);
  const hostname = parsedUrl.hostname;

  if (!hostname) return 'None';

  for (const rule of vendors) { // eslint-disable-line
    if (rule.mapRule.test(hostname)) {
      return rule[vendorProperty];
    }
  }

  return hostname;
};

const mapUrlToVendorName = adUrl => mapUrlToVendorNameInternal(adUrl);

const mapUrlToVendorId = adUrl =>
  mapUrlToVendorNameInternal(adUrl, 'id').toLowerCase();

const mapUrlToVendorTagValue = (adUrl) => {
  let vendorTag = mapUrlToVendorNameInternal(adUrl);
  vendorTag = vendorTag.replace(/\s+/g, '-').toLowerCase();

  return vendorTag;
};

module.exports = {
  mapUrlToVendorId,
  mapUrlToVendorName,
  mapUrlToVendorTagValue,
};
