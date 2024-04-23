'use strict';

const vastChangeTrackingEventType = (vast, actualType, newType) => {
  const xpathQuery = `.//Tracking[@event='${actualType}']`;
  const affectedTrackingElements = vast.find(xpathQuery);

  affectedTrackingElements.forEach(element => element.setAttribute('event', newType));
};

module.exports = vastChangeTrackingEventType;
