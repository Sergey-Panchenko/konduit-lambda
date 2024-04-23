'use strict';

const appVersion = require('../../package.json').version;
const buildNumber = require('../../build_number.json')['build-number'];

function getApiVersionString() {
  let buildDetails = process.env.NODE_ENV;
  if (buildNumber) {
    buildDetails = `${buildDetails}-${buildNumber}`;
  }

  const apiVersion = `${appVersion} (${buildDetails})`;

  return [apiVersion].join('<br/>\n');
}

module.exports = getApiVersionString;
