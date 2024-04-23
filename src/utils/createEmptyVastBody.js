'use strict';

const createEmptyVastBody = (vastVersion = '') => {
  if (vastVersion) return `<VAST version="${vastVersion}" />`;
  return '<VAST />';
};

module.exports = createEmptyVastBody;
