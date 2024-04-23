'use strict';

const xmlRemoveAttributes = (parentElement, targetSelector, attribute) => {
  parentElement.find(targetSelector)
    .forEach((ad) => {
      const adSequenceAttr = ad.getAttribute(attribute);
      return adSequenceAttr && adSequenceAttr.remove();
    });
};

module.exports = xmlRemoveAttributes;
