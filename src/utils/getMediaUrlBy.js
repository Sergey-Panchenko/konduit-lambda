'use strict';

const removeUrlParameters = require('./removeUrlParameters');

function getMediaUrlBy(mediaFile, blacklistPrefixes) {
  return removeUrlParameters(
    mediaFile.text().trim(),
    blacklistPrefixes
  );
}

module.exports = getMediaUrlBy;
