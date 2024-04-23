'use strict';

const MS_PER_SEC = 1e3;
const NS_PER_MS = 1e6;

module.exports = function hrtimeToMs(hrtime) {
  return Math.round((hrtime[0] * MS_PER_SEC) + (hrtime[1] / NS_PER_MS));
};
