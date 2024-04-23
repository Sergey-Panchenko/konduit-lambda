'use strict';

const xmlRemoveElements = require('./xmlRemoveElements');

const vastRemoveTrackingEvents = (parentElement, eventType) => {
  const xpathQuery = `.//Tracking[@event="${eventType}"]`;
  xmlRemoveElements(parentElement, xpathQuery);
};

module.exports = vastRemoveTrackingEvents;
