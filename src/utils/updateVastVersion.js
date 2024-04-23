'use strict';

const supportedVastVersions = new Set([
  '2.0',
  '3.0',
  '4.0',
  '4.1',
]);

const updateVastTagVersion = (xmlDoc, vastVersion) => {
  if (!xmlDoc || !supportedVastVersions.has(vastVersion)) return;

  const vast = xmlDoc.root();
  if (!vast) return;

  vast.setAttribute('version', vastVersion);
};

module.exports = updateVastTagVersion;
