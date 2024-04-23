'use strict';

const obtainUniversalAdIds = (creativeElement) => {
  const universalAdIdElements = creativeElement.find('//UniversalAdId');

  if (!universalAdIdElements.length) {
    return [];
  }
  return universalAdIdElements
    .map(universalAdIdElement => universalAdIdElement.text());
};

const obtainCreativeIds = (creativeElement) => {
  if (!creativeElement) {
    return [];
  }
  const universalAdIds = obtainUniversalAdIds(creativeElement);

  if (universalAdIds.length) {
    return universalAdIds;
  }

  const creativeElementIdAttribute = creativeElement.getAttribute('id');

  if (creativeElementIdAttribute) {
    return [creativeElementIdAttribute.value()];
  }

  return [];
};

module.exports = obtainCreativeIds;
