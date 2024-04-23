'use strict';

function getTimestamp() {// eslint-disable-line
  const hrTime = process.hrtime();
  return hrTime[0] * 1000 + hrTime[1] / 1000000;// eslint-disable-line
}

module.exports = getTimestamp;
