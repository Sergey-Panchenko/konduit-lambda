'use strict';

const collectVendorsChain = (context) => {
  if (!Array.isArray(context.vastVendorsChain)) {
    return '';
  }
  return context.vastVendorsChain.join('-');
};

module.exports = collectVendorsChain;
