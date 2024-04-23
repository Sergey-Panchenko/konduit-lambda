'use strict';

/**
 * Checks if passed Ad contains VPAID unit
 * @param  {libxml.Element} adUnit -- Ad unit to check
 * @return {Boolean}
 */
const isVpaidAd = (adUnit) => {
  const mediaFile = adUnit.get('.//MediaFile');
  if (!mediaFile) return false;

  const apiFramework = mediaFile.getAttribute('apiFramework');
  if (!apiFramework) return false;

  return apiFramework.value().toLowerCase() === 'vpaid';
};

module.exports = isVpaidAd;
