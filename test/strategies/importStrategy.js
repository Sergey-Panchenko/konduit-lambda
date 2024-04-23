'use strict';

const path = require('path');
const Strategy = require('../../src/strategies/Strategy');

const STRATEGIES_DIRECTORY_PATH = '../../src/strategies/implementations';

const importStrategy = (strategyPath) => {
  const targetPath = path.join(STRATEGIES_DIRECTORY_PATH, strategyPath);
  // eslint-disable-next-line
  const target = require(targetPath);
  if (!(target instanceof Strategy)) {
    // eslint-disable-next-line
    throw new TypeError(`importStrategy: Expected target path to export Strategy instance, got ${typeof targetPath}. Path: ${targetPath}`);
  }

  return target;
};

module.exports = importStrategy;
