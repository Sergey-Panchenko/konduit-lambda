'use strict';

const _ = require('lodash');
const { blocklist } = require('../constants/blocklist');
const { mapUrlToVendorId } = require('./mapUrlToVendorName');
const hashToMap = require('./hashToMap');

const vendorsToBlock = hashToMap(blocklist.vendors);
const isBlockedByVendor = (vendorsToBlockMap, vastUrl, viewerCountry) => {
  if (!vastUrl) return false;
  const vendor = mapUrlToVendorId(vastUrl, true);

  if (!vendorsToBlockMap.has(vendor)) return false;

  const countriesToBlock = vendorsToBlockMap.get(vendor);

  return (countriesToBlock instanceof Set) ?
    countriesToBlock.has(viewerCountry) : !!countriesToBlock;
};

const originsToBlockRegExps = blocklist.origins;
const isBlockedByOrigin = (regExps, origin) => {
  if (!origin) return false;

  return _.some(regExps, regExp => regExp.test(origin));
};

const clientsToBlockSet = new Set(blocklist.clients);
const isBlockedByClient = (set, clientId) => {
  if (!clientId) return false;

  return set.has(clientId);
};

module.exports = {
  INTERNAL: { isBlockedByVendor, isBlockedByOrigin, isBlockedByClient },
  isBlockedByVendor: isBlockedByVendor.bind(null, vendorsToBlock),
  isBlockedByOrigin: isBlockedByOrigin.bind(null, originsToBlockRegExps),
  isBlockedByClient: isBlockedByClient.bind(null, clientsToBlockSet),
};
