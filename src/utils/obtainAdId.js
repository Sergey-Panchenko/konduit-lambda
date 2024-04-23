'use strict';

const obtainAdId = (adElement) => {
  if (!adElement) {
    return '';
  }
  const adElementIdAttribute = adElement.getAttribute('id');

  return adElementIdAttribute ? adElementIdAttribute.value() : '';
};

module.exports = obtainAdId;
