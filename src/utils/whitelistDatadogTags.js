'use strict';

const getConfigParameter = require('./getConfigParameter');
const convertStringToList = require('./convertStringToList');

const OTHER = 'other';
const DOUBLE_CLICK = 'double-click';

const topBrowsersTagSet = new Set(
  convertStringToList(getConfigParameter('DATADOG_TOP_BROWSERS'))
);
const topOsTagSet = new Set(
  convertStringToList(getConfigParameter('DATADOG_TOP_OS'))
);
const topVastVendorsTopLevelDomainsTagSet = new Set(
  convertStringToList(getConfigParameter('DATADOG_TOP_VAST_VENDORS_TOP_LEVEL_DOMAINS'))
);
const topVastVendorsAliasesTagSet = new Set(
  convertStringToList(getConfigParameter('DATADOG_TOP_VAST_VENDORS_ALIASES'))
);
const topVpaidVendorsTopLevelDomainsTagSet = new Set(
  convertStringToList(getConfigParameter('DATADOG_TOP_VPAID_VENDORS_TOP_LEVEL_DOMAINS'))
);
const topVpaidVendorsAliasesTagSet = new Set(
  convertStringToList(getConfigParameter('DATADOG_TOP_VPAID_VENDORS_ALIASES'))
);

function toDatadogTag(tag) {
  if (!tag) {
    return '';
  }

  return tag.replace(/\s+/g, '_').toLowerCase();
}

function whitelistTag(tag, set) {
  const convertedTag = toDatadogTag(tag);
  if (set.has(convertedTag)) {
    return convertedTag;
  }

  return OTHER;
}

function extractTopLevelDomain(domain) {
  const split = domain.split('.');
  if (split.length < 2) {
    return null;
  }

  return `${split[split.length - 2]}.${split[split.length - 1]}`;
}

function isDoubleClick(topLevelDomain) {
  return topLevelDomain === 'doubleclick.net';
}

function whitelistBrowserDatadogTag(browserTag) {
  return whitelistTag(browserTag, topBrowsersTagSet);
}

function whitelistOsDatadogTag(osTag) {
  return whitelistTag(osTag, topOsTagSet);
}

function whitelistVastVendorDatadogTag(vendorTag) {
  const convertedTag = toDatadogTag(vendorTag);
  if (topVastVendorsAliasesTagSet.has(convertedTag)) {
    return convertedTag;
  }

  const topLevelDomain = extractTopLevelDomain(convertedTag);

  if (isDoubleClick(topLevelDomain)) {
    return DOUBLE_CLICK;
  }

  if (topVastVendorsTopLevelDomainsTagSet.has(topLevelDomain)) {
    return topLevelDomain;
  }

  return OTHER;
}

function whitelistVpaidVendorDatadogTag(vendorTag) {
  const convertedTag = toDatadogTag(vendorTag);
  if (topVpaidVendorsAliasesTagSet.has(convertedTag)) {
    return convertedTag;
  }

  const topLevelDomain = extractTopLevelDomain(convertedTag);

  if (topVpaidVendorsTopLevelDomainsTagSet.has(topLevelDomain)) {
    return topLevelDomain;
  }

  return OTHER;
}

module.exports = {
  whitelistBrowserDatadogTag,
  whitelistOsDatadogTag,
  whitelistVastVendorDatadogTag,
  whitelistVpaidVendorDatadogTag,
};
