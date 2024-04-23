'use strict';

const ABTestType = require('../constants/ABTestType');

module.exports = (abTestType) => {
  if (abTestType === ABTestType.KONDUITED) {
    return 'konduited';
  }

  if (abTestType === ABTestType.ORIGINAL) {
    return 'original';
  }

  return 'none';
};
