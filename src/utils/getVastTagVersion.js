'use strict';

const getVastTagVersion = (xmlDoc) => {
  if (!xmlDoc || !xmlDoc.get) return null;

  const vast = xmlDoc.get('//VAST');
  if (!vast) return null;

  const version = vast.getAttribute('version');

  return version ? version.value() : null;
};

module.exports = getVastTagVersion;
