'use strict';

const obtainCreativeAdId = (creativeElement) => {
  if (!creativeElement) {
    return '';
  }
  const adElementIdAttribute = creativeElement.getAttribute('AdID') || creativeElement.getAttribute('adId');

  return adElementIdAttribute ? adElementIdAttribute.value() : '';
};

module.exports = obtainCreativeAdId;
