'use strict';

const vendors = [
  { id: 'one-video-js',
    name: 'One Video JS',
    mapRule: /adap\.tv$/ },
  { id: 'one-video',
    name: 'One Video',
    mapRule: /adaptv\.advertising\.com/ },
  { id: 'one-video-o2-js',
    name: 'One Video O2 JS',
    mapRule: /vidible\.tv$/ },
  { id: 'eyeblaster',
    name: 'EyeBlaster',
    mapRule: /serving-sys\.com$/ },
  { id: 'springserve',
    name: 'SpringServe',
    mapRule: /springserve\.com$/ },
  { id: 'innovid',
    name: 'Innovid',
    mapRule: /innovid\.com$/ },
  { id: 'google-ima',
    name: 'Google IMA',
    mapRule: /googleapis\.com$/ },
  { id: 'videology',
    name: 'Videology',
    mapRule: /tidaltv/ },
  // @note: subdomains should be specified higher then higher level domains
  { id: 'appnexus-secure',
    name: 'AppNexus',
    mapRule: /secure\.adnxs\.com$/ },
  { id: 'appnexus',
    name: 'AppNexus',
    mapRule: /adnxs\.com$/ },
  { id: 'visible-measures',
    name: 'Visible Measures',
    mapRule: /visiblemeasures/ },
  { id: 'spotxchange',
    name: 'SpotXChange',
    mapRule: /spotxchange/ },
  { id: 'extreme-reach',
    name: 'Extreme Reach',
    mapRule: /extremereach/ },
  { id: 'measure ad',
    name: 'Measure Ad',
    mapRule: /measuread/ },
  { id: 'double-verify',
    name: 'Double Verify',
    mapRule: /doubleverify\.com$/ },
  { id: 'ias',
    name: 'IAS',
    mapRule: /adsafeprotected\.com$/ },
  { id: 'yahoo',
    name: 'Yahoo',
    mapRule: /yimg\.com$/ },
  { id: 'pictela',
    name: 'Pictela',
    mapRule: /pictela\.net$/ },
  { id: 'casalemedia',
    name: 'Casalemedia',
    mapRule: /casalemedia\.com/ },
];

const pureVendors = vendors.reduce((acc, vendor) => {
  acc[vendor.id] = vendor.id;
  return acc;
}, {});

const detailedVendors = vendors.reduce((acc, vendor) => {
  acc[vendor.id] = vendor;
  return acc;
}, {});

module.exports = {
  pure: pureVendors,
  detailed: detailedVendors,
  list: vendors,
};
