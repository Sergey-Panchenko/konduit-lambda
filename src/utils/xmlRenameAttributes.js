'use strict';

const xmlRenameAttributes = (parentElement, targetSelector, oldAttributeName, newAttributeName) => {
  parentElement.find(targetSelector)
    .forEach((ad) => {
      const adSequenceAttr = ad.getAttribute(oldAttributeName);

      if (adSequenceAttr) {
        ad.setAttribute(newAttributeName, adSequenceAttr.value());
      }

      return adSequenceAttr && adSequenceAttr.remove();
    });
};

module.exports = xmlRenameAttributes;
